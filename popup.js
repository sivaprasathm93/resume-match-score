// popup.js — Resume Match Score Extension Controller
// Orchestrates UI, resume upload, page analysis, and result rendering.

document.addEventListener('DOMContentLoaded', init);

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
let resumeText = '';
let resumeSkills = new Set();

let cachedPageData = null;
let currentResult = null;

// AI Mode state
let aiModeEnabled = false;
let aiProvider = 'groq'; // 'groq' | 'nvidia'
let aiApiKeys = { groq: '', nvidia: '' };
let lastAIPayload = null;

// Allowed Patterns state
const DEFAULT_ALLOWED_PATTERNS = [
  'myworkdayjobs',
  'greenhouse.io',
  'linkedin.com',
  'ripplehire',
  'rippling',
  'naukri.com'
];
let customAllowedPatterns = [];
let analysisHistory = [];

// DOM Reference Cache
let DOM = {};

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
async function init() {
  cacheDOM();
  bindEvents();

  const stored = await AppStorage.loadAll();

  resumeText = stored.resumeText;
  resumeSkills = new Set(stored.resumeSkills);

  aiModeEnabled = stored.aiModeEnabled;
  aiProvider = stored.aiProvider;
  aiApiKeys = stored.aiApiKeys;
  customAllowedPatterns = stored.customAllowedPatterns;
  analysisHistory = stored.analysisHistory || [];

  syncAIToggleUI();

  if (resumeText && resumeSkills.size > 0) {
    updateResumeStatusCard();
    analyzePage();
  } else {
    showView('view-upload');
  }
}

function cacheDOM() {
  DOM = {
    dropZone: document.getElementById('drop-zone'),
    fileInput: document.getElementById('file-input'),
    btnPaste: document.getElementById('btn-paste'),
    pasteModal: document.getElementById('paste-modal'),
    pasteTextarea: document.getElementById('paste-textarea'),
    btnPasteSubmit: document.getElementById('btn-paste-submit'),
    btnPasteCancel: document.getElementById('btn-paste-cancel'),
    
    // Header & Toggles
    aiModeToggle: document.getElementById('ai-mode-toggle'),
    modeToggleDiv: document.getElementById('mode-toggle'),
    btnAISettings: document.getElementById('btn-ai-settings'),

    btnManageResume: document.getElementById('btn-manage-resume'),
    btnSettings: document.getElementById('btn-settings'),

    // Dashboard
    resumeSkillCount: document.getElementById('resume-skill-count'),
    skillsFlyout: document.getElementById('skills-flyout'),
    resumeSkillsList: document.getElementById('resume-skills-list'),
    btnAnalyze: document.getElementById('btn-analyze'),
    btnAnalyzeAgain: document.getElementById('btn-analyze-again'),
    btnViewSkills: document.getElementById('btn-view-skills'),
    btnCloseFlyout: document.getElementById('btn-close-flyout'),

    // AI Privacy & Data Modal
    aiPrivacyBadge: document.getElementById('ai-privacy-badge'),
    btnViewLLMData: document.getElementById('btn-view-llm-data'),

    // Support Page Modal
    supportPageModal: document.getElementById('support-page-modal'),
    supportPageUrl: document.getElementById('support-page-url'),
    supportPatternInput: document.getElementById('support-pattern-input'),
    btnSupportConfirm: document.getElementById('btn-support-page-confirm'),
    btnSupportClose: document.getElementById('btn-support-page-close'),

    // History & Dedup
    btnHistory: document.getElementById('btn-history'),
    btnClearHistory: document.getElementById('btn-clear-history'),
    btnHistoryBack: document.getElementById('btn-history-back'),
    historyList: document.getElementById('history-list'),
    historyEmpty: document.getElementById('history-empty'),
    dedupBanner: document.getElementById('dedup-banner'),
    dedupText: document.getElementById('dedup-text'),
    btnForceReanalyze: document.getElementById('btn-force-reanalyze'),
  };
}

