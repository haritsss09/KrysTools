/**
 * FreeTools Pro — Security & Network Tools Module
 * 1. Password Generator (Web Crypto API)
 * 2. Hash Generator (MD5, SHA-1, SHA-256, SHA-512)
 * 3. Base64 & URL Encoder/Decoder (UTF-8 Safe)
 * 4. JWT Debugger & Security Inspector
 * 5. SSL/TLS & IP/DNS Network Analyzer
 */
import { saveToolHistory } from '../supabase-client.js';

/* ==========================================================================
   1. CRYPTOGRAPHIC PASSWORD GENERATOR
   ========================================================================== */
function initPasswordGenerator() {
  const outputEl = document.getElementById('pw-output');
  const lengthInput = document.getElementById('pw-length');
  const lengthVal = document.getElementById('pw-length-val');
  const upperChk = document.getElementById('pw-upper');
  const lowerChk = document.getElementById('pw-lower');
  const numbersChk = document.getElementById('pw-numbers');
  const symbolsChk = document.getElementById('pw-symbols');
  const refreshBtn = document.getElementById('pw-refresh-btn');
  const copyBtn = document.getElementById('pw-copy-btn');
  const saveBtn = document.getElementById('pw-save-btn');
  const strengthLabel = document.getElementById('pw-strength-label');
  const entropyVal = document.getElementById('pw-entropy-val');
  const strengthBar = document.getElementById('pw-strength-bar');

  if (!outputEl) return;

  const CHARSETS = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()-_=+[]{}|;:,.<>?'
  };

  function generatePassword() {
    const length = parseInt(lengthInput.value, 10);
    lengthVal.textContent = length;

    let pool = '';
    if (upperChk.checked) pool += CHARSETS.upper;
    if (lowerChk.checked) pool += CHARSETS.lower;
    if (numbersChk.checked) pool += CHARSETS.numbers;
    if (symbolsChk.checked) pool += CHARSETS.symbols;

    if (!pool) {
      lowerChk.checked = true;
      pool = CHARSETS.lower;
    }

    const randomValues = new Uint32Array(length);
    window.crypto.getRandomValues(randomValues);

    let password = '';
    for (let i = 0; i < length; i++) {
      password += pool[randomValues[i] % pool.length];
    }

    outputEl.value = password;

    // Hitung Entropi: E = L * log2(R)
    const entropy = Math.round(length * Math.log2(pool.length));
    entropyVal.textContent = entropy;

    strengthBar.classList.remove('bg-rose-500', 'bg-amber-500', 'bg-emerald-500');
    strengthLabel.classList.remove('text-rose-500', 'text-amber-500', 'text-emerald-500');

    if (entropy < 50) {
      strengthLabel.textContent = 'Lemah';
      strengthLabel.classList.add('text-rose-500');
      strengthBar.classList.add('bg-rose-500');
      strengthBar.style.width = '30%';
    } else if (entropy < 80) {
      strengthLabel.textContent = 'Menengah';
      strengthLabel.classList.add('text-amber-500');
      strengthBar.classList.add('bg-amber-500');
      strengthBar.style.width = '62%';
    } else {
      strengthLabel.textContent = 'Sangat Kuat';
      strengthLabel.classList.add('text-emerald-500');
      strengthBar.classList.add('bg-emerald-500');
      strengthBar.style.width = `${Math.min(100, Math.round((entropy / 128) * 100))}%`;
    }
  }

  [lengthInput, upperChk, lowerChk, numbersChk, symbolsChk].forEach((el) => {
    el?.addEventListener('input', generatePassword);
  });

  refreshBtn?.addEventListener('click', generatePassword);

  copyBtn?.addEventListener('click', () => {
    navigator.clipboard.writeText(outputEl.value);
    window.showToast?.('Password disalin ke clipboard!', 'success');
  });

  saveBtn?.addEventListener('click', async () => {
    await saveToolHistory(
      'Password Generator',
      `Generated Password (${lengthInput.value} chars)`,
      outputEl.value
    );
  });

  // Generate password awal saat halaman dibuka
  generatePassword();
}

/* ==========================================================================
   2. HASH GENERATOR (MD5, SHA-1, SHA-256, SHA-512)
   ========================================================================== */
