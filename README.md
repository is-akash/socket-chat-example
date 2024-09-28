
## socket-chat-example

Following the official docs : https://socket.io/docs/v4/tutorial


### Acknowledgements
Events are great, but in some cases you may want a more classic request-response API. In Socket.IO, this feature is named "acknowledgements".

It comes in two flavors:

1. With a callback function
2. With a Promise

**Callback**

#### from client to server case 1

`client`

```js
socket.timeout(5000).emit("request", { foo: "bar" }, "baz", (err, response) => {
     if (err) {
         console.log(
             "the server did not acknowledged the event in the given delay"
         );
     } else {
         console.log(response.status); // 'ok'
     }
});
```

`server`

```js
    socket.on("request", (arg1, arg2, callback) => {
        console.log(arg1);
        console.log(arg2);
        callback({
            status: "ok",
        });
    });
```

**With a promise**

`client`

```js
(async () => {
    try {
        const response = await socket
            .timeout(5000)
            .emitWithAck("request2", { foo: "bar" }, "baz");
        console.log(response.status);
    } catch (error) {
        console.log(
            "the server did not acknowledged the event in the given delay"
        );
    }
})();
```

`server`

```js
    socket.on("request2", (arg1, arg2, callback) => {
        console.log(arg1);
        console.log(arg2);
        callback({
            status: "ok from request 2",
        });
    });
```

### catch-all listeners

`Sender`

```js
socket.emit("catch-all-listeners", 1, "2", { 3: "4", 5: Uint8Array.from([6]) });
```
`Receiver`

```js
    socket.onAny((eventName, ...args) => {
        console.log(eventName); // catch-all-listeners
        console.log(args); // [ 1, '2', { 3: '4', 5: ArrayBuffer (1) [ 6 ] } ]
    });
```

`Similarly, for outgoing packets:`

`outgoing event: `

```js
    io.emit("outgoing-event", 1, "2");
```
```js
    socket.onAnyOutgoing((eventName, ...args) => {
        console.log(eventName); // 'outgoing-event'
        console.log(args); // [ 1, '2']
    });
```

### Server API
#### Broadcasting

`server`
// will emit the msg to every connected socket

```js
io.emit();
```
![ref](/public/assets/Images/broadcasting-dark.png)

#### Rooms

```js
io.on('connection', (socket) => {
    // creating a room id
    const roomId = socket.id;
    
    // join the room
    socket.join(roomId);

    // broadcast to all connected client in the room
    io.to(roomId).emit("msg", "hello world");

    // broadcast to all connected clients except in the room specified
    io.except(roomId).emit("msg", "hi world");

    // leave the room
    socket.leave(roomId);
});
```
![ref](/public/assets/Images/room-dark.png)

### Handling disconnections

Now, let's highlight two really important properties of Socket.IO:

- a Socket.IO client is not always connected
- a Socket.IO server does not store any event

Even over a stable network, it is not possible to maintain a connection alive forever.
In the context of our chat application, this implies that a disconnected client might miss some messages:

![ref](/public/assets/Images/disconnected-dark.png)


