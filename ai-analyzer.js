// ai-analyzer.js — AI-Powered Resume Analysis Engine
// Supports Groq and Nvidia API cloud providers

// ─────────────────────────────────────────────
// 2. PROMPT ENGINEERING
// ─────────────────────────────────────────────

const AI_SYSTEM_PROMPT = `You are an expert resume-to-job-match analyst. Given a candidate's resume text and a job description text, compare them and rate the fit.

Ground every judgment strictly in the two documents provided. Do not assume a skill, tool, or certification the candidate holds if it is not stated or clearly implied in the resume text, and do not invent job requirements that aren't in the job text.

When judging fit, give partial credit for transferable or adjacent skills instead of treating every comparison as binary (e.g. Cypress experience is relevant evidence toward a Playwright requirement; Vue experience is relevant evidence toward a React requirement). Weigh the candidate's total years of experience against any years-of-experience requirement stated in the job text.

Produce ONLY valid JSON — no markdown code fences, no commentary before or after — in this exact shape:
{
  "score": <integer 0-100, overall fit>,
  "honestTake": "<1-2 sentence, direct summary of the fit>",
  "matchedRequired": [/* required job skills the resume evidences — specific names like "Python", "React" */],
  "matchedPreferred": [/* preferred/nice-to-have job skills the resume evidences */],
  "missingRequired": [/* required job skills the resume does not evidence */],
  "missingPreferred": [/* preferred job skills the resume does not evidence */],
  "strengths": [/* exactly 2-3 bullets on what makes the candidate stand out for THIS role */],
  "concerns": [/* exactly 1-2 bullets on the most significant gaps, phrased constructively */],
  "suggestions": [
    {"icon": "🎯", "title": "<short title>", "description": "<one actionable step>", "priority": "high", "skills": [/* 1-3 related skills */]},
    {"icon": "⭐", "title": "<short title>", "description": "<one actionable step>", "priority": "medium", "skills": [/* 1-3 related skills */]}
  ],
  "coldEmailSubject": "Application for <exact role title from the job text>",
  "coldEmailBody": "Hi [Hiring Manager],\\n\\n<3-4 line email referencing 2-3 of the candidate's matched skills>\\n\\nBest regards,\\n[Your Name]"
}

Guidelines:
- Each of matchedRequired / matchedPreferred / missingRequired / missingPreferred: max 8 entries, specific skill or tool names only — never vague terms like "communication" or "team player".
- A skill belongs in exactly one of the four skill lists. Never list the same skill as both matched and missing, and never repeat a skill across lists.
- score reflects overall fit, weighting required skills higher than preferred, and incorporating the experience-level and transferable-skill judgment above — it is not a raw keyword ratio.
- coldEmailBody is exactly one email, 3-4 lines, referencing only real matched skills — never invent a company name, hiring manager name, or metric that isn't in the source text.
- Escape every newline inside JSON string values as \\n. Output nothing but the JSON object itself.`;

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
      response_format: { type: "json_object" },
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

  // Verdict is derived from score in code, not trusted from the model — keeps
  // the bucketing consistent even if the model's own label and score disagree.
  let verdictBadge, verdictColor, verdictIcon, verdictTitle;
  if (score >= 80) {
    verdictBadge = "PRIORITISE";
    verdictColor = "#107c41";
    verdictIcon = "local_fire_department";
    verdictTitle = "Prioritise this 🔥";
  } else if (score >= 60) {
    verdictBadge = "CONSIDER";
    verdictColor = "#e37400";
    verdictIcon = "bolt";
    verdictTitle = "Consider this ⚡";
  } else {
    verdictBadge = "PASS";
    verdictColor = "#d93025";
    verdictIcon = "cancel";
    verdictTitle = "Pass on this 🚫";
  }

  // Build skill Sets for UI compatibility (ensure they are always arrays).
  // Matched and missing are now both split required/preferred by the model,
  // so the UI's "Required"/"Preferred" badges are accurate in AI mode too.
  const matchedRequiredList = Array.isArray(data.matchedRequired)
    ? data.matchedRequired
    : [];
  const matchedPreferredList = Array.isArray(data.matchedPreferred)
    ? data.matchedPreferred
    : [];
  const missingRequiredList = Array.isArray(data.missingRequired)
    ? data.missingRequired
    : [];
  const missingPreferredList = Array.isArray(data.missingPreferred)
    ? data.missingPreferred
    : [];

  // Convert to Sets with normalized keys
  const matchedRequired = new Set(
    matchedRequiredList.map((s) => String(s).toLowerCase()),
  );
  const matchedPreferred = new Set(
    matchedPreferredList.map((s) => String(s).toLowerCase()),
  );
  const missingRequired = new Set(
    missingRequiredList.map((s) => String(s).toLowerCase()),
  );
  const missingPreferred = new Set(
    missingPreferredList.map((s) => String(s).toLowerCase()),
  );

  // Register any AI-detected skills not in SKILLS_DATABASE so getSkillInfo works
  const allAISkills = [
    ...matchedRequiredList,
    ...matchedPreferredList,
    ...missingRequiredList,
    ...missingPreferredList,
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
    totalJobSkills:
      matchedRequiredList.length +
      matchedPreferredList.length +
      missingRequiredList.length +
      missingPreferredList.length,
    totalResumeSkills: matchedRequiredList.length + matchedPreferredList.length,
    suggestions,
    coldEmailSubject: data.coldEmailSubject || "Application for [Role Title]",
    coldEmailBody: data.coldEmailBody || "",
    resumeSkillsList: [...matchedRequiredList, ...matchedPreferredList].map(
      (s) => ({
        display: s,
        category: SKILLS_DATABASE[s.toLowerCase()]?.category || "AI Detected",
        aliases: [],
      }),
    ),
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
          const escapedName = namePart.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
