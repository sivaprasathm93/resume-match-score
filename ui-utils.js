// ui-utils.js — UI Utilities for Resume Match Score Extension
// Handles view switching, modals, toast notifications, animations, and sanitization.

/**
 * Escapes HTML characters for safe DOM insertion.
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Promisified sleep helper.
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Display a toast notification message.
 */
function showToast(message, type = 'info', duration = 3000) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-message');
  const toastIcon = document.getElementById('toast-icon');

  if (!toast || !toastMsg) return;

  toastMsg.textContent = message;
  toast.className = `toast toast-${type}`;

  const iconMap = {
    info: 'info',
    success: 'check_circle',
    warning: 'warning',
    error: 'error_outline'
  };

  if (toastIcon) {
    toastIcon.textContent = iconMap[type] || 'info';
  }

  toast.style.display = 'flex';

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.display = 'none';
  }, duration);
}

/**
 * Switch active view container in the popup SPA layout.
 */
function showView(viewId) {
  document.querySelectorAll('.view').forEach(view => {
    view.style.display = view.id === viewId ? 'block' : 'none';
    if (view.id === viewId) {
      view.classList.add('active');
    } else {
      view.classList.remove('active');
    }
  });

  // Update header buttons visibility based on view
  const btnManage = document.getElementById('btn-manage-resume');
  const btnSettings = document.getElementById('btn-settings');
  const btnHistory = document.getElementById('btn-history');
  const isDashboardOrResults = viewId === 'view-dashboard' || viewId === 'view-results';

  if (btnManage) btnManage.style.display = isDashboardOrResults ? 'flex' : 'none';
  if (btnSettings) btnSettings.style.display = isDashboardOrResults ? 'flex' : 'none';
  if (btnHistory) btnHistory.style.display = isDashboardOrResults ? 'flex' : 'none';
}

/**
 * Show a modal dialog by ID.
 */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
  }
}

/**
 * Close a modal dialog by ID.
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * Show processing overlay screen.
 */
function showProcessing(title = 'Processing...', subtitle = 'Please wait') {
  showView('view-processing');
  const titleEl = document.getElementById('processing-text');
  const subEl = document.getElementById('processing-sub');
  if (titleEl) titleEl.textContent = title;
  if (subEl) subEl.textContent = subtitle;
}

/**
 * Smooth animated numerical counter.
 */
function animateCounter(elementId, start, end, duration = 1000) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const startTime = performance.now();
  const range = end - start;

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic formula
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.round(start + range * easeProgress);

    el.textContent = currentValue;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/**
 * Switch results tabs in the UI.
 */
function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  const panelMatched = document.getElementById('panel-matched');
  const panelMissing = document.getElementById('panel-missing');
  if (panelMatched) panelMatched.style.display = tabName === 'matched' ? 'block' : 'none';
  if (panelMissing) panelMissing.style.display = tabName === 'missing' ? 'block' : 'none';
}

/**
 * Switch LLM Data Viewer tabs in the UI.
 */
function switchLLMTab(tabName) {
  document.querySelectorAll('.llm-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.llmtab === tabName);
  });

  const panels = {
    resume: document.getElementById('llm-panel-resume'),
    job: document.getElementById('llm-panel-job'),
    full: document.getElementById('llm-panel-full'),
  };

  Object.keys(panels).forEach(key => {
    if (panels[key]) {
      panels[key].style.display = key === tabName ? 'block' : 'none';
    }
  });
}

/**
 * Renders a list of text insights (strengths/concerns) with bullet points.
 */
function renderInsightsList(containerId, items) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  if (!items || items.length === 0) {
    container.innerHTML = '<div class="insight-item"><span class="insight-bullet">•</span><span>None noted</span></div>';
    return;
  }

  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'insight-item';
    div.innerHTML = `<span class="insight-bullet">•</span><span>${escapeHtml(item)}</span>`;
    container.appendChild(div);
  });
}
