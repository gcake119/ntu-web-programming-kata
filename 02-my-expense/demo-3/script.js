/* ─────────────────────────────────────────────────
   記帳本 — script.js
   ───────────────────────────────────────────────── */

// ─── Categories ────────────────────────────────────
const CATEGORIES = {
  expense: [
    { id: 'food',      label: '餐飲',  icon: '🍜', color: '#ff8c69', bg: '#fff1ec' },
    { id: 'transport', label: '交通',  icon: '🚌', color: '#5b9af7', bg: '#eef4ff' },
    { id: 'shopping',  label: '購物',  icon: '🛍️', color: '#a670f0', bg: '#f5efff' },
    { id: 'health',    label: '醫療',  icon: '💊', color: '#f06292', bg: '#ffeef4' },
    { id: 'entertain', label: '娛樂',  icon: '🎮', color: '#26c6da', bg: '#e0f9fb' },
    { id: 'housing',   label: '住宿',  icon: '🏠', color: '#66bb6a', bg: '#edf7ee' },
    { id: 'edu',       label: '教育',  icon: '📚', color: '#ff7043', bg: '#fff3ee' },
    { id: 'other_e',   label: '其他',  icon: '💡', color: '#90a4ae', bg: '#f0f4f5' },
  ],
  income: [
    { id: 'salary',    label: '薪資',  icon: '💼', color: '#2dc97e', bg: '#edfff6' },
    { id: 'bonus',     label: '獎金',  icon: '🎁', color: '#ffa726', bg: '#fff8ee' },
    { id: 'invest',    label: '投資',  icon: '📈', color: '#26a69a', bg: '#e0f5f4' },
    { id: 'freelance', label: '接案',  icon: '💻', color: '#7e57c2', bg: '#f0ecff' },
    { id: 'part_time', label: '兼職',  icon: '👔', color: '#42a5f5', bg: '#e8f4ff' },
    { id: 'gift',      label: '禮金',  icon: '🧧', color: '#ef5350', bg: '#ffeeee' },
    { id: 'rent_in',   label: '租金',  icon: '🏘️', color: '#8d6e63', bg: '#f5f0ee' },
    { id: 'other_i',   label: '其他',  icon: '💰', color: '#90a4ae', bg: '#f0f4f5' },
  ],
};

// ─── Demo Data ──────────────────────────────────────
const DEMO_TRANSACTIONS = [
  // 2026-02
  { id: uid(), date: '2026-02-20', type: 'expense', categoryId: 'food',      amount: 180, desc: '燒肉便當' },
  { id: uid(), date: '2026-02-20', type: 'expense', categoryId: 'transport', amount: 28,  desc: 'MRT 三重－台北' },
  { id: uid(), date: '2026-02-19', type: 'expense', categoryId: 'shopping',  amount: 1290,desc: 'UNIQLO 發熱衣 x2' },
  { id: uid(), date: '2026-02-19', type: 'income',  categoryId: 'salary',    amount: 45000, desc: '2月薪資入帳' },
  { id: uid(), date: '2026-02-18', type: 'expense', categoryId: 'food',      amount: 320, desc: '與同事聚餐' },
  { id: uid(), date: '2026-02-18', type: 'expense', categoryId: 'entertain', amount: 440, desc: '電影票 x2' },
  { id: uid(), date: '2026-02-17', type: 'expense', categoryId: 'housing',   amount: 8000, desc: '2月房租' },
  { id: uid(), date: '2026-02-15', type: 'expense', categoryId: 'edu',       amount: 990, desc: 'Udemy 線上課程' },
  { id: uid(), date: '2026-02-15', type: 'income',  categoryId: 'bonus',     amount: 5000, desc: '年終獎金（尾款）' },
  { id: uid(), date: '2026-02-14', type: 'expense', categoryId: 'food',      amount: 860, desc: '情人節晚餐' },
  { id: uid(), date: '2026-02-14', type: 'expense', categoryId: 'shopping',  amount: 550, desc: '巧克力禮盒' },
  { id: uid(), date: '2026-02-12', type: 'expense', categoryId: 'health',    amount: 250, desc: '診所掛號自付' },
  { id: uid(), date: '2026-02-12', type: 'expense', categoryId: 'transport', amount: 720, desc: 'Uber Eats 月費' },
  { id: uid(), date: '2026-02-10', type: 'income',  categoryId: 'freelance', amount: 12000, desc: 'Side Project 結案' },
  { id: uid(), date: '2026-02-08', type: 'expense', categoryId: 'entertain', amount: 248, desc: 'Netflix 訂閱' },
  { id: uid(), date: '2026-02-05', type: 'expense', categoryId: 'food',      amount: 135, desc: '超商採購' },
  { id: uid(), date: '2026-02-03', type: 'expense', categoryId: 'transport', amount: 2400, desc: '高鐵回家（過年）' },
  { id: uid(), date: '2026-02-01', type: 'income',  categoryId: 'gift',      amount: 6000, desc: '春節紅包收入' },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ─── State ──────────────────────────────────────────
let transactions = [];
let currentYear  = 2026;
let currentMonth = 2;      // 1-based
let editingId    = null;
let deleteId     = null;
let currentType  = 'expense';
let selectedCat  = null;
let currentView  = 'list'; // 'list' | 'chart'

// ─── LocalStorage ───────────────────────────────────
const LS_KEY = 'demo3_transactions';

function save() {
  localStorage.setItem(LS_KEY, JSON.stringify(transactions));
}

function load() {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) {
    transactions = JSON.parse(raw);
  } else {
    transactions = DEMO_TRANSACTIONS;
    save();
  }
}

