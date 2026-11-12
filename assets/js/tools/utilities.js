function initCodeFormatter() {
  const langSelect = document.getElementById('fmt-lang');
  const indentSelect = document.getElementById('fmt-indent');
  const beautifyBtn = document.getElementById('fmt-beautify-btn');
  const minifyBtn = document.getElementById('fmt-minify-btn');
  const clearBtn = document.getElementById('fmt-clear-btn');
  const statusMsg = document.getElementById('fmt-status-msg');
  const inputEl = document.getElementById('fmt-input');
  const outputEl = document.getElementById('fmt-output');

  if (!inputEl) return;

  function showStatus(msg, isError = false) {
    statusMsg.textContent = msg;
    statusMsg.classList.remove(
      'hidden',
      'bg-rose-500/10',
      'text-rose-500',
      'bg-emerald-500/10',
      'text-emerald-500'
    );
    statusMsg.classList.add(
      isError ? 'bg-rose-500/10' : 'bg-emerald-500/10',
      isError ? 'text-rose-500' : 'text-emerald-500'
    );
  }

  function formatHTML(html, spaces) {
    const tab = ' '.repeat(spaces);
    let result = '';
    let indent = '';
    html
      .replace(/>\s+</g, '><')
      .split(/(?=<)|(?<=>)/g)
      .forEach((element) => {
        if (!element.trim()) return;
        if (element.match(/^<\/\w/)) {
          indent = indent.substring(tab.length);
        }
        result += indent + element.trim() + '\n';
        if (element.match(/^<\w[^>]*[^\/]>$/) && !element.match(/^<(br|hr|img|input|meta|link)/i)) {
          indent += tab;
        }
      });
    return result.trim();
  }

  function formatCSS(css, spaces) {
    const tab = ' '.repeat(spaces);
    return css
      .replace(/\s+/g, ' ')
      .replace(/\s*\{\s*/g, ' {\n' + tab)
      .replace(/;\s*/g, ';\n' + tab)
      .replace(/\s*\}\s*/g, '\n}\n\n')
      .replace(new RegExp(tab + '\\}', 'g'), '}')
      .trim();
  }

  beautifyBtn?.addEventListener('click', () => {
    const raw = inputEl.value.trim();
    if (!raw) return;
    const lang = langSelect.value;
    const indent = parseInt(indentSelect.value, 10);

    try {
      if (lang === 'json') {
        const parsed = JSON.parse(raw);
        outputEl.value = JSON.stringify(parsed, null, indent);
        showStatus('✓ JSON Valid & berhasil dirapikan.');
      } else if (lang === 'html') {
        outputEl.value = formatHTML(raw, indent);
        showStatus('✓ Markup HTML berhasil dirapikan.');
      } else if (lang === 'css') {
        outputEl.value = formatCSS(raw, indent);
        showStatus('✓ Stylesheet CSS berhasil dirapikan.');
      }
    } catch (err) {
      showStatus(`✗ Syntax Error (${lang.toUpperCase()}): ${err.message}`, true);
    }
  });

  minifyBtn?.addEventListener('click', () => {
    const raw = inputEl.value.trim();
    if (!raw) return;
    const lang = langSelect.value;

    try {
      if (lang === 'json') {
        outputEl.value = JSON.stringify(JSON.parse(raw));
      } else if (lang === 'html') {
        outputEl.value = raw.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();
      } else if (lang === 'css') {
        outputEl.value = raw
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/\s+/g, ' ')
          .replace(/\s*([{}:;,])\s*/g, '$1')
          .trim();
      }
      showStatus(`✓ Berhasil dikompres (${outputEl.value.length} karakter).`);
    } catch (err) {
      showStatus(`✗ Gagal Minify: ${err.message}`, true);
    }
  });

  clearBtn?.addEventListener('click', () => {
    inputEl.value = '';
    outputEl.value = '';
    statusMsg.classList.add('hidden');
  });
}

/* ==========================================================================
   7. QR CODE & BARCODE GENERATOR STUDIO
   ========================================================================== */
