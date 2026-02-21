// =====================
// Data
// =====================
const expenses = [
  { datetime: '2026-02-18 : 12pm', category: 'Food',      item: 'Lunch bento',         amount: 150,   description: 'Convenience store combo' },
  { datetime: '2026-02-18 : 7pm',  category: 'Food',      item: 'Dinner with friends',  amount: 680,   description: 'Hot pot at Shin-Yeh' },
  { datetime: '2026-02-19 : 3pm',  category: 'Entertain', item: 'Movie tickets',        amount: 560,   description: '2 tickets for Interstellar re-release' },
  { datetime: '2026-02-19 : 8pm',  category: 'Entertain', item: 'KTV',                  amount: 1200,  description: '' },
  { datetime: '2026-02-20 : 9am',  category: 'Travel',    item: 'MRT day pass',         amount: 150,   description: '' },
  { datetime: '2026-02-20 : 2pm',  category: 'Travel',    item: 'Taxi to airport',      amount: 350,   description: 'Uber surge pricing' },
  { datetime: '2026-02-20 : 6pm',  category: 'Utility',   item: 'Electricity bill',     amount: 1280,  description: 'February invoice' },
  { datetime: '2026-02-21 : 10am', category: 'Utility',   item: 'Internet subscription',amount: 599,   description: 'Monthly broadband fee' },
  { datetime: '2026-02-21 : 1pm',  category: 'Food',      item: 'Grocery shopping',     amount: 820,   description: 'PXMart weekly groceries' },
  { datetime: '2026-02-21 : 4pm',  category: 'Entertain', item: 'Spotify Premium',      amount: 169,   description: 'Monthly subscription' },
];

const CATEGORY_COLORS = {
  Food:      '#f2d9a2',
  Entertain: '#87cecc',
  Travel:    '#c5a6d9',
  Utility:   '#f0a07a',
};

// =====================
// Helpers
// =====================
function formatNow() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const dd   = String(now.getDate()).padStart(2, '0');
  let   h    = now.getHours();
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return `${yyyy}-${mm}-${dd} : ${h}${ampm}`;
}

function formatMoney(n) {
  return '$' + n.toLocaleString();
}

// =====================
// Tab Switching
// =====================
function activateTab(tabName) {
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tabName);
  });

  const expensePanel    = document.getElementById('panel-expense');
  const statisticsPanel = document.getElementById('panel-statistics');

  if (tabName === 'expense') {
    expensePanel.classList.remove('hidden');
    statisticsPanel.classList.add('hidden');
  } else {
    expensePanel.classList.add('hidden');
    statisticsPanel.classList.remove('hidden');
    renderStatistics();
  }
}

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => activateTab(tab.dataset.tab));
});

// =====================
// Now Button
// =====================
document.getElementById('btn-now').addEventListener('click', () => {
  const el = document.getElementById('datetime-input');
  el.value = formatNow();
  el.classList.remove('error');
});

// =====================
// Clear error on user input
// =====================
['datetime-input', 'category-select', 'item-input', 'expense-input'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('input', () => el.classList.remove('error'));
  el.addEventListener('change', () => el.classList.remove('error'));
});