// ─── Derived Data ────────────────────────────────────
function transactionsForMonth(y, m) {
  const prefix = `${y}-${String(m).padStart(2, '0')}`;
  return transactions.filter(t => t.date.startsWith(prefix));
}

function totalIncome(list) {
  return list.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
}

function totalExpense(list) {
  return list.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
}

function groupByDate(list) {
  const map = {};
  for (const t of list) {
    (map[t.date] ??= []).push(t);
  }
  // Sort dates descending
  return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
}

function formatAmount(n) {
  return 'NT$ ' + n.toLocaleString('zh-TW');
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return `${d.getMonth() + 1} / ${d.getDate()}  週${weekdays[d.getDay()]}`;
}

function getCat(type, id) {
  return CATEGORIES[type].find(c => c.id === id) || CATEGORIES[type].at(-1);
}

// ─── Render ──────────────────────────────────────────
function renderHeader() {
  const list = transactionsForMonth(currentYear, currentMonth);
  const inc  = totalIncome(list);
  const exp  = totalExpense(list);
  const bal  = inc - exp;

  document.getElementById('monthTitle').textContent =
    `${currentYear}年 ${currentMonth}月`;
  document.getElementById('totalIncome').textContent   = formatAmount(inc);
  document.getElementById('totalExpense').textContent  = formatAmount(exp);

  const balEl = document.getElementById('balanceAmount');
  balEl.textContent = formatAmount(bal);
  balEl.style.color = bal >= 0 ? '#a8ffd2' : '#ffb3c1';
}

