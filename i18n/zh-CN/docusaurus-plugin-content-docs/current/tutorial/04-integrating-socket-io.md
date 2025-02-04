---
title: "教程步骤 #3 - 集成 Socket.IO"
sidebar_label: "步骤 #3: 集成 Socket.IO"
slug: step-3
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 集成 Socket.IO

Socket.IO 由两部分组成：

- 一个与 Node.JS HTTP 服务器集成（或挂载）的服务器（[`socket.io`](https://www.npmjs.com/package/socket.io) 包）
- 一个在浏览器端加载的客户端库（[`socket.io-client`](https://www.npmjs.com/package/socket.io-client) 包）

在开发过程中，`socket.io` 会自动为我们提供客户端服务，如我们将看到的，因此现在我们只需安装一个模块：

```
npm install socket.io
```

这将安装模块并将依赖项添加到 `package.json`。现在让我们编辑 `index.js` 来添加它：

<Tabs groupId="lang">
  <TabItem value="cjs" label="CommonJS" default>

```js
const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
// highlight-start
const { Server } = require('socket.io');
// highlight-end

const app = express();
const server = createServer(app);
// highlight-start
const io = new Server(server);
// highlight-end

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

// highlight-start
io.on('connection', (socket) => {
  console.log('a user connected');
});
// highlight-end

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});
```

  </TabItem>
  <TabItem value="mjs" label="ES modules">

```js
import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
// highlight-start
import { Server } from 'socket.io';
// highlight-end

const app = express();
const server = createServer(app);
// highlight-start
const io = new Server(server);
// highlight-end

const __dirname = dirname(fileURLToPath(import.meta.url));

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

// highlight-start
io.on('connection', (socket) => {
  console.log('a user connected');
});
// highlight-end

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});
```

  </TabItem>
</Tabs>

注意，我通过传递 `server`（HTTP 服务器）对象来初始化一个新的 `socket.io` 实例。然后我监听 `connection` 事件以接收传入的套接字并将其记录到控制台。


现在在 `index.html` 中，在 `</body>`（结束 body 标签）之前添加以下代码片段：

<Tabs groupId="syntax">
  <TabItem value="es6" label="ES6" default>

```html
<script src="/socket.io/socket.io.js"></script>
<script>
  const socket = io();
</script>
```

  </TabItem>
  <TabItem value="es5" label="ES5">

```html
<script src="/socket.io/socket.io.js"></script>
<script>
  var socket = io();
</script>
```

  </TabItem>
</Tabs>

这就是加载 `socket.io-client` 所需的全部内容，它会暴露一个全局的 `io`（以及端点 `GET /socket.io/socket.io.js`），然后进行连接。

如果你想使用客户端 JS 文件的本地版本，可以在 `node_modules/socket.io/client-dist/socket.io.js` 找到它。

:::tip

你也可以使用 CDN 而不是本地文件（例如 `<script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>`）。

:::

注意，当我调用 `io()` 时，我没有指定任何 URL，因为它默认尝试连接到提供页面的主机。

:::note

如果你在使用反向代理（如 apache 或 nginx），请查看[相关文档](/docs/v4/reverse-proxy/)。

如果你的应用托管在网站的非根目录下（例如 `https://example.com/chatapp`），那么你还需要在服务器和客户端中指定[path](/docs/v4/server-options/#path)。

:::

如果你现在重新启动进程（按 Control+C 然后再次运行 `node index.js`）并刷新网页，你应该会看到控制台打印“a user connected”。

尝试打开多个标签页，你会看到多条消息。

<img src="/images/chat-4.png" alt="控制台显示多条消息，表明有用户已连接" />

每个套接字还会触发一个特殊的 `disconnect` 事件：

```js
io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});
```

然后，如果你多次刷新一个标签页，你可以看到它的效果。

<img src="/images/chat-5.png" alt="控制台显示多条消息，表明有用户已连接和断开连接" />

:::info

<Tabs groupId="lang">
  <TabItem value="cjs" label="CommonJS" default attributes={{ className: 'display-none' }}>

你可以在浏览器中直接运行此示例：

- [CodeSandbox](https://codesandbox.io/p/sandbox/github/socketio/chat-example/tree/cjs/step3?file=index.js)
- [StackBlitz](https://stackblitz.com/github/socketio/chat-example/tree/cjs/step3?file=index.js)


  </TabItem>
  <TabItem value="mjs" label="ES modules" attributes={{ className: 'display-none' }}>

你可以在浏览器中直接运行此示例：

- [CodeSandbox](https://codesandbox.io/p/sandbox/github/socketio/chat-example/tree/esm/step3?file=index.js)
- [StackBlitz](https://stackblitz.com/github/socketio/chat-example/tree/esm/step3?file=index.js)


  </TabItem>
</Tabs>

:::