// ─────────────────────────────────────────────
// EVENT BINDINGS (Event Delegation)
// ─────────────────────────────────────────────
function bindEvents() {
  // Global backdrop click delegation to close modals
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      const modal = e.target.closest('.modal');
      if (modal) modal.style.display = 'none';
    }
  });

  // Drop zone events
  if (DOM.dropZone && DOM.fileInput) {
    DOM.dropZone.addEventListener('click', () => DOM.fileInput.click());
    DOM.dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      DOM.dropZone.classList.add('drag-over');
    });
    DOM.dropZone.addEventListener('dragleave', () => DOM.dropZone.classList.remove('drag-over'));
    DOM.dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      DOM.dropZone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    });
    DOM.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handleFileUpload(file);
    });
  }

  // Paste modal
  DOM.btnPaste?.addEventListener('click', () => {
    openModal('paste-modal');
    DOM.pasteTextarea?.focus();
  });
  DOM.btnPasteCancel?.addEventListener('click', () => closeModal('paste-modal'));
  DOM.btnPasteSubmit?.addEventListener('click', handlePasteSubmit);


  // Cold Email modal
  document.getElementById('btn-cold-email')?.addEventListener('click', openColdEmailModal);
  document.getElementById('btn-email-close')?.addEventListener('click', () => closeModal('email-modal'));
  document.getElementById('btn-copy-email')?.addEventListener('click', copyColdEmail);

  // Dashboard buttons
  DOM.btnAnalyze?.addEventListener('click', analyzePage);
  DOM.btnAnalyzeAgain?.addEventListener('click', analyzePage);
  DOM.btnViewSkills?.addEventListener('click', toggleSkillsFlyout);
  DOM.btnCloseFlyout?.addEventListener('click', toggleSkillsFlyout);
  DOM.btnManageResume?.addEventListener('click', () => {
    showView('view-upload');
    if (DOM.btnManageResume) DOM.btnManageResume.style.display = 'none';
  });
  DOM.btnSettings?.addEventListener('click', resetResume);

  // History & Dedup events
  DOM.btnHistory?.addEventListener('click', () => {
    renderHistoryList();
    showView('view-history');
  });
  DOM.btnClearHistory?.addEventListener('click', async () => {
    analysisHistory = [];
    await AppStorage.clearAnalysisHistory();
    renderHistoryList();
    showToast('Analysis history cleared', 'info');
  });
  DOM.btnHistoryBack?.addEventListener('click', () => {
    if (currentResult) {
      showView('view-results');
    } else {
      showView('view-dashboard');
    }
  });
  DOM.btnForceReanalyze?.addEventListener('click', () => {
    window._forceReanalyzeFlag = true;
    analyzePage();
  });

  // Results tabs switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // AI Mode toggle & settings
  DOM.aiModeToggle?.addEventListener('change', handleAIToggle);
  DOM.btnAISettings?.addEventListener('click', openAISettingsModal);
  document.getElementById('ai-provider-select')?.addEventListener('change', handleProviderChange);
  document.getElementById('btn-test-key')?.addEventListener('click', handleTestAPIKey);
  document.getElementById('btn-ai-settings-save')?.addEventListener('click', saveAISettings);
  document.getElementById('btn-ai-settings-close')?.addEventListener('click', closeAISettingsModal);

  // Support Page modal
  DOM.btnSupportConfirm?.addEventListener('click', handleSupportPageConfirm);
  DOM.btnSupportClose?.addEventListener('click', closeSupportPageModal);
  DOM.supportPatternInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSupportPageConfirm();
  });

  // LLM Shared Data modal
  DOM.btnViewLLMData?.addEventListener('click', openLLMDataModal);
  document.getElementById('btn-llm-data-close')?.addEventListener('click', closeLLMDataModal);
  document.getElementById('btn-copy-llm-data')?.addEventListener('click', copyLLMData);
  document.querySelectorAll('.llm-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchLLMTab(btn.dataset.llmtab));
  });
}

// ─────────────────────────────────────────────
// FILE HANDLING & PARSING
// ─────────────────────────────────────────────
async function handleFileUpload(file) {
  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    showToast('File size exceeds 10MB limit.', 'error');
    showView('view-upload');
    return;
  }

  const ext = file.name.split('.').pop().toLowerCase();
  showProcessing('Reading your resume...', `Extracting text from ${file.name}`);

  try {
    let text = '';
    if (ext === 'pdf') {
      text = await parsePDF(file);
    } else if (ext === 'txt') {
      text = await file.text();
    } else if (ext === 'doc' || ext === 'docx') {
      showToast('Binary .doc/.docx files are not directly readable. Please save/convert to PDF or TXT, or use Paste Text.', 'warning');
      showView('view-upload');
      return;
    } else {
      showToast('Unsupported file type. Please use PDF or TXT.', 'error');
      showView('view-upload');
      return;
    }

    if (!text || text.trim().length < 50) {
      showToast('Could not extract sufficient readable text (at least 50 chars). Please paste your resume instead.', 'warning');
      showView('view-upload');
      return;
    }

    processResumeText(text);
  } catch (err) {
    console.error('File processing error:', err);
    showToast('Error reading file. Please try pasting your resume text.', 'error');
    showView('view-upload');
  }
}

async function parsePDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  try {
    const pdfjsLib = await import(chrome.runtime.getURL('lib/pdf.min.mjs'));
    pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('lib/pdf.worker.min.mjs');
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    if (pdf.numPages > 15) {
      throw new Error('PDF exceeds 15 page maximum limit.');
    }
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map(item => item.str).join(' ') + '\n';
    }
    return fullText;
  } catch (e) {
    console.error('PDF.js parsing error:', e);
    throw new Error('Failed to parse PDF document. Please try pasting your resume text.');
  }
}

function handlePasteSubmit() {
  const text = DOM.pasteTextarea ? DOM.pasteTextarea.value.trim() : '';
  if (!text || text.length < 50) {
    showToast('Please paste a full resume text (at least 50 characters).', 'warning');
    return;
  }
  closeModal('paste-modal');
  if (DOM.pasteTextarea) DOM.pasteTextarea.value = '';
  processResumeText(text);
}

