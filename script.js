const API_BASE = 'http://127.0.0.1:3000/api'; // Исправлен порт и добавлен /api

// Получаем элементы
const searchInput = document.querySelector('.search');
const searchBlock = document.querySelector('.search-block');
const notesList = document.querySelector('.notes-list');
const noteDetail = document.querySelector('.note-detail');
const newMarkBtn = document.querySelector('.newmark');
const tagsList = document.querySelectorAll('.tags-list li');

let currentTagFilter = 'Все';
let currentNoteId = null; // Для отслеживания id редактируемой заметки

// Функция загрузки заметок с сервера
async function loadNotes() {
  try {
    const response = await fetch(`${API_BASE}`);
    if (!response.ok) throw new Error('Ошибка загрузки заметок');
    const notes = await response.json();
    renderNotes(notes);
  } catch (error) {
    console.error(error);
    alert('Не удалось загрузить заметки');
  }
}

// Функция рендеринга заметок в DOM
function renderNotes(notes) {
  notesList.innerHTML = ''; // Очищаем список
  notes.forEach(note => {
    const noteElement = document.createElement('div');
    noteElement.classList.add('note');
    noteElement.dataset.id = note.id; // Сохраняем id в data-атрибуте

    const noteTitle = document.createElement('div');
    noteTitle.classList.add('note-title');
    noteTitle.textContent = note.title;

    const noteDate = document.createElement('div');
    noteDate.classList.add('note-date');
    noteDate.textContent = note.date;

    const noteSection = document.createElement('div');
    noteSection.classList.add('note-section');
    noteSection.textContent = note.tag;

    const noteContent = document.createElement('div');
    noteContent.classList.add('note-content');
    noteContent.style.display = 'none';
    noteContent.textContent = note.content || '';

    noteElement.appendChild(noteTitle);
    noteElement.appendChild(noteDate);
    noteElement.appendChild(noteSection);
    noteElement.appendChild(noteContent);

    notesList.appendChild(noteElement);

    // Обработчик клика для открытия детального вида
    noteElement.addEventListener('click', () => showNoteDetail(noteElement));
  });
  filterNotes(); // Применяем фильтр после рендеринга
}

// Функция фильтрации заметок по заголовку и тегу
function filterNotes() {
  const query = searchInput.value.toLowerCase();
  const notes = notesList.querySelectorAll('.note');

  notes.forEach(note => {
    const title = note.querySelector('.note-title').textContent.toLowerCase();
    const section = note.querySelector('.note-section').textContent;
    const matchesSearch = title.includes(query);
    const matchesTag = currentTagFilter === 'Все' || section === currentTagFilter;

    if (matchesSearch && matchesTag) {
      note.style.display = '';
    } else {
      note.style.display = 'none';
    }
  });
}

// Обработчик поиска по вводу
searchInput.addEventListener('input', filterNotes);

// Функция показа списка заметок
function showNotesList() {
  notesList.style.display = 'block';
  searchBlock.style.display = 'flex';
  noteDetail.style.display = 'none';
  filterNotes();
}

