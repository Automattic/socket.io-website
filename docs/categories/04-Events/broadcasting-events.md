


---
title: Broadcasting events
sidebar_position: 3
slug: /broadcasting-events/
---

import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';

Socket.IO makes it easy to send events to all the connected clients.

:::info

Please note that broadcasting is a **server-only** feature.

:::

## To all connected clients

<ThemedImage
  alt="Broadcasting to all connected clients"
  sources={{
    light: useBaseUrl('/images/broadcasting.png'),
    dark: useBaseUrl('/images/broadcasting-dark.png'),
  }}
/>

```js
io.emit("hello", "world");
```

:::caution

Clients that are currently disconnected (or in the process of reconnecting) won't receive the event. Storing this event somewhere (in a database, for example) is up to you, depending on your use case.

:::

## To all connected clients except the sender

<ThemedImage
  alt="Broadcasting to all connected clients excepting the sender"
  sources={{
    light: useBaseUrl('/images/broadcasting2.png'),
    dark: useBaseUrl('/images/broadcasting2-dark.png'),
  }}
/>

```js
io.on("connection", (socket) => {
  socket.broadcast.emit("hello", "world");
});
```

:::note

In the example above, using `socket.emit("hello", "world")` (without `broadcast` flag) would send the event to "client A". You can find the list of all the ways to send an event in the [cheatsheet](emit-cheatsheet.md).

:::

## With acknowledgements

Starting with Socket.IO 4.5.0, you can now broadcast an event to multiple clients and expect an acknowledgement from each one of them:

```js
io.timeout(5000).emit("hello", "world", (err, responses) => {
  if (err) {
    // some clients did not acknowledge the event in the given delay
  } else {
    console.log(responses); // one response per client
  }
});
```

All broadcasting forms are supported:

- in a room

```js
io.to("room123").timeout(5000).emit("hello", "world", (err, responses) => {
  // ...
});
```

- from a specific `socket`

```js
socket.broadcast.timeout(5000).emit("hello", "world", (err, responses) => {
  // ...
});
```

- in a namespace

```js
io.of("/the-namespace").timeout(5000).emit("hello", "world", (err, responses) => {
  // ...
});
```

## With multiple Socket.IO servers

Broadcasting also works with multiple Socket.IO servers.

You just need to replace the default adapter by the [Redis Adapter](../05-Adapters/adapter-redis.md) or another [compatible adapter](../05-Adapters/adapter.md).

<ThemedImage
  alt="Broadcasting with Redis"
  sources={{
    light: useBaseUrl('/images/broadcasting-redis.png'),
    dark: useBaseUrl('/images/broadcasting-redis-dark.png'),
  }}
/>

In certain cases, you may want to only broadcast to clients that are connected to the current server. You can achieve this with the `local` flag:

```js
io.local.emit("hello", "world");
```

<ThemedImage
  alt="Broadcasting with Redis but local"
  sources={{
    light: useBaseUrl('/images/broadcasting-redis-local.png'),
    dark: useBaseUrl('/images/broadcasting-redis-local-dark.png'),
  }}
/>

In order to target specific clients when broadcasting, please see the documentation about [Rooms](rooms.md).
