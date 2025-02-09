---
title: Migrating from 3.x to 4.0
sidebar_position: 2
slug: /migrating-from-3-x-to-4-0/
toc_max_heading_level: 4
---

The 4.0.0 release adds quite a lot of new features, which are detailed [below](#new-features), but it also contains a few API breaking changes (hence the major bump).

Please note that these breaking changes only impact the API on the server side. The Socket.IO protocol itself was not updated, so a v3 client **will** be able to reach a v4 server and vice-versa. Besides, the compatibility mode ([`allowEIO3: true`](../../server-options.md#alloweio3)) is still available between a Socket.IO v2 client and a Socket.IO v4 server.

Here is the complete list of changes:

- [Breaking changes](#breaking-changes)
  - [`io.to()` is now immutable](#ioto-is-now-immutable)
  - [`wsEngine` option](#wsengine-option)
- [Configuration](#configuration)
  - [Ensure compatibility with Swift v15 clients](#ensure-compatibility-with-swift-v15-clients)
  - [The default value of `pingTimeout` was increased](#the-default-value-of-pingtimeout-was-increased)
- [New features](#new-features)
  - [Allow excluding specific rooms when broadcasting](#allow-excluding-specific-rooms-when-broadcasting)
  - [Allow to pass an array to `io.to()`](#allow-to-pass-an-array-to-ioto)
  - [Additional utility methods](#additional-utility-methods)
  - [Typed events](#typed-events)
  - [`autoUnref` option](#autounref-option)
- [Known migration issues](#known-migration-issues)

## Codemods
### Socket.io v4 Codemods
To assist with the upgrade from Socket.io 3.x to 4.0, Codemod provides open-source codemods that automatically transform your code to many of the new APIs and patterns.

Run the following codemod to automatically update your code for Socket.io v4 migration:

```
npx codemod@latest socket.io/4/migration-recipe

```
This will run the following codemods from the Socket.io Codemod repository:
- **socket.io/4/ws-engine-format-update**
- **socket.io/4/removing-useless-broadcast-flag**

Each of these codemods automates the changes listed in the v4 migration guide.
For a complete list of available Fastify codemods and further details, 
see the [codemod registry](https://codemod.com/registry?q=socket.io).

If you have any feedback for codemods run this command:

```
npx codemod feedback
```

### Breaking changes

#### `io.to()` is now immutable

Previously, broadcasting to a given room (by calling `io.to()`) would mutate the io instance, which could lead to surprising behaviors, like:

```js
io.to("room1");
io.to("room2").emit(/* ... */); // also sent to room1

// or with async/await
io.to("room3").emit("details", await fetchDetails()); // random behavior: maybe in room3, maybe to all clients
```

Calling `io.to()` (or any other broadcast modifier) will now return an immutable instance.

Examples:

```js
const operator1 = io.to("room1");
const operator2 = operator1.to("room2");
const operator3 = socket.broadcast;
const operator4 = socket.to("room3").to("room4");

operator1.emit(/* ... */); // only to clients in "room1"
operator2.emit(/* ... */); // to clients in "room1" or in "room2"
operator3.emit(/* ... */); // to all clients but the sender
operator4.emit(/* ... */); // to clients in "room3" or in "room4" but the sender
```

#### `wsEngine` option

The format of the [`wsEngine`](../../server-options.md#wsengine) option was updated in order to get rid of the following error:

`Critical dependency: the request of a dependency is an expression`

when bundling the server with webpack.

Before:

```js
const io = require("socket.io")(httpServer, {
  wsEngine: "eiows"
});
```

After:

```js
const io = require("socket.io")(httpServer, {
  wsEngine: require("eiows").Server
});
```

> **Note**: Codemod updates the format of ws-engine:
>
> ```bash
> npx codemod@latest socket.io/4/ws-engine-format-update
> ```

### Configuration

#### Ensure compatibility with Swift v15 clients

Before version 16.0.0, the Swift client would not include the `EIO` query parameter in the HTTP requests, and the Socket.IO v3 server would infer `EIO=4` by default.

That's why a Swift client v15 was not able to connect to the server, even when the compatibility mode was enabled ([`allowEIO3: true`](../../server-options.md#alloweio3)), unless you explicitly specified the query param:

```swift
let manager = SocketManager(socketURL: URL(string: "http://localhost:8080")!, config: [
  .log(true),
  .connectParams(["EIO": "3"])
])
let socket = manager.defaultSocket
```

The Socket.IO v4 server will now infer `EIO=3` if the `EIO` query param is not included.

#### The default value of `pingTimeout` was increased

The default value of [`pingTimeout`](../../server-options.md#pingtimeout) (used in the [heartbeat mechanism](../01-Documentation/how-it-works.md#disconnection-detection)) value was updated from 60000 to 5000 in `socket.io@2.1.0` (March 2018).

The reasoning back then:

Some users experienced long delays between disconnection on the server-side and on the client-side. The "disconnect" event would take a long time to fire in the browser, probably due to a timer being delayed. Hence the change.

That being said, the current value (5s) caused unexpected disconnections when a big payload was sent over a slow network, because it prevents the ping-pong packets from being exchanged between the client and the server. This can also happen when a synchronous task blocks the server for more than 5 seconds.

The new value (20s) thus seems like a good balance between quick disconnection detection and tolerance to various delays.

### New features

#### Allow excluding specific rooms when broadcasting

Thanks to the awesome work of [Sebastiaan Marynissen](https://github.com/sebamarynissen), you can now exclude a specific room when broadcasting:

```js
io.except("room1").emit(/* ... */); // to all clients except the ones in "room1"
io.to("room2").except("room3").emit(/* ... */); // to all clients in "room2" except the ones in "room3"

socket.broadcast.except("room1").emit(/* ... */); // to all clients except the ones in "room1" and the sender
socket.except("room1").emit(/* ... */); // same as above
socket.to("room4").except("room5").emit(/* ... */); // to all clients in "room4" except the ones in "room5" and the sender
```

#### Allow to pass an array to `io.to()`

The `to()` method now accepts an array of rooms.

Before:

```js
const rooms = ["room1", "room2", "room3"];
for (const room of rooms) {
  io.to(room);
}
// broadcast to clients in "room1", "room2" or "room3"
// WARNING !!! this does not work anymore in v4, see the breaking change above
io.emit(/* ... */);
```

After:

```js
io.to(["room1", "room2", "room3"]).emit(/* ... */);

socket.to(["room1", "room2", "room3"]).emit(/* ... */);
```

#### Additional utility methods

Some (long-awaited) methods were added:

- `socketsJoin`: makes the matching socket instances join the specified rooms

```js
// make all Socket instances join the "room1" room
io.socketsJoin("room1");

// make all Socket instances of the "admin" namespace in the "room1" room join the "room2" room
io.of("/admin").in("room1").socketsJoin("room2");
```

- `socketsLeave`: makes the matching socket instances leave the specified rooms

```js
// make all Socket instances leave the "room1" room
io.socketsLeave("room1");

// make all Socket instances of the "admin" namespace in the "room1" room leave the "room2" room
io.of("/admin").in("room1").socketsLeave("room2");
```

- `disconnectSockets`: makes the matching socket instances disconnect

```js
// make all Socket instances disconnect
io.disconnectSockets();

// make all Socket instances of the "admin" namespace in the "room1" room disconnect
io.of("/admin").in("room1").disconnectSockets();

// this also works with a single socket ID
io.of("/admin").in(theSocketId).disconnectSockets();
```

- `fetchSockets`: returns the matching socket instances

```js
// return all Socket instances of the main namespace
const sockets = await io.fetchSockets();

// return all Socket instances of the "admin" namespace in the "room1" room
const sockets = await io.of("/admin").in("room1").fetchSockets();

// this also works with a single socket ID
const sockets = await io.in(theSocketId).fetchSockets();
```

The `sockets` variable in the example above is an array of objects exposing a subset of the usual Socket class:

```js
for (const socket of sockets) {
  console.log(socket.id);
  console.log(socket.handshake);
  console.log(socket.rooms);
  socket.emit(/* ... */);
  socket.join(/* ... */);
  socket.leave(/* ... */);
  socket.disconnect(/* ... */);
}
```

Those methods share the same semantics as broadcasting, and the same filters apply:

```js
io.of("/admin").in("room1").except("room2").local.disconnectSockets();
```

Which makes all Socket instances of the "admin" namespace

- in the "room1" room (`in("room1")` or `to("room1")`)
- except the ones in "room2" (`except("room2")`)
- and only on the current Socket.IO server (`local`)

disconnect.

#### Typed events

Thanks to the awesome work of [Maxime Kjaer](https://github.com/MaximeKjaer), TypeScript users can now type the events sent between the client and the server.

First, you declare the signature of each event:

```ts
interface ClientToServerEvents {
  noArg: () => void;
  basicEmit: (a: number, b: string, c: number[]) => void;
}

interface ServerToClientEvents {
  withAck: (d: string, cb: (e: number) => void) => void;
}
```

And you can now use them on the client side:

```ts
import { io, Socket } from "socket.io-client";

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io();

socket.emit("noArg");

socket.emit("basicEmit", 1, "2", [3]);

socket.on("withAck", (d, cb) => {
    cb(4);
});
```

Your IDE should now properly infer the type of each argument:

Similarly on the server side (the `ServerToClientEvents` and `ClientToServerEvents` are reversed):

```ts
import { Server } from "socket.io";

const io = new Server<ClientToServerEvents, ServerToClientEvents>(3000);

io.on("connection", (socket) => {
    socket.on("noArg", () => {
      // ...
    });

    socket.on("basicEmit", (a, b, c) => {
      // ...
    });

    socket.emit("withAck", "42", (e) => {
        console.log(e);
    });
});
```

By default, the events are untyped and the arguments will be inferred as `any`.

#### `autoUnref` option

And finally, thanks to the awesome work of [KC Erb](https://github.com/KCErb), the `autoUnref` option was added.

With `autoUnref` set to true (default: false), the Socket.IO client will allow the program to exit if there is no other active timer/TCP socket in the event system (even if the client is connected):

```js
const socket = io({
  autoUnref: true
});
```

Note: this option only applies to Node.js clients.

### Known migration issues

- `cannot get emit of undefined`

The following expression:

```js
socket.to("room1").broadcast.emit(/* ... */);
```

was working in Socket.IO v3 but is now considered invalid, as the `broadcast` flag is useless because the `to("room1")` method already puts the Socket instance in broadcasting mode.

```js
// VALID
socket.broadcast.emit(/* ... */); // to all clients but the sender
socket.to("room1").emit(/* ... */); // to clients in "room1" but the sender

// VALID (but useless 'broadcast' flag)
socket.broadcast.to("room1").emit(/* ... */);

// INVALID
socket.to("room1").broadcast.emit(/* ... */);
```

> **Note**: Codemod removes `broadcast flag` with:
>
> ```bash
> npx codemod@latest socket.io/4/removing-useless-broadcast-flag
> ```