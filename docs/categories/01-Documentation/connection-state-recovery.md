---
title: Connection state recovery
sidebar_position: 4
slug: /connection-state-recovery
---

Connection state recovery is a feature which allows restoring a client's state after a temporary disconnection, including any missed packets.

:::info

This feature was added in version `4.6.0`, released in February 2023.

The release notes can be found [here](../../changelog/4.6.0.md).

:::

## Disclaimer

Under real conditions, a Socket.IO client will inevitably experience temporary disconnections, regardless of the quality of the connection.

This feature will help you cope with such disconnections, but unless you want to store the packets and the sessions forever (by setting `maxDisconnectionDuration` to `Infinity`), you can't be assured that the recovery will always be successful.

That's why you will still need to handle the case where the states of the client and the server must be synchronized.

:::tip

Connection State Recovery will NOT be successful unless the client has received *at least* one event from the server

:::
## Usage

Connection state recovery must be enabled by the server:

```js
const io = new Server(httpServer, {
  connectionStateRecovery: {
    // the backup duration of the sessions and the packets
    maxDisconnectionDuration: 2 * 60 * 1000,
    // whether to skip middlewares upon successful recovery
    skipMiddlewares: true,
  }
});
```

Upon an unexpected disconnection (i.e. no manual disconnection with `socket.disconnect()`), the server will store the `id`, the rooms and the `data` attribute of the socket.

Then upon reconnection, the server will try to restore the state of the client. The `recovered` attribute indicates whether this recovery was successful:

*Server*

```js
io.on("connection", (socket) => {
  if (socket.recovered) {
    // recovery was successful: socket.id, socket.rooms and socket.data were restored
  } else {
    // new or unrecoverable session
  }
});
```

*Client*

```js
socket.on("connect", () => {
  if (socket.recovered) {
    // any event missed during the disconnection period will be received now
  } else {
    // new or unrecoverable session
  }
});
```

You can check that the recovery is working by forcefully closing the underlying engine:

```js
import { io } from "socket.io-client";

const socket = io({
  reconnectionDelay: 10000, // defaults to 1000
  reconnectionDelayMax: 10000 // defaults to 5000
});

socket.on("connect", () => {
  console.log("recovered?", socket.recovered);

  setTimeout(() => {
    if (socket.io.engine) {
      // close the low-level connection and trigger a reconnection
      socket.io.engine.close();
    }
  }, 10000);
});
```

:::tip

You can also run this example directly in your browser on:

- [CodeSandbox](https://codesandbox.io/p/sandbox/github/socketio/socket.io/tree/main/examples/connection-state-recovery-example/esm?file=index.js)
- [StackBlitz](https://stackblitz.com/github/socketio/socket.io/tree/main/examples/connection-state-recovery-example/esm?file=index.js)

:::

## Compatibility with existing adapters

| Adapter                                                          |                                                         Support?                                                         |
|------------------------------------------------------------------|:------------------------------------------------------------------------------------------------------------------------:|
| Built-in adapter (in memory)                                     |                                                  YES :white_check_mark:                                                  |
| [Redis adapter](../05-Adapters/adapter-redis.md)                 |                                                      NO<sup>1</sup>                                                      |
| [Redis Streams adapter](../05-Adapters/adapter-redis-streams.md) |                                                  YES :white_check_mark:                                                  |
| [MongoDB adapter](../05-Adapters/adapter-mongo.md)               | YES :white_check_mark: (since version [`0.3.0`](https://github.com/socketio/socket.io-mongo-adapter/releases/tag/0.3.0)) |
| [Postgres adapter](../05-Adapters/adapter-postgres.md)           |                                                           WIP                                                            |
| [Cluster adapter](../05-Adapters/adapter-cluster.md)             |                                                           WIP                                                            |

[1] Persisting the packets is not compatible with the Redis PUB/SUB mechanism.

## How it works under the hood

- the server sends a session ID [during the handshake](../08-Miscellaneous/sio-protocol.md#connection-to-a-namespace-1) (which is different from the current id attribute, which is public and can be freely shared)

Example:

```
40{"sid":"GNpWD7LbGCBNCr8GAAAB","pid":"YHcX2sdAF1z452-HAAAW"}

where

4         => the Engine.IO message type
0         => the Socket.IO CONNECT type
GN...AB   => the public id of the session
YH...AW   => the private id of the session
```

- the server also includes an offset in [each packet](../08-Miscellaneous/sio-protocol.md#sending-and-receiving-data-1) (added at the end of the data array, for backward compatibility)

Example:

```
42["foo","MzUPkW0"]

where

4         => the Engine.IO message type
2         => the Socket.IO EVENT type
foo       => the event name (socket.emit("foo"))
MzUPkW0   => the offset
```

:::note

For the recovery to succeed, the server must send at least one event, in order to initialize the offset on the client side.

:::

- upon temporary disconnection, the server stores the client state for a given delay (implemented at the adapter level)

- upon reconnection, the client sends both the session ID and the last offset it has processed, and the server tries to restore the state

Example:

```
40{"pid":"YHcX2sdAF1z452-HAAAW","offset":"MzUPkW0"}

where

4         => the Engine.IO message type
0         => the Socket.IO CONNECT type
YH...AW   => the private id of the session
MzUPkW0   => the last processed offset
```
