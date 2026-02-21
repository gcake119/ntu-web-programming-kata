const todoInput = document.getElementById('todo-input');
const descInput = document.getElementById('desc-input');
const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');

let todos = [];

function renderTodos() {
  todoList.innerHTML = '';

  todos.forEach((todo, index) => {
    const li = document.createElement('li');
    li.classList.add('todo-item');
    if (todo.done) li.classList.add('done');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.done;
    checkbox.addEventListener('change', () => toggleDone(index));

    const span = document.createElement('span');
    span.classList.add('todo-text');
    span.textContent = todo.title;
    if (todo.description) {
      span.title = todo.description; // show description as tooltip
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('delete-btn');
    deleteBtn.textContent = 'delete';
    deleteBtn.addEventListener('click', () => deleteTodo(index));

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(deleteBtn);
    todoList.appendChild(li);
  });
}

function addTodo() {
  const title = todoInput.value.trim();
  if (!title) return;

  const description = descInput.value.trim();
  todos.push({ title, description, done: false });

  todoInput.value = '';
  descInput.value = '';
  renderTodos();
}

function deleteTodo(index) {
  todos.splice(index, 1);
  renderTodos();
}

function toggleDone(index) {
  todos[index].done = !todos[index].done;
  renderTodos();
}

addBtn.addEventListener('click', addTodo);

todoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTodo();
});