function renderList() {
  const container = document.getElementById('transactionList');
  const empty     = document.getElementById('emptyState');
  const list = transactionsForMonth(currentYear, currentMonth);

  container.innerHTML = '';
  if (list.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  const groups = groupByDate(list);
  for (const [date, items] of groups) {
    const inc  = totalIncome(items);
    const exp  = totalExpense(items);
    const diff = inc - exp;

    const group = document.createElement('div');
    group.className = 'date-group';

    let totalStr = '';
    if (inc > 0 && exp > 0) totalStr = `+${formatAmount(inc)} / -${formatAmount(exp)}`;
    else if (inc > 0)        totalStr = `+${formatAmount(inc)}`;
    else                     totalStr = `-${formatAmount(exp)}`;

    group.innerHTML = `
      <div class="date-group-header">
        <span class="date-group-label">${formatDate(date)}</span>
        <span class="date-group-total" style="color:${diff >= 0 ? 'var(--income-color)' : 'var(--expense-color)'}">
          ${totalStr}
        </span>
      </div>
    `;

    const ul = document.createElement('div');
    ul.className = 'tx-list';

    for (const tx of items) {
      const cat = getCat(tx.type, tx.categoryId);
      const li  = document.createElement('div');
      li.className = 'tx-item';
      li.dataset.id = tx.id;
      li.innerHTML = `
        <div class="tx-icon" style="background:${cat.bg};">${cat.icon}</div>
        <div class="tx-info">
          <div class="tx-category">${cat.label}</div>
          ${tx.desc ? `<div class="tx-desc">${tx.desc}</div>` : ''}
        </div>
        <div class="tx-amount ${tx.type}">
          ${tx.type === 'income' ? '+' : '-'}${formatAmount(tx.amount)}
        </div>
      `;
      li.addEventListener('click', () => openEditModal(tx.id));
      ul.appendChild(li);
    }

    group.appendChild(ul);
    container.appendChild(group);
  }
}

function renderChart() {
  const chartView = document.getElementById('chartView');
  chartView.classList.remove('hidden');

  const list    = transactionsForMonth(currentYear, currentMonth);
  const expList = list.filter(t => t.type === 'expense');
  const total   = totalExpense(expList);

  // Aggregate by category
  const catMap = {};
  for (const t of expList) {
    catMap[t.categoryId] = (catMap[t.categoryId] || 0) + t.amount;
  }
  const catArr = Object.entries(catMap)
    .map(([id, amount]) => ({ id, amount, cat: getCat('expense', id) }))
    .sort((a, b) => b.amount - a.amount);

  // Draw donut
  const svg       = document.getElementById('donutSvg');
  const center    = document.getElementById('donutCenter');
  const legend    = document.getElementById('chartLegend');
  svg.innerHTML   = '';
  legend.innerHTML = '';

  if (total === 0) {
    center.innerHTML = '<span class="donut-center-label">無支出資料</span>';
    return;
  }

  center.innerHTML = `
    <span class="donut-center-label">本月支出</span>
    <span class="donut-center-amount">${formatAmount(total)}</span>
  `;

  const R = 80, CX = 100, CY = 100, SW = 28;
  const circumference = 2 * Math.PI * R;
  let offset = 0;

  for (const { id, amount, cat } of catArr) {
    const pct  = amount / total;
    const dash = pct * circumference;
    const gap  = circumference - dash;

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', CX);
    circle.setAttribute('cy', CY);
    circle.setAttribute('r', R);
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', cat.color);
    circle.setAttribute('stroke-width', SW);
    circle.setAttribute('stroke-dasharray', `${dash} ${gap}`);
    circle.setAttribute('stroke-dashoffset', -offset);
    circle.setAttribute('stroke-linecap', 'butt');
    svg.appendChild(circle);
    offset += dash;

    const li = document.createElement('li');
    li.className = 'legend-item';
    li.innerHTML = `
      <span class="legend-dot" style="background:${cat.color}"></span>
      <span class="legend-name">${cat.icon} ${cat.label}</span>
      <span class="legend-pct">${(pct * 100).toFixed(1)}%</span>
      <span class="legend-val">${formatAmount(amount)}</span>
    `;
    legend.appendChild(li);
  }
}

// ─── Modal ───────────────────────────────────────────
function openAddModal() {
  editingId = null;
  document.getElementById('modalTitle').textContent = '新增記帳';
  document.getElementById('txForm').reset();
  document.getElementById('dateInput').value = todayStr();
  setType('expense');
  document.getElementById('modalOverlay').classList.remove('hidden');
  document.getElementById('amountInput').focus();
}

function openEditModal(id) {
  const tx = transactions.find(t => t.id === id);
  if (!tx) return;
  editingId = id;
  document.getElementById('modalTitle').textContent = '編輯記帳';
  setType(tx.type);
  document.getElementById('amountInput').value = tx.amount;
  document.getElementById('descInput').value   = tx.desc || '';
  document.getElementById('dateInput').value   = tx.date;
  // Set category
  document.querySelectorAll('.cat-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.cat === tx.categoryId);
  });
  selectedCat = tx.categoryId;
  document.getElementById('modalOverlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
  editingId   = null;
  selectedCat = null;
}

function setType(type) {
  currentType = type;
  document.querySelectorAll('.type-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.type === type);
  });
  renderCategoryGrid(type);
  selectedCat = null;
}