function processResumeText(text) {
  resumeText = text;
  resumeSkills = extractSkills(resumeText);

  if (resumeSkills.size === 0) {
    showToast('No standard skills detected. Try pasting a more detailed resume.', 'warning');
    showView('view-upload');
    return;
  }

  AppStorage.saveResume(resumeText, resumeSkills);
  updateResumeStatusCard();
  showToast(`Found ${resumeSkills.size} skills in your resume! Analyzing page...`, 'success');
  setTimeout(() => analyzePage(), 500);
}

function updateResumeStatusCard() {
  if (DOM.resumeSkillCount) {
    DOM.resumeSkillCount.textContent = `${resumeSkills.size} skills detected`;
  }
  renderResumeSkillsFlyout();
  showView('view-dashboard');
}

function renderResumeSkillsFlyout() {
  if (!DOM.resumeSkillsList) return;
  DOM.resumeSkillsList.innerHTML = '';

  const grouped = groupByCategory(resumeSkills);
  for (const [category, skills] of Object.entries(grouped)) {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'skill-category-group';
    groupDiv.innerHTML = `
      <h5 class="category-name">${escapeHtml(category)}</h5>
      <div class="skills-grid">
        ${skills.map(s => `<span class="skill-chip chip-matched">${escapeHtml(s)}</span>`).join('')}
      </div>
    `;
    DOM.resumeSkillsList.appendChild(groupDiv);
  }
}

function toggleSkillsFlyout() {
  if (!DOM.skillsFlyout) return;
  const isHidden = DOM.skillsFlyout.style.display === 'none';
  DOM.skillsFlyout.style.display = isHidden ? 'block' : 'none';
}

async function resetResume() {
  if (!confirm('Are you sure you want to clear your saved resume data?')) return;
  resumeText = '';
  resumeSkills = new Set();
  cachedPageData = null;
  currentResult = null;
  await AppStorage.clearResume();
  showView('view-upload');
  showToast('Saved resume data cleared.', 'info');
}

// ─────────────────────────────────────────────
// PAGE ANALYSIS & SUPPORTED SITES
// ─────────────────────────────────────────────
function getAllowedPatterns() {
  return [...DEFAULT_ALLOWED_PATTERNS, ...customAllowedPatterns];
}

async function analyzePage() {
  showProcessing('Reading job posting...', 'Extracting skills from the page');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.id || !tab.url) {
      showToast('No active tab found. Open a job posting first.', 'error');
      showView('view-dashboard');
      return;
    }

    const lowerUrl = tab.url.toLowerCase();
    if (lowerUrl.startsWith('chrome://') || lowerUrl.startsWith('chrome-extension://') || lowerUrl.startsWith('edge://') || lowerUrl.startsWith('about:')) {
      showToast('Cannot analyze browser internal pages. Please open a job posting.', 'warning');
      showView('view-dashboard');
      return;
    }

    const allowedPatterns = getAllowedPatterns();
    const isAllowed = allowedPatterns.some(pattern => lowerUrl.includes(pattern.toLowerCase()));

    if (!isAllowed) {
      showSupportPageModal(tab.url);
      return;
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js'],
    });

    const pageData = results?.[0]?.result;
    if (!pageData || !pageData.text || pageData.text.length < 50) {
      showToast('Could not find job description on this page.', 'error');
      showView('view-dashboard');
      return;
    }

    cachedPageData = pageData;

    const hash = computeUrlHash(pageData.url, pageData.text);
    const cachedEntry = analysisHistory.find(h => h.hash === hash);

    if (cachedEntry && cachedEntry.savedResult && !window._forceReanalyzeFlag) {
      const timeAgoStr = getTimeAgo(cachedEntry.timestamp);
      showToast(`Found cached analysis from ${timeAgoStr} (${cachedEntry.score}/100)`, 'success');
      const res = {
        ...cachedEntry.savedResult,
        matchedRequired: new Set(cachedEntry.savedResult.matchedRequired || []),
        matchedPreferred: new Set(cachedEntry.savedResult.matchedPreferred || []),
        missingRequired: new Set(cachedEntry.savedResult.missingRequired || []),
        missingPreferred: new Set(cachedEntry.savedResult.missingPreferred || []),
        bonusSkills: new Set(cachedEntry.savedResult.bonusSkills || []),
        isDedupHit: true,
        dedupTimeStr: timeAgoStr,
        dedupScore: cachedEntry.score
      };
      renderResults(res);
      return;
    }
    window._forceReanalyzeFlag = false;

    if (aiModeEnabled) {
      await analyzePageWithAI(pageData);
    } else {
      await analyzePageStatic(pageData);
    }
  } catch (err) {
    console.error('Analysis error:', err);
    if (err.message?.includes('Cannot access')) {
      showToast('Cannot analyze this page (browser internal page).', 'error');
    } else {
      showToast('Error analyzing page. Try refreshing the tab.', 'error');
    }
    showView('view-dashboard');
  }
}

