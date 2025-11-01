import { createServer } from "node:http";
import { allNotes, createNote, updateNote, deleteNote } from "./db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const host = "127.0.0.1";
const port = 3000;

const server = createServer((req, res) => {
    const method = req.method;
    const url = req.url;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // Обработка preflight OPTIONS запросов (исправление CORS)
    if (method === "OPTIONS") {
        res.statusCode = 200;
        res.end();
        return;
    }

    // Обслуживание статических файлов
    if (url === "/" && method === "GET") {
        const filePath = path.join(__dirname, 'index.html');
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                res.statusCode = 500;
                res.end('Error loading HTML');
                return;
            }
            res.setHeader('Content-Type', 'text/html');
            res.end(data);
        });
    } else if (url === "/script.js" && method === "GET") {
        const filePath = path.join(__dirname, 'script.js');
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                res.statusCode = 500;
                res.end('Error loading JS');
                return;
            }
            res.setHeader('Content-Type', 'application/javascript');
            res.end(data);
        });
    } else if (url === "/Zametka.css" && method === "GET") {
        const filePath = path.join(__dirname, 'Zametka.css');
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                res.statusCode = 500;
                res.end('Error loading CSS');
                return;
            }
            res.setHeader('Content-Type', 'text/css');
            res.end(data);
        });
    }
    // API эндпоинты (изменены на /api)
    else if (url === "/api" && method === "GET") {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify(allNotes()));
        res.end();
    } else if (url === "/api/notes" && method === "POST") {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        let body = [];
        req.on("data", (chunk) => body.push(chunk));
        req.on("end", () => {
            const buffer = Buffer.concat(body);
            const rawDataString = buffer.toString();
            const data = JSON.parse(rawDataString);
            createNote(data);
            console.log(allNotes());
            res.end(JSON.stringify({ "statusCode": 200 }));
        });
    } else if (url === "/api/notes" && method === "PUT") {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        let body = [];
        req.on("data", (chunk) => body.push(chunk));
        req.on("end", () => {
            const buffer = Buffer.concat(body);
            const rawDataString = buffer.toString();
            const data = JSON.parse(rawDataString);
            const success = updateNote(data);
            if (!success) {
                res.statusCode = 404;
                res.end(JSON.stringify({ "error": "Note not found" }));
                return;
            }
            console.log(allNotes());
            res.end(JSON.stringify({ "statusCode": 200 }));
        });
    } else if (url === "/api/notes/delete" && method === "DELETE") {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        let body = [];
        req.on("data", (chunk) => body.push(chunk));
        req.on("end", () => {
            const buffer = Buffer.concat(body);
            const rawDataString = buffer.toString();
            const data = JSON.parse(rawDataString);
            const success = deleteNote(data);
            if (!success) {
                res.statusCode = 404;
                res.end(JSON.stringify({ "error": "Note not found" }));
                return;
            }
            console.log(allNotes());
            res.end(JSON.stringify({ "statusCode": 200 }));
        });
    } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ "error": "Not found" }));
    }
});

server.listen(port, host, () => {
    console.log(`Server run: http://${host}:${port}`);
});