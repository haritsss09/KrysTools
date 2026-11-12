/**
 * FreeTools Pro — Supabase Auth & Cloud History Client
 * Mendukung autentikasi Supabase penuh dengan fallback localStorage otomatis.
 */

// Ganti dengan URL dan Anon Key proyek Supabase Anda
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const LOCAL_HISTORY_KEY = 'freetools_pro_local_history';
const isConfigured =
  SUPABASE_URL.startsWith('https://') &&
  !SUPABASE_URL.includes('YOUR_PROJECT_ID') &&
  SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';

let supabase = null;
let currentUser = null;

if (isConfigured && window.supabase) {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/**
 * Menampilkan pesan feedback di dalam modal autentikasi
 */
function showAuthFeedback(message, isError = false) {
  const feedbackEl = document.getElementById('auth-feedback');
  if (!feedbackEl) return;
  feedbackEl.textContent = message;
  feedbackEl.classList.remove(
    'hidden',
    'bg-rose-500/10',
    'text-rose-500',
    'bg-emerald-500/10',
    'text-emerald-500'
  );
  if (isError) {
    feedbackEl.classList.add('bg-rose-500/10', 'text-rose-500');
  } else {
    feedbackEl.classList.add('bg-emerald-500/10', 'text-emerald-500');
  }
}

/**
 * Memperbarui tampilan UI Navbar (index.html) & Sidebar (dashboard.html) berdasarkan status login
 */
function updateAuthUI(user) {
  currentUser = user;

  // 1. Update Navbar di index.html
  const navAuthLabel = document.getElementById('nav-auth-label');
  if (navAuthLabel) {
    navAuthLabel.textContent = user ? user.email.split('@')[0] : 'Masuk';
  }

  // 2. Update Sidebar di dashboard.html
  const sidebarEmail = document.getElementById('sidebar-user-email');
  const sidebarStatus = document.getElementById('sidebar-sync-status');
  const avatarInitial = document.getElementById('user-avatar-initial');
  const sidebarAuthBtn = document.getElementById('sidebar-auth-btn');

  if (sidebarEmail && sidebarStatus && avatarInitial) {
    if (user) {
      sidebarEmail.textContent = user.email;
      sidebarStatus.textContent = '● Cloud Sync Aktif';
      sidebarStatus.classList.add('text-emerald-500');
      avatarInitial.textContent = user.email.charAt(0).toUpperCase();
      if (sidebarAuthBtn) {
        sidebarAuthBtn.title = 'Keluar (Logout)';
        sidebarAuthBtn.innerHTML = '<i data-lucide="log-out" class="w-4 h-4 text-rose-500"></i>';
      }
    } else {
      sidebarEmail.textContent = isConfigured ? 'Mode Tamu (Lokal)' : 'Mode Lokal (Offline Sync)';
      sidebarStatus.textContent = isConfigured ? 'Login untuk Cloud Sync' : 'Tersimpan di Browser';
      sidebarStatus.classList.remove('text-emerald-500');
      avatarInitial.textContent = 'G';
      if (sidebarAuthBtn) {
        sidebarAuthBtn.title = 'Masuk Akun Supabase';
        sidebarAuthBtn.innerHTML = '<i data-lucide="log-in" class="w-4 h-4"></i>';
      }
    }
    if (window.lucide) window.lucide.createIcons();
  }
}

/**
 * Inisialisasi Listener Form Login, Daftar & Logout
 */
export async function initSupabaseAuth() {
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    updateAuthUI(data?.session?.user || null);

    supabase.auth.onAuthStateChange((_event, session) => {
      updateAuthUI(session?.user || null);
      renderHistoryDrawer();
    });
  } else {
    updateAuthUI(null);
  }

  const authForm = document.getElementById('auth-form');
  const signupBtn = document.getElementById('auth-signup-btn');
  const authModal = document.getElementById('auth-modal');
  const sidebarAuthBtn = document.getElementById('sidebar-auth-btn');

  // Handle Logout jika user sudah login saat tombol sidebar diklik
  sidebarAuthBtn?.addEventListener('click', async (e) => {
    if (currentUser && supabase) {
      e.stopImmediatePropagation();
      await supabase.auth.signOut();
      window.showToast?.('Berhasil keluar dari akun Supabase.', 'info');
    }
  });

  // Handle Sign In
  authForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!supabase) {
      showAuthFeedback(
        'Konfigurasi SUPABASE_URL & SUPABASE_ANON_KEY di assets/js/supabase-client.js terlebih dahulu untuk mengaktifkan Cloud Auth.',
        true
      );
      return;
    }

    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      showAuthFeedback(`Gagal masuk: ${error.message}`, true);
    } else {
      showAuthFeedback('Login berhasil! Menyinkronkan data...', false);
      setTimeout(() => {
        authModal?.classList.add('hidden');
        authModal?.classList.remove('flex');
      }, 700);
      window.showToast?.('Berhasil masuk ke Supabase Cloud.', 'success');
    }
  });

  // Handle Sign Up
  signupBtn?.addEventListener('click', async () => {
    if (!supabase) {
      showAuthFeedback(
        'Isi SUPABASE_URL dan SUPABASE_ANON_KEY di assets/js/supabase-client.js untuk pendaftaran akun.',
        true
      );
      return;
    }

    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;

    if (!email || password.length < 6) {
      showAuthFeedback('Masukkan email valid dan password minimal 6 karakter.', true);
      return;
    }

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      showAuthFeedback(`Pendaftaran gagal: ${error.message}`, true);
    } else {
      showAuthFeedback('Akun berhasil dibuat! Silakan cek email verifikasi atau langsung masuk.', false);
    }
  });

  // Load riwayat saat drawer dibuka
  document.getElementById('open-history-btn')?.addEventListener('click', () => {
    renderHistoryDrawer();
  });
}

