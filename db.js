import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const NOTES_FILE = path.join(__dirname, 'notes.json');

let notesList = [];

// Функция загрузки заметок из файла
function loadNotesFromFile() {
    try {
        if (fs.existsSync(NOTES_FILE)) {
            const data = fs.readFileSync(NOTES_FILE, 'utf8');
            notesList = JSON.parse(data);
        }
    } catch (error) {
        console.error('Ошибка загрузки заметок из файла:', error);
        notesList = [];
    }
}

// Функция сохранения заметок в файл
function saveNotesToFile() {
    try {
        fs.writeFileSync(NOTES_FILE, JSON.stringify(notesList, null, 2));
    } catch (error) {
        console.error('Ошибка сохранения заметок в файл:', error);
    }
}

// Инициализация: загружаем заметки при импорте
loadNotesFromFile();

function getMaxId() {
    let max = 0;
    for (let note of notesList) {
        if (note.id > max) {
            max = note.id;
        }
    }
    return max;
}

let maxId = getMaxId();

export function allNotes() {
    return notesList;
}

export function createNote(dto) {
    const newNote = {
        "id": ++maxId,
        "title": dto.title,
        "tag": dto.tag,
        "date": dto.date,
        "content": dto.content || ""
    };
    notesList.push(newNote);
    saveNotesToFile();  // Сохраняем после создания
}

export function updateNote(dto) {
    const index = notesList.findIndex((note) => note.id === dto.id);
    if (index === -1) {
        return false;
    }
    notesList[index] = {
        id: dto.id,
        title: dto.title,
        tag: dto.tag,
        date: dto.date,
        content: dto.content || ""
    };
    saveNotesToFile();  // Сохраняем после обновления
    return true;
}

export function deleteNote(dto) {
    const index = notesList.findIndex((note) => note.id === dto.id);
    if (index === -1) {
        return false;
    }
    notesList.splice(index, 1);
    saveNotesToFile();  // Сохраняем после удаления
    return true;
}