async function analyzePageStatic(pageData) {
  showProcessing('Analyzing match...', 'Comparing skills');
  await sleep(400);

  const result = analyzeMatch(resumeText, pageData.text);
  result.jobTitle = pageData.title;
  result.isNoisyExtraction = pageData.isNoisyExtraction;
  result.extractionTier = pageData.extractionTier;
  recordAnalysisHistory(pageData, result);
  renderResults(result);
}

async function analyzePageWithAI(pageData) {
  showProcessing('AI is analyzing your match...', 'Stripping personal details & analyzing with AI');

  try {
    const options = {
      provider: aiProvider,
      apiKey: aiApiKeys[aiProvider] || '',
    };

    const result = await analyzeWithAI(resumeText, pageData.text, options);
    result.jobTitle = pageData.title;
    result.isNoisyExtraction = pageData.isNoisyExtraction;
    result.extractionTier = pageData.extractionTier;
    lastAIPayload = result.promptPayload || null;
    recordAnalysisHistory(pageData, result);
    renderResults(result);
  } catch (err) {
    console.error('AI analysis error:', err);
    if (err.message === 'NO_API_KEY') {
      showToast('No API key configured. Open AI Settings to add one.', 'warning');
      openAISettingsModal();
    } else {
      showToast('AI analysis failed. Falling back to static analysis.', 'warning');
      await analyzePageStatic(pageData);
    }
  }
}

function showSupportPageModal(url) {
  showView('view-dashboard');
  let candidatePattern = '';
  try {
    candidatePattern = new URL(url).hostname.replace(/^www\./, '');
  } catch (e) {
    candidatePattern = url;
  }

  if (DOM.supportPageUrl) DOM.supportPageUrl.textContent = url;
  if (DOM.supportPatternInput) DOM.supportPatternInput.value = candidatePattern;

  renderCustomPatternsList();
  openModal('support-page-modal');
}

function closeSupportPageModal() {
  closeModal('support-page-modal');
}

async function handleSupportPageConfirm() {
  const newPattern = DOM.supportPatternInput ? DOM.supportPatternInput.value.trim().toLowerCase() : '';
  if (!newPattern) {
    showToast('Please enter a valid domain or pattern.', 'warning');
    return;
  }

  if (!customAllowedPatterns.includes(newPattern)) {
    customAllowedPatterns.push(newPattern);
    await AppStorage.saveCustomAllowedPatterns(customAllowedPatterns);
  }

  closeSupportPageModal();
  showToast(`Added "${newPattern}" to supported sites!`, 'success');
  analyzePage();
}