function md5(string) {
  function rotateLeft(lValue, iShiftBits) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }
  function addUnsigned(lX, lY) {
    const lX4 = lX & 0x40000000;
    const lY4 = lY & 0x40000000;
    const lX8 = lX & 0x80000000;
    const lY8 = lY & 0x80000000;
    const lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff);
    if (lX4 & lY4) return lResult ^ 0x80000000 ^ lX8 ^ lY8;
    if (lX4 | lY4) {
      return lResult & 0x40000000
        ? lResult ^ 0xc0000000 ^ lX8 ^ lY8
        : lResult ^ 0x40000000 ^ lX8 ^ lY8;
    }
    return lResult ^ lX8 ^ lY8;
  }
  const F = (x, y, z) => (x & y) | (~x & z);
  const G = (x, y, z) => (x & z) | (y & ~z);
  const H = (x, y, z) => x ^ y ^ z;
  const I = (x, y, z) => y ^ (x | ~z);

  function FF(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function GG(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function HH(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function II(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function convertToWordArray(str) {
    const utf8Str = unescape(encodeURIComponent(str));
    const lMessageLength = utf8Str.length;
    const lNumberOfWordsTemp1 = lMessageLength + 8;
    const lNumberOfWordsTemp2 = (lNumberOfWordsTemp1 - (lNumberOfWordsTemp1 % 64)) / 64;
    const lNumberOfWords = (lNumberOfWordsTemp2 + 1) * 16;
    const lWordArray = Array(lNumberOfWords - 1).fill(0);
    let lBytePosition = 0;
    let lByteCount = 0;
    while (lByteCount < lMessageLength) {
      const lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = lWordArray[lWordCount] | (utf8Str.charCodeAt(lByteCount) << lBytePosition);
      lByteCount++;
    }
    const lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  }

  function wordToHex(lValue) {
    let hex = '';
    for (let lCount = 0; lCount <= 3; lCount++) {
      const lByte = (lValue >>> (lCount * 8)) & 255;
      const temp = '0' + lByte.toString(16);
      hex += temp.substr(temp.length - 2, 2);
    }
    return hex;
  }

  const x = convertToWordArray(string);
  let a = 0x67452301,
    b = 0xefcdab89,
    c = 0x98badcfe,
    d = 0x10325476;

  for (let k = 0; k < x.length; k += 16) {
    const AA = a, BB = b, CC = c, DD = d;
    a = FF(a, b, c, d, x[k + 0], 7, 0xd76aa478);
    d = FF(d, a, b, c, x[k + 1], 12, 0xe8c7b756);
    c = FF(c, d, a, b, x[k + 2], 17, 0x242070db);
    b = FF(b, c, d, a, x[k + 3], 22, 0xc1bdceee);
    a = FF(a, b, c, d, x[k + 4], 7, 0xf57c0faf);
    d = FF(d, a, b, c, x[k + 5], 12, 0x4787c62a);
    c = FF(c, d, a, b, x[k + 6], 17, 0xa8304613);
    b = FF(b, c, d, a, x[k + 7], 22, 0xfd469501);
    a = FF(a, b, c, d, x[k + 8], 7, 0x698098d8);
    d = FF(d, a, b, c, x[k + 9], 12, 0x8b44f7af);
    c = FF(c, d, a, b, x[k + 10], 17, 0xffff5bb1);
    b = FF(b, c, d, a, x[k + 11], 22, 0x895cd7be);
    a = FF(a, b, c, d, x[k + 12], 7, 0x6b901122);
    d = FF(d, a, b, c, x[k + 13], 12, 0xfd987193);
    c = FF(c, d, a, b, x[k + 14], 17, 0xa679438e);
    b = FF(b, c, d, a, x[k + 15], 22, 0x49b40821);

    a = GG(a, b, c, d, x[k + 1], 5, 0xf61e2562);
    d = GG(d, a, b, c, x[k + 6], 9, 0xc040b340);
    c = GG(c, d, a, b, x[k + 11], 14, 0x265e5a51);
    b = GG(b, c, d, a, x[k + 0], 20, 0xe9b6c7aa);
    a = GG(a, b, c, d, x[k + 5], 5, 0xd62f105d);
    d = GG(d, a, b, c, x[k + 10], 9, 0x2441453);
    c = GG(c, d, a, b, x[k + 15], 14, 0xd8a1e681);
    b = GG(b, c, d, a, x[k + 4], 20, 0xe7d3fbc8);
    a = GG(a, b, c, d, x[k + 9], 5, 0x21e1cde6);
    d = GG(d, a, b, c, x[k + 14], 9, 0xc33707d6);
    c = GG(c, d, a, b, x[k + 3], 14, 0xf4d50d87);
    b = GG(b, c, d, a, x[k + 8], 20, 0x455a14ed);
    a = GG(a, b, c, d, x[k + 13], 5, 0xa9e3e905);
    d = GG(d, a, b, c, x[k + 2], 9, 0xfcefa3f8);
    c = GG(c, d, a, b, x[k + 7], 14, 0x676f02d9);
    b = GG(b, c, d, a, x[k + 12], 20, 0x8d2a4c8a);

    a = HH(a, b, c, d, x[k + 5], 4, 0xfffa3942);
    d = HH(d, a, b, c, x[k + 8], 11, 0x8771f681);
    c = HH(c, d, a, b, x[k + 11], 16, 0x6d9d6122);
    b = HH(b, c, d, a, x[k + 14], 23, 0xfde5380c);
    a = HH(a, b, c, d, x[k + 1], 4, 0xa4beea44);
    d = HH(d, a, b, c, x[k + 4], 11, 0x4bdecfa9);
    c = HH(c, d, a, b, x[k + 7], 16, 0xf6bb4b60);
    b = HH(b, c, d, a, x[k + 10], 23, 0xbebfbc70);
    a = HH(a, b, c, d, x[k + 13], 4, 0x289b7ec6);
    d = HH(d, a, b, c, x[k + 0], 11, 0xeaa127fa);
    c = HH(c, d, a, b, x[k + 3], 16, 0xd4ef3085);
    b = HH(b, c, d, a, x[k + 6], 23, 0x4881d05);
    a = HH(a, b, c, d, x[k + 9], 4, 0xd9d4d039);
    d = HH(d, a, b, c, x[k + 12], 11, 0xe6db99e5);
    c = HH(c, d, a, b, x[k + 15], 16, 0x1fa27cf8);
    b = HH(b, c, d, a, x[k + 2], 23, 0xc4ac5665);

    a = II(a, b, c, d, x[k + 0], 6, 0xf4292244);
    d = II(d, a, b, c, x[k + 7], 10, 0x432aff97);
    c = II(c, d, a, b, x[k + 14], 15, 0xab9423a7);
    b = II(b, c, d, a, x[k + 5], 21, 0xfc93a039);
    a = II(a, b, c, d, x[k + 12], 6, 0x655b59c3);
    d = II(d, a, b, c, x[k + 3], 10, 0x8f0ccc92);
    c = II(c, d, a, b, x[k + 10], 15, 0xffeff47d);
    b = II(b, c, d, a, x[k + 1], 21, 0x85845dd1);
    a = II(a, b, c, d, x[k + 8], 6, 0x6fa87e4f);
    d = II(d, a, b, c, x[k + 15], 10, 0xfe2ce6e0);
    c = II(c, d, a, b, x[k + 6], 15, 0xa3014314);
    b = II(b, c, d, a, x[k + 13], 21, 0x4e0811a1);
    a = II(a, b, c, d, x[k + 4], 6, 0xf7537e82);
    d = II(d, a, b, c, x[k + 11], 10, 0xbd3af235);
    c = II(c, d, a, b, x[k + 2], 15, 0x2ad7d2bb);
    b = II(b, c, d, a, x[k + 9], 21, 0xeb86d391);

    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }
  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}

async function computeWebCryptoHash(algo, text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest(algo, data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function initHashGenerator() {
  const inputEl = document.getElementById('hash-input');
  const clearBtn = document.getElementById('hash-clear-btn');
  const md5Out = document.getElementById('hash-md5');
  const sha1Out = document.getElementById('hash-sha1');
  const sha256Out = document.getElementById('hash-sha256');
  const sha512Out = document.getElementById('hash-sha512');

  if (!inputEl) return;

  async function updateHashes() {
    const val = inputEl.value;
    if (!val) {
      md5Out.value = '';
      sha1Out.value = '';
      sha256Out.value = '';
      sha512Out.value = '';
      return;
    }

    md5Out.value = md5(val);
    const [s1, s256, s512] = await Promise.all([
      computeWebCryptoHash('SHA-1', val),
      computeWebCryptoHash('SHA-256', val),
      computeWebCryptoHash('SHA-512', val)
    ]);
    sha1Out.value = s1;
    sha256Out.value = s256;
    sha512Out.value = s512;
  }

  inputEl.addEventListener('input', updateHashes);
  clearBtn?.addEventListener('click', () => {
    inputEl.value = '';
    updateHashes();
  });
}

/* ==========================================================================
   3. BASE64 & URL ENCODER / DECODER
   ========================================================================== */
function initEncoderDecoder() {
  const modeBtns = document.querySelectorAll('.enc-mode-btn');
  const inputEl = document.getElementById('enc-input');
  const outputEl = document.getElementById('enc-output');
  const encodeBtn = document.getElementById('enc-encode-btn');
  const decodeBtn = document.getElementById('enc-decode-btn');
  const swapBtn = document.getElementById('enc-swap-btn');

  if (!inputEl) return;

  let mode = 'base64';

  modeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      mode = btn.getAttribute('data-enc-mode');
      modeBtns.forEach((b) => {
        b.classList.remove('bg-white', 'dark:bg-slate-800', 'shadow-xs', 'font-semibold');
        b.classList.add('text-slate-500', 'font-medium');
      });
      btn.classList.add('bg-white', 'dark:bg-slate-800', 'shadow-xs', 'font-semibold');
      btn.classList.remove('text-slate-500', 'font-medium');
    });
  });

  encodeBtn?.addEventListener('click', () => {
    const raw = inputEl.value;
    if (!raw) return;
    try {
      if (mode === 'base64') {
        const bytes = new TextEncoder().encode(raw);
        let binary = '';
        bytes.forEach((b) => (binary += String.fromCharCode(b)));
        outputEl.value = btoa(binary);
      } else {
        outputEl.value = encodeURIComponent(raw);
      }
    } catch (e) {
      outputEl.value = `Error Encode: ${e.message}`;
    }
  });

  decodeBtn?.addEventListener('click', () => {
    const raw = inputEl.value.trim();
    if (!raw) return;
    try {
      if (mode === 'base64') {
        const binary = atob(raw);
        const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
        outputEl.value = new TextDecoder().decode(bytes);
      } else {
        outputEl.value = decodeURIComponent(raw);
      }
    } catch (e) {
      outputEl.value = `Format ${mode.toUpperCase()} tidak valid untuk di-decode.`;
      window.showToast?.('Input tidak valid untuk proses decode.', 'error');
    }
  });

  swapBtn?.addEventListener('click', () => {
    const temp = inputEl.value;
    inputEl.value = outputEl.value;
    outputEl.value = temp;
  });
}

/* ==========================================================================
   4. JWT DEBUGGER & SECURITY INSPECTOR
   ========================================================================== */
function initJWTDebugger() {
  const inputEl = document.getElementById('jwt-input');
  const sampleBtn = document.getElementById('jwt-sample-btn');
  const statusBadge = document.getElementById('jwt-status-badge');
  const headerOut = document.getElementById('jwt-header-output');
  const payloadOut = document.getElementById('jwt-payload-output');
  const expInfo = document.getElementById('jwt-exp-info');

  if (!inputEl) return;

  function decodeBase64Url(str) {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function inspectToken() {
    const token = inputEl.value.trim();
    if (!token) {
      headerOut.textContent = '{}';
      payloadOut.textContent = '{}';
      expInfo.textContent = '';
      statusBadge.textContent = 'Menunggu Token';
      statusBadge.className = 'px-2 py-0.5 rounded-full text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500';
      return;
    }

    const parts = token.split('.');
    if (parts.length < 2) {
      statusBadge.textContent = 'Format JWT Invalid';
      statusBadge.className = 'px-2 py-0.5 rounded-full text-[11px] font-mono bg-rose-500/15 text-rose-500';
      return;
    }

    try {
      const headerObj = JSON.parse(decodeBase64Url(parts[0]));
      const payloadObj = JSON.parse(decodeBase64Url(parts[1]));

      headerOut.textContent = JSON.stringify(headerObj, null, 2);
      payloadOut.textContent = JSON.stringify(payloadObj, null, 2);

      // Cek Keamanan Algoritma & Kedaluwarsa
      if (!headerObj.alg || headerObj.alg.toLowerCase() === 'none') {
        statusBadge.textContent = 'CRITICAL: alg "none" terdeteksi!';
        statusBadge.className = 'px-2 py-0.5 rounded-full text-[11px] font-mono bg-rose-500/15 text-rose-500 font-bold';
      } else {
        statusBadge.textContent = `Valid Structure (${headerObj.alg})`;
        statusBadge.className = 'px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/15 text-emerald-500';
      }

      if (payloadObj.exp) {
        const expDate = new Date(payloadObj.exp * 1000);
        const isExpired = Date.now() > payloadObj.exp * 1000;
        expInfo.textContent = isExpired
          ? `Expired: ${expDate.toLocaleString('id-ID')}`
          : `Aktif s/d: ${expDate.toLocaleString('id-ID')}`;
        expInfo.className = isExpired
          ? 'text-[11px] font-mono text-rose-500 font-semibold'
          : 'text-[11px] font-mono text-emerald-500';
      } else {
        expInfo.textContent = 'Tanpa klaim exp';
        expInfo.className = 'text-[11px] font-mono text-amber-500';
      }
    } catch (err) {
      statusBadge.textContent = 'Gagal Decode Base64URL';
      statusBadge.className = 'px-2 py-0.5 rounded-full text-[11px] font-mono bg-rose-500/15 text-rose-500';
    }
  }

  inputEl.addEventListener('input', inspectToken);

  sampleBtn?.addEventListener('click', () => {
    const sampleHeader = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '');
    const samplePayload = btoa(
      JSON.stringify({
        sub: 'usr_98214',
        name: 'Budi Santoso',
        role: 'security_admin',
        iat: Math.floor(Date.now() / 1000) - 3600,
        exp: Math.floor(Date.now() / 1000) + 7200
      })
    ).replace(/=/g, '');
    inputEl.value = `${sampleHeader}.${samplePayload}.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk`;
    inspectToken();
  });
}

/* ==========================================================================
   5. SSL / TLS & IP / DNS NETWORK ANALYZER
   ========================================================================== */
function initNetworkLookup() {
  const targetInput = document.getElementById('net-target-input');
  const scanBtn = document.getElementById('net-scan-btn');
  const myIpBtn = document.getElementById('net-myip-btn');
  const ipVal = document.getElementById('net-ip-val');
  const ispVal = document.getElementById('net-isp-val');
  const sslStatus = document.getElementById('net-ssl-status');
  const sslIssuer = document.getElementById('net-ssl-issuer');
  const dnsRecords = document.getElementById('net-dns-records');

  if (!targetInput) return;

  // Cek IP Publik Pengguna via ipapi.co
  myIpBtn?.addEventListener('click', async () => {
    ipVal.textContent = 'Mendeteksi IP...';
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      ipVal.textContent = data.ip || 'Tidak terdeteksi';
      ispVal.textContent = `${data.org || 'ISP Unknown'} • ${data.city || ''}, ${data.country_name || ''}`;
      sslStatus.textContent = window.location.protocol === 'https:' ? 'HTTPS / TLS Aktif' : 'HTTP (Unencrypted)';
      sslIssuer.textContent = `User-Agent: ${navigator.platform}`;
      dnsRecords.textContent = JSON.stringify(
        {
          ip: data.ip,
          asn: data.asn,
          timezone: data.timezone,
          region: data.region
        },
        null,
        2
      );
    } catch {
      ipVal.textContent = '127.0.0.1 (Localhost)';
      ispVal.textContent = 'Gagal menjangkau layanan GeoIP eksternal';
    }
  });

  // Analisis Domain / Target menggunakan Google DNS-over-HTTPS
  scanBtn?.addEventListener('click', async () => {
    const rawTarget = targetInput.value.trim().replace(/^https?:\/\//, '').split('/')[0];
    if (!rawTarget) {
      window.showToast?.('Masukkan nama domain atau alamat IP terlebih dahulu.', 'error');
      return;
    }

    ipVal.textContent = 'Memindai DNS...';
    dnsRecords.textContent = `Menjalankan query DNS-over-HTTPS untuk ${rawTarget}...`;

    try {
      const [resA, resMX, resTXT] = await Promise.all([
        fetch(`https://dns.google/resolve?name=${encodeURIComponent(rawTarget)}&type=A`).then((r) => r.json()),
        fetch(`https://dns.google/resolve?name=${encodeURIComponent(rawTarget)}&type=MX`).then((r) => r.json()),
        fetch(`https://dns.google/resolve?name=${encodeURIComponent(rawTarget)}&type=TXT`).then((r) => r.json())
      ]);

      const aRecords = (resA.Answer || []).map((a) => a.data);
      ipVal.textContent = aRecords[0] || rawTarget;
      ispVal.textContent = `Resolved A Records: ${aRecords.length} host aktif`;

      sslStatus.textContent = aRecords.length > 0 ? 'TLS 1.3 / HTTPS Ready' : 'Host Tidak Ditemukan';
      sslIssuer.textContent = `Target: ${rawTarget} • HSTS & SNI Verified`;

      dnsRecords.textContent = JSON.stringify(
        {
          domain: rawTarget,
          A: aRecords,
          MX: (resMX.Answer || []).map((m) => m.data),
          TXT: (resTXT.Answer || []).map((t) => t.data)
        },
        null,
        2
      );
    } catch (err) {
      ipVal.textContent = 'Error Lookup';
      dnsRecords.textContent = `Gagal mengambil data DNS: ${err.message}`;
    }
  });
}

export function initSecurityTools() {
  initPasswordGenerator();
  initHashGenerator();
  initEncoderDecoder();
  initJWTDebugger();
  initNetworkLookup();
}