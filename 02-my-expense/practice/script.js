/* ── Helpers ─────────────────────────────────────────────────────── */

const STORAGE_KEY = 'my_expense_records';

/** 格式化本地時間為 datetime-local 格式 (YYYY-MM-DDTHH:MM) */
function localISOString(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    date.getFullYear() + '-' +
    pad(date.getMonth() + 1) + '-' +
    pad(date.getDate()) + 'T' +
    pad(date.getHours()) + ':' +
    pad(date.getMinutes())
  );
}

/** 友善顯示時間 */
function formatDisplay(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleString('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
}

/** 貨幣格式 */
function fmtMoney(amount) {
  return '$' + Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

/* ── Data Layer ──────────────────────────────────────────────────── */

function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function addRecord(record) {
  const records = loadRecords();
  records.unshift(record); // newest first
  saveRecords(records);
}

function deleteRecord(id) {
  const records = loadRecords().filter((r) => r.id !== id);
  saveRecords(records);
}

/* ── Tab Switching ───────────────────────────────────────────────── */

const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');

function switchTab(tabName) {
  tabs.forEach((t) => t.classList.toggle('active', t.dataset.tab === tabName));
  panels.forEach((p) => p.classList.toggle('hidden', p.id !== `panel-${tabName}`));

  if (tabName === 'statistics') renderStatistics();
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});

/* ── Category Management ─────────────────────────────────────────── */

const CAT_KEY = 'my_expense_categories';
const DEFAULT_CATS = ['Food', 'Entertain', 'Travel', 'Utility'];

function loadCategories() {
  try {
    return JSON.parse(localStorage.getItem(CAT_KEY)) || [...DEFAULT_CATS];
  } catch {
    return [...DEFAULT_CATS];
  }
}

function saveCategories(cats) {
  localStorage.setItem(CAT_KEY, JSON.stringify(cats));
}

function populateCategorySelect(selectedValue) {
  const sel = document.getElementById('category-select');
  const cats = loadCategories();
  sel.innerHTML = '';
  cats.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    sel.appendChild(opt);
  });
  const addOpt = document.createElement('option');
  addOpt.value = '__add_new__';
  addOpt.textContent = '＋ 新增分類...';
  sel.appendChild(addOpt);
  if (selectedValue && cats.includes(selectedValue)) sel.value = selectedValue;
}

function setupCategorySelect() {
  const sel = document.getElementById('category-select');
  const row = document.getElementById('new-cat-row');
  const input = document.getElementById('new-cat-input');
  const btn = document.getElementById('btn-add-cat');

  sel.addEventListener('change', () => {
    if (sel.value === '__add_new__') {
      row.classList.remove('hidden');
      input.focus();
    } else {
      row.classList.add('hidden');
    }
  });

  function confirmNewCategory() {
    const name = input.value.trim();
    if (!name) { input.focus(); return; }
    const cats = loadCategories();
    if (!cats.includes(name)) { cats.push(name); saveCategories(cats); }
    input.value = '';
    row.classList.add('hidden');
    populateCategorySelect(name);
  }

  btn.addEventListener('click', confirmNewCategory);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); confirmNewCategory(); }
    if (e.key === 'Escape') { row.classList.add('hidden'); populateCategorySelect(); }
  });
}

/* ── Expense Form ────────────────────────────────────────────────── */

const form = document.getElementById('expense-form');
const datetimeInput = document.getElementById('datetime');
const btnNow = document.getElementById('btn-now');

// 初始化日期為現在
datetimeInput.value = localISOString();

btnNow.addEventListener('click', () => {
  datetimeInput.value = localISOString();
});

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const datetime = datetimeInput.value;
  const sel = document.getElementById('category-select');
  const category = (sel.value === '__add_new__') ? '' : sel.value.trim();
  const item = document.getElementById('item').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);
  const description = document.getElementById('description').value.trim();

  if (!datetime || !category || !item || isNaN(amount) || amount <= 0) {
    alert('請填寫日期、類別、項目，並輸入有效金額。');
    return;
  }

  const record = {
    id: Date.now(),
    datetime,
    category,
    item,
    amount,
    description
  };

  addRecord(record);
  renderRecordList();

  // Reset (keep datetime & category)
  document.getElementById('item').value = '';
  document.getElementById('amount').value = '';
  document.getElementById('description').value = '';
  datetimeInput.value = localISOString();
});

/* ── Record List ─────────────────────────────────────────────────── */

function renderRecordList() {
  const list = document.getElementById('record-list');
  const records = loadRecords();
  list.innerHTML = '';

  records.forEach((r) => {
    const item = document.createElement('div');
    item.className = 'record-item';
    item.innerHTML = `
      <div class="record-meta">
        <div class="record-category">${escapeHtml(r.category)}</div>
        <div class="record-item-name">${escapeHtml(r.item)}</div>
        <div class="record-date">${formatDisplay(r.datetime)}</div>
        ${r.description ? `<div class="record-desc">${escapeHtml(r.description)}</div>` : ''}
      </div>
      <div class="record-right">
        <div class="record-amount">${fmtMoney(r.amount)}</div>
        <button class="btn-delete" data-id="${r.id}" title="刪除">×</button>
      </div>
    `;
    list.appendChild(item);
  });

  // Delete buttons
  list.querySelectorAll('.btn-delete').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (confirm('確定要刪除這筆記錄？')) {
        deleteRecord(Number(btn.dataset.id));
        renderRecordList();
      }
    });
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Statistics ──────────────────────────────────────────────────── */