function renderCustomPatternsList() {
  const section = document.getElementById('custom-patterns-section');
  const container = document.getElementById('custom-patterns-list');
  if (!section || !container) return;

  if (customAllowedPatterns.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  container.innerHTML = '';

  customAllowedPatterns.forEach(pattern => {
    const chip = document.createElement('div');
    chip.className = 'removable-tag';
    chip.innerHTML = `
      <span>${escapeHtml(pattern)}</span>
      <button class="remove-tag-btn" title="Remove site">
        <span class="material-icons-round">close</span>
      </button>
    `;
    chip.querySelector('.remove-tag-btn').addEventListener('click', async () => {
      customAllowedPatterns = customAllowedPatterns.filter(p => p !== pattern);
      await AppStorage.saveCustomAllowedPatterns(customAllowedPatterns);
      renderCustomPatternsList();
      showToast(`Removed "${pattern}" from supported sites.`, 'info');
    });
    container.appendChild(chip);
  });
}

// ─────────────────────────────────────────────
// RENDER RESULTS
// ─────────────────────────────────────────────
function renderResults(result) {
  currentResult = result;
  showView('view-results');

  const {
    score, gradeColor, verdictBadge, verdictColor, verdictIcon, verdictText,
    strengths, concerns, matchedRequired, matchedPreferred,
    missingRequired, missingPreferred, suggestions, jobTitle,
  } = result;

  const badgeEl = document.getElementById('verdict-badge');
  const iconEl = document.getElementById('verdict-icon');
  const titleEl = document.getElementById('verdict-title');
  const textEl = document.getElementById('verdict-text');

  if (badgeEl && iconEl && titleEl && textEl) {
    titleEl.textContent = verdictBadge || 'PRIORITIZE';
    iconEl.textContent = verdictIcon || 'stars';
    textEl.textContent = verdictText || '';
    badgeEl.style.backgroundColor = verdictColor || gradeColor;

    const existingBadge = document.querySelector('.ai-badge');
    if (existingBadge) existingBadge.remove();
    if (result.isAIGenerated) {
      const aiBadge = document.createElement('span');
      aiBadge.className = 'ai-badge';
      aiBadge.innerHTML = '<span class="material-icons-round">auto_awesome</span>AI';
      badgeEl.parentElement.appendChild(aiBadge);
    }
  }

  if (DOM.aiPrivacyBadge) {
    DOM.aiPrivacyBadge.style.display = result.isAIGenerated ? 'flex' : 'none';
  }

  animateCounter('score-number', 0, score, 1000);

  const totalMatched = matchedRequired.size + matchedPreferred.size;
  const totalMissing = missingRequired.size + missingPreferred.size;

  const matchedEl = document.getElementById('meta-matched');
  const missingEl = document.getElementById('meta-missing');
  if (matchedEl) matchedEl.textContent = totalMatched;
  if (missingEl) missingEl.textContent = totalMissing;

  const jobTitleBar = document.getElementById('job-title-bar');
  const jobTitleText = document.getElementById('job-title-text');
  if (jobTitleBar && jobTitleText) {
    if (jobTitle) {
      jobTitleText.textContent = jobTitle;
      jobTitleBar.style.display = 'flex';
    } else {
      jobTitleBar.style.display = 'none';
    }
  }

  renderInsightsList('tal-strengths-list', strengths || []);
  renderInsightsList('tal-concerns-list', concerns || []);

  const countMatchedEl = document.getElementById('tab-count-matched');
  const countMissingEl = document.getElementById('tab-count-missing');
  if (countMatchedEl) countMatchedEl.textContent = totalMatched;
  if (countMissingEl) countMissingEl.textContent = totalMissing;

  renderSkillChips('matched-skills', matchedRequired, matchedPreferred, true);
  renderSkillChips('missing-skills', missingRequired, missingPreferred, false);

  const emptyMatched = document.getElementById('empty-matched');
  const emptyMissing = document.getElementById('empty-missing');
  if (emptyMatched) emptyMatched.style.display = totalMatched === 0 ? 'block' : 'none';
  if (emptyMissing) emptyMissing.style.display = totalMissing === 0 ? 'block' : 'none';

  const noisyBanner = document.getElementById('noisy-extraction-banner');
  if (noisyBanner) {
    noisyBanner.style.display = result.isNoisyExtraction ? 'flex' : 'none';
  }

  if (DOM.dedupBanner) {
    if (result.isDedupHit || result.isFromHistory) {
      DOM.dedupBanner.style.display = 'flex';
      const timeStr = result.dedupTimeStr || (result.historyTimestamp ? getTimeAgo(result.historyTimestamp) : 'earlier');
      if (DOM.dedupText) {
        DOM.dedupText.textContent = `You already scored this posting (${result.score}/100 • ${timeStr}).`;
      }
    } else {
      DOM.dedupBanner.style.display = 'none';
    }
  }

  const breakdownDiv = document.getElementById('score-breakdown');
  const breakdownTextEl = document.getElementById('score-breakdown-text');
  if (breakdownDiv && breakdownTextEl) {
    if (result.breakdown && result.breakdown.text) {
      breakdownTextEl.textContent = result.breakdown.text;
      breakdownDiv.style.display = 'flex';
    } else {
      breakdownDiv.style.display = 'none';
    }
  }

  renderSuggestions(suggestions || []);
  renderBulletRewrites(result.bulletRewrites || []);
  switchTab('matched');
}



function renderSkillChips(containerId, requiredSet, preferredSet, isMatched) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  for (const skillKey of requiredSet) {
    const info = getSkillInfo(skillKey);
    const chipClass = isMatched ? 'chip-matched' : 'chip-missing-required';
    const chip = createSkillChip(info.display, info.category, chipClass, 'Required');
    container.appendChild(chip);
  }

  for (const skillKey of preferredSet) {
    const info = getSkillInfo(skillKey);
    const chipClass = isMatched ? 'chip-matched' : 'chip-missing-preferred';
    const chip = createSkillChip(info.display, info.category, chipClass, 'Preferred');
    container.appendChild(chip);
  }
}

function createSkillChip(displayName, category, extraClass, badgeLabel) {
  const chip = document.createElement('span');
  chip.className = `skill-chip ${extraClass}`;
  const badgeClass = badgeLabel.toLowerCase() === 'required' ? 'badge-required' : 'badge-preferred';
  chip.innerHTML = `
    <span class="skill-chip-text">${escapeHtml(displayName)}</span>
    ${badgeLabel ? `<span class="skill-chip-badge ${badgeClass}">${badgeLabel}</span>` : ''}
  `;
  chip.title = `${displayName} (${category})`;
  return chip;
}

function renderSuggestions(suggestions) {
  const container = document.getElementById('suggestions-list');
  const card = document.getElementById('suggestions-card');
  if (!container || !card) return;

  if (!suggestions || suggestions.length === 0) {
    card.style.display = 'none';
    return;
  }

  card.style.display = 'block';
  container.innerHTML = '';

  suggestions.forEach(item => {
    const div = document.createElement('div');
    div.className = `suggestion-item priority-${item.priority || 'medium'}`;
    
    let skillsHtml = '';
    if (Array.isArray(item.skills) && item.skills.length > 0) {
      skillsHtml = '<div class="suggestion-skills">' + 
        item.skills.map(s => `<span class="suggestion-skill-chip">${escapeHtml(s)}</span>`).join('') + 
        '</div>';
    }

    div.innerHTML = `
      <div class="suggestion-icon">${item.icon || '💡'}</div>
      <div class="suggestion-content">
        <h4>${escapeHtml(item.title)}</h4>
        <p>${escapeHtml(item.description)}</p>
        ${skillsHtml}
      </div>
    `;
    container.appendChild(div);
  });
}

