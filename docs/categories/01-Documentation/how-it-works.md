---
title: How it works
sidebar_position: 2
slug: /how-it-works/
---

The bidirectional channel between the Socket.IO server (Node.js or [another programming language](index.md#server-implementations)) and the Socket.IO client (browser, Node.js, or [another programming language](index.md#client-implementations)) is established with a [WebSocket connection](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) whenever possible, and will use HTTP long-polling as fallback.

The Socket.IO codebase is split into two distinct layers:

- the low-level plumbing: what we call Engine.IO, the engine inside Socket.IO
- the high-level API: Socket.IO itself

## Engine.IO

Engine.IO is responsible for establishing the low-level connection between the server and the client. It handles:

- the various [transports](#transports) and the [upgrade mechanism](#upgrade-mechanism)
- the [disconnection detection](#disconnection-detection)

A detailed version of the Engine.IO protocol can be found [here](../08-Miscellaneous/eio-protocol.md).

The source code of the reference implementation (written in TypeScript) can be found here:

- server: https://github.com/socketio/engine.io
- client: https://github.com/socketio/engine.io-client
- parser: https://github.com/socketio/engine.io-parser

### Transports

There are currently two implemented transports:

- [HTTP long-polling](#http-long-polling)
- [WebSocket](#websocket)

#### HTTP long-polling

The HTTP long-polling transport (also simply referred as "polling") consists of successive HTTP requests:

- long-running `GET` requests, for receiving data from the server
- short-running `POST` requests, for sending data to the server

Due to the nature of the transport, successive emits may be concatenated and sent within the same HTTP request.

#### WebSocket

The WebSocket transport consists, well, of a [WebSocket connection](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API), which provides a bidirectional and low-latency communication channel between the server and the client.

Due to the nature of the transport, each emit is sent in its own WebSocket frame (some emits may even result in two distinct WebSocket frames, more information [here](../06-Advanced/custom-parser.md#the-default-parser)).

### Handshake

At the beginning of the Engine.IO connection, the server sends some information:

```json
{
  "sid": "FSDjX-WRwSA4zTZMALqx",
  "upgrades": ["websocket"],
  "pingInterval": 25000,
  "pingTimeout": 20000
}
```

- the `sid` is the ID of the session, it must be included in the `sid` query parameter in all subsequent HTTP requests
- the `upgrades` array contains the list of all "better" transports that are supported by the server
- the `pingInterval` and `pingTimeout` values are used in the heartbeat mechanism

### Upgrade mechanism

By default, the client establishes the connection with the HTTP long-polling transport.

**But, why?**

While WebSocket is clearly the best way to establish a bidirectional communication, experience has shown that it is not always possible to establish a WebSocket connection, due to corporate proxies, personal firewall, antivirus software...

From the user perspective, an unsuccessful WebSocket connection can translate in up to 10 seconds of waiting for the realtime application to begin exchanging data. This **perceptively** hurts user experience.

To summarize, Engine.IO focuses on reliability and user experience first, marginal potential UX improvements and increased server performance second.

To upgrade, the client will:

- ensure its outgoing buffer is empty
- put the current transport in read-only mode
- try to establish a connection with the other transport
- if successful, close the first transport

You can check in the Network Monitor of your browser:

![Successful upgrade](/images/network-monitor.png)

1. handshake (contains the session ID — here, `zBjrh...AAAK` — that is used in subsequent requests)
2. send data (HTTP long-polling)
3. receive data (HTTP long-polling)
4. upgrade (WebSocket)
5. receive data (HTTP long-polling, closed once the WebSocket connection in 4. is successfully established)

### Disconnection detection

The Engine.IO connection is considered as closed when:

- one HTTP request (either GET or POST) fails (for example, when the server is shutdown)
- the WebSocket connection is closed (for example, when the user closes the tab in its browser)
- `socket.disconnect()` is called on the server-side or on the client-side

There is also a heartbeat mechanism which checks that the connection between the server and the client is still up and running:

At a given interval (the `pingInterval` value sent in the handshake) the server sends a PING packet and the client has a few seconds (the `pingTimeout` value) to send a PONG packet back. If the server does not receive a PONG packet back, it will consider that the connection is closed. Conversely, if the client does not receive a PING packet within `pingInterval + pingTimeout`, it will consider that the connection is closed.

The disconnection reasons are listed [here](../02-Server/server-socket-instance.md#disconnect) (server-side) and [here](../03-Client/client-socket-instance.md#disconnect) (client-side).


## Socket.IO

Socket.IO provides some additional features over the Engine.IO connection:

- automatic reconnection
- [packet buffering](../03-Client/client-offline-behavior.md#buffered-events)
- [acknowledgments](../04-Events/emitting-events.md#acknowledgements)
- broadcasting [to all clients](../04-Events/broadcasting-events.md) or [to a subset of clients](../04-Events/rooms.md) (what we call "Room")
- [multiplexing](../06-Advanced/namespaces.md) (what we call "Namespace")

A detailed version of the Socket.IO protocol can be found [here](../08-Miscellaneous/sio-protocol.md).

The source code of the reference implementation (written in TypeScript) can be found here:

- server: https://github.com/socketio/socket.io
- client: https://github.com/socketio/socket.io-client
- parser: https://github.com/socketio/socket.io-parser
