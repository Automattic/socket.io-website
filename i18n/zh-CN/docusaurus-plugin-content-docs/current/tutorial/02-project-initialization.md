---
title: "教程步骤 #1 - 项目初始化"
sidebar_label: "步骤 #1: 项目初始化"
slug: step-1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 项目初始化

我们的首要目标是设置一个简单的 HTML 网页，用于提供一个表单和消息列表。我们将使用 Node.JS 的 Web 框架 `express` 来实现这一目标。请确保已安装 [Node.JS](https://nodejs.org)。

首先，让我们创建一个 `package.json` 清单文件来描述我们的项目。建议将其放在一个专用的空目录中（我将其命名为 `socket-chat-example`）。

<Tabs groupId="lang">
  <TabItem value="cjs" label="CommonJS" default>

```json
{
  "name": "socket-chat-example",
  "version": "0.0.1",
  "description": "my first socket.io app",
  "type": "commonjs",
  "dependencies": {}
}
```

  </TabItem>
  <TabItem value="mjs" label="ES modules">

```json
{
  "name": "socket-chat-example",
  "version": "0.0.1",
  "description": "my first socket.io app",
  "type": "module",
  "dependencies": {}
}
```

  </TabItem>
</Tabs>

:::caution

"name" 属性必须是唯一的，不能使用类似 "socket.io" 或 "express" 的值，因为在安装依赖时 npm 会报错。

:::

现在，为了方便地填充我们需要的 `dependencies` 属性，我们将使用 `npm install`：

```
npm install express@4
```

安装完成后，我们可以创建一个 `index.js` 文件来设置我们的应用程序。

<Tabs groupId="lang">
  <TabItem value="cjs" label="CommonJS" default>

```js
const express = require('express');
const { createServer } = require('node:http');

const app = express();
const server = createServer(app);

app.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>');
});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});
```

  </TabItem>
  <TabItem value="mjs" label="ES modules">

```js
import express from 'express';
import { createServer } from 'node:http';

const app = express();
const server = createServer(app);

app.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>');
});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});
```

  </TabItem>
</Tabs>

这意味着：

- Express 初始化 `app` 为一个函数处理器，可以提供给 HTTP 服务器（如第 5 行所示）。
- 我们定义了一个路由处理器 `/`，当访问我们的网站主页时会被调用。
- 我们让 HTTP 服务器监听 3000 端口。

如果运行 `node index.js`，你应该会看到以下内容：

<img src="/images/chat-1.png" alt="控制台显示服务器已开始监听 3000 端口" />

如果将浏览器指向 `http://localhost:3000`：

<img src="/images/chat-2.png" alt="浏览器显示一个大的 'Hello World'" />

到目前为止，一切顺利！

:::info

<Tabs groupId="lang">
  <TabItem value="cjs" label="CommonJS" default attributes={{ className: 'display-none' }}>

你可以在浏览器中直接运行此示例：

- [CodeSandbox](https://codesandbox.io/p/sandbox/github/socketio/chat-example/tree/cjs/step1?file=index.js)
- [StackBlitz](https://stackblitz.com/github/socketio/chat-example/tree/cjs/step1?file=index.js)


  </TabItem>
  <TabItem value="mjs" label="ES modules" attributes={{ className: 'display-none' }}>

你可以在浏览器中直接运行此示例：

- [CodeSandbox](https://codesandbox.io/p/sandbox/github/socketio/chat-example/tree/esm/step1?file=index.js)
- [StackBlitz](https://stackblitz.com/github/socketio/chat-example/tree/esm/step1?file=index.js)


  </TabItem>
</Tabs>

:::
