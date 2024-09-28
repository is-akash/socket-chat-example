const socket = io();

const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");

form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (input.value) {
        socket.emit("chat-message", input.value);
        input.value = "";
    }
});

socket.on("message-to-everyone", (msg) => {
    console.log(msg);
});

socket.on("messages", (msg) => {
    console.log(msg);
    const item = document.createElement("li");
    item.textContent = msg;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});