function initQRBarcodeStudio() {
  const typeBtns = document.querySelectorAll('.code-type-btn');
  const inputEl = document.getElementById('code-input');
  const fgColor = document.getElementById('code-fg-color');
  const bgColor = document.getElementById('code-bg-color');
  const genBtn = document.getElementById('code-generate-btn');
  const downloadBtn = document.getElementById('code-download-btn');
  const qrBox = document.getElementById('qr-preview-box');
  const barcodeSvg = document.getElementById('barcode-preview-svg');

  if (!inputEl || !qrBox) return;

  let activeMode = 'qr';

  function renderCode() {
    const text = inputEl.value.trim() || 'https://freetools.pro';
    const fg = fgColor.value;
    const bg = bgColor.value;

    if (activeMode === 'qr') {
      qrBox.classList.remove('hidden');
      barcodeSvg.classList.add('hidden');
      qrBox.innerHTML = '';

      if (window.QRCode) {
        new window.QRCode(qrBox, {
          text,
          width: 190,
          height: 190,
          colorDark: fg,
          colorLight: bg,
          correctLevel: window.QRCode.CorrectLevel.H
        });
      }
    } else {
      qrBox.classList.add('hidden');
      barcodeSvg.classList.remove('hidden');

      if (window.JsBarcode) {
        try {
          window.JsBarcode(barcodeSvg, text, {
            format: 'CODE128',
            lineColor: fg,
            background: bg,
            width: 2,
            height: 80,
            displayValue: true
          });
        } catch {
          window.showToast?.('Karakter tidak didukung untuk Barcode Code-128.', 'error');
        }
      }
    }
  }

  typeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      activeMode = btn.getAttribute('data-code-type');
      typeBtns.forEach((b) => {
        b.classList.remove('bg-white', 'dark:bg-slate-800', 'shadow-xs', 'font-semibold');
        b.classList.add('text-slate-500', 'font-medium');
      });
      btn.classList.add('bg-white', 'dark:bg-slate-800', 'shadow-xs', 'font-semibold');
      btn.classList.remove('text-slate-500', 'font-medium');
      renderCode();
    });
  });

  genBtn?.addEventListener('click', renderCode);
  inputEl.addEventListener('input', renderCode);

  downloadBtn?.addEventListener('click', () => {
    const link = document.createElement('a');
    if (activeMode === 'qr') {
      const canvas = qrBox.querySelector('canvas');
      const img = qrBox.querySelector('img');
      link.href = canvas ? canvas.toDataURL('image/png') : img?.src;
      link.download = 'freetools-qrcode.png';
      link.click();
    } else {
      const svgData = new XMLSerializer().serializeToString(barcodeSvg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        link.href = canvas.toDataURL('image/png');
        link.download = 'freetools-barcode.png';
        link.click();
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    }
  });

  renderCode();
}

/* ==========================================================================
   8. CLIENT-SIDE IMAGE RESIZER & COMPRESSOR
   ========================================================================== */
function initImageOptimizer() {
  const dropzone = document.getElementById('img-dropzone');
  const fileInput = document.getElementById('img-file-input');
  const controlsPanel = document.getElementById('img-controls-panel');
  const widthInput = document.getElementById('img-width');
  const heightInput = document.getElementById('img-height');
  const formatSelect = document.getElementById('img-format');
  const qualityInput = document.getElementById('img-quality');
  const qualityVal = document.getElementById('img-quality-val');
  const origMeta = document.getElementById('img-orig-meta');
  const newMeta = document.getElementById('img-new-meta');
  const processBtn = document.getElementById('img-process-btn');
  const downloadBtn = document.getElementById('img-download-btn');
  const canvas = document.getElementById('img-preview-canvas');

  if (!fileInput || !canvas) return;

  let loadedImage = null;
  let originalBytes = 0;
  let processedDataUrl = '';
  let aspectRatio = 1;

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  }

  function processImage() {
    if (!loadedImage) return;
    const w = parseInt(widthInput.value, 10) || loadedImage.width;
    const h = parseInt(heightInput.value, 10) || loadedImage.height;
    const mime = formatSelect.value;
    const quality = parseInt(qualityInput.value, 10) / 100;

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(loadedImage, 0, 0, w, h);

    processedDataUrl = canvas.toDataURL(mime, quality);
    const approxBytes = Math.round((processedDataUrl.length - `data:${mime};base64,`.length) * 0.75);
    const savedPct = originalBytes > 0 ? Math.round(((originalBytes - approxBytes) / originalBytes) * 100) : 0;

    newMeta.textContent = `${w}×${h}px (${formatBytes(approxBytes)}${savedPct > 0 ? `, hemat ${savedPct}%` : ''})`;
  }

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      window.showToast?.('Silakan unggah file gambar yang valid (PNG/JPG/WEBP).', 'error');
      return;
    }

    originalBytes = file.size;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        loadedImage = img;
        aspectRatio = img.width / img.height;
        widthInput.value = img.width;
        heightInput.value = img.height;
        origMeta.textContent = `${img.width}×${img.height}px (${formatBytes(originalBytes)})`;
        controlsPanel.classList.remove('hidden');
        processImage();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

  // Drag & Drop Events
  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  });
  dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    handleFile(e.dataTransfer.files[0]);
  });

  // Maintain Aspect Ratio saat lebar diubah
  widthInput?.addEventListener('input', () => {
    const w = parseInt(widthInput.value, 10);
    if (w > 0 && aspectRatio) {
      heightInput.value = Math.round(w / aspectRatio);
    }
  });

  qualityInput?.addEventListener('input', () => {
    qualityVal.textContent = qualityInput.value;
  });

  processBtn?.addEventListener('click', processImage);

  downloadBtn?.addEventListener('click', () => {
    if (!processedDataUrl) return;
    const ext = formatSelect.value.split('/')[1];
    const link = document.createElement('a');
    link.href = processedDataUrl;
    link.download = `optimized-image.${ext}`;
    link.click();
  });
}

