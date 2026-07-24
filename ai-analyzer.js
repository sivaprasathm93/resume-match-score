// ai-analyzer.js — AI-Powered Resume Analysis Engine
// Supports Groq and Nvidia API cloud providers

// ─────────────────────────────────────────────
// 2. PROMPT ENGINEERING
// ─────────────────────────────────────────────

const AI_SYSTEM_PROMPT = `You are an expert resume-to-job-match analyst. Given a candidate’s resume text and a job description text, compare them and rate the fit. Produce ONLY valid JSON in this exact format:
{
  "score": <integer 0-100>,
  "verdictBadge": "<PRIORITISE | CONSIDER | PASS>",
  "honestTake": "<1-2 sentence summary>",
  "matchedSkills": [/* list of specific skill names */],
  "missingSkills": [/* all missing skill names */],
  "requiredMissing": [/* missing required skills */],
  "preferredMissing": [/* missing preferred skills */],
  "strengths": [/* 2-3 bullet points on candidate strengths for this role */],
  "concerns": [/* 1-2 bullet points on candidate concerns */],
  "suggestions": [
    {"icon": "🎯", "title": "title", "description": "actionable advice", "priority": "high", "skills": [/* skills*/]},
    {"icon": "⭐", "title": "title", "description": "actionable advice", "priority": "medium", "skills": [/* skills*/]}
  ],
  "coldEmailSubject": "Application for [Role Title]",
  "coldEmailBody": "Hi [Hiring Manager],\\n\\n<3-4 line email referencing 2-3 matched skills>\\n\\nBest regards,\\n[Your Name]"
}

Guidelines: Score is an integer 0–100. If score ≥80 use “PRIORITISE”, if 60–79 use “CONSIDER”, else use “PASS”. List specific skills (e.g. “Python”, “React”), not vague terms. \`matchedSkills\` are skills both the resume and job have. \`missingSkills\` covers all required+preferred skills the candidate lacks (split into requiredMissing and preferredMissing). In \`strengths\`, highlight what makes the candidate stand out *for this role*. In \`concerns\`, mention any significant gaps constructively. Suggestions should be actionable (linking to missing skills), with a high-priority 🎯 tip and a medium-priority ⭐ tip. The cold email should reference 2–3 matched skills. Remember to consider experience level and transferable skills. No extra output beyond the JSON.`;

function buildUserPrompt(resumeText, jobText) {
  return `=== RESUME ===
${resumeText.substring(0, 4000)}

=== JOB DESCRIPTION ===
${jobText.substring(0, 4000)}

Analyze the match and respond with the JSON structure specified.`;
}

// ─────────────────────────────────────────────
// 3. AI PROVIDERS
// ─────────────────────────────────────────────

/**
 * Prompt using Groq API (free tier)
 */
async function promptGroqAPI(systemPrompt, userPrompt, apiKey) {
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2048,
        response_format: { type: "json_object" },
      }),
    },
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

/**
 * Prompt using Nvidia NIM API (free tier)
 */
