---
title: 介绍
sidebar_position: 1
slug: /
---

import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';

:::tip

如果您是 Socket.IO 的新手，我们建议您查看我们的[教程](../../tutorial/01-introduction.md)。

:::

## 什么是 Socket.IO {#what-socketio-is}

Socket.IO 是一个库，可以在客户端和服务器之间实现 **低延迟**、**双向** 和 **基于事件的** 通信。

<ThemedImage
  alt="服务器和客户端之间通信的示意图"
  sources={{
    light: useBaseUrl('/images/bidirectional-communication2.png'),
    dark: useBaseUrl('/images/bidirectional-communication2-dark.png'),
  }}
/>

Socket.IO 连接可以通过不同的低级传输方式建立：

- HTTP 长轮询
- [WebSocket](https://developer.mozilla.org/zh-CN/docs/Web/API/WebSockets_API)
- [WebTransport](https://developer.mozilla.org/zh-CN/docs/Web/API/WebTransport_API)

Socket.IO 会根据以下情况自动选择最佳可用选项：

- 浏览器的能力（参见[这里](https://caniuse.com/websockets)和[这里](https://caniuse.com/webtransport)）
- 网络（某些网络会阻止 WebSocket 和/或 WebTransport 连接）

您可以在["工作原理"部分](./how-it-works.md)找到更多详细信息。

### 服务器实现 {#server-implementations}

| 语言                 | 网站                                                                                                                           |
|----------------------|--------------------------------------------------------------------------------------------------------------------------------|
| JavaScript (Node.js) | - [安装步骤](../02-Server/server-installation.md)<br/>- [API](../../server-api.md)<br/>- [源代码](https://github.com/socketio/socket.io) |
| JavaScript (Deno)    | https://github.com/socketio/socket.io-deno                                                                                      |
| Java                 | https://github.com/mrniko/netty-socketio                                                                                        |
| Java                 | https://github.com/trinopoty/socket.io-server-java                                                                              |
| Python               | https://github.com/miguelgrinberg/python-socketio                                                                               |
| Golang               | https://github.com/googollee/go-socket.io                                                                                       |
| Rust                 | https://github.com/Totodore/socketioxide                                                                                        |

### 客户端实现 {#client-implementations}

| 语言                                        | 网站                                                                                                                                  |
|---------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| JavaScript (浏览器、Node.js 或 React Native) | - [安装步骤](../03-Client/client-installation.md)<br/>- [API](../../client-api.md)<br/>- [源代码](https://github.com/socketio/socket.io-client) |
| JavaScript (用于微信小程序)                 | https://github.com/weapp-socketio/weapp.socket.io                                                                                     |
| Java                                        | https://github.com/socketio/socket.io-client-java                                                                                     |
| C++                                         | https://github.com/socketio/socket.io-client-cpp                                                                                      |
| Swift                                       | https://github.com/socketio/socket.io-client-swift                                                                                    |
| Dart                                        | https://github.com/rikulo/socket.io-client-dart                                                                                       |
| Python                                      | https://github.com/miguelgrinberg/python-socketio                                                                                     |
| .Net                                        | https://github.com/doghappy/socket.io-client-csharp                                                                                   |
| Rust                                        | https://github.com/1c3t3a/rust-socketio                                                                                               |
| Kotlin                                      | https://github.com/icerockdev/moko-socket-io                                                                                          |
| PHP                                         | https://github.com/ElephantIO/elephant.io                                                                                             |

## Socket.IO 不是什么 {#what-socketio-is-not}

:::caution

Socket.IO **不是** WebSocket 实现。

:::

尽管 Socket.IO 确实在可能的情况下使用 WebSocket 进行传输，但它为每个数据包添加了额外的元数据。这就是为什么 WebSocket 客户端将无法成功连接到 Socket.IO 服务器，而 Socket.IO 客户端也将无法连接到普通 WebSocket 服务器。

```js
// 警告：客户端将无法连接！
const socket = io("ws://echo.websocket.org");
```

如果您正在寻找一个普通的 WebSocket 服务器，请查看 [ws](https://github.com/websockets/ws) 或 [µWebSockets.js](https://github.com/uNetworking/uWebSockets.js)。

还有[关于](https://github.com/nodejs/node/issues/19308)在 Node.js 核心中包含 WebSocket 服务器的讨论。

在客户端，您可能对[robust-websocket](https://github.com/nathanboktae/robust-websocket)感兴趣。

:::caution

Socket.IO 并不打算在移动应用程序的后台服务中使用。

:::

Socket.IO 库保持与服务器的开放 TCP 连接，这可能会导致用户消耗大量电池。请为此用例使用[FCM](https://firebase.google.com/docs/cloud-messaging)等专用消息传递平台。

## 特点 {#features}

以下是 Socket.IO 在普通 WebSockets 上提供的功能：

### HTTP 长轮询回退 {#http-long-polling-fallback}

如果无法建立 WebSocket 连接，连接将回退到 HTTP 长轮询。

这个特性是人们在十多年前创建项目时使用 Socket.IO 的原因（！），因为浏览器对 WebSockets 的支持仍处于起步阶段。

即使现在大多数浏览器都支持 WebSockets（超过[97%](https://caniuse.com/mdn-api_websocket)），它仍然是一个很棒的功能，因为我们仍然会收到来自用户的报告，这些用户无法建立 WebSocket 连接，因为他们使用了一些错误配置的代理。

### 自动重新连接 {#automatic-reconnection}

在某些特定情况下，服务器和客户端之间的 WebSocket 连接可能会中断，而双方都不知道链接的断开状态。

这就是为什么 Socket.IO 包含一个心跳机制，它会定期检查连接的状态。

当客户端最终断开连接时，它会以指数回退延迟自动重新连接，以免使服务器不堪重负。

### 数据包缓冲 {#packet-buffering}

当客户端断开连接时，数据包会自动缓冲，并在重新连接时发送。

更多信息[在这里](../03-Client/client-offline-behavior.md#buffered-events)。

### 收到后的回调 {#acknowledgements}

Socket.IO 提供了一种方便的方式来发送事件和接收响应：

*发件人*

```js
socket.emit("hello", "world", (response) => {
  console.log(response); // "got it"
});
```

*接收者*

```js
socket.on("hello", (arg, callback) => {
  console.log(arg); // "world"
  callback("got it!");
});
```

您还可以添加超时：

```js
socket.timeout(5000).emit("hello", "world", (err, response) => {
  if (err) {
    // 另一方未在给定延迟内确认事件
  } else {
    console.log(response); // "got it"
  }
});
```

### 广播 {#broadcasting}

[在服务器端，您可以向所有连接的客户端](../04-Events/broadcasting-events.md)或[客户端的子集](../04-Events/rooms.md)发送事件：

```js
// 到所有连接的客户端
io.emit("hello");

// 致“news”房间中的所有连接客户端
io.to("news").emit("hello");
```

这在[扩展到多个节点](../02-Server/using-multiple-nodes.md)时也有效。

### 多路复用 {#multiplexing}

命名空间允许您在单个共享连接上拆分应用程序的逻辑。例如，如果您想创建一个只有授权用户才能加入的“管理员”频道，这可能很有用。

```js
io.on("connection", (socket) => {
  // 普通用户
});

io.of("/admin").on("connection", (socket) => {
  // 管理员用户
});
```

详情点击[这里](../06-Advanced/namespaces.md)。

## 常见问题 {#common-questions}

### 现在还需要 Socket.IO 吗？ {#is-socketio-still-needed-today}

[这是一个很好的问题，因为现在几乎所有地方](https://caniuse.com/mdn-api_websocket)都支持 WebSocket。

话虽如此，我们相信，如果您在应用程序中使用普通的 WebSocket，您最终将需要实现 Socket.IO 中已经包含（并经过实战测试）的大部分功能，例如[重新连接](#automatic-reconnection)、[确认](#acknowledgements)或[广播](#broadcasting)。

### Socket.IO 协议的数据表大小？ {#what-is-the-overhead-of-the-socketio-protocol}

`socket.emit("hello", "world")` 将作为单个 WebSocket 帧发送，其中包含`42["hello","world"]`：

- `4` 是 Engine.IO “消息”数据包类型
- `2` 是 Socket.IO “消息”数据包类型
- `["hello","world"]`是参数数组被`JSON.stringify()`过的版本

因此，每条消息都会增加几个字节，可以通过使用[自定义解析器](../06-Advanced/custom-parser.md)进一步减少。

:::info

浏览器包本身的大小是[`10.4 kB`](https://bundlephobia.com/package/socket.io-client)（缩小和压缩）。

:::

您可以在[这里](../08-Miscellaneous/sio-protocol.md)找到 Socket.IO 协议的详细信息。

### 有些东西不能正常工作，想要获取帮助？ {#something-does-not-work-properly-please-help}

请查看[故障排除指南](../01-Documentation/troubleshooting.md)。

## 下一步 {#next-steps}

- [入门示例](/get-started/chat)
- [服务器安装](../02-Server/server-installation.md)
- [客户端安装](../03-Client/client-installation.md)