function renderBulletRewrites(rewrites) {
  const container = document.getElementById('bullet-rewrites-list');
  const card = document.getElementById('bullet-rewrites-card');
  if (!container || !card) return;

  if (!rewrites || rewrites.length === 0) {
    card.style.display = 'none';
    return;
  }

  card.style.display = 'block';
  container.innerHTML = '';

  rewrites.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'bullet-rewrite-item';
    div.innerHTML = `
      <div class="rewrite-section">
        <div class="rewrite-label">
          <span>Original Bullet</span>
        </div>
        <div class="rewrite-original-text">${escapeHtml(item.original)}</div>
      </div>
      <div class="rewrite-section" style="margin-top:4px;">
        <div class="rewrite-label">
          <span>ATS Optimized Rewrite</span>
          <button class="btn-copy-rewrite" data-idx="${idx}" title="Copy rewritten bullet">
            <span class="material-icons-round" style="font-size:14px;">content_copy</span> Copy
          </button>
        </div>
        <div class="rewrite-new-text">${escapeHtml(item.rewritten)}</div>
        ${item.reason ? `<div class="rewrite-reason">Why: ${escapeHtml(item.reason)}</div>` : ''}
      </div>
    `;
    container.appendChild(div);

    const copyBtn = div.querySelector('.btn-copy-rewrite');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(item.rewritten).then(() => {
          showToast('Rewritten bullet copied to clipboard!', 'success');
        }).catch(() => {
          showToast('Failed to copy text.', 'error');
        });
      });
    }
  });
}



function openColdEmailModal() {
  if (!currentResult) return;
  const subjectInput = document.getElementById('email-subject-input');
  const bodyTextarea = document.getElementById('email-body-textarea');

  if (subjectInput) subjectInput.value = currentResult.coldEmailSubject || 'Application';
  if (bodyTextarea) bodyTextarea.value = currentResult.coldEmailBody || '';

  openModal('email-modal');
}

function copyColdEmail() {
  const subjectInput = document.getElementById('email-subject-input');
  const bodyTextarea = document.getElementById('email-body-textarea');

  const subject = subjectInput ? subjectInput.value : '';
  const body = bodyTextarea ? bodyTextarea.value : '';
  const fullText = `Subject: ${subject}\n\n${body}`;

  navigator.clipboard.writeText(fullText).then(() => {
    showToast('Cold email copied to clipboard!', 'success');
  }).catch(() => {
    showToast('Failed to copy text.', 'error');
  });
}

// ─────────────────────────────────────────────
// AI MODE TOGGLE & SETTINGS
// ─────────────────────────────────────────────
async function reanalyzeWithCurrentData() {
  if (!cachedPageData) return;
  if (DOM.aiModeToggle) DOM.aiModeToggle.disabled = true;
  showProcessing('Re-analyzing...', aiModeEnabled ? 'Running AI semantic analysis...' : 'Running static keyword matching...');
  try {
    if (aiModeEnabled) {
      await analyzePageWithAI(cachedPageData);
    } else {
      await analyzePageStatic(cachedPageData);
    }
  } finally {
    if (DOM.aiModeToggle) DOM.aiModeToggle.disabled = false;
  }
}

function handleAIToggle(e) {
  aiModeEnabled = e.target.checked;
  syncAIToggleUI();
  AppStorage.saveAISettings(aiModeEnabled, aiProvider, aiApiKeys);

  if (currentResult && cachedPageData) {
    reanalyzeWithCurrentData();
  }
}

function syncAIToggleUI() {
  if (DOM.aiModeToggle) DOM.aiModeToggle.checked = aiModeEnabled;
  if (DOM.modeToggleDiv) DOM.modeToggleDiv.classList.toggle('ai-active', aiModeEnabled);
  if (DOM.btnAISettings) DOM.btnAISettings.style.display = aiModeEnabled ? 'flex' : 'none';
}

function openAISettingsModal() {
  openModal('ai-settings-modal');
  const select = document.getElementById('ai-provider-select');
  if (select) select.value = aiProvider;
  updateKeySection();
}

function closeAISettingsModal() {
  closeModal('ai-settings-modal');
}

function handleProviderChange(e) {
  aiProvider = e.target.value;
  updateKeySection();
}