async function promptNvidiaAPI(systemPrompt, userPrompt, apiKey) {
  const url = "https://integrate.api.nvidia.com/v1/chat/completions";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "meta/llama-3.1-70b-instruct",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Nvidia API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// ─────────────────────────────────────────────
// 4. RESPONSE PARSING & NORMALIZATION
// ─────────────────────────────────────────────

/**
 * Parse the AI response JSON and normalize it into the matchResult shape
 * that popup.js / renderResults() expects.
 */
function parseAIResponse(rawText) {
  let cleaned = rawText.trim();

  // Extract JSON block using first { and last } to ignore conversational padding
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  let data = {};
  try {
    data = JSON.parse(cleaned);
  } catch (err) {
    console.error("Failed to parse AI JSON response:", cleaned);
    throw new Error("INVALID_JSON");
  }

  const score = Math.min(100, Math.max(0, parseInt(data.score, 10) || 0));
  const score10 = (score / 10).toFixed(score % 10 === 0 ? 0 : 1);

  // Map verdict
  let verdictBadge = (data.verdictBadge || "CONSIDER").toUpperCase();
  let verdictColor, verdictIcon, verdictTitle;

  if (verdictBadge === "PRIORITISE" || verdictBadge === "PRIORITIZE") {
    verdictBadge = "PRIORITISE";
    verdictColor = "#107c41";
    verdictIcon = "local_fire_department";
    verdictTitle = "Prioritise this 🔥";
  } else if (verdictBadge === "CONSIDER") {
    verdictColor = "#e37400";
    verdictIcon = "bolt";
    verdictTitle = "Consider this ⚡";
  } else {
    verdictBadge = "PASS";
    verdictColor = "#d93025";
    verdictIcon = "cancel";
    verdictTitle = "Pass on this 🚫";
  }

  // Build skill Sets for UI compatibility (ensure they are always arrays)
  const matchedSkills = Array.isArray(data.matchedSkills)
    ? data.matchedSkills
    : [];
  const missingSkills = Array.isArray(data.missingSkills)
    ? data.missingSkills
    : [];
  const requiredMissing = Array.isArray(data.requiredMissing)
    ? data.requiredMissing
    : missingSkills;
  const preferredMissing = Array.isArray(data.preferredMissing)
    ? data.preferredMissing
    : [];

  // Convert to Sets with normalized keys
  const matchedRequired = new Set(
    matchedSkills.map((s) => String(s).toLowerCase()),
  );
  const matchedPreferred = new Set();
  const missingRequired = new Set(
    requiredMissing.map((s) => String(s).toLowerCase()),
  );
  const missingPreferred = new Set(
    preferredMissing.map((s) => String(s).toLowerCase()),
  );

  // Register any AI-detected skills not in SKILLS_DATABASE so getSkillInfo works
  const allAISkills = [
    ...matchedSkills,
    ...missingSkills,
    ...requiredMissing,
    ...preferredMissing,
  ];
  for (const skill of allAISkills) {
    const key = String(skill).toLowerCase();
    if (!SKILLS_DATABASE[key]) {
      SKILLS_DATABASE[key] = {
        display: String(skill),
        category: "AI Detected",
        aliases: [],
      };
    }
  }

  // Suggestions
  const suggestions = (
    Array.isArray(data.suggestions) ? data.suggestions : []
  ).map((s) => ({
    icon: s?.icon || "💡",
    title: s?.title || "Suggestion",
    description: s?.description || "",
    priority: s?.priority || "medium",
    skills: Array.isArray(s?.skills) ? s.skills : [],
  }));

  const gradeColor = verdictColor;

  return {
    score,
    score10,
    grade: verdictBadge,
    gradeColor,
    verdictTitle,
    verdictBadge,
    verdictColor,
    verdictIcon,
    confidenceLabel:
      score >= 75
        ? "High Confidence"
        : score >= 60
          ? "Moderate Confidence"
          : "Low Confidence",
    honestTake: data.honestTake || "",
    verdictText: data.honestTake || "",
    strengthsList: Array.isArray(data.strengths)
      ? data.strengths
      : typeof data.strengths === "string"
        ? [data.strengths]
        : [],
    concernsList: Array.isArray(data.concerns)
      ? data.concerns
      : typeof data.concerns === "string"
        ? [data.concerns]
        : [],
    strengths: Array.isArray(data.strengths)
      ? data.strengths
      : typeof data.strengths === "string"
        ? [data.strengths]
        : [],
    concerns: Array.isArray(data.concerns)
      ? data.concerns
      : typeof data.concerns === "string"
        ? [data.concerns]
        : [],
    matchedRequired,
    matchedPreferred,
    missingRequired,
    missingPreferred,
    bonusSkills: new Set(),
    yearsMap: new Map(),
    totalJobSkills: matchedSkills.length + missingSkills.length,
    totalResumeSkills: matchedSkills.length,
    suggestions,
    coldEmailSubject: data.coldEmailSubject || "Application for [Role Title]",
    coldEmailBody: data.coldEmailBody || "",
    resumeSkillsList: matchedSkills.map((s) => ({
      display: s,
      category: SKILLS_DATABASE[s.toLowerCase()]?.category || "AI Detected",
      aliases: [],
    })),
    jobTitle: "",
    isAIGenerated: true,
  };
}

// ─────────────────────────────────────────────
// 5. MAIN ANALYSIS ENTRY POINT
// ─────────────────────────────────────────────

/**
 * Strips Personally Identifiable Information (PII) from text.
 * Removes candidate names, emails, phone numbers, and URLs (like LinkedIn).
 */
function stripPII(text) {
  if (!text) return "";
  let sanitized = text;

  // 1. Remove Email addresses
  sanitized = sanitized.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    "[EMAIL REMOVED]",
  );

  // 2. Remove Phone numbers
  sanitized = sanitized.replace(
    /(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g,
    "[PHONE REMOVED]",
  );

  // 3. Remove URLs & links (LinkedIn, GitHub, Portfolios, etc)
  sanitized = sanitized.replace(
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g,
    "[URL REMOVED]",
  );
  sanitized = sanitized.replace(
    /\b(linkedin\.com|github\.com)\/[a-zA-Z0-9_-]+\/?/gi,
    "[LINK REMOVED]",
  );

  // 4. Remove explicit Name fields ("Name: John Doe", "Full Name: Jane Smith")
  sanitized = sanitized.replace(
    /\b(?:full\s+)?name\s*:\s*([A-Za-z]+(?:\s+[A-Za-z]+){1,3})/gi,
    "Name: [NAME REMOVED]",
  );

  // 5. Detect and remove header name at top of resume
  try {
    const lines = sanitized.split("\n");
    let firstLineIdx = -1;

    for (let i = 0; i < lines.length; i++) {
      const textLeft = lines[i]
        .replace(/\[(EMAIL|PHONE|URL|LINK|NAME) REMOVED\]/gi, "")
        .trim();
      if (
        textLeft.length > 0 &&
        /[A-Za-z]/.test(textLeft) &&
        !/^(resume|cv|curriculum vitae)$/i.test(textLeft)
      ) {
        firstLineIdx = i;
        break;
      }
    }

    if (firstLineIdx !== -1) {
      const textLeft = lines[firstLineIdx]
        .replace(/\[(EMAIL|PHONE|URL|LINK|NAME) REMOVED\]/gi, "")
        .trim();
      const namePart = textLeft.split(/\||-|•|,/)[0].trim();

      if (namePart.length > 0 && namePart.length < 60) {
        lines[firstLineIdx] = lines[firstLineIdx].replace(
          namePart,
          "[NAME REMOVED]",
        );
        sanitized = lines.join("\n");

        if (namePart.length >= 3) {
          const escapedName = namePart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          sanitized = sanitized.replace(
            new RegExp(`\\b${escapedName}\\b`, "gi"),
            "[NAME REMOVED]",
          );
        }
      }
    }
  } catch (nameErr) {
    console.warn("stripPII: Name detection failed, skipping:", nameErr);
  }

  return sanitized;
}

/**
 * Run AI-powered analysis on resume vs job description.
 *
 * @param {string} resumeText - Full resume text
 * @param {string} jobText - Full job description text
 * @param {Object} options - { provider: 'groq'|'nvidia', apiKey: string }
 * @returns {Object} Result in the same shape as analyzeMatch()
 */
async function analyzeWithAI(resumeText, jobText, options = {}) {
  const { provider = "groq", apiKey = "" } = options;

  // Guardrail: Strip PII before sending to cloud
  const sanitizedResume = stripPII(resumeText);
  const userPrompt = buildUserPrompt(sanitizedResume, jobText);
  let rawResponse = "";

  const promptPayload = {
    provider,
    modelName:
      provider === "groq"
        ? "Groq (llama-3.3-70b-versatile)"
        : "Nvidia NIM (llama-3.1-70b-instruct)",
    systemPrompt: AI_SYSTEM_PROMPT,
    sanitizedResume,
    jobTextTruncated: jobText.substring(0, 4000),
    fullUserPrompt: userPrompt,
    fullPromptText: `=== SYSTEM INSTRUCTION ===\n${AI_SYSTEM_PROMPT}\n\n=== USER PROMPT SENT TO MODEL ===\n${userPrompt}`,
  };

  if (provider === "groq") {
    if (!apiKey) throw new Error("NO_API_KEY");
    rawResponse = await promptGroqAPI(AI_SYSTEM_PROMPT, userPrompt, apiKey);
  } else if (provider === "nvidia") {
    if (!apiKey) throw new Error("NO_API_KEY");
    rawResponse = await promptNvidiaAPI(AI_SYSTEM_PROMPT, userPrompt, apiKey);
  } else {
    throw new Error("UNKNOWN_PROVIDER");
  }

  if (!rawResponse || rawResponse.trim().length === 0) {
    throw new Error("EMPTY_RESPONSE");
  }

  const result = parseAIResponse(rawResponse);
  result.promptPayload = promptPayload;
  return result;
}

/**
 * Test if an API key works by sending a minimal prompt.
 */
async function testAPIKey(provider, apiKey) {
  try {
    const testPrompt = 'Respond in JSON format with exactly: {"status":"ok"}';
    let response;

    if (provider === "groq") {
      response = await promptGroqAPI(
        "You are a test bot returning JSON.",
        testPrompt,
        apiKey,
      );
    } else if (provider === "nvidia") {
      response = await promptNvidiaAPI(
        "You are a test bot returning JSON.",
        testPrompt,
        apiKey,
      );
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
