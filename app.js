/**
 * FreeTools Pro — Main Application Bootstrapper
 */
import { initSupabaseAuth } from './supabase-client.js';
import { initAIAdvisor } from './ai-integration.js';
import { initSecurityTools } from './tools/security.js';
import { initUtilityTools } from './tools/utilities.js';

/**
 * Global Toast Notification Helper
 */
window.showToast = function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const colorMap = {
    success: 'bg-emerald-600 text-white border-emerald-500',
    error: 'bg-rose-600 text-white border-rose-500',
    info: 'bg-slate-900 dark:bg-slate-800 text-white border-slate-700'
  };

  toast.className = `toast-item px-4 py-2.5 rounded-xl border shadow-lg text-xs font-medium flex items-center gap-2 ${
    colorMap[type] || colorMap.info
  }`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-exit');
    toast.addEventListener('animationend', () => toast.remove());
  }, 2600);
};

/**
 * Global Copy-to-Clipboard Delegator untuk seluruh tombol `.copy-btn`
 */
function initGlobalCopyButtons() {
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-copy-from');
      const targetEl = document.getElementById(targetId);
      if (!targetEl || !targetEl.value) {
        window.showToast?.('Tidak ada teks untuk disalin.', 'error');
        return;
      }
      navigator.clipboard.writeText(targetEl.value);
      window.showToast?.('Berhasil disalin ke clipboard!', 'success');
    });
  });
}

// Bootstrap Seluruh Modul Aplikasi
document.addEventListener('DOMContentLoaded', () => {
  initGlobalCopyButtons();
  initSecurityTools();
  initUtilityTools();
  initAIAdvisor();

  if (window.lucide) {
    window.lucide.createIcons();
  }
});