function updateKeySection() {
  const keyInput = document.getElementById('ai-api-key-input');
  const keyStatus = document.getElementById('ai-key-status');

  const stepsGroq = document.getElementById('steps-groq');
  const stepsNvidia = document.getElementById('steps-nvidia');
  if (stepsGroq) stepsGroq.style.display = aiProvider === 'groq' ? 'block' : 'none';
  if (stepsNvidia) stepsNvidia.style.display = aiProvider === 'nvidia' ? 'block' : 'none';

  if (keyInput) keyInput.value = aiApiKeys[aiProvider] || '';
  if (keyStatus) keyStatus.textContent = '';
}

async function handleTestAPIKey() {
  const keyInput = document.getElementById('ai-api-key-input');
  const keyStatus = document.getElementById('ai-key-status');
  const testBtn = document.getElementById('btn-test-key');
  if (!keyInput || !keyStatus) return;

  const key = keyInput.value.trim();
  if (!key) {
    keyStatus.textContent = 'Please enter an API key first.';
    keyStatus.className = 'ai-key-status key-error';
    return;
  }

  testBtn.textContent = '...';
  testBtn.disabled = true;

  const result = await testAPIKey(aiProvider, key);

  testBtn.textContent = 'Test';
  testBtn.disabled = false;

  if (result.success) {
    keyStatus.textContent = '✓ API key is valid!';
    keyStatus.className = 'ai-key-status key-success';
  } else {
    keyStatus.textContent = `✗ Invalid key: ${result.error}`;
    keyStatus.className = 'ai-key-status key-error';
  }
}

async function saveAISettings() {
  const select = document.getElementById('ai-provider-select');
  const keyInput = document.getElementById('ai-api-key-input');

  if (select) aiProvider = select.value;
  if (keyInput) aiApiKeys[aiProvider] = keyInput.value.trim();

  await AppStorage.saveAISettings(aiModeEnabled, aiProvider, aiApiKeys);
  closeAISettingsModal();
  showToast('AI settings saved!', 'success');

  if (currentResult && cachedPageData && aiModeEnabled) {
    reanalyzeWithCurrentData();
  }
}

// ─────────────────────────────────────────────
// LLM DATA VIEWER MODAL
// ─────────────────────────────────────────────
function openLLMDataModal() {
  if (!lastAIPayload) {
    showToast('No AI prompt data available for this analysis.', 'warning');
    return;
  }

  const tag = document.getElementById('llm-provider-tag');
  const resumePrev = document.getElementById('llm-resume-preview');
  const jobPrev = document.getElementById('llm-job-preview');
  const fullPrev = document.getElementById('llm-full-preview');

  if (tag) tag.textContent = lastAIPayload.modelName || 'AI Provider';
  if (resumePrev) resumePrev.textContent = lastAIPayload.sanitizedResume || 'No resume text available';
  if (jobPrev) jobPrev.textContent = lastAIPayload.jobTextTruncated || 'No job text available';
  if (fullPrev) fullPrev.textContent = lastAIPayload.fullPromptText || 'No prompt payload available';

  switchLLMTab('resume');
  openModal('llm-data-modal');
}

function closeLLMDataModal() {
  closeModal('llm-data-modal');
}



function copyLLMData() {
  if (!lastAIPayload) return;
  const textToCopy = lastAIPayload.fullPromptText || '';
  navigator.clipboard.writeText(textToCopy).then(() => {
    showToast('Prompt payload copied to clipboard!', 'success');
  }).catch(() => {
    showToast('Failed to copy to clipboard.', 'error');
  });
}

// ─────────────────────────────────────────────
// ANALYSIS HISTORY & DEDUP HELPERS
// ─────────────────────────────────────────────
function computeUrlHash(url, text = '') {
  try {
    let identity = url || '';
    if (url && url.startsWith('http')) {
      const u = new URL(url);
      const jobId = u.searchParams.get('currentJobId') || u.searchParams.get('jobId') || u.searchParams.get('jk') || u.searchParams.get('gh_jid');
      if (jobId) {
        identity = u.hostname + '/job/' + jobId;
      } else {
        identity = u.hostname + u.pathname;
      }
    } else {
      identity = 'manual|' + (text ? text.slice(0, 100).trim() : '');
    }
    const resFingerprint = resumeText ? `${resumeText.length}_${resumeText.slice(0, 40).trim()}` : 'no_res';
    const modeStr = aiModeEnabled ? `ai_${aiProvider}` : 'static';
    const compoundStr = `${identity}|${resFingerprint}|${modeStr}|v2`;

    let hash = 0;
    for (let i = 0; i < compoundStr.length; i++) {
      hash = ((hash << 5) - hash) + compoundStr.charCodeAt(i);
      hash |= 0;
    }
    return 'job_' + Math.abs(hash).toString(36);
  } catch (e) {
    return 'job_' + Date.now().toString(36);
  }
}

function getResumeProfileName(text) {
  if (!text) return "Default Resume";
  const lines = text.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length > 0 && lines[0].length < 40 && !lines[0].toLowerCase().includes("resume") && !lines[0].toLowerCase().includes("curriculum")) {
    return lines[0];
  }
  return lines[0] ? lines[0].slice(0, 25) + "..." : "Default Resume";
}

