---
title: "教程步骤 #7 - 服务器传递"
sidebar_label: "步骤 #7: 服务器传递"
slug: step-7
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 服务器传递

在重新连接时同步客户端状态有两种常见方法：

- 服务器发送整个状态
- 客户端跟踪其处理的最后一个事件，服务器发送缺失的部分

这两种方案都是完全有效的，选择哪种取决于你的使用场景。在本教程中，我们将选择后者。

首先，让我们持久化聊天应用程序的消息。如今有很多不错的选择，这里我们使用 [SQLite](https://www.sqlite.org/)。

:::tip

如果你不熟悉 SQLite，可以在网上找到很多教程，比如 [这个](https://www.sqlitetutorial.net/)。

:::

安装必要的包：

<Tabs groupId="pm">
  <TabItem value="npm" label="NPM" default>

```sh
npm install sqlite sqlite3
```

  </TabItem>
  <TabItem value="yarn" label="Yarn">

```sh
yarn add sqlite sqlite3
```

  </TabItem>
  <TabItem value="pnpm" label="pnpm">

```sh
pnpm add sqlite sqlite3
```

  </TabItem>
</Tabs>

我们将简单地将每条消息存储在一个 SQL 表中：

<Tabs groupId="lang">
  <TabItem value="cjs" label="CommonJS" default>

```js title="index.js"
const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
// highlight-start
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
// highlight-end

async function main() {
  // highlight-start
  // 打开数据库文件
  const db = await open({
    filename: 'chat.db',
    driver: sqlite3.Database
  });

  // 创建我们的 'messages' 表（可以暂时忽略 'client_offset' 列）
  await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_offset TEXT UNIQUE,
        content TEXT
    );
  `);
  // highlight-end

  const app = express();
  const server = createServer(app);
  const io = new Server(server, {
    connectionStateRecovery: {}
  });

  app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
  });

  io.on('connection', (socket) => {
    socket.on('chat message', async (msg) => {
      // highlight-start
      let result;
      try {
        // 将消息存储在数据库中
        result = await db.run('INSERT INTO messages (content) VALUES (?)', msg);
      } catch (e) {
        // TODO 处理失败
        return;
      }
      // 包含偏移量与消息一起发送
      io.emit('chat message', msg, result.lastID);
      // highlight-end
    });
  });

  server.listen(3000, () => {
    console.log('server running at http://localhost:3000');
  });
}

main();
```

  </TabItem>
  <TabItem value="mjs" label="ES modules">

```js title="index.js"
import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';
// highlight-start
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// 打开数据库文件
const db = await open({
  filename: 'chat.db',
  driver: sqlite3.Database
});

// 创建我们的 'messages' 表（可以暂时忽略 'client_offset' 列）
await db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_offset TEXT UNIQUE,
      content TEXT
  );
`);
// highlight-end

const app = express();
const server = createServer(app);
const io = new Server(server, {
  connectionStateRecovery: {}
});

const __dirname = dirname(fileURLToPath(import.meta.url));

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  socket.on('chat message', async (msg) => {
    // highlight-start
    let result;
    try {
      // 将消息存储在数据库中
      result = await db.run('INSERT INTO messages (content) VALUES (?)', msg);
    } catch (e) {
      // TODO 处理失败
      return;
    }
    // 包含偏移量与消息一起发送
    io.emit('chat message', msg, result.lastID);
    // highlight-end
  });
});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});
```

  </TabItem>
</Tabs>

客户端将跟踪偏移量：

<Tabs groupId="syntax">
  <TabItem value="es6" label="ES6" default>

```html title="index.html"
<script>
  // highlight-start
  const socket = io({
    auth: {
      serverOffset: 0
    }
  });
  // highlight-end

  const form = document.getElementById('form');
  const input = document.getElementById('input');
  const messages = document.getElementById('messages');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value) {
      socket.emit('chat message', input.value);
      input.value = '';
    }
  });

  // highlight-next-line
  socket.on('chat message', (msg, serverOffset) => {
    const item = document.createElement('li');
    item.textContent = msg;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
    // highlight-next-line
    socket.auth.serverOffset = serverOffset;
  });
</script>
```

  </TabItem>
  <TabItem value="es5" label="ES5">

```html title="index.html"
<script>
  // highlight-start
  var socket = io({
    auth: {
      serverOffset: 0
    }
  });
  // highlight-end

  var form = document.getElementById('form');
  var input = document.getElementById('input');
  var messages = document.getElementById('messages');

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value) {
      socket.emit('chat message', input.value);
      input.value = '';
    }
  });

  // highlight-next-line
  socket.on('chat message', function(msg, serverOffset) {
    var item = document.createElement('li');
    item.textContent = msg;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
    // highlight-next-line
    socket.auth.serverOffset = serverOffset;
  });
</script>
```

  </TabItem>
</Tabs>

最后，服务器将在（重新）连接时发送缺失的消息：

```js title="index.js"
// [...]

io.on('connection', async (socket) => {
  socket.on('chat message', async (msg) => {
    let result;
    try {
      result = await db.run('INSERT INTO messages (content) VALUES (?)', msg);
    } catch (e) {
      // TODO 处理失败
      return;
    }
    io.emit('chat message', msg, result.lastID);
  });

  // highlight-start
  if (!socket.recovered) {
    // 如果连接状态恢复不成功
    try {
      await db.each('SELECT id, content FROM messages WHERE id > ?',
        [socket.handshake.auth.serverOffset || 0],
        (_err, row) => {
          socket.emit('chat message', row.content, row.id);
        }
      )
    } catch (e) {
      // 出现错误
    }
  }
  // highlight-end
});

// [...]
```

让我们看看实际效果：

<video controls width="100%"><source src="/videos/tutorial/server-delivery.mp4" /></video>

如上面视频所示，它在临时断开连接和完全刷新页面后都能正常工作。

:::tip

与“连接状态恢复”功能的区别在于，成功的恢复可能不需要访问主数据库（例如，它可能从 Redis 流中获取消息）。

:::

好了，现在让我们讨论客户端传递。