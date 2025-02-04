---
title: "教程 - API 概览"
sidebar_label: "API 概览"
slug: api-overview
toc_max_heading_level: 4
---

import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# API 概览

在深入了解之前，让我们快速浏览一下 Socket.IO 提供的 API：

## 通用 API

以下方法可用于客户端和服务器。

### 基本的 emit

如我们在[步骤 #4](05-emitting-events.md)中所见，可以使用 `socket.emit()` 向另一端发送任何数据：

<Tabs>
  <TabItem value="从客户端到服务器" label="从客户端到服务器">

*客户端*

```js
socket.emit('hello', 'world');
```

*服务器*

```js
io.on('connection', (socket) => {
  socket.on('hello', (arg) => {
    console.log(arg); // 'world'
  });
});
```

  </TabItem>
  <TabItem value="从服务器到客户端" label="从服务器到客户端">

*服务器*

```js
io.on('connection', (socket) => {
  socket.emit('hello', 'world');
});
```

*客户端*

```js
socket.on('hello', (arg) => {
  console.log(arg); // 'world'
});
```

  </TabItem>
</Tabs>

你可以发送任意数量的参数，并且支持所有可序列化的数据结构，包括二进制对象，如 [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer)、[TypedArray](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray) 或 [Buffer](https://nodejs.org/docs/latest/api/buffer.html#buffer_buffer)（仅限 Node.js）：

<Tabs>
  <TabItem value="从客户端到服务器" label="从客户端到服务器">

*客户端*

```js
socket.emit('hello', 1, '2', { 3: '4', 5: Uint8Array.from([6]) });
```

*服务器*

```js
io.on('connection', (socket) => {
  socket.on('hello', (arg1, arg2, arg3) => {
    console.log(arg1); // 1
    console.log(arg2); // '2'
    console.log(arg3); // { 3: '4', 5: <Buffer 06> }
  });
});
```

  </TabItem>
  <TabItem value="从服务器到客户端" label="从服务器到客户端">

*服务器*

```js
io.on('connection', (socket) => {
  socket.emit('hello', 1, '2', { 3: '4', 5: Buffer.from([6]) });
});
```

*客户端*

```js
socket.on('hello', (arg1, arg2, arg3) => {
  console.log(arg1); // 1
  console.log(arg2); // '2'
  console.log(arg3); // { 3: '4', 5: ArrayBuffer (1) [ 6 ] }
});
```

  </TabItem>
</Tabs>

:::tip

不需要对对象调用 `JSON.stringify()`：

```js
// 错误示例
socket.emit('hello', JSON.stringify({ name: 'John' }));

// 正确示例
socket.emit('hello', { name: 'John' });
```

:::

### 确认机制

事件非常有用，但在某些情况下，你可能需要更经典的请求-响应 API。在 Socket.IO 中，这个功能被称为“确认机制”。

它有两种形式：

#### 使用回调函数

你可以在 `emit()` 的最后一个参数中添加一个回调函数，当另一端确认事件后，该回调将被调用：

<Tabs>
  <TabItem value="从客户端到服务器" label="从客户端到服务器">

*客户端*

```js
socket.timeout(5000).emit('request', { foo: 'bar' }, 'baz', (err, response) => {
  if (err) {
    // 服务器未在给定时间内确认事件
  } else {
    console.log(response.status); // 'ok'
  }
});
```

*服务器*

```js
io.on('connection', (socket) => {
  socket.on('request', (arg1, arg2, callback) => {
    console.log(arg1); // { foo: 'bar' }
    console.log(arg2); // 'baz'
    callback({
      status: 'ok'
    });
  });
});
```

  </TabItem>
  <TabItem value="从服务器到客户端" label="从服务器到客户端">

*服务器*

```js
io.on('connection', (socket) => {
  socket.timeout(5000).emit('request', { foo: 'bar' }, 'baz', (err, response) => {
    if (err) {
      // 客户端未在给定时间内确认事件
    } else {
      console.log(response.status); // 'ok'
    }
  });
});
```

*客户端*

```js
socket.on('request', (arg1, arg2, callback) => {
  console.log(arg1); // { foo: 'bar' }
  console.log(arg2); // 'baz'
  callback({
    status: 'ok'
  });
});
```

  </TabItem>
</Tabs>

#### 使用 Promise

`emitWithAck()` 方法提供相同的功能，但返回一个 Promise，一旦另一端确认事件，该 Promise 将被解析：

<Tabs>
  <TabItem value="从客户端到服务器" label="从客户端到服务器">

*客户端*

```js
try {
  const response = await socket.timeout(5000).emitWithAck('request', { foo: 'bar' }, 'baz');
  console.log(response.status); // 'ok'
} catch (e) {
  // 服务器未在给定时间内确认事件
}
```

*服务器*

```js
io.on('connection', (socket) => {
  socket.on('request', (arg1, arg2, callback) => {
    console.log(arg1); // { foo: 'bar' }
    console.log(arg2); // 'baz'
    callback({
      status: 'ok'
    });
  });
});
```

  </TabItem>
  <TabItem value="从服务器到客户端" label="从服务器到客户端">

*服务器*

```js
io.on('connection', async (socket) => {
  try {
    const response = await socket.timeout(5000).emitWithAck('request', { foo: 'bar' }, 'baz');
    console.log(response.status); // 'ok'
  } catch (e) {
    // 客户端未在给定时间内确认事件
  }
});
```

*客户端*

```js
socket.on('request', (arg1, arg2, callback) => {
  console.log(arg1); // { foo: 'bar' }
  console.log(arg2); // 'baz'
  callback({
    status: 'ok'
  });
});
```

  </TabItem>
</Tabs>

:::caution

不支持 [Promises](https://caniuse.com/promises) 的环境（如 Internet Explorer）需要添加 polyfill 或使用类似 [babel](https://babeljs.io/) 的编译器才能使用此功能（但这超出了本教程的范围）。

:::

### 全局监听器

全局监听器是一个会在任何传入事件时被调用的监听器。这对于调试应用程序非常有用：

*发送者*

```js
socket.emit('hello', 1, '2', { 3: '4', 5: Uint8Array.from([6]) });
```

*接收者*

```js
socket.onAny((eventName, ...args) => {
  console.log(eventName); // 'hello'
  console.log(args); // [ 1, '2', { 3: '4', 5: ArrayBuffer (1) [ 6 ] } ]
});
```

类似地，对于传出数据包：

```js
socket.onAnyOutgoing((eventName, ...args) => {
  console.log(eventName); // 'hello'
  console.log(args); // [ 1, '2', { 3: '4', 5: ArrayBuffer (1) [ 6 ] } ]
});
```

## 服务器 API

### 广播

如我们在[步骤 #5](06-broadcasting.md)中所见，可以使用 `io.emit()` 向所有连接的客户端广播事件：

```js
io.emit('hello', 'world');
```

<ThemedImage
  alt="'hello' 事件被发送到所有连接的客户端"
  sources={{
    light: useBaseUrl('/images/tutorial/broadcasting.png'),
    dark: useBaseUrl('/images/tutorial/broadcasting-dark.png'),
  }}
/>

### 房间

在 Socket.IO 术语中，*房间* 是一个可以让 socket 加入和离开的任意通道。它可以用于向一部分连接的客户端广播事件：

```js
io.on('connection', (socket) => {
  // 加入名为 'some room' 的房间
  socket.join('some room');
  
  // 向房间内所有连接的客户端广播
  io.to('some room').emit('hello', 'world');

  // 向除房间内的客户端外的所有连接客户端广播
  io.except('some room').emit('hello', 'world');

  // 离开房间
  socket.leave('some room');
});
```

<ThemedImage
  alt="'hello' 事件被发送到目标房间内的所有连接客户端"
  sources={{
    light: useBaseUrl('/images/tutorial/room.png'),
    dark: useBaseUrl('/images/tutorial/room-dark.png'),
  }}
/>

基本就是这样！如需参考，完整的 API 可以在[这里](../server-api.md)（服务器）和[这里](../client-api.md)（客户端）找到。