/* ==========================================================================
   9. KALKULATOR FINANSIAL (INVESTASI) & AKADEMIK (IPK)
   ========================================================================== */
function initSmartCalculator() {
  const tabBtns = document.querySelectorAll('.calc-tab-btn');
  const finPanel = document.getElementById('calc-panel-finance');
  const acadPanel = document.getElementById('calc-panel-academic');

  if (!finPanel) return;

  // Sub-tab Switching
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-calc-tab');
      tabBtns.forEach((b) => {
        b.classList.remove('bg-white', 'dark:bg-slate-800', 'shadow-xs', 'font-semibold');
        b.classList.add('text-slate-500', 'font-medium');
      });
      btn.classList.add('bg-white', 'dark:bg-slate-800', 'shadow-xs', 'font-semibold');
      btn.classList.remove('text-slate-500', 'font-medium');

      if (target === 'finance') {
        finPanel.classList.remove('hidden');
        acadPanel.classList.add('hidden');
      } else {
        finPanel.classList.add('hidden');
        acadPanel.classList.remove('hidden');
      }
    });
  });

  // A. Kalkulator Bunga Majemuk
  const finCalcBtn = document.getElementById('fin-calc-btn');
  const formatIDR = (num) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);

  function calculateCompoundInterest() {
    const P = parseFloat(document.getElementById('fin-principal').value) || 0;
    const PMT = parseFloat(document.getElementById('fin-monthly').value) || 0;
    const annualRate = (parseFloat(document.getElementById('fin-rate').value) || 0) / 100;
    const years = parseFloat(document.getElementById('fin-years').value) || 0;

    const r = annualRate / 12;
    const n = years * 12;

    let futureValue = 0;
    if (r === 0) {
      futureValue = P + PMT * n;
    } else {
      const compoundFactor = Math.pow(1 + r, n);
      futureValue = P * compoundFactor + PMT * ((compoundFactor - 1) / r);
    }

    const totalDeposit = P + PMT * n;
    const totalInterest = futureValue - totalDeposit;

    document.getElementById('fin-total-result').textContent = formatIDR(futureValue);
    document.getElementById('fin-deposit-result').textContent = formatIDR(totalDeposit);
    document.getElementById('fin-interest-result').textContent = `+${formatIDR(Math.max(0, totalInterest))}`;
  }

  finCalcBtn?.addEventListener('click', calculateCompoundInterest);
  calculateCompoundInterest();

  // B. Kalkulator IPK / GPA
  const coursesList = document.getElementById('gpa-courses-list');
  const addRowBtn = document.getElementById('gpa-add-row-btn');
  const gpaCalcBtn = document.getElementById('gpa-calc-btn');

  addRowBtn?.addEventListener('click', () => {
    const row = document.createElement('div');
    row.className = 'grid grid-cols-12 gap-2 items-center gpa-row';
    row.innerHTML = `
      <input type="text" placeholder="Nama Mata Kuliah" class="col-span-6 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800" />
      <input type="number" placeholder="SKS" value="3" min="1" max="6" class="gpa-sks col-span-3 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800" />
      <select class="gpa-grade col-span-3 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <option value="4.0">A (4.0)</option>
        <option value="3.5">AB (3.5)</option>
        <option value="3.0">B (3.0)</option>
        <option value="2.5">BC (2.5)</option>
        <option value="2.0">C (2.0)</option>
        <option value="1.0">D (1.0)</option>
        <option value="0.0">E (0.0)</option>
      </select>
    `;
    coursesList.appendChild(row);
  });

  gpaCalcBtn?.addEventListener('click', () => {
    const rows = document.querySelectorAll('.gpa-row');
    let totalPoints = 0;
    let totalSks = 0;

    rows.forEach((row) => {
      const sks = parseFloat(row.querySelector('.gpa-sks').value) || 0;
      const grade = parseFloat(row.querySelector('.gpa-grade').value) || 0;
      totalPoints += sks * grade;
      totalSks += sks;
    });

    const gpa = totalSks > 0 ? (totalPoints / totalSks).toFixed(2) : '0.00';
    document.getElementById('gpa-total-sks').textContent = totalSks;
    document.getElementById('gpa-result-val').textContent = gpa;
  });
}

export function initUtilityTools() {
  initCodeFormatter();
  initQRBarcodeStudio();
  initImageOptimizer();
  initSmartCalculator();
}
