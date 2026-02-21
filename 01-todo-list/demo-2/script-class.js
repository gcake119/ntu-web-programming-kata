class TodoApp {
  #STORAGE_KEY = 'demo2-todos-class';
  #todos       = [];
  #nextId      = 1;
  #filter      = 'all';
  #animateId   = null;

  constructor() {
    this.#loadTodos();

    this.todoInput         = document.getElementById('todo-input');
    this.descInput         = document.getElementById('desc-input');
    this.addBtn            = document.getElementById('add-btn');
    this.todoListEl        = document.getElementById('todo-list');
    this.emptyMsg          = document.getElementById('empty-msg');
    this.activeCountEl     = document.getElementById('active-count');
    this.clearCompletedBtn = document.getElementById('clear-completed-btn');
    this.filterTabs        = document.querySelectorAll('.filter-tab');

    this.#bindEvents();
    this.#render();
  }

  // ── Data: load / save ─────────────────────────────────────
  #loadTodos() {
    try {
      const raw = JSON.parse(localStorage.getItem(this.#STORAGE_KEY));
      if (raw?.length) {
        this.#todos  = raw;
        this.#nextId = Math.max(...raw.map((t) => t.id)) + 1;
        return;
      }
    } catch { /* ignore */ }
    this.#todos = [
      { id: 1, title: '學習 HTML / CSS / JavaScript', description: '完成 NTU Web Programming 的練習題。', checked: false, expanded: false, createdAt: new Date().toISOString() },
      { id: 2, title: '複習 Git 基礎指令',             description: '',                                  checked: true,  expanded: false, createdAt: new Date().toISOString() },
    ];
    this.#nextId = 3;
  }

  #saveTodos() {
    localStorage.setItem(this.#STORAGE_KEY, JSON.stringify(this.#todos));
  }

  // ── Data: CRUD ────────────────────────────────────────────
  #addTodo(title, description) {
    const todo = { id: this.#nextId++, title, description, checked: false, expanded: false, createdAt: new Date().toISOString() };
    this.#todos.unshift(todo);
    this.#saveTodos();
    return todo;
  }

  #deleteTodo(id) {
    this.#todos = this.#todos.filter((t) => t.id !== id);
    this.#saveTodos();
  }

  #toggleTodo(id) {
    const todo = this.#todos.find((t) => t.id === id);
    if (todo) { todo.checked = !todo.checked; this.#saveTodos(); }
  }

  #toggleExpanded(id) {
    const todo = this.#todos.find((t) => t.id === id);
    if (todo) { todo.expanded = !todo.expanded; this.#saveTodos(); }
  }

  #clearCompleted() {
    this.#todos = this.#todos.filter((t) => !t.checked);
    this.#saveTodos();
  }

  #filteredTodos() {
    switch (this.#filter) {
      case 'active':    return this.#todos.filter((t) => !t.checked);
      case 'completed': return this.#todos.filter((t) => t.checked);
      default:          return this.#todos;
    }
  }

  // ── UI: events ────────────────────────────────────────────
  #bindEvents() {
    this.addBtn.addEventListener('click', () => this.#handleAdd());

    this.todoInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.#handleAdd();
    });

    this.descInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) this.#handleAdd();
    });

    this.clearCompletedBtn.addEventListener('click', () => {
      this.#clearCompleted();
      this.#render();
    });

    this.filterTabs.forEach((tab) => {
      tab.addEventListener('click', () => this.#setFilter(tab.dataset.filter));
    });
  }

  #handleAdd() {
    const title = this.todoInput.value.trim();
    if (!title) {
      this.todoInput.focus();
      this.todoInput.classList.add('shake');
      this.todoInput.addEventListener('animationend', () => this.todoInput.classList.remove('shake'), { once: true });
      return;
    }
    const newTodo = this.#addTodo(title, this.descInput.value.trim());
    this.#animateId = newTodo.id;
    this.todoInput.value = '';
    this.descInput.value = '';
    this.todoInput.focus();
    if (this.#filter === 'completed') this.#setFilter('all');
    else this.#render();
  }

  #setFilter(filter) {
    this.#filter = filter;
    this.filterTabs.forEach((tab) => {
      const active = tab.dataset.filter === filter;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    this.#render();
  }

  // ── UI: render ────────────────────────────────────────────
  #render() {
    this.todoListEl.innerHTML = '';
    const visible = this.#filteredTodos();
    this.emptyMsg.hidden = visible.length > 0;
    visible.forEach((todo) => this.todoListEl.appendChild(this.#createItem(todo, todo.id === this.#animateId)));
    this.#animateId = null;
    this.#updateStats();
  }

  #createItem(todo, isNew = false) {
    const li = document.createElement('li');
    li.classList.add('todo-item');
    if (todo.checked)  li.classList.add('checked');
    if (todo.expanded) li.classList.add('expanded');
    if (isNew)         li.classList.add('todo-item--new');
    li.dataset.id = todo.id;

    const row = document.createElement('div');
    row.classList.add('todo-item__row');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.classList.add('todo-item__checkbox');
    checkbox.checked = todo.checked;
    checkbox.setAttribute('aria-label', '標記完成');
    checkbox.addEventListener('change', (e) => {
      e.stopPropagation();
      this.#toggleTodo(todo.id);
      if (this.#filter === 'all') { li.classList.toggle('checked', todo.checked); this.#updateStats(); }
      else this.#render();
    });

    const titleSpan = document.createElement('span');
    titleSpan.classList.add('todo-item__title');
    titleSpan.textContent = todo.title;

    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('btn', 'btn--danger');
    deleteBtn.textContent = '刪除';
    deleteBtn.setAttribute('aria-label', `刪除「${todo.title}」`);
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.#deleteTodo(todo.id);
      this.#render();
    });

    row.appendChild(checkbox);
    row.appendChild(titleSpan);
    if (todo.description) {
      const badge = document.createElement('span');
      badge.classList.add('todo-item__badge');
      badge.textContent = '說明';
      row.appendChild(badge);
    }
    row.appendChild(deleteBtn);

    const descWrapper = document.createElement('div');
    descWrapper.classList.add('todo-item__desc-wrapper');
    if (todo.description) {
      const p = document.createElement('p');
      p.classList.add('todo-item__desc-text');
      p.textContent = todo.description;
      descWrapper.appendChild(p);
    }
    const meta = document.createElement('span');
    meta.classList.add('todo-item__meta');
    meta.textContent = `建立於 ${new Date(todo.createdAt).toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`;
    descWrapper.appendChild(meta);

    li.appendChild(row);
    li.appendChild(descWrapper);

    li.addEventListener('click', () => {
      this.#toggleExpanded(todo.id);
      li.classList.toggle('expanded', todo.expanded);
    });

    return li;
  }

  #updateStats() {
    const activeCount = this.#todos.filter((t) => !t.checked).length;
    this.activeCountEl.textContent = `${activeCount} 項待完成`;
    this.clearCompletedBtn.style.visibility = this.#todos.some((t) => t.checked) ? 'visible' : 'hidden';
  }
}

// ── Entry point ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => new TodoApp());
