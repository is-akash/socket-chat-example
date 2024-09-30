
## socket-chat-example

Following the official docs : https://socket.io/docs/v4/tutorial

```js
npm install socket.io
```

```js
import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server);

const __dirname = dirname(fileURLToPath(import.meta.url));

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  console.log('a user connected');

      socket.on("disconnect", () => {
        console.log(`user disconnected ${socket.id}`);
    });
});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});
```

`client`

```js
<script src="/socket.io/socket.io.js"></script>
<script>
  const socket = io();

  // If we are using a separate client and server
  // const socket = io("https://example.com/app"); // server endpoint
</script>
```

`socket.io cdn`

```js
<script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
```

### Emitting events

`client`

```
socket.emit('chat message', value);
```
`server`

```js
io.on('connection', (socket) => {
  socket.on('chat message', (msg) => {
    console.log('message: ' + msg);
  });
});
```

### Broadcasting

`server`

```js
io.on('connection', (socket) => {
  socket.broadcast.emit('hi'); // emit msg to everyone except sender
});
```

```js
io.on('connection', (socket) => {
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg); // emit msg to everyone including sender
  });
});
```

`client`

```js
  socket.on('chat message', (msg) => {
    const item = document.createElement('li');
    item.textContent = msg;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
  });
```


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

```js
const io = new Server(server, {
  connectionStateRecovery: {}
});
```

### Server Delivery

There are two common ways to synchronize the state of the client upon reconnection:

- either the server sends the whole state
- or the client keeps track of the last event it has processed and the server sends the missing pieces

Both are totally valid solutions and choosing one will depend on your use case. In this tutorial, we will go with the latter.

`server`

```js

// ** ----rest code -----**

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// open the database file
const db = await open({
  filename: 'chat.db',
  driver: sqlite3.Database
});

// create our 'messages' table (you can ignore the 'client_offset' column for now)
await db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_offset TEXT UNIQUE,
      content TEXT
  );
`);


// ** ----rest code -----**

    socket.on("chat-message", async (msg) => {
        let result;
        try {
            const query = "INSERT INTO messages (content) VALUES (?)";
            result = await db.run(query, msg);
        } catch (error) {
            // TODO: handle the failure
            console.error(error);
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
```

`client`

```js

  const socket = io({
    auth: {
      serverOffset: 0
    }
  });


  socket.on('chat message', (msg, serverOffset) => { // new added
    const item = document.createElement('li');
    item.textContent = msg;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
    socket.auth.serverOffset = serverOffset; // new added
  });
```

### Client Delivery

#### Buffered events

When a client gets disconnected, any call to socket.emit() is buffered until reconnection:

##### At least once

- manually with an acknowledgement:

```js
function emit(socket, event, arg) {
  socket.timeout(5000).emit(event, arg, (err) => {
    if (err) {
      // no ack from the server, let's retry
      emit(socket, event, arg);
    }
  });
}

emit(socket, 'hello', 'world');
```

- or with the retries option:

```js
const socket = io({
  ackTimeout: 10000,
  retries: 3
});

socket.emit('hello', 'world');
```

In both cases, the client will retry to send the message until it gets an acknowledgement from the server:

`server`

```js
io.on('connection', (socket) => {
  socket.on('hello', (value, callback) => {
    // once the event is successfully handled
    callback();
  });
})
```

> With the `retries` option, the order of the messages is guaranteed, as the messages are queued and sent one by one. This is not the case with the first option.

##### Exactly once

The problem with retries is that the server might now receive the same message multiple times, so it needs a way to uniquely identify each message, and only store it once in the database.

We will start by assigning a unique identifier to each message on the client side:

`client`

```js

let counter = 0;

  const socket = io({
    auth: {
      serverOffset: 0
    },
    // enable retries
    ackTimeout: 10000,
    retries: 3,
  });


  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value) {
      // compute a unique offset
      const clientOffset = `${socket.id}-${counter++}`; // new added
      socket.emit('chat message', input.value, clientOffset); // new added
      input.value = '';
    }
  });
```

> The `socket.id` attribute is a random 20-characters identifier which is assigned to each connection. We could also have used `getRandomValues()` to generate a unique offset.

And then we store this offset alongside the message on the server side:

`server`

```js
  socket.on('chat message', async (msg, clientOffset, callback) => {
    let result;
    try {
      result = await db.run('INSERT INTO messages (content, client_offset) VALUES (?, ?)', msg, clientOffset);
    } catch (e) {
      if (e.errno === 19 /* SQLITE_CONSTRAINT */ ) {
        // the message was already inserted, so we notify the client
        callback();
      } else {
        // nothing to do, just let the client retry
      }
      return;
    }
    io.emit('chat message', msg, result.lastID);
    // acknowledge the event
    callback();
  });
```

This way, the `UNIQUE` constraint on the `client_offset` column prevents the duplication of the message.

> Do not forget to acknowledge the event, or else the client will keep retrying (up to retries times).

### Scaling horizontally

- Horizontal scaling (also known as "scaling out") means adding new servers to your infrastructure to cope with new demands
- Vertical scaling (also known as "scaling up") means adding more resources (processing power, memory, storage, ...) to your existing infrastructure

First step: let's use all the available cores of the host. By default, Node.js runs your Javascript code in a single thread, which means that even with a 32-core CPU, only one core will be used. Fortunately, the Node.js cluster module provides a convenient way to create one worker thread per core.

We will also need a way to forward events between the Socket.IO servers. We call this component an "Adapter".

![ref](/public/assets/Images/adapter-dark.png);

So let's install the cluster adapter:

```bash
npm install @socket.io/cluster-adapter
```

`server`

```js
import { availableParallelism } from 'node:os';
import cluster from 'node:cluster';
import { createAdapter, setupPrimary } from '@socket.io/cluster-adapter';


if (cluster.isPrimary) {
  const numCPUs = availableParallelism();
  // create one worker per available core
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork({
      PORT: 3000 + i
    });
  }
  
  // set up the adapter on the primary thread
  setupPrimary();
} else {
  const app = express();
  const server = createServer(app);
  const io = new Server(server, {
    connectionStateRecovery: {},
    // set up the adapter on each worker thread
    adapter: createAdapter()
  });

  // [...]

  // each worker will listen on a distinct port
  const port = process.env.PORT;

  server.listen(port, () => {
    console.log(`server running at http://localhost:${port}`);
  });
}
```


There are currently 5 official adapter implementations:

the Redis adapter
the Redis Streams adapter
the MongoDB adapter
the Postgres adapter
the Cluster adapter
So you can choose the one that best suits your needs. However, please note that some implementations do not support the Connection state recovery feature, you can find the compatibility matrix [here](https://socket.io/docs/v4/connection-state-recovery#compatibility-with-existing-adapters).


>In most cases, you would also need to ensure that all the HTTP requests of a Socket.IO session reach the same server (also known as "sticky session"). This is not needed here though, as each Socket.IO server has its own port.

More information [here](https://socket.io/docs/v4/using-multiple-nodes/).

### What we learn 

- send an event between the client and the server
- broadcast an event to all or a subset of connected clients
- handle temporary disconnections
- scale up

### Here are some ideas to improve the application:

- [ ] Broadcast a message to connected users when someone connects or disconnects.
- [ ] Add support for nicknames.
- [ ] Don’t send the same message to the user that sent it. Instead, append the message directly as soon as they press enter.
- [ ] Add “{user} is typing” functionality.
- [ ] Show who’s online.
- [ ] Add private messaging.