function renderCategoryGrid(type) {
  const grid = document.getElementById('categoryGrid');
  grid.innerHTML = '';
  for (const cat of CATEGORIES[type]) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cat-btn';
    btn.dataset.cat = cat.id;
    btn.innerHTML = `<span class="cat-icon">${cat.icon}</span><span class="cat-name">${cat.label}</span>`;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedCat = cat.id;
    });
    grid.appendChild(btn);
  }
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ─── Form Submit ─────────────────────────────────────
document.getElementById('txForm').addEventListener('submit', e => {
  e.preventDefault();
  const amount = parseInt(document.getElementById('amountInput').value, 10);
  const desc   = document.getElementById('descInput').value.trim();
  const date   = document.getElementById('dateInput').value;
  const catId  = selectedCat || CATEGORIES[currentType][0].id;

  if (!amount || amount <= 0) {
    document.getElementById('amountInput').focus();
    return;
  }

  if (editingId) {
    const tx = transactions.find(t => t.id === editingId);
    if (tx) { tx.amount = amount; tx.desc = desc; tx.date = date; tx.type = currentType; tx.categoryId = catId; }
  } else {
    transactions.unshift({ id: uid(), date, type: currentType, categoryId: catId, amount, desc });
  }

  save();
  closeModal();
  refresh();
});

// ─── Delete ──────────────────────────────────────────
function requestDelete(id) {
  deleteId = id;
  document.getElementById('deleteOverlay').classList.remove('hidden');
  document.getElementById('deleteOverlay').classList.add('confirm');
}

document.getElementById('deleteConfirmBtn').addEventListener('click', () => {
  if (deleteId) {
    transactions = transactions.filter(t => t.id !== deleteId);
    save();
    deleteId = null;
    document.getElementById('deleteOverlay').classList.add('hidden');
    closeModal();
    refresh();
  }
});

document.getElementById('deleteCancelBtn').addEventListener('click', () => {
  deleteId = null;
  document.getElementById('deleteOverlay').classList.add('hidden');
});

// ─── Navigation ──────────────────────────────────────
document.getElementById('prevMonthBtn').addEventListener('click', () => {
  currentMonth--;
  if (currentMonth < 1) { currentMonth = 12; currentYear--; }
  refresh();
});

document.getElementById('nextMonthBtn').addEventListener('click', () => {
  currentMonth++;
  if (currentMonth > 12) { currentMonth = 1; currentYear++; }
  refresh();
});

document.getElementById('fabBtn').addEventListener('click', openAddModal);
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
});

document.querySelectorAll('.type-btn').forEach(btn => {
  btn.addEventListener('click', () => setType(btn.dataset.type));
});

document.getElementById('navList').addEventListener('click', () => {
  currentView = 'list';
  document.getElementById('navList').classList.add('active');
  document.getElementById('navChart').classList.remove('active');
  document.getElementById('chartView').classList.add('hidden');
  document.getElementById('fabBtn').classList.remove('hidden');
});

document.getElementById('navChart').addEventListener('click', () => {
  currentView = 'chart';
  document.getElementById('navChart').classList.add('active');
  document.getElementById('navList').classList.remove('active');
  document.getElementById('fabBtn').classList.add('hidden');
  renderChart();
});

// Long-press on tx-item for delete (desktop: right-click)
let longPressTimer = null;
document.getElementById('transactionList').addEventListener('contextmenu', e => {
  const item = e.target.closest('.tx-item');
  if (!item) return;
  e.preventDefault();
  requestDelete(item.dataset.id);
});
document.getElementById('transactionList').addEventListener('touchstart', e => {
  const item = e.target.closest('.tx-item');
  if (!item) return;
  longPressTimer = setTimeout(() => requestDelete(item.dataset.id), 600);
}, { passive: true });
document.getElementById('transactionList').addEventListener('touchend', () => {
  clearTimeout(longPressTimer);
}, { passive: true });

// ─── Refresh ─────────────────────────────────────────
function refresh() {
  renderHeader();
  renderList();
  if (currentView === 'chart') renderChart();
}

// ─── Init ─────────────────────────────────────────────
load();
refresh();
