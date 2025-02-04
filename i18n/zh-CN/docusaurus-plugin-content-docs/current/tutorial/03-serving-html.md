---
title: "教程步骤 #2 - 提供 HTML 服务"
sidebar_label: "步骤 #2: 提供 HTML 服务"
slug: step-2
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 提供 HTML

到目前为止，在 `index.js` 中我们使用 `res.send` 并传递一个 HTML 字符串。如果将整个应用程序的 HTML 都放在这里，代码会显得非常混乱，因此我们将创建一个 `index.html` 文件并提供该文件。

让我们重构路由处理器以使用 `sendFile`。

<Tabs groupId="lang">
  <TabItem value="cjs" label="CommonJS" default>

```js
const express = require('express');
const { createServer } = require('node:http');
// highlight-start
const { join } = require('node:path');
// highlight-end

const app = express();
const server = createServer(app);

// highlight-start
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
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
// highlight-start
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
// highlight-end

const app = express();
const server = createServer(app);

// highlight-start
const __dirname = dirname(fileURLToPath(import.meta.url));

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});
// highlight-end

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});
```

  </TabItem>
</Tabs>

在你的 `index.html` 文件中放入以下内容：

```html
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <title>Socket.IO chat</title>
    <style>
      body { margin: 0; padding-bottom: 3rem; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }

      #form { background: rgba(0, 0, 0, 0.15); padding: 0.25rem; position: fixed; bottom: 0; left: 0; right: 0; display: flex; height: 3rem; box-sizing: border-box; backdrop-filter: blur(10px); }
      #input { border: none; padding: 0 1rem; flex-grow: 1; border-radius: 2rem; margin: 0.25rem; }
      #input:focus { outline: none; }
      #form > button { background: #333; border: none; padding: 0 1rem; margin: 0.25rem; border-radius: 3px; outline: none; color: #fff; }

      #messages { list-style-type: none; margin: 0; padding: 0; }
      #messages > li { padding: 0.5rem 1rem; }
      #messages > li:nth-child(odd) { background: #efefef; }
    </style>
  </head>
  <body>
    <ul id="messages"></ul>
    <form id="form" action="">
      <input id="input" autocomplete="off" /><button>Send</button>
    </form>
  </body>
</html>
```

如果你重启进程（按下 Control+C 然后再次运行 `node index.js`）并刷新页面，它应该看起来像这样：

<img src="/images/chat-3.png" alt="浏览器显示一个输入框和一个 'Send' 按钮" />

:::info

<Tabs groupId="lang">
  <TabItem value="cjs" label="CommonJS" default attributes={{ className: 'display-none' }}>

你可以在浏览器中直接运行此示例：

- [CodeSandbox](https://codesandbox.io/p/sandbox/github/socketio/chat-example/tree/cjs/step2?file=index.js)
- [StackBlitz](https://stackblitz.com/github/socketio/chat-example/tree/cjs/step2?file=index.js)


  </TabItem>
  <TabItem value="mjs" label="ES modules" attributes={{ className: 'display-none' }}>

你可以在浏览器中直接运行此示例：

- [CodeSandbox](https://codesandbox.io/p/sandbox/github/socketio/chat-example/tree/esm/step2?file=index.js)
- [StackBlitz](https://stackblitz.com/github/socketio/chat-example/tree/esm/step2?file=index.js)


  </TabItem>
</Tabs>

:::
