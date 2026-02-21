// ===== State =====
const expenses = [
  { datetime: '2026-02-18 : 12pm', category: 'Food',      item: 'Lunch at café',      amount: 280,  description: 'Pasta + coffee' },
  { datetime: '2026-02-18 : 7pm',  category: 'Food',      item: 'Dinner with friends', amount: 650,  description: '' },
  { datetime: '2026-02-19 : 10am', category: 'Travel',    item: 'MRT day pass',        amount: 150,  description: 'Taipei metro' },
  { datetime: '2026-02-19 : 3pm',  category: 'Entertain', item: 'Movie ticket',        amount: 320,  description: 'IMAX screening' },
  { datetime: '2026-02-20 : 9am',  category: 'Utility',   item: 'Electricity bill',    amount: 1200, description: 'February bill' },
  { datetime: '2026-02-20 : 1pm',  category: 'Food',      item: 'Groceries',           amount: 430,  description: 'Weekly grocery run' },
  { datetime: '2026-02-21 : 8am',  category: 'Travel',    item: 'Uber to airport',     amount: 520,  description: '' },
  { datetime: '2026-02-21 : 2pm',  category: 'Entertain', item: 'Spotify Premium',     amount: 149,  description: 'Monthly subscription' },
];

const CATEGORY_COLORS = {
  Food:      '#ff9f0a',
  Entertain: '#0a84ff',
  Travel:    '#30d158',
  Utility:   '#bf5af2',
};

// ===== DOM References =====
const tabExpense    = document.getElementById('tab-expense');
const tabStatistics = document.getElementById('tab-statistics');
const panelExpense  = document.getElementById('panel-expense');
const panelStats    = document.getElementById('panel-statistics');

const datetimeInput   = document.getElementById('datetime');
const categorySelect  = document.getElementById('category');
const itemInput       = document.getElementById('item');
const expenseInput    = document.getElementById('expense-amount');
const descInput       = document.getElementById('description');

const btnNow    = document.getElementById('btn-now');
const btnRecord = document.getElementById('btn-record');

const pieCanvas  = document.getElementById('pie-chart');
const chartEmpty = document.getElementById('chart-empty');
const legend     = document.getElementById('legend');
const statsTbody = document.getElementById('stats-tbody');

// ===== Tab Switching =====
tabExpense.addEventListener('click', () => {
  tabExpense.classList.add('active');
  tabStatistics.classList.remove('active');
  panelExpense.classList.remove('hidden');
  panelStats.classList.add('hidden');
});

tabStatistics.addEventListener('click', () => {
  tabStatistics.classList.add('active');
  tabExpense.classList.remove('active');
  panelStats.classList.remove('hidden');
  panelExpense.classList.add('hidden');
  renderStatistics();
});

// ===== "Now" Button =====
btnNow.addEventListener('click', () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const dd   = String(now.getDate()).padStart(2, '0');
  let   h    = now.getHours();
  const ampm = h >= 12 ? 'pm' : 'am';
  if (h === 0)       h = 12;
  else if (h > 12)   h -= 12;
  datetimeInput.value = `${yyyy}-${mm}-${dd} : ${h}${ampm}`;
  datetimeInput.classList.remove('error');
});

// ===== Remove error highlight on input =====
[datetimeInput, categorySelect, itemInput, expenseInput].forEach(el => {
  el.addEventListener('input',  () => el.classList.remove('error'));
  el.addEventListener('change', () => el.classList.remove('error'));
});

// ===== Validation =====
function validate() {
  const fields = [
    { el: datetimeInput,  value: datetimeInput.value.trim() },
    { el: categorySelect, value: categorySelect.value },
    { el: itemInput,      value: itemInput.value.trim() },
    { el: expenseInput,   value: expenseInput.value.trim() },
  ];

  for (const f of fields) {
    if (!f.value) {
      f.el.classList.add('error');
      f.el.focus();
      return false;
    }
  }

  // Validate expense is a non-negative number
  const rawAmt = parseFloat(expenseInput.value);
  if (isNaN(rawAmt) || rawAmt < 0) {
    expenseInput.classList.add('error');
    expenseInput.focus();
    return false;
  }

  return true;
}