// 多色調色盤
const PALETTE = [
  '#ef5350', '#ab47bc', '#42a5f5', '#26a69a',
  '#ffca28', '#ff7043', '#66bb6a', '#ec407a',
  '#7e57c2', '#29b6f6', '#d4e157', '#26c6da'
];

function groupByCategory(records) {
  const map = {};
  records.forEach((r) => {
    const cat = r.category.trim() || 'Other';
    map[cat] = (map[cat] || 0) + r.amount;
  });
  return map;
}

function renderStatistics() {
  const records = loadRecords();
  const noData = document.getElementById('no-data');
  const statsBody = document.getElementById('stats-body');
  const statsFoot = document.getElementById('stats-foot');

  if (records.length === 0) {
    noData.classList.remove('hidden');
    statsBody.innerHTML = '';
    statsFoot.innerHTML = '';
    drawEmptyChart();
    return;
  }

  noData.classList.add('hidden');

  const grouped = groupByCategory(records);
  const categories = Object.keys(grouped);
  const total = categories.reduce((sum, c) => sum + grouped[c], 0);

  // Table rows
  statsBody.innerHTML = '';
  categories.forEach((cat, i) => {
    const color = PALETTE[i % PALETTE.length];
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="legend-dot" style="background:${color}"></span>${escapeHtml(cat)}</td>
      <td>${fmtMoney(grouped[cat])}</td>
    `;
    statsBody.appendChild(tr);
  });

  // Footer total
  statsFoot.innerHTML = `
    <tr>
      <td>Total</td>
      <td>${fmtMoney(total)}</td>
    </tr>
  `;

  // Pie chart
  drawPieChart(grouped, total);
}

/* ── Pie Chart (Canvas) ──────────────────────────────────────────── */

function drawPieChart(grouped, total) {
  const canvas = document.getElementById('pie-chart');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const radius = Math.min(W, H) / 2 - 10;

  ctx.clearRect(0, 0, W, H);

  const categories = Object.keys(grouped);
  let startAngle = -Math.PI / 2; // start from top

  categories.forEach((cat, i) => {
    const slice = (grouped[cat] / total) * 2 * Math.PI;
    const color = PALETTE[i % PALETTE.length];

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, startAngle + slice);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Gap between slices
    ctx.strokeStyle = '#f0f4f4';
    ctx.lineWidth = 3;
    ctx.stroke();

    startAngle += slice;
  });

  // Inner circle (donut)
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.42, 0, 2 * Math.PI);
  ctx.fillStyle = '#f0f4f4';
  ctx.fill();

  // Center total text
  const label = fmtMoney(total);
  const fontSize = label.length > 7 ? 13 : 15;
  ctx.fillStyle = '#004d40';
  ctx.font = `700 ${fontSize}px 'Segoe UI', Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, cx, cy);
}

function drawEmptyChart() {
  const canvas = document.getElementById('pie-chart');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Empty circle
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, Math.min(W, H) / 2 - 10, 0, 2 * Math.PI);
  ctx.fillStyle = '#e0f2f1';
  ctx.fill();

  // Inner circle
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, (Math.min(W, H) / 2 - 10) * 0.42, 0, 2 * Math.PI);
  ctx.fillStyle = '#f0f4f4';
  ctx.fill();
}

/* ── Demo Seed Data ──────────────────────────────────────────────── */

function seedDemoData() {
  if (loadRecords().length > 0) return; // 已有資料就不重複插入

  const demos = [
    { id: 1, datetime: '2026-02-20T08:30', category: 'Food',      item: '早餐 — 豆漿蛋餅',     amount: 65,    description: '鼎香豆漿' },
    { id: 2, datetime: '2026-02-20T12:15', category: 'Food',      item: '午餐 — 排骨飯',       amount: 120,   description: '自助餐廳' },
    { id: 3, datetime: '2026-02-20T15:00', category: 'Entertain', item: '電影票 — 怪獸宇宙',   amount: 320,   description: '威秀影城' },
    { id: 4, datetime: '2026-02-20T18:30', category: 'Food',      item: '晚餐 — 火鍋',         amount: 580,   description: '五人均攤' },
    { id: 5, datetime: '2026-02-20T21:00', category: 'Entertain', item: 'KTV 包廂',             amount: 850,   description: '慶生' },
    { id: 6, datetime: '2026-02-19T09:00', category: 'Travel',    item: 'MRT 悠遊卡加值',       amount: 500,   description: '' },
    { id: 7, datetime: '2026-02-19T11:30', category: 'Utility',   item: '手機月租費',           amount: 699,   description: '遠傳 5G 方案' },
    { id: 8, datetime: '2026-02-19T14:00', category: 'Food',      item: '咖啡 × 2',             amount: 180,   description: 'Starbucks' },
    { id: 9, datetime: '2026-02-18T10:00', category: 'Utility',   item: '水電費',               amount: 1240,  description: '二月份帳單' },
    { id:10, datetime: '2026-02-18T16:00', category: 'Travel',    item: '台北 → 台中 高鐵票',  amount: 670,   description: '對號座' },
    { id:11, datetime: '2026-02-17T12:00', category: 'Entertain', item: 'Switch 遊戲',          amount: 1490,  description: 'eShop 特賣' },
    { id:12, datetime: '2026-02-17T20:00', category: 'Utility',   item: 'Netflix 訂閱',         amount: 390,   description: '標準方案' },
  ];

  // 依 id 由大到小，讓最新的排第一
  saveRecords(demos.reverse());
}

/* ── Init ────────────────────────────────────────────────────────── */
populateCategorySelect();
setupCategorySelect();
seedDemoData();
renderRecordList();
drawEmptyChart();