// =====================
// Record Button
// =====================
document.getElementById('btn-record').addEventListener('click', () => {
  const datetimeEl = document.getElementById('datetime-input');
  const categoryEl = document.getElementById('category-select');
  const itemEl     = document.getElementById('item-input');
  const expenseEl  = document.getElementById('expense-input');
  const descEl     = document.getElementById('description-input');

  // Clear previous error styles
  [datetimeEl, categoryEl, itemEl, expenseEl].forEach(el => el.classList.remove('error'));

  // Validate in order — stop at first missing field
  const required = [
    { el: datetimeEl, getValue: () => datetimeEl.value.trim() },
    { el: categoryEl, getValue: () => categoryEl.value },
    { el: itemEl,     getValue: () => itemEl.value.trim() },
    { el: expenseEl,  getValue: () => expenseEl.value.trim() },
  ];

  for (const { el, getValue } of required) {
    if (!getValue()) {
      el.classList.add('error');
      el.focus();
      return;
    }
  }

  // Validate expense is a valid non-negative number
  const rawAmount = parseFloat(expenseEl.value);
  if (isNaN(rawAmount) || rawAmount < 0) {
    expenseEl.classList.add('error');
    expenseEl.focus();
    return;
  }

  const amount = Math.round(rawAmount);

  // Save record
  expenses.push({
    datetime:    datetimeEl.value.trim(),
    category:    categoryEl.value,
    item:        itemEl.value.trim(),
    amount,
    description: descEl.value.trim(),
  });

  // Clear form
  datetimeEl.value = '';
  categoryEl.value = '';
  itemEl.value     = '';
  expenseEl.value  = '';
  descEl.value     = '';
});

// =====================
// Statistics
// =====================
function calcStats() {
  const totals = {};
  let grand = 0;
  for (const e of expenses) {
    totals[e.category] = (totals[e.category] || 0) + e.amount;
    grand += e.amount;
  }
  return { totals, grand };
}

function renderStatistics() {
  const { totals, grand } = calcStats();
  const tbody = document.getElementById('stats-tbody');
  const tfoot = document.getElementById('stats-tfoot');
  const totalCell = document.getElementById('stats-total');

  const categories = Object.keys(totals);

  if (categories.length === 0) {
    tbody.innerHTML = `<tr><td colspan="2" class="no-data">No expenses recorded yet.</td></tr>`;
    tfoot.classList.add('hidden');
    drawEmptyPie();
    return;
  }

  // Render table rows
  tbody.innerHTML = categories
    .map(cat => `<tr><td>${cat}</td><td>${formatMoney(totals[cat])}</td></tr>`)
    .join('');

  tfoot.classList.remove('hidden');
  totalCell.innerHTML = `<strong>${formatMoney(grand)}</strong>`;

  drawPie(totals, grand);
}

// =====================
// Pie Chart (SVG)
// =====================
function drawEmptyPie() {
  const svg = document.getElementById('pie-chart');
  svg.innerHTML = `
    <circle cx="100" cy="100" r="90" fill="#d0d8d7" stroke="#3aafa9" stroke-width="2"/>
    <text x="100" y="107" text-anchor="middle" fill="rgba(23,37,42,0.45)"
          font-size="11" font-family="'Segoe UI', system-ui, sans-serif">No data yet</text>
  `;
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = (endAngle - startAngle) > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x1.toFixed(4)} ${y1.toFixed(4)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(4)} ${y2.toFixed(4)} Z`;
}

function drawPie(totals, grand) {
  const svg = document.getElementById('pie-chart');
  svg.innerHTML = '';

  const cx = 100, cy = 100, r = 88;
  const TAU = Math.PI * 2;
  const categories = Object.keys(totals);

  // Background circle (so gaps look clean)
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  bg.setAttribute('cx', cx);
  bg.setAttribute('cy', cy);
  bg.setAttribute('r', r + 2);
  bg.setAttribute('fill', '#3aafa9');
  svg.appendChild(bg);

  if (categories.length === 1) {
    // Full circle for single category
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', r);
    circle.setAttribute('fill', CATEGORY_COLORS[categories[0]] || '#ccc');
    svg.appendChild(circle);
    return;
  }

  let startAngle = -Math.PI / 2; // 12 o'clock

  categories.forEach(cat => {
    const fraction  = totals[cat] / grand;
    const sliceAngle = fraction * TAU;
    const endAngle  = startAngle + sliceAngle;
    const color     = CATEGORY_COLORS[cat] || '#cccccc';

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', describeArc(cx, cy, r, startAngle, endAngle));
    path.setAttribute('fill', color);
    // Teal stroke between slices
    path.setAttribute('stroke', '#3aafa9');
    path.setAttribute('stroke-width', '2.5');
    path.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(path);

    startAngle = endAngle;
  });
}
