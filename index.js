import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Server } from "socket.io";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const app = express();
const server = createServer(app);
const io = new Server(server, {
    connectionStateRecovery: {},
});
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use("/assets", express.static(join(__dirname, "public/assets")));

// open the database file
const db = await open({
    filename: "chat.db",
    driver: sqlite3.Database,
});

await db.exec(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_offset TEXT UNIQUE,
            content TEXT
        )
    `);

app.get("/", (req, res) => {
    res.sendFile(join(__dirname, "index.html"));
});

app.get("*", (req, res) => {
    res.redirect("/");
});

io.on("connection", async (socket) => {
    socket.on("chat-message", async (msg) => {
        let result;
        try {
            const query = "INSERT INTO messages (content) VALUES (?)";
            result = await db.run(query, msg);
        } catch (error) {
            // TODO: handle the failure
            console.error(error);
            recovered = false;
            return;
        }
        io.emit("chat-message", msg, result.lastID);
    });

    if (!socket.recovered) {
        // if the connection state recovery was not successful
        try {
            const query = "SELECT id, content FROM messages WHERE id > ?";
            await db.each(
                query,
                [socket.handshake.auth.serverOffset || 0],
                (_err, row) => {
                    socket.emit("chat-message", row.content, row.id);
                }
            );
        } catch (error) {
            console.log(error);
        }
    }
});

server.listen(3000, () => {
    console.log("server running at http://localhost:3000");
});
