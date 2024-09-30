const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");
const toggleButton = document.getElementById("toggle-btn");

let counter = 0;

const socket = io({
    auth: {
        serverOffset: 0,
    },
    ackTimeout: 1000,
    retries: 3,
});

form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (input.value) {
        // compute a unique offset
        const clientOffset = `${socket.id}-${counter++}`;
        socket.emit("chat-message", input.value, clientOffset);
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

socket.emit("hello", "world");

socket.on("chat-message", (msg, serverOffset) => {
    const item = document.createElement("li");
    item.textContent = msg;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
    socket.auth.serverOffset = serverOffset;
});