// ===== Record Button =====
btnRecord.addEventListener('click', () => {
  if (!validate()) return;

  const record = {
    datetime:    datetimeInput.value.trim(),
    category:    categorySelect.value,
    item:        itemInput.value.trim(),
    amount:      Math.round(parseFloat(expenseInput.value)),
    description: descInput.value.trim(),
  };

  expenses.push(record);

  // Clear form
  datetimeInput.value  = '';
  categorySelect.value = '';
  itemInput.value      = '';
  expenseInput.value   = '';
  descInput.value      = '';

  showToast('Recorded!');
});

// ===== Toast =====
let toastTimer = null;
function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

// ===== Statistics =====
function computeStats() {
  const totals = { Food: 0, Entertain: 0, Travel: 0, Utility: 0 };
  for (const e of expenses) {
    if (totals[e.category] !== undefined) totals[e.category] += e.amount;
  }
  return totals;
}

function renderStatistics() {
  const totals    = computeStats();
  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);

  // --- Pie chart ---
  const size = Math.min(pieCanvas.parentElement.clientWidth, 240);
  pieCanvas.width  = size;
  pieCanvas.height = size;

  const ctx = pieCanvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);

  if (grandTotal === 0) {
    pieCanvas.style.display = 'none';
    chartEmpty.classList.remove('hidden');
  } else {
    pieCanvas.style.display = 'block';
    chartEmpty.classList.add('hidden');
    drawPie(ctx, totals, grandTotal, size);
  }

  // --- Legend ---
  legend.innerHTML = '';
  for (const [cat, color] of Object.entries(CATEGORY_COLORS)) {
    if (totals[cat] === 0) continue;
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `<span class="legend-dot" style="background:${color}"></span>${cat}`;
    legend.appendChild(item);
  }

  // --- Table ---
  statsTbody.innerHTML = '';

  if (grandTotal === 0) {
    const tr = document.createElement('tr');
    tr.id = 'no-data-row';
    tr.innerHTML = '<td colspan="3" style="text-align:center;color:#aaa;">No records yet</td>';
    statsTbody.appendChild(tr);
    return;
  }

  for (const [cat, color] of Object.entries(CATEGORY_COLORS)) {
    if (totals[cat] === 0) continue;
    const pct = ((totals[cat] / grandTotal) * 100).toFixed(1);
    const tr  = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="cat-dot" style="background:${color}"></span>${cat}</td>
      <td style="text-align:right">${totals[cat].toLocaleString()}</td>
      <td style="text-align:right">${pct}%</td>
    `;
    statsTbody.appendChild(tr);
  }

  // Total row
  const totalTr = document.createElement('tr');
  totalTr.className = 'total-row';
  totalTr.innerHTML = `
    <td><strong>Total</strong></td>
    <td style="text-align:right"><strong>${grandTotal.toLocaleString()}</strong></td>
    <td style="text-align:right"><strong>100%</strong></td>
  `;
  statsTbody.appendChild(totalTr);
}

function drawPie(ctx, totals, grandTotal, size) {
  const cx     = size / 2;
  const cy     = size / 2;
  const radius = size / 2 - 8;
  let   start  = -Math.PI / 2;   // start from top

  for (const [cat, color] of Object.entries(CATEGORY_COLORS)) {
    if (totals[cat] === 0) continue;
    const slice = (totals[cat] / grandTotal) * 2 * Math.PI;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, start, start + slice);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Divider line
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(
      cx + radius * Math.cos(start),
      cy + radius * Math.sin(start)
    );
    ctx.strokeStyle = '#1c1c1e';
    ctx.lineWidth = 2;
    ctx.stroke();

    start += slice;
  }

  // Final divider
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + radius * Math.cos(start), cy + radius * Math.sin(start));
  ctx.strokeStyle = '#1c1c1e';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Center circle (donut hole)
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.38, 0, 2 * Math.PI);
  ctx.fillStyle = '#2c2c2e';
  ctx.fill();
}

// Redraw chart on resize when statistics panel is visible
window.addEventListener('resize', () => {
  if (!panelStats.classList.contains('hidden')) renderStatistics();
});