/**
 * Menyimpan item riwayat ke Supabase (jika login) atau localStorage
 */
export async function saveToolHistory(toolName, title, content) {
  const entry = {
    id: crypto.randomUUID(),
    tool_name: toolName,
    title,
    content,
    created_at: new Date().toISOString()
  };

  if (supabase && currentUser) {
    const { error } = await supabase.from('tool_history').insert([
      {
        user_id: currentUser.id,
        tool_name: toolName,
        title,
        content
      }
    ]);

    if (error) {
      console.error('Supabase insert error:', error);
      window.showToast?.(`Gagal menyimpan ke cloud: ${error.message}`, 'error');
      return false;
    }
    window.showToast?.('Tersimpan ke Supabase Cloud!', 'success');
    return true;
  }

  // Fallback LocalStorage
  const existing = JSON.parse(localStorage.getItem(LOCAL_HISTORY_KEY) || '[]');
  existing.unshift(entry);
  localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(existing.slice(0, 50)));
  window.showToast?.('Tersimpan ke Riwayat Lokal!', 'success');
  return true;
}

/**
 * Mengambil dan merender daftar riwayat di dalam History Drawer
 */
export async function renderHistoryDrawer() {
  const container = document.getElementById('history-list-container');
  if (!container) return;

  container.innerHTML = '<p class="text-xs text-slate-400 text-center py-6">Memuat riwayat...</p>';

  let items = [];

  if (supabase && currentUser) {
    const { data, error } = await supabase
      .from('tool_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    if (!error && data) items = data;
  } else {
    items = JSON.parse(localStorage.getItem(LOCAL_HISTORY_KEY) || '[]');
  }

  if (items.length === 0) {
    container.innerHTML = `
      <div class="text-center py-10 space-y-2">
        <p class="text-xs text-slate-500">Belum ada riwayat tersimpan.</p>
        <p class="text-[11px] text-slate-400">Gunakan tombol "Simpan" pada Password Generator atau AI Security Advisor.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = items
    .map((item) => {
      const dateStr = new Date(item.created_at).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
      const safePreview = String(item.content)
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .slice(0, 140);

      return `
        <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
          <div class="flex items-center justify-between gap-2">
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-brand-500/10 text-brand-600 dark:text-brand-400">${item.tool_name}</span>
            <span class="text-[10px] text-slate-400">${dateStr}</span>
          </div>
          <p class="text-xs font-bold truncate">${item.title}</p>
          <p class="text-[11px] font-mono text-slate-500 dark:text-slate-400 break-all line-clamp-2">${safePreview}</p>
          <div class="flex justify-end gap-2 pt-1">
            <button type="button" data-copy-raw="${encodeURIComponent(item.content)}" class="history-copy-btn text-[11px] font-medium text-brand-600 dark:text-brand-400 hover:underline">Salin</button>
            <button type="button" data-del-id="${item.id}" class="history-del-btn text-[11px] font-medium text-rose-500 hover:underline">Hapus</button>
          </div>
        </div>
      `;
    })
    .join('');

  // Bind tombol salin & hapus di riwayat
  container.querySelectorAll('.history-copy-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const raw = decodeURIComponent(btn.getAttribute('data-copy-raw'));
      navigator.clipboard.writeText(raw);
      window.showToast?.('Konten riwayat disalin!', 'success');
    });
  });

  container.querySelectorAll('.history-del-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-del-id');
      if (supabase && currentUser) {
        await supabase.from('tool_history').delete().eq('id', id);
      } else {
        const list = JSON.parse(localStorage.getItem(LOCAL_HISTORY_KEY) || '[]');
        localStorage.setItem(
          LOCAL_HISTORY_KEY,
          JSON.stringify(list.filter((entry) => entry.id !== id))
        );
      }
      renderHistoryDrawer();
      window.showToast?.('Item riwayat dihapus.', 'info');
    });
  });
}

// Auto-init jika dimuat langsung di index.html
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSupabaseAuth);
} else {
  initSupabaseAuth();
}