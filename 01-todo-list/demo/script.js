// ─── State ───────────────────────────────────────────────────
let todos = [
  { id: 1, title: 'todo 1', description: '', checked: false, expanded: false },
  { id: 2, title: 'todo 2', description: '', checked: false, expanded: false },
];
let nextId = 3;

// ─── DOM refs ────────────────────────────────────────────────
const todoInput = document.getElementById('todo-input');
const descInput  = document.getElementById('desc-input');
const addBtn     = document.getElementById('add-btn');
const todoList   = document.getElementById('todo-list');

// ─── Render ──────────────────────────────────────────────────
function render() {
  todoList.innerHTML = '';

  todos.forEach((todo) => {
    const li = createTodoElement(todo);
    todoList.appendChild(li);
  });
}

function createTodoElement(todo) {
  const li = document.createElement('li');
  li.classList.add('todo-item');
  if (todo.checked)  li.classList.add('checked');
  if (todo.expanded) li.classList.add('expanded');
  li.dataset.id = todo.id;

  // ── Top row ──────────────────────────────────────────────
  const row = document.createElement('div');
  row.classList.add('todo-item__row');

  // checkbox
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.classList.add('todo-item__checkbox');
  checkbox.checked = todo.checked;
  checkbox.addEventListener('change', (e) => {
    e.stopPropagation();          // don't also toggle expand
    todo.checked = checkbox.checked;
    li.classList.toggle('checked', todo.checked);
  });

  // title
  const titleSpan = document.createElement('span');
  titleSpan.classList.add('todo-item__title');
  titleSpan.textContent = todo.title;

  // delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.classList.add('todo-item__delete');
  deleteBtn.textContent = 'delete';
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();          // don't also toggle expand
    todos = todos.filter((t) => t.id !== todo.id);
    render();
  });

  row.appendChild(checkbox);
  row.appendChild(titleSpan);
  row.appendChild(deleteBtn);

  // ── Description wrapper ───────────────────────────────────
  const descWrapper = document.createElement('div');
  descWrapper.classList.add('todo-item__desc-wrapper');

  const descText = document.createElement('p');
  descText.classList.add('todo-item__desc-text');
  descText.textContent = todo.description || '(no description)';

  descWrapper.appendChild(descText);

  // ── Assemble ──────────────────────────────────────────────
  li.appendChild(row);
  li.appendChild(descWrapper);

  // ── Click to expand / collapse ────────────────────────────
  li.addEventListener('click', () => {
    todo.expanded = !todo.expanded;
    li.classList.toggle('expanded', todo.expanded);
  });

  return li;
}

// ─── Add todo ────────────────────────────────────────────────
function addTodo() {
  const title = todoInput.value.trim();
  if (!title) return;

  const description = descInput.value.trim();
  todos.push({
    id: nextId++,
    title,
    description,
    checked: false,
    expanded: false,
  });

  todoInput.value = '';
  descInput.value = '';
  todoInput.focus();

  render();
}

// ─── Event listeners ─────────────────────────────────────────
addBtn.addEventListener('click', addTodo);

todoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTodo();
});

// ─── Init ────────────────────────────────────────────────────
render();
