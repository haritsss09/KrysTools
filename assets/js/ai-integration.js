import { saveToolHistory } from './supabase-client.js';
import { ENV } from './config.js';

const GEMINI_API_KEY = ENV.GEMINI_API_KEY;

const SYSTEM_PROMPTS = {
  'security-audit':
    'Anda adalah Senior Cyber Security Engineer & Penetration Tester. Analisis input pengguna secara mendalam untuk mencari kerentanan keamanan (OWASP Top 10, XSS, SQLi, kelemahan algoritma kriptografi, mis-konfigurasi JWT, atau eksposur kredensial). Berikan tingkat risiko (CRITICAL/HIGH/MEDIUM/LOW), penjelasan teknis singkat, dan kode perbaikan yang aman dalam Bahasa Indonesia.',
  'code-review':
    'Anda adalah Principal Software Architect. Tinjau potongan kode pengguna dari sisi performa, kebersihan arsitektur, edge-case, dan best practices modern. Berikan saran refactoring yang konkret dalam Bahasa Indonesia.',
  'config-check':
    'Anda adalah DevSecOps & Cloud Infrastructure Specialist. Audit konfigurasi server (Nginx, Apache, Docker, CORS, CSP, HSTS) yang diberikan pengguna dan berikan konfigurasi hardening yang direkomendasikan dalam Bahasa Indonesia.',
  'general-helper':
    'Anda adalah Asisten Developer & Utilitas Digital Senior pada platform FreeTools Pro. Jawab pertanyaan teknis, regex, struktur data, atau debugging dengan akurat, ringkas, dan praktis dalam Bahasa Indonesia.'
};

let lastMarkdownReport = '';


async function callGeminiAPI(prompt, mode) {
  const systemInstruction = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS['security-audit'];
  let lastError = null;

  for (const model of GEMINI_MODELS) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
      GEMINI_API_KEY
    )}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 2048
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        lastError = data?.error?.message || `HTTP ${response.status}`;
        continue;
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (err) {
      lastError = err.message;
    }
  }

  throw new Error(lastError || 'Gagal menghubungi layanan Gemini AI.');
}


export function initAIAdvisor() {
  const contextSelect = document.getElementById('ai-context-type');
  const promptInput = document.getElementById('ai-prompt-input');
  const submitBtn = document.getElementById('ai-submit-btn');
  const clearBtn = document.getElementById('ai-clear-btn');
  const saveBtn = document.getElementById('ai-save-btn');
  const copyBtn = document.getElementById('ai-copy-response-btn');
  const loadingBox = document.getElementById('ai-loading');
  const responseWrapper = document.getElementById('ai-response-wrapper');
  const responseOutput = document.getElementById('ai-response-output');

  if (!submitBtn || !promptInput) return;

  
  document.querySelectorAll('.ai-preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-preset');
      promptInput.value = `${preset}\n\n`;
      promptInput.focus();
    });
  });

  
  clearBtn?.addEventListener('click', () => {
    promptInput.value = '';
    responseWrapper.classList.add('hidden');
    saveBtn?.classList.add('hidden');
    lastMarkdownReport = '';
  });

  // Copy Markdown Report
  copyBtn?.addEventListener('click', () => {
    if (!lastMarkdownReport) return;
    navigator.clipboard.writeText(lastMarkdownReport);
    window.showToast?.('Laporan analisis AI berhasil disalin!', 'success');
  });

  
  saveBtn?.addEventListener('click', async () => {
    if (!lastMarkdownReport) return;
    const modeLabel = contextSelect.options[contextSelect.selectedIndex]?.text || 'AI Audit';
    await saveToolHistory('AI Advisor', modeLabel, lastMarkdownReport);
  });

 
  submitBtn.addEventListener('click', async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) {
      window.showToast?.('Masukkan kode, token, atau konfigurasi yang ingin dianalisis.', 'error');
      promptInput.focus();
      return;
    }

    const mode = contextSelect.value;

   
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-60', 'cursor-not-allowed');
    loadingBox.classList.remove('hidden');
    responseWrapper.classList.add('hidden');
    saveBtn?.classList.add('hidden');

    try {
      const markdownText = await callGeminiAPI(prompt, mode);
      lastMarkdownReport = markdownText;

  
      if (window.marked) {
        responseOutput.innerHTML = window.marked.parse(markdownText);
      } else {
        responseOutput.textContent = markdownText;
      }

      responseWrapper.classList.remove('hidden');
      saveBtn?.classList.remove('hidden');
      window.showToast?.('Analisis Gemini AI selesai!', 'success');
    } catch (error) {
      responseOutput.innerHTML = `
        <div class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-mono">
          <strong>[API Error]</strong> ${error.message}
        </div>
      `;
      responseWrapper.classList.remove('hidden');
      window.showToast?.('Terjadi kendala saat memanggil Gemini API.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove('opacity-60', 'cursor-not-allowed');
      loadingBox.classList.add('hidden');
    }
  });
}