function getTimeAgo(ts) {
  if (!ts) return 'recently';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  return new Date(ts).toLocaleDateString();
}

function recordAnalysisHistory(pageData, result) {
  if (!pageData || !result || result.isDedupHit || result.isFromHistory) return;
  const url = pageData.url || '';
  let domain = 'Local / Paste';
  try {
    if (url && url.startsWith('http')) domain = new URL(url).hostname.replace(/^www\./, '');
  } catch (_) {}
  const hash = computeUrlHash(url, pageData.text);
  const resumeProfile = getResumeProfileName(resumeText);

  analysisHistory = analysisHistory.filter(h => h.hash !== hash);

  const entry = {
    hash,
    url,
    jobTitle: result.jobTitle || pageData.title || 'Job Posting',
    domain,
    score: result.score || 0,
    verdict: result.verdictBadge || result.grade || 'CONSIDER',
    verdictColor: result.verdictColor || result.gradeColor || '#1a73e8',
    timestamp: Date.now(),
    resumeProfile,
    isAIGenerated: result.isAIGenerated || false,
    savedResult: {
      ...result,
      matchedRequired: Array.from(result.matchedRequired || []),
      matchedPreferred: Array.from(result.matchedPreferred || []),
      missingRequired: Array.from(result.missingRequired || []),
      missingPreferred: Array.from(result.missingPreferred || []),
      bonusSkills: Array.from(result.bonusSkills || []),
      suggestions: result.suggestions || [],
      bulletRewrites: result.bulletRewrites || [],
      breakdown: result.breakdown || null
    }
  };

  analysisHistory.unshift(entry);
  if (analysisHistory.length > 25) {
    analysisHistory = analysisHistory.slice(0, 25);
  }
  AppStorage.saveAnalysisHistory(analysisHistory);
}

function renderHistoryList() {
  if (!DOM.historyList || !DOM.historyEmpty) return;

  if (!analysisHistory || analysisHistory.length === 0) {
    DOM.historyList.innerHTML = '';
    DOM.historyList.style.display = 'none';
    DOM.historyEmpty.style.display = 'block';
    return;
  }

  DOM.historyEmpty.style.display = 'none';
  DOM.historyList.style.display = 'flex';
  DOM.historyList.innerHTML = '';

  analysisHistory.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'history-card';
    
    const timeAgoStr = getTimeAgo(item.timestamp);
    const badgeColor = item.verdictColor || '#1a73e8';

    div.innerHTML = `
      <div class="history-card-top">
        <div class="history-job-info">
          <h4 class="history-job-title" title="${escapeHtml(item.jobTitle)}">${escapeHtml(item.jobTitle)}</h4>
          <span class="history-domain"><span class="material-icons-round" style="font-size:12px;">public</span> ${escapeHtml(item.domain)}</span>
        </div>
        <div class="history-score-badge" style="background: ${badgeColor};">
          <span class="history-score-val">${item.score}%</span>
          <span class="history-verdict-val">${escapeHtml(item.verdict)}</span>
        </div>
      </div>
      <div class="history-card-bottom">
        <span class="history-meta"><span class="material-icons-round" style="font-size:12px;">schedule</span> ${timeAgoStr}</span>
      </div>
      <div class="history-card-actions">
        <button class="btn-history-load" data-idx="${idx}">
          <span class="material-icons-round" style="font-size:14px;">visibility</span> View Match
        </button>
        ${item.url && item.url.startsWith('http') ? `<a href="${escapeHtml(item.url)}" target="_blank" class="btn-history-link"><span class="material-icons-round" style="font-size:14px;">open_in_new</span> Job</a>` : ''}
        <button class="btn-history-delete icon-btn-sm" data-idx="${idx}" title="Delete entry">
          <span class="material-icons-round" style="font-size:16px;">delete_outline</span>
        </button>
      </div>
    `;
    DOM.historyList.appendChild(div);

    const loadBtn = div.querySelector('.btn-history-load');
    if (loadBtn && item.savedResult) {
      loadBtn.addEventListener('click', () => {
        currentResult = item.savedResult;
        const res = {
          ...item.savedResult,
          matchedRequired: new Set(item.savedResult.matchedRequired || []),
          matchedPreferred: new Set(item.savedResult.matchedPreferred || []),
          missingRequired: new Set(item.savedResult.missingRequired || []),
          missingPreferred: new Set(item.savedResult.missingPreferred || []),
          bonusSkills: new Set(item.savedResult.bonusSkills || []),
          isFromHistory: true,
          historyTimestamp: item.timestamp
        };
        renderResults(res);
        showToast(`Loaded historical analysis from ${timeAgoStr}`, 'info');
      });
    }

    const delBtn = div.querySelector('.btn-history-delete');
    if (delBtn) {
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        analysisHistory.splice(idx, 1);
        AppStorage.saveAnalysisHistory(analysisHistory);
        renderHistoryList();
        showToast('History entry deleted', 'info');
      });
    }
  });
}
