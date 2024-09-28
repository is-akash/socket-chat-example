const socket = io();

const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");
const toggleButton = document.getElementById("toggle-btn");

form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (input.value) {
        socket.emit("chat-message", input.value);
        input.value = "";
    }
});

toggleButton.addEventListener("click", (e) => {
    e.preventDefault();
    if (socket.connected) {
        toggleButton.innerText = "Connect";
        socket.disconnect();
    } else {
        toggleButton.innerText = "Disconnect";
        socket.connect();
    }
});

socket.on("message-to-everyone", (msg) => {
    const item = document.createElement("li");
    item.textContent = msg;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});

socket.on("messages", (msg) => {
    const item = document.createElement("li");
    item.textContent = msg;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});

socket.on("msg", (val) => {
    console.log(val);
});
socket.on("left", (id) => {
    console.log(id + "left the room");
});
