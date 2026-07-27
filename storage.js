// storage.js — Storage Layer for Resume Match Score Extension
// Encapsulates all chrome.storage.local operations with async/await syntax.

const AppStorage = {
  /**
   * Load all saved extension settings and state.
   */
  async loadAll() {
    try {
      const data = await chrome.storage.local.get([
        'resumeText',
        'resumeSkills',
        'aiModeEnabled',
        'aiProvider',
        'aiApiKeys',
        'customAllowedPatterns'
      ]);
      return {
        resumeText: data.resumeText || '',
        resumeSkills: Array.isArray(data.resumeSkills) ? data.resumeSkills : [],
        aiModeEnabled: typeof data.aiModeEnabled === 'boolean' ? data.aiModeEnabled : false,
        aiProvider: data.aiProvider || 'groq',
        aiApiKeys: data.aiApiKeys || { groq: '', nvidia: '' },
        customAllowedPatterns: Array.isArray(data.customAllowedPatterns) ? data.customAllowedPatterns : [],
      };
    } catch (err) {
      console.warn('Storage load error:', err);
      return {
        resumeText: '',
        resumeSkills: [],
        aiModeEnabled: false,
        aiProvider: 'groq',
        aiApiKeys: { groq: '', nvidia: '' },
        customAllowedPatterns: [],
      };
    }
  },

  /**
   * @param {string} resumeText 
   * @param {Set<string>|Array<string>} resumeSkills 
   */
  async saveResume(resumeText, resumeSkills) {
    try {
      await chrome.storage.local.set({
        resumeText,
        resumeSkills: Array.from(resumeSkills)
      });
    } catch (err) {
      console.warn('Error saving resume:', err);
    }
  },

  /**
   * Clear resume data from storage.
   */
  async clearResume() {
    try {
      await chrome.storage.local.remove(['resumeText', 'resumeSkills']);
    } catch (err) {
      console.warn('Error clearing resume:', err);
    }
  },



  /**
   * @param {boolean} aiModeEnabled 
   * @param {string} aiProvider 
   * @param {Object} aiApiKeys 
   */
  async saveAISettings(aiModeEnabled, aiProvider, aiApiKeys) {
    try {
      await chrome.storage.local.set({
        aiModeEnabled,
        aiProvider,
        aiApiKeys
      });
    } catch (err) {
      console.warn('Error saving AI settings:', err);
    }
  },

  /**
   * @param {Array<string>} customAllowedPatterns 
   */
  async saveCustomAllowedPatterns(customAllowedPatterns) {
    try {
      await chrome.storage.local.set({ customAllowedPatterns });
    } catch (err) {
      console.warn('Error saving custom patterns:', err);
    }
  },
};

