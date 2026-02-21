// ─── State ────────────────────────────────────────────────────
const STORAGE_KEY = 'demo2-todos';

/** @type {{ id: number, title: string, description: string, checked: boolean, expanded: boolean, createdAt: string }[]} */
let todos = loadTodos();
let nextId = todos.length ? Math.max(...todos.map((t) => t.id)) + 1 : 1;

/** @type {'all' | 'active' | 'completed'} */
let currentFilter = 'all';

// ─── DOM refs ─────────────────────────────────────────────────
const todoInput         = document.getElementById('todo-input');
const descInput         = document.getElementById('desc-input');
const addBtn            = document.getElementById('add-btn');
const todoListEl        = document.getElementById('todo-list');
const emptyMsg          = document.getElementById('empty-msg');
const activeCountEl     = document.getElementById('active-count');
const clearCompletedBtn = document.getElementById('clear-completed-btn');
const filterTabs        = document.querySelectorAll('.filter-tab');

// ─── Persistence ──────────────────────────────────────────────
function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function loadTodos() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? defaultTodos();
  } catch {
    return defaultTodos();
  }
}

function defaultTodos() {
  return [
    {
      id: 1,
      title: '學習 HTML / CSS / JavaScript',
      description: '完成 NTU Web Programming 的練習題。',
      checked: false,
      expanded: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      title: '複習 Git 基礎指令',
      description: '',
      checked: true,
      expanded: false,
      createdAt: new Date().toISOString(),
    },
  ];
}

// ─── Helpers ──────────────────────────────────────────────────
function formatDate(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function filteredTodos() {
  switch (currentFilter) {
    case 'active':    return todos.filter((t) => !t.checked);
    case 'completed': return todos.filter((t) => t.checked);
    default:          return todos;
  }
}

// ─── Render ───────────────────────────────────────────────────
function render(animateId = null) {
  todoListEl.innerHTML = '';

  const visible = filteredTodos();

  emptyMsg.hidden = visible.length > 0;

  visible.forEach((todo) => {
    const li = createTodoElement(todo, todo.id === animateId);
    todoListEl.appendChild(li);
  });

  updateStats();
}

function createTodoElement(todo, isNew = false) {
  const li = document.createElement('li');
  li.classList.add('todo-item');
  if (todo.checked)  li.classList.add('checked');
  if (todo.expanded) li.classList.add('expanded');
  if (isNew)         li.classList.add('todo-item--new');
  li.dataset.id = todo.id;

  // ── Top row ────────────────────────────────────────────────
  const row = document.createElement('div');
  row.classList.add('todo-item__row');

  // Checkbox
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.classList.add('todo-item__checkbox');
  checkbox.checked = todo.checked;
  checkbox.setAttribute('aria-label', '標記完成');
  checkbox.addEventListener('change', (e) => {
    e.stopPropagation();
    todo.checked = checkbox.checked;
    li.classList.toggle('checked', todo.checked);
    saveTodos();
    // If filter is active / completed, re-render to reflect
    if (currentFilter !== 'all') render();
    else updateStats();
  });

  // Title
  const titleSpan = document.createElement('span');
  titleSpan.classList.add('todo-item__title');
  titleSpan.textContent = todo.title;

  // Description badge (only shown if description exists)
  const badge = document.createElement('span');
  if (todo.description) {
    badge.classList.add('todo-item__badge');
    badge.textContent = '說明';
  }

  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.classList.add('btn', 'btn--danger');
  deleteBtn.textContent = '刪除';
  deleteBtn.setAttribute('aria-label', `刪除「${todo.title}」`);
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    todos = todos.filter((t) => t.id !== todo.id);
    saveTodos();
    render();
  });

  row.appendChild(checkbox);
  row.appendChild(titleSpan);
  if (todo.description) row.appendChild(badge);
  row.appendChild(deleteBtn);

  // ── Description + meta ─────────────────────────────────────
  const descWrapper = document.createElement('div');
  descWrapper.classList.add('todo-item__desc-wrapper');

  if (todo.description) {
    const descText = document.createElement('p');
    descText.classList.add('todo-item__desc-text');
    descText.textContent = todo.description;
    descWrapper.appendChild(descText);
  }

  const meta = document.createElement('span');
  meta.classList.add('todo-item__meta');
  meta.textContent = `建立於 ${formatDate(todo.createdAt)}`;
  descWrapper.appendChild(meta);

  // ── Assemble ───────────────────────────────────────────────
  li.appendChild(row);
  li.appendChild(descWrapper);

  // ── Toggle expand/collapse on row click ────────────────────
  li.addEventListener('click', () => {
    todo.expanded = !todo.expanded;
    li.classList.toggle('expanded', todo.expanded);
    saveTodos();
  });

  return li;
}

// ─── Stats ────────────────────────────────────────────────────
function updateStats() {
  const activeCount = todos.filter((t) => !t.checked).length;
  activeCountEl.textContent = `${activeCount} 項待完成`;

  const hasCompleted = todos.some((t) => t.checked);
  clearCompletedBtn.style.visibility = hasCompleted ? 'visible' : 'hidden';
}

// ─── Add todo ─────────────────────────────────────────────────
function addTodo() {
  const title = todoInput.value.trim();
  if (!title) {
    todoInput.focus();
    todoInput.classList.add('shake');
    todoInput.addEventListener('animationend', () => todoInput.classList.remove('shake'), { once: true });
    return;
  }

  const description = descInput.value.trim();
  const newTodo = {
    id: nextId++,
    title,
    description,
    checked: false,
    expanded: false,
    createdAt: new Date().toISOString(),
  };

  todos.unshift(newTodo); // newest first
  saveTodos();

  todoInput.value = '';
  descInput.value = '';
  todoInput.focus();

  // Switch to 'all' so user can see the new item
  if (currentFilter === 'completed') setFilter('all');
  else render(newTodo.id);
}

// ─── Clear completed ──────────────────────────────────────────
function clearCompleted() {
  todos = todos.filter((t) => !t.checked);
  saveTodos();
  render();
}

// ─── Filter ───────────────────────────────────────────────────
function setFilter(filter) {
  currentFilter = filter;

  filterTabs.forEach((tab) => {
    const isActive = tab.dataset.filter === filter;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });

  render();
}

// ─── Event listeners ──────────────────────────────────────────
addBtn.addEventListener('click', addTodo);

todoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTodo();
});

descInput.addEventListener('keydown', (e) => {
  // Ctrl+Enter / Cmd+Enter submits from textarea
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addTodo();
});

clearCompletedBtn.addEventListener('click', clearCompleted);

filterTabs.forEach((tab) => {
  tab.addEventListener('click', () => setFilter(tab.dataset.filter));
});

// ─── Init ─────────────────────────────────────────────────────
render();
