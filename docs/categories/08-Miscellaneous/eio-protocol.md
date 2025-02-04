---
title: Engine.IO 协议
sidebar_position: 3
slug: /engine-io-protocol/
---

本文档描述了 Engine.IO 协议的第 4 版。

本文档的源代码可以在[这里](https://github.com/socketio/engine.io-protocol)找到。

**目录**

- [介绍](#introduction)
- [传输](#transports)
  - [HTTP 长轮询](#http-long-polling)
    - [请求路径](#request-path)
    - [查询参数](#query-parameters)
    - [头信息](#headers)
    - [发送和接收数据](#sending-and-receiving-data)
      - [发送数据](#sending-data)
      - [接收数据](#receiving-data)
  - [WebSocket](#websocket)
- [协议](#protocol)
  - [握手](#handshake)
  - [心跳](#heartbeat)
  - [升级](#upgrade)
  - [消息](#message)
- [数据包编码](#packet-encoding)
  - [HTTP 长轮询](#http-long-polling-1)
  - [WebSocket](#websocket-1)
- [历史](#history)
  - [从 v2 到 v3](#from-v2-to-v3)
  - [从 v3 到 v4](#from-v3-to-v4)
- [测试套件](#test-suite)

## 介绍

Engine.IO 协议实现了客户端和服务器之间的[全双工](https://en.wikipedia.org/wiki/Duplex_(telecommunications)#FULL-DUPLEX)和低开销通信。

它基于[WebSocket 协议](https://en.wikipedia.org/wiki/WebSocket)，并在无法建立 WebSocket 连接时使用[HTTP 长轮询](https://en.wikipedia.org/wiki/Push_technology#Long_polling)作为后备。

参考实现是用[TypeScript](https://www.typescriptlang.org/)编写的：

- 服务器: https://github.com/socketio/engine.io
- 客户端: https://github.com/socketio/engine.io-client

[Socket.IO 协议](https://github.com/socketio/socket.io-protocol)建立在这些基础之上，在 Engine.IO 协议提供的通信通道上增加了额外的功能。

## 传输

Engine.IO 客户端和 Engine.IO 服务器之间的连接可以通过以下方式建立：

- [HTTP 长轮询](#http-long-polling)
- [WebSocket](#websocket)

### HTTP 长轮询

HTTP 长轮询传输（也简称为“轮询”）由连续的 HTTP 请求组成：

- 长时间运行的 `GET` 请求，用于从服务器接收数据
- 短时间运行的 `POST` 请求，用于向服务器发送数据

#### 请求路径

HTTP 请求的路径默认是 `/engine.io/`。

它可能会被基于该协议构建的库更新（例如，Socket.IO 协议使用 `/socket.io/`）。

#### 查询参数

使用以下查询参数：

| 名称        | 值       | 描述                                                        |
|-------------|-----------|--------------------------------------------------------------------|
| `EIO`       | `4`       | 必须，协议的版本。                            |
| `transport` | `polling` | 必须，传输的名称。                              |
| `sid`       | `<sid>`   | 一旦会话建立，必须，表示会话标识符。 |

如果缺少必需的查询参数，服务器必须响应 HTTP 400 错误状态。

#### 头信息

发送二进制数据时，发送方（客户端或服务器）必须包含 `Content-Type: application/octet-stream` 头。

如果没有明确的 `Content-Type` 头，接收方应推断数据是纯文本。

参考: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type

#### 发送和接收数据

##### 发送数据

要发送一些数据包，客户端必须创建一个 HTTP `POST` 请求，并在请求体中编码数据包：

```
客户端                                                 服务器

  │                                                      │
  │   POST /engine.io/?EIO=4&transport=polling&sid=...   │
  │ ───────────────────────────────────────────────────► │
  │ ◄──────────────────────────────────────────────────┘ │
  │                        HTTP 200                      │
  │                                                      │
```

如果会话 ID（来自 `sid` 查询参数）未知，服务器必须返回 HTTP 400 响应。

为了表示成功，服务器必须返回 HTTP 200 响应，并在响应体中包含字符串 `ok`。

为了确保数据包的顺序，客户端不得有多个活动的 `POST` 请求。如果发生这种情况，服务器必须返回 HTTP 400 错误状态并关闭会话。

##### 接收数据

要接收一些数据包，客户端必须创建一个 HTTP `GET` 请求：

```
客户端                                                服务器

  │   GET /engine.io/?EIO=4&transport=polling&sid=...   │
  │ ──────────────────────────────────────────────────► │
  │                                                   . │
  │                                                   . │
  │                                                   . │
  │                                                   . │
  │ ◄─────────────────────────────────────────────────┘ │
  │                       HTTP 200                      │
```

如果会话 ID（来自 `sid` 查询参数）未知，服务器必须返回 HTTP 400 响应。

如果没有缓冲的包要发送，服务器可能不会立即响应。一旦有一些包要发送，服务器应对其进行编码（参见[数据包编码](#packet-encoding)）并在 HTTP 请求的响应体中发送它们。

为了确保数据包的顺序，客户端不得有多个活动的 `GET` 请求。如果发生这种情况，服务器必须返回 HTTP 400 错误状态并关闭会话。

### WebSocket

WebSocket 传输由一个[WebSocket 连接](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)组成，它在服务器和客户端之间提供了一个双向和低延迟的通信通道。

使用以下查询参数：

| 名称        | 值         | 描述                                                                   |
|-------------|-------------|-------------------------------------------------------------------------------|
| `EIO`       | `4`         | 必须，协议的版本。                                       |
| `transport` | `websocket` | 必须，传输的名称。                                         |
| `sid`       | `<sid>`     | 可选，取决于是否从 HTTP 长轮询升级。 |

如果缺少必需的查询参数，服务器必须关闭 WebSocket 连接。

每个数据包（读或写）都在自己的[WebSocket 帧](https://datatracker.ietf.org/doc/html/rfc6455#section-5)中发送。

客户端不得为每个会话打开多个 WebSocket 连接。如果发生这种情况，服务器必须关闭 WebSocket 连接。

## 协议

Engine.IO 数据包由以下部分组成：

- 数据包类型
- 可选的数据包负载

以下是可用的数据包类型列表：

| 类型    | ID  | 用途                                            |
|---------|-----|--------------------------------------------------|
| open    | 0   | 用于[握手](#handshake)期间。         |
| close   | 1   | 用于指示传输可以关闭。 |
| ping    | 2   | 用于[心跳机制](#heartbeat)。   |
| pong    | 3   | 用于[心跳机制](#heartbeat)。   |
| message | 4   | 用于向另一方发送负载。        |
| upgrade | 5   | 用于[升级过程](#upgrade)。     |
| noop    | 6   | 用于[升级过程](#upgrade)。     |

### 握手

要建立连接，客户端必须向服务器发送 HTTP `GET` 请求：

- 首先是 HTTP 长轮询（默认）

```
客户端                                                    服务器

  │                                                          │
  │        GET /engine.io/?EIO=4&transport=polling           │
  │ ───────────────────────────────────────────────────────► │
  │ ◄──────────────────────────────────────────────────────┘ │
  │                        HTTP 200                          │
  │                                                          │
```

- 仅 WebSocket 会话

```
客户端                                                    服务器

  │                                                          │
  │        GET /engine.io/?EIO=4&transport=websocket         │
  │ ───────────────────────────────────────────────────────► │
  │ ◄──────────────────────────────────────────────────────┘ │
  │                        HTTP 101                          │
  │                                                          │
```

如果服务器接受连接，则必须响应一个带有以下 JSON 编码负载的 `open` 数据包：

| 键            | 类型       | 描述                                                                                                       |
|----------------|------------|-------------------------------------------------------------------------------------------------------------------|
| `sid`          | `string`   | 会话 ID。                                                                                                   |
| `upgrades`     | `string[]` | 可用的[传输升级](#upgrade)列表。                                                             |
| `pingInterval` | `number`   | 用于[心跳机制](#heartbeat)的 ping 间隔（以毫秒为单位）。                               |
| `pingTimeout`  | `number`   | 用于[心跳机制](#heartbeat)的 ping 超时（以毫秒为单位）。                                |
| `maxPayload`   | `number`   | 每个块的最大字节数，客户端用于将数据包聚合到[负载](#packet-encoding)中。 |

示例：

```json
{
  "sid": "lv_VI97HAXpY6yYWAAAC",
  "upgrades": ["websocket"],
  "pingInterval": 25000,
  "pingTimeout": 20000,
  "maxPayload": 1000000
}
```

客户端必须在所有后续请求的查询参数中发送 `sid` 值。

### 心跳

一旦[握手](#handshake)完成，启动一个心跳机制来检查连接的活跃性：

```
客户端                                                 服务器

  │                   *** 握手 ***                  │
  │                                                      │
  │  ◄─────────────────────────────────────────────────  │
  │                           2                          │  (ping 数据包)
  │  ─────────────────────────────────────────────────►  │
  │                           3                          │  (pong 数据包)
```

在给定的间隔（握手中发送的 `pingInterval` 值）内，服务器发送一个 `ping` 数据包，客户端有几秒钟（`pingTimeout` 值）来发送一个 `pong` 数据包。

如果服务器没有收到 `pong` 数据包，则应认为连接已关闭。

相反，如果客户端在 `pingInterval + pingTimeout` 内没有收到 `ping` 数据包，则应认为连接已关闭。

### 升级

默认情况下，客户端应创建一个 HTTP 长轮询连接，然后升级到更好的传输（如果可用）。

要升级到 WebSocket，客户端必须：

- 暂停 HTTP 长轮询传输（不再发送 HTTP 请求），以确保没有数据包丢失
- 使用相同的会话 ID 打开一个 WebSocket 连接
- 发送一个带有字符串 `probe` 的 `ping` 数据包

服务器必须：

- 向任何挂起的 `GET` 请求发送一个 `noop` 数据包（如果适用），以干净地关闭 HTTP 长轮询传输
- 响应一个带有字符串 `probe` 的 `pong` 数据包

最后，客户端必须发送一个 `upgrade` 数据包以完成升级：

```
客户端                                                 服务器

  │                                                      │
  │   GET /engine.io/?EIO=4&transport=websocket&sid=...  │
  │ ───────────────────────────────────────────────────► │
  │  ◄─────────────────────────────────────────────────┘ │
  │            HTTP 101 (WebSocket 握手)            │
  │                                                      │
  │            -----  WebSocket 帧 -----             │
  │  ─────────────────────────────────────────────────►  │
  │                         2probe                       │ (ping 数据包)
  │  ◄─────────────────────────────────────────────────  │
  │                         3probe                       │ (pong 数据包)
  │  ─────────────────────────────────────────────────►  │
  │                         5                            │ (upgrade 数据包)
  │                                                      │
```

### 消息

一旦[握手](#handshake)完成，客户端和服务器可以通过在 `message` 数据包中包含数据来交换数据。

## 数据包编码

Engine.IO 数据包的序列化取决于负载的类型（纯文本或二进制）和传输方式。

### HTTP 长轮询

由于 HTTP 长轮询传输的性质，多个数据包可能会被连接到一个负载中以增加吞吐量。

格式：

```
<packet type>[<data>]<separator><packet type>[<data>]<separator><packet type>[<data>][...]
```

示例：

```
4hello\x1e2\x1e4world

其中：

4      => 消息数据包类型
hello  => 消息负载
\x1e   => 分隔符
2      => ping 数据包类型
\x1e   => 分隔符
4      => 消息数据包类型
world  => 消息负载
```

数据包由[记录分隔符字符](https://en.wikipedia.org/wiki/C0_and_C1_control_codes#Field_separators)分隔：`\x1e`

二进制负载必须进行 base64 编码并以 `b` 字符为前缀：

示例：

```
4hello\x1ebAQIDBA==

其中：

4         => 消息数据包类型
hello     => 消息负载
\x1e      => 分隔符
b         => 二进制前缀
AQIDBA==  => 缓冲区 <01 02 03 04> 编码为 base64
```

客户端应使用握手期间发送的 `maxPayload` 值来决定应连接多少数据包。

### WebSocket

每个 Engine.IO 数据包都在自己的[WebSocket 帧](https://datatracker.ietf.org/doc/html/rfc6455#section-5)中发送。

格式：

```
<packet type>[<data>]
```

示例：

```
4hello

其中：

4      => 消息数据包类型
hello  => 消息负载（UTF-8 编码）
```

二进制负载按原样发送，不做修改。

## 历史

### 从 v2 到 v3

- 增加对二进制数据的支持

协议的[第 2 版](https://github.com/socketio/engine.io-protocol/tree/v2)用于 Socket.IO `v0.9` 及以下版本。

协议的[第 3 版](https://github.com/socketio/engine.io-protocol/tree/v3)用于 Socket.IO `v1` 和 `v2`。

### 从 v3 到 v4

- 反转 ping/pong 机制

现在由服务器发送 ping 数据包，因为浏览器中设置的计时器不够可靠。我们怀疑很多超时问题是由于客户端的计时器被延迟引起的。

- 在编码带有二进制数据的负载时始终使用 base64

此更改允许以相同的方式处理所有负载（无论是否带有二进制），而无需考虑客户端或当前传输是否支持二进制数据。

请注意，这仅适用于 HTTP 长轮询。二进制数据在 WebSocket 帧中发送，无需额外转换。

- 使用记录分隔符（`\x1e`）而不是字符计数

字符计数使得在其他语言中实现协议变得更加困难，或者至少更难，因为这些语言可能不使用 UTF-16 编码。

例如，`€` 被编码为 `2:4€`，尽管 `Buffer.byteLength('€') === 3`。

注意：这假设记录分隔符不用于数据中。

第 4 版（当前）包含在 Socket.IO `v3` 及以上版本中。

## 测试套件

[`test-suite/`](https://github.com/socketio/engine.io-protocol/tree/main/test-suite)目录中的测试套件让您可以检查服务器实现的合规性。

用法：

- 在 Node.js 中：`npm ci && npm test`
- 在浏览器中：只需在浏览器中打开 `index.html` 文件

作为参考，以下是 JavaScript 服务器通过所有测试的预期配置：

```js
import { listen } from "engine.io";

const server = listen(3000, {
  pingInterval: 300,
  pingTimeout: 200,
  maxPayload: 1e6,
  cors: {
    origin: "*"
  }
});

server.on("connection", socket => {
  socket.on("data", (...args) => {
    socket.send(...args);
  });
});
```