// Функция показа детального просмотра/редактирования заметки
function showNoteDetail(noteElement) {
  currentNoteId = noteElement.dataset.id; // Сохраняем id
  const title = noteElement.querySelector('.note-title').textContent;
  const date = noteElement.querySelector('.note-date').textContent;
  const section = noteElement.querySelector('.note-section').textContent;
  const content = noteElement.querySelector('.note-content').textContent || '';

  // Заполняем детальный вид
  noteDetail.querySelector('.detail-title').textContent = title;
  noteDetail.querySelector('.detail-date').value = date;
  noteDetail.querySelector('.detail-section').value = section;
  noteDetail.querySelector('.detail-content').value = content;

  // Скрываем список и поиск, показываем детальный вид
  searchBlock.style.display = 'none';
  notesList.style.display = 'none';
  noteDetail.style.display = 'block';

  // Обработчики кнопок
  const backBtn = noteDetail.querySelector('.back-btn');
  const saveBtn = noteDetail.querySelector('.save-detail-btn');
  const deleteBtn = noteDetail.querySelector('.delete-detail-btn');
  const cancelBtn = noteDetail.querySelector('.cancel-detail-btn');

  const goBack = () => {
    showNotesList();
    currentNoteId = null;
  };

  backBtn.onclick = goBack;
  cancelBtn.onclick = goBack;

  // Сохранение изменений
  saveBtn.onclick = async () => {
    const newTitle = noteDetail.querySelector('.detail-title').textContent;
    const newDate = noteDetail.querySelector('.detail-date').value;
    const newSection = noteDetail.querySelector('.detail-section').value;
    const newContent = noteDetail.querySelector('.detail-content').value;

    if (newDate && newTitle.trim()) {
      const dto = { title: newTitle, tag: newSection, date: newDate, content: newContent };
      try {
        if (currentNoteId) {
          // Обновление существующей
          dto.id = parseInt(currentNoteId);
          const response = await fetch(`${API_BASE}/notes`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dto)
          });
          if (!response.ok) throw new Error('Ошибка обновления');
        } else {
          // Создание новой (если каким-то образом id нет)
          const response = await fetch(`${API_BASE}/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dto)
          });
          if (!response.ok) throw new Error('Ошибка создания');
        }
        loadNotes(); // Перезагружаем список
        goBack();
      } catch (error) {
        console.error(error);
        alert('Ошибка сохранения');
      }
    } else {
      alert('Заголовок и дата обязательны!');
    }
  };

  // Удаление заметки
  deleteBtn.onclick = async () => {
    if (confirm('Удалить заметку?')) {
      try {
        const response = await fetch(`${API_BASE}/notes/delete`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: parseInt(currentNoteId) })
        });
        if (!response.ok) throw new Error('Ошибка удаления');
        loadNotes(); // Перезагружаем список
        goBack();
      } catch (error) {
        console.error(error);
        alert('Ошибка удаления');
      }
    }
  };
}

// Обработчики для фильтров по тегам
tagsList.forEach(tag => {
  tag.addEventListener('click', () => {
    currentTagFilter = tag.textContent;
    if (noteDetail.style.display === 'block') {
      showNotesList();
    } else {
      filterNotes();
    }
  });
});

// Обработчик кнопки "Новая заметка"
newMarkBtn.addEventListener('click', () => {
  // Создаем форму для ввода новой заметки (как в оригинале)
  const formOverlay = document.createElement('div');
  formOverlay.style.position = 'fixed';
  formOverlay.style.top = 0;
  formOverlay.style.left = 0;
  formOverlay.style.width = '100vw';
  formOverlay.style.height = '100vh';
  formOverlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
  formOverlay.style.display = 'flex';
  formOverlay.style.justifyContent = 'center';
  formOverlay.style.alignItems = 'center';
  formOverlay.style.zIndex = 1000;

  const form = document.createElement('form');
  form.style.backgroundColor = '#fff';
  form.style.padding = '20px';
  form.style.borderRadius = '10px';
  form.style.width = '500px';
  form.style.maxHeight = '80vh';
  form.style.overflowY = 'auto';
  form.style.boxSizing = 'border-box';
  form.style.display = 'flex';
  form.style.flexDirection = 'column';
  form.style.gap = '12px';

  const titleLabel = document.createElement('label');
  titleLabel.textContent = 'Заголовок:';
  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.required = true;

  const dateLabel = document.createElement('label');
  dateLabel.textContent = 'Дата:';
  const dateInput = document.createElement('input');
  dateInput.type = 'date';
  dateInput.required = true;
  const today = new Date().toISOString().split('T')[0];
  dateInput.value = today;

  const sectionLabel = document.createElement('label');
  sectionLabel.textContent = 'Тег:';
  const sectionSelect = document.createElement('select');
  sectionSelect.required = true;
  tagsList.forEach(li => {
    if (li.textContent !== 'Все') {
      const option = document.createElement('option');
      option.value = li.textContent;
      option.textContent = li.textContent;
      sectionSelect.appendChild(option);
    }
  });

  const contentLabel = document.createElement('label');
  contentLabel.textContent = 'Содержимое:';
  const contentTextarea = document.createElement('textarea');
  contentTextarea.rows = 10;
  contentTextarea.style.width = '100%';
  contentTextarea.style.padding = '8px';
  contentTextarea.style.border = '1px solid #ccc';
  contentTextarea.style.borderRadius = '5px';
  contentTextarea.style.boxSizing = 'border-box';

  const buttonsDiv = document.createElement('div');
  buttonsDiv.style.display = 'flex';
  buttonsDiv.style.justifyContent = 'space-between';

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.textContent = 'Добавить';
  submitBtn.style.backgroundColor = '#4499FF';
  submitBtn.style.color = '#fff';
  submitBtn.style.border = 'none';
  submitBtn.style.padding = '8px 16px';
  submitBtn.style.borderRadius = '5px';
  submitBtn.style.cursor = 'pointer';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.textContent = 'Отмена';
  cancelBtn.style.backgroundColor = '#ccc';
  cancelBtn.style.border = 'none';
  cancelBtn.style.padding = '8px 16px';
  cancelBtn.style.borderRadius = '5px';
  cancelBtn.style.cursor = 'pointer';

  buttonsDiv.appendChild(submitBtn);
  buttonsDiv.appendChild(cancelBtn);

  // Добавляем элементы в форму
  form.appendChild(titleLabel);
  form.appendChild(titleInput);
  form.appendChild(dateLabel);
  form.appendChild(dateInput);
  form.appendChild(sectionLabel);
  form.appendChild(sectionSelect);
  form.appendChild(contentLabel);
  form.appendChild(contentTextarea);
  form.appendChild(buttonsDiv);

  formOverlay.appendChild(form);
  document.body.appendChild(formOverlay);

  // Обработчик отмены
  cancelBtn.addEventListener('click', () => {
    document.body.removeChild(formOverlay);
  });

  // Обработчик отправки формы
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    const date = dateInput.value;
    const section = sectionSelect.value;
    const content = contentTextarea.value;

    if (title && date && section) {
      try {
        const response = await fetch(`${API_BASE}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, tag: section, date, content })
        });
        if (!response.ok) throw new Error('Ошибка создания');
        loadNotes(); // Перезагружаем список
        document.body.removeChild(formOverlay);
        searchInput.value = ''; // очищаем поиск
        filterNotes(); // обновляем фильтр
      } catch (error) {
        console.error(error);
        alert('Ошибка создания заметки');
      }
    }
  });
});

// Инициализация: загружаем заметки при загрузке страницы
document.addEventListener('DOMContentLoaded', loadNotes);