// content.js — Extracts job posting text from the active page
// Injected via chrome.scripting.executeScript from popup.js

(() => {
  'use strict';
  /**
   * Attempts to find the main job description content using
   * site-specific selectors, then falls back to generic selectors.
   */
  const JOB_SELECTORS = [
    // LinkedIn
    '.jobs-description__content',
    '.jobs-box__html-content',
    '.description__text',
    '.jobs-description-content__text',
    // Indeed
    '#jobDescriptionText',
    '.jobsearch-jobDescriptionText',
    '.jobsearch-JobInfoHeader-title-container',
    // Glassdoor
    '.jobDescriptionContent',
    '#JobDescriptionContainer',
    '.desc',
    // Naukri
    '.job-desc',
    '.jd-container',
    '.styles_JDC__dang-inner-html__h0K4t',
    '.styles_job-desc-container__txpYf',
    // Monster
    '.job-description',
    '#JobDescription',
    // ZipRecruiter
    '.job_description',
    '.jobDescriptionSection',
    // AngelList / Wellfound
    '.listing-container',
    // Dice
    '#jobdescSec',
    // SimplyHired
    '.viewjob-jobDescription',
    // CareerBuilder
    '.jdp-job-description-card',
    // Google Jobs
    '.HBvzbc',
    // Generic selectors
    '[data-testid="job-description"]',
    '[data-automation="jobDescription"]',
    '[class*="job-description"]',
    '[class*="jobDescription"]',
    '[class*="job_description"]',
    '[class*="job-detail"]',
    '[class*="posting-requirements"]',
    '[id*="job-description"]',
    '[id*="jobDescription"]',
    'article[role="main"]',
    'article',
    'main',
    '[role="main"]',
  ];

  let content = '';
  let title = document.title || '';

  // Try each selector
  for (const selector of JOB_SELECTORS) {
    try {
      const el = document.querySelector(selector);
      if (el && el.innerText && el.innerText.trim().length > 80) {
        content = el.innerText.trim();
        break;
      }
    } catch (_) {
      // Skip invalid selectors
    }
  }

  // Fallback: combine multiple smaller job-related sections
  if (!content || content.length < 80) {
    const candidates = document.querySelectorAll(
      'section, .card, .panel, [class*="detail"], [class*="requirement"], [class*="qualification"]'
    );
    const parts = [];
    candidates.forEach((el) => {
      const text = el.innerText?.trim();
      if (text && text.length > 40) parts.push(text);
    });
    if (parts.length) content = parts.join('\n\n');
  }

  // Final fallback: body text
  if (!content || content.length < 80) {
    content = document.body.innerText?.trim() || '';
  }

  // Also try to extract the job title from the page
  const titleSelectors = [
    'h1',
    '.jobs-unified-top-card__job-title',
    '.jobsearch-JobInfoHeader-title',
    '[class*="job-title"]',
    '[class*="jobTitle"]',
    '[data-testid="jobTitle"]',
  ];
  let jobTitle = '';
  for (const sel of titleSelectors) {
    try {
      const el = document.querySelector(sel);
      if (el && el.innerText?.trim()) {
        jobTitle = el.innerText.trim();
        break;
      }
    } catch (_) {}
  }

  return {
    text: content,
    title: jobTitle || title,
    url: window.location.href,
    length: content.length,
  };
})();
