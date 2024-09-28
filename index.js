import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server);

const __dirname = dirname(fileURLToPath(import.meta.url));

app.use("/assets", express.static(join(__dirname, "public/assets")));

app.get("/", (req, res) => {
    res.sendFile(join(__dirname, "index.html"));
});

io.on("connection", (socket) => {
    // console.log(socket);
    console.log(`a user is connected ${socket.id}`);

    socket.on("disconnect", () => {
        console.log(`user disconnected ${socket.id}`);
    });

    socket.on("chat-message", (msg) => {
        // console.log("message", msg);
        // this will emit the event to all connected sockets
        // io.emit("message-to-everyone", msg);

        // message to everyone expect the sender
        socket.broadcast.emit("messages", msg);
    });
});

server.listen(3000, () => {
    console.log("server running at http://localhost:3000");
});
