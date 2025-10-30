const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');

// Файл для хранения заметок
const NOTES_FILE = path.join(__dirname, 'notes.json');

// Загрузка заметок из файла
function loadNotes() {
  if (fs.existsSync(NOTES_FILE)) {
    const data = fs.readFileSync(NOTES_FILE, 'utf8');
    return JSON.parse(data);
  }
  return [{ id: 1, title: 'Первая заметка', content: '', date: '2024-06-01', section: 'Идеи' }];
}

// Сохранение заметок в файл
function saveNotes(notes) {
  fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2));
}

// Инициализация заметок
let notes = loadNotes();

// Функция для рендера HTML заметки
function renderNote(note) {
  return `
    <div class="note">
      <a href="/notes/${note.id}/edit" style="text-decoration: none; color: inherit;">
        <div class="note-title">${note.title}</div>
        <div class="note-date">${note.date}</div>
        <div class="note-section">${note.section}</div>
        <div class="note-content" style="display: none;">${note.content}</div>
      </a>
      <form action="/notes/${note.id}" method="POST" style="display: inline;">
        <input type="hidden" name="_method" value="DELETE" />
        <button type="submit" class="delete-btn"></button>
      </form>
    </div>
  `;
}

// Функция для рендера списка заметок с фильтром и поиском
function renderNotesList(notes, tag, search) {
  const filtered = notes.filter(note => {
    const matchesTag = !tag || tag === 'Все' || note.section === tag;
    const matchesSearch = !search || note.title.toLowerCase().includes(search.toLowerCase()) || note.content.toLowerCase().includes(search.toLowerCase());
    return matchesTag && matchesSearch;
  });
  return filtered.map(renderNote).join('');
}

// Функция для рендера главной страницы
function renderIndex(query) {
  const tag = query.tag || 'Все';
  const search = query.search || '';
  const notesHtml = renderNotesList(notes, tag, search);
  let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  html = html.replace('{{notes}}', notesHtml);
  html = html.replace('{{tag}}', tag);
  html = html.replace('{{search}}', search);
  return html;
}

// Функция для рендера формы создания
function renderCreateForm() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Новая заметка</title>
      <link rel="stylesheet" href="/zametki.css" />
    </head>
    <body>
      <div class="create-container">
        <div class="create-form">
          <h1 class="create-title">Новая заметка</h1>
          <form action="/notes" method="POST">
            <div class="form-group">
              <label for="title">Заголовок</label>
              <input type="text" id="title" name="title" class="form-field" placeholder="Заголовок" required />
            </div>
            <div class="form-group">
              <label for="content">Содержимое</label>
              <textarea id="content" name="content" class="form-field form-textarea" placeholder="Содержимое"></textarea>
            </div>
            <div class="form-group">
              <label for="section">Секция</label>
              <select id="section" name="section" class="form-field">
                <option value="Идеи">Идеи</option>
                <option value="Личное">Личное</option>
                <option value="Работа">Работа</option>
                <option value="Список покупок">Список покупок</option>
              </select>
            </div>
            <div class="form-buttons">
              <button type="submit" class="btn btn-primary">Создать</button>
              <a href="/" class="btn btn-secondary">Отмена</a>
            </div>
          </form>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Функция для рендера формы редактирования
function renderEditForm(note) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Редактировать заметку</title>
      <link rel="stylesheet" href="/zametki.css" />
    </head>
    <body>
      <div class="create-container">
        <div class="create-form">
          <h1 class="create-title">Редактировать заметку</h1>
          <form action="/notes/${note.id}" method="POST">
            <input type="hidden" name="_method" value="PUT" />
            <div class="form-group">
              <label for="title">Заголовок</label>
              <input type="text" id="title" name="title" class="form-field" placeholder="Заголовок" value="${note.title}" required />
            </div>
            <div class="form-group">
              <label for="content">Содержимое</label>
              <textarea id="content" name="content" class="form-field form-textarea" placeholder="Содержимое">${note.content}</textarea>
            </div>
            <div class="form-group">
              <label for="section">Секция</label>
              <select id="section" name="section" class="form-field">
                <option value="Идеи" ${note.section === 'Идеи' ? 'selected' : ''}>Идеи</option>
                <option value="Личное" ${note.section === 'Личное' ? 'selected' : ''}>Личное</option>
                <option value="Работа" ${note.section === 'Работа' ? 'selected' : ''}>Работа</option>
                <option value="Список покупок" ${note.section === 'Список покупок' ? 'selected' : ''}>Список покупок</option>
              </select>
            </div>
            <div class="form-buttons">
              <button type="submit" class="btn btn-primary">Сохранить</button>
              <a href="/" class="btn btn-secondary">Отмена</a>
            </div>
          </form>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Основной обработчик запросов
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;
  const method = req.method;

  if (method === 'GET') {
    if (pathname === '/' || pathname === '/index.html') {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(renderIndex(query));
    } else if (pathname === '/zametki.css') {
      fs.readFile(path.join(__dirname, 'zametki.css'), (err, data) => {
        if (err) {
          res.writeHead(500, {'Content-Type': 'text/plain'});
          res.end('Internal Server Error');
        } else {
          res.writeHead(200, {'Content-Type': 'text/css'});
          res.end(data);
        }
      });
    } else if (pathname === '/notes/new') {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(renderCreateForm());
    } else if (pathname.startsWith('/notes/') && pathname.endsWith('/edit')) {
      const id = parseInt(pathname.split('/')[2]);
      const note = notes.find(n => n.id === id);
      if (note) {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(renderEditForm(note));
      } else {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end('Note not found');
      }
    } else {
      res.writeHead(404, {'Content-Type': 'text/plain'});
      res.end('Not found');
    }
  } else if (method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      const data = querystring.parse(body);
      if (pathname === '/notes') {
        // Создание
        const newNote = {
          id: notes.length ? Math.max(...notes.map(n => n.id)) + 1 : 1,
          title: data.title,
          content: data.content,
          section: data.section,
          date: new Date().toISOString().split('T')[0]
        };
        notes.push(newNote);
        saveNotes(notes);
        res.writeHead(302, { 'Location': '/' });
        res.end();
      } else if (pathname.startsWith('/notes/')) {
        const id = parseInt(pathname.split('/')[2]);
        const idx = notes.findIndex(n => n.id === id);
        if (idx >= 0) {
          if (data._method === 'PUT') {
            // Обновление
            notes[idx] = { ...notes[idx], title: data.title, content: data.content, section: data.section };
            saveNotes(notes);
            res.writeHead(302, { 'Location': '/' });
            res.end();
          } else if (data._method === 'DELETE') {
            // Удаление
            notes.splice(idx, 1);
            saveNotes(notes);
            res.writeHead(302, { 'Location': '/' });
            res.end();
          } else {
            res.writeHead(400, {'Content-Type': 'text/plain'});
            res.end('Invalid method');
          }
        } else {
          res.writeHead(404, {'Content-Type': 'text/plain'});
          res.end('Note not found');
        }
      } else {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end('Not found');
      }
    });
  } else {
    res.writeHead(405, {'Content-Type': 'text/plain'});
    res.end('Method not allowed');
  }
});

server.listen(2200, () => {
  console.log('Server running at http://localhost:2200/');
});