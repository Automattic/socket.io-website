---
title: The Socket instance (server-side)
sidebar_label: The Socket instance
sidebar_position: 4
slug: /server-socket-instance/
---

import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';

A `Socket` is the fundamental class for interacting with the client. It inherits all the methods of the Node.js [EventEmitter](https://nodejs.org/api/events.html#class-eventemitter), like [emit](../../server-api.md#socketemiteventname-args), [on](../../server-api.md#socketoneventname-callback), [once](../../server-api.md#socketonceeventname-listener) or [removeListener](../../server-api.md#socketremovelistenereventname-listener).

<ThemedImage
  alt="Bidirectional communication between server and client"
  sources={{
    light: useBaseUrl('/images/bidirectional-communication-socket.png'),
    dark: useBaseUrl('/images/bidirectional-communication-socket-dark.png'),
  }}
/>

<br />
<br />

Besides:

- [emitting](../04-Events/emitting-events.md#basic-emit) and [listening to](../04-Events/listening-to-events.md) events
- [broadcasting events](../04-Events/broadcasting-events.md#to-all-connected-clients-except-the-sender)
- [joining and leaving rooms](../04-Events/rooms.md#joining-and-leaving)

The Socket instance has a few attributes that may be of use in your application:

## Socket#id

Each new connection is assigned a random 20-characters identifier.

This identifier is synced with the value on the client-side.

```js
// server-side
io.on("connection", (socket) => {
  console.log(socket.id); // ojIckSD2jqNzOqIrAGzL
});

// client-side
socket.on("connect", () => {
  console.log(socket.id); // ojIckSD2jqNzOqIrAGzL
});
```

:::caution

Please note that, unless [connection state recovery](../01-Documentation/connection-state-recovery.md) is enabled, the `id` attribute is an **ephemeral** ID that is not meant to be used in your application (or only for debugging purposes) because:

- this ID is regenerated after each reconnection (for example when the WebSocket connection is severed, or when the user refreshes the page)
- two different browser tabs will have two different IDs
- there is no message queue stored for a given ID on the server (i.e. if the client is disconnected, the messages sent from the server to this ID are lost)

Please use a regular session ID instead (either sent in a cookie, or stored in the localStorage and sent in the [`auth`](../../client-options.md#auth) payload).

See also:

- [Part II of our private message guide](/get-started/private-messaging-part-2/)
- [How to deal with cookies](/how-to/deal-with-cookies)

:::

Note: you can't overwrite this identifier, as it is used in several parts of the Socket.IO codebase.

## Socket#handshake

This object contains some details about the handshake that happens at the beginning of the Socket.IO session.

```
{
  headers: /* the headers of the initial request */
  query: /* the query params of the initial request */
  auth: /* the authentication payload */
  time: /* the date of creation (as string) */
  issued: /* the date of creation (unix timestamp) */
  url: /* the request URL string */
  address: /* the ip of the client */
  xdomain: /* whether the connection is cross-domain */
  secure: /* whether the connection is secure */
}
```

Example:

```json
{
  "headers": {
    "user-agent": "xxxx",
    "accept": "*/*",
    "host": "example.com",
    "connection": "close"
  },
  "query": {
    "EIO": "4",
    "transport": "polling",
    "t": "NNjNltH"
  },
  "auth": {
    "token": "123"
  },
  "time": "Sun Nov 22 2020 01:33:46 GMT+0100 (Central European Standard Time)",
  "issued": 1606005226969,
  "url": "/socket.io/?EIO=4&transport=polling&t=NNjNltH",
  "address": "::ffff:1.2.3.4",
  "xdomain": false,
  "secure": true
}
```

## Socket#rooms

This is a reference to the [rooms](../04-Events/rooms.md) the Socket is currently in.

```js
io.on("connection", (socket) => {
  console.log(socket.rooms); // Set { <socket.id> }
  socket.join("room1");
  console.log(socket.rooms); // Set { <socket.id>, "room1" }
});
```

## Socket#data

An arbitrary object that can be used in conjunction with the `fetchSockets()` utility method:

```js
// server A
io.on("connection", (socket) => {
  socket.data.username = "alice";
});

// server B
const sockets = await io.fetchSockets();
console.log(sockets[0].data.username); // "alice"
```

More information [here](server-instance.md#utility-methods).

:::caution
Do not rely on reference equality when using properties of `data`.
:::

```js
// BAD
const activeUsers = new Set();
io.on("connection", (socket) => {
  socket.data.user = { name: "alice" };
  activeUsers.add(socket.data.user);

  socket.on("disconnect", () => {
    // Socket.IO makes no guarantee data.user will reference the same object...
    activeUsers.delete(socket.data.user);
  });
});
```

## Socket#conn

A reference to the underlying Engine.IO socket (see [here](../01-Documentation/how-it-works.md)).

```js
io.on("connection", (socket) => {
  console.log("initial transport", socket.conn.transport.name); // prints "polling"

  socket.conn.once("upgrade", () => {
    // called when the transport is upgraded (i.e. from HTTP long-polling to WebSocket)
    console.log("upgraded transport", socket.conn.transport.name); // prints "websocket"
  });

  socket.conn.on("packet", ({ type, data }) => {
    // called for each packet received
  });

  socket.conn.on("packetCreate", ({ type, data }) => {
    // called for each packet sent
  });

  socket.conn.on("drain", () => {
    // called when the write buffer is drained
  });

  socket.conn.on("close", (reason) => {
    // called when the underlying connection is closed
  });
});
```

## Additional attributes

As long as you do not overwrite any existing attribute, you can attach any attribute to the Socket instance and use it later:

```js
// in a middleware
io.use(async (socket, next) => {
  try {
    const user = await fetchUser(socket);
    socket.user = user;
  } catch (e) {
    next(new Error("unknown user"));
  }
});

io.on("connection", (socket) => {
  console.log(socket.user);

  // in a listener
  socket.on("set username", (username) => {
    socket.username = username;
  });
});

```

## Socket middlewares

Those middlewares look a lot like the usual [middlewares](middlewares.md), except that they are called for each incoming packet:

```js
socket.use(([event, ...args], next) => {
  // do something with the packet (logging, authorization, rate limiting...)
  // do not forget to call next() at the end
  next();
});
```

The `next` method can also be called with an error object. In that case, the event will not reach the registered event handlers and an `error` event will be emitted instead:

```js
io.on("connection", (socket) => {
  socket.use(([event, ...args], next) => {
    if (isUnauthorized(event)) {
      return next(new Error("unauthorized event"));
    }
    next();
  });

  socket.on("error", (err) => {
    if (err && err.message === "unauthorized event") {
      socket.disconnect();
    }
  });
});
```

Note: this feature only exists on the server-side. For the client-side, you might be interested in [catch-all listeners](../04-Events/listening-to-events.md#catch-all-listeners).

## Events

On the server-side, the Socket instance emits two special events:

- [`disconnect`](#disconnect)
- [`disconnecting`](#disconnecting)

### `disconnect`

This event is fired by the Socket instance upon disconnection.

```js
io.on("connection", (socket) => {
  socket.on("disconnect", (reason) => {
    // ...
  });
});
```

Here is the list of possible reasons:

| Reason                        | Description                                                                                                                                  |
|-------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| `server namespace disconnect` | The socket was forcefully disconnected with [socket.disconnect()](server-api.md#socketdisconnectclose).                                      |
| `client namespace disconnect` | The client has manually disconnected the socket using [socket.disconnect()](client-api.md#socketdisconnect).                                 |
| `server shutting down`        | The server is, well, shutting down.                                                                                                          |
| `ping timeout`                | The client did not send a PONG packet in the `pingTimeout` delay.                                                                            |
| `transport close`             | The connection was closed (example: the user has lost connection, or the network was changed from WiFi to 4G).                               |
| `transport error`             | The connection has encountered an error.                                                                                                     |
| `parse error`                 | The server has received an invalid packet from the client.                                                                                   |
| `forced close`                | The server has received an invalid packet from the client.                                                                                   |
| `forced server close`         | The client did not join a namespace in time (see the [`connectTimeout`](server-options.md#connecttimeout) option) and was forcefully closed. |

### `disconnecting`

This event is similar to `disconnect` but is fired a bit earlier, when the [Socket#rooms](server-socket-instance.md#socketrooms) set is not empty yet

```js
io.on("connection", (socket) => {
  socket.on("disconnecting", (reason) => {
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        socket.to(room).emit("user has left", socket.id);
      }
    }
  });
});
```

Note: those events, along with `connect`, `connect_error`, `newListener` and `removeListener`, are special events that shouldn't be used in your application:

```js
// BAD, will throw an error
socket.emit("disconnect");
```

## Complete API

The complete API exposed by the Socket instance can be found [here](../../server-api.md#socket).
