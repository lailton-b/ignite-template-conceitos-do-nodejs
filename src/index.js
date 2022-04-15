const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find((user) => 
    user.username === username
  );

  if (!user) {
    return response.status(404).json([{ error: "User not found" }]);
  };

  request.user = user;
  return next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  if (!name) return response.status(400).json({ error: "Field 'name' required" })
  if (!username) return response.status(400).json({ error: "Field 'username' required" })
  
  const isUsernameBeingUsed = users.some((user) => 
    user.username === username
  );
  
  if (isUsernameBeingUsed) {
    return response.status(400).json({
      error: "Username already exists"
    })
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    todos: []
  };
  users.push(user);
  return response.status(201).json(user);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  return response.status(200).json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;
  const todo = {
    id: uuidv4(),
    title,
    done: false, 
    deadline: new Date(deadline), 
    created_at: new Date()
  }
  user.todos.push(todo)
  return response.status(201).json(todo);
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;
  const { id } = request.params;

  const todoIndex = user.todos.findIndex((todo) => todo.id === id)

  if (todoIndex === -1) {
    return response.status(404).json({
      error: `No TODO was found with the id "${id}"`
    })
  }

  user.todos[todoIndex] = {
    ...user.todos[todoIndex],
    title: title || todo.title,
    deadline: deadline || todo.deadline
  }

  response.status(200).json({
    title: user.todos[todoIndex].title,
    deadline: user.todos[todoIndex].deadline,
    done: user.todos[todoIndex].done,
  })
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { user } = request;

  const todoIndex = user.todos.findIndex((todo) => todo.id === id);

  if (todoIndex === -1) {
    return response.status(404).json({
      error: `No TODO was found with the id "${id}"`
    })
  }

  user.todos[todoIndex].done = true;

  return response.status(200).json(user.todos[todoIndex]);  
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { user } = request;
  const todoIndex = user.todos.findIndex((todo) => todo.id === id);

  if (todoIndex === -1) {
    return response.status(404).json({
      error: `No TODO was found with the id "${id}"`
    })
  }

  user.todos.splice(todoIndex, 1);

  return response.status(204).send();
});

module.exports = app;