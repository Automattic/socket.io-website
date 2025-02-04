---
title: "教程步骤 #9 - 水平扩展"
sidebar_label: "步骤 #9: 水平扩展"
slug: step-9
---

import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 水平扩展

现在我们的应用程序已经能够应对临时的网络中断，让我们看看如何通过水平扩展来支持数千个并发客户端。

:::note

- 水平扩展（也称为“扩展出”）是指向基础设施中添加新的服务器以应对新的需求
- 垂直扩展（也称为“扩展上”）是指为现有基础设施添加更多资源（处理能力、内存、存储等）

:::

第一步：利用主机的所有可用核心。默认情况下，Node.js 在单线程中运行 JavaScript 代码，这意味着即使有 32 核 CPU，也只会使用一个核心。幸运的是，Node.js 的 [`cluster` 模块](https://nodejs.org/api/cluster.html#cluster) 提供了一种方便的方法来为每个核心创建一个工作线程。

我们还需要一种方法在 Socket.IO 服务器之间转发事件。我们称这个组件为“适配器”。

<ThemedImage
  alt="‘hello’ 事件被转发到其他服务器"
  sources={{
    light: useBaseUrl('/images/tutorial/adapter.png'),
    dark: useBaseUrl('/images/tutorial/adapter-dark.png'),
  }}
/>

现在安装集群适配器：

<Tabs groupId="pm">
  <TabItem value="npm" label="NPM" default>

```sh
npm install @socket.io/cluster-adapter
```

  </TabItem>
  <TabItem value="yarn" label="Yarn">

```sh
yarn add @socket.io/cluster-adapter
```

  </TabItem>
  <TabItem value="pnpm" label="pnpm">

```sh
pnpm add @socket.io/cluster-adapter
```

  </TabItem>
</Tabs>

现在我们将其接入：

<Tabs groupId="lang">
  <TabItem value="cjs" label="CommonJS" default>

```js title="index.js"
const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
// highlight-start
const { availableParallelism } = require('node:os');
const cluster = require('node:cluster');
const { createAdapter, setupPrimary } = require('@socket.io/cluster-adapter');
// highlight-end

if (cluster.isPrimary) {
  // highlight-start
  const numCPUs = availableParallelism();
  // 为每个可用核心创建一个工作线程
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork({
      PORT: 3000 + i
    });
  }
  
  // 在主线程上设置适配器
  return setupPrimary();
  // highlight-end
}

async function main() {
  const app = express();
  const server = createServer(app);
  const io = new Server(server, {
    connectionStateRecovery: {},
    // highlight-start
    // 在每个工作线程上设置适配器
    adapter: createAdapter()
    // highlight-end
  });

  // [...]

  // highlight-start
  // 每个工作线程将监听不同的端口
  const port = process.env.PORT;

  server.listen(port, () => {
    console.log(`server running at http://localhost:${port}`);
  });
  // highlight-end
}

main();
```

  </TabItem>
  <TabItem value="mjs" label="ES modules">

```js title="index.js"
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
// highlight-start
import { availableParallelism } from 'node:os';
import cluster from 'node:cluster';
import { createAdapter, setupPrimary } from '@socket.io/cluster-adapter';
// highlight-end

if (cluster.isPrimary) {
  // highlight-start
  const numCPUs = availableParallelism();
  // 为每个可用核心创建一个工作线程
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork({
      PORT: 3000 + i
    });
  }
  
  // 在主线程上设置适配器
  setupPrimary();
  // highlight-end
} else {
  const app = express();
  const server = createServer(app);
  const io = new Server(server, {
    connectionStateRecovery: {},
    // highlight-start
    // 在每个工作线程上设置适配器
    adapter: createAdapter()
    // highlight-end
  });

  // [...]

  // highlight-start
  // 每个工作线程将监听不同的端口
  const port = process.env.PORT;

  server.listen(port, () => {
    console.log(`server running at http://localhost:${port}`);
  });
  // highlight-end
}
```

  </TabItem>
</Tabs>

完成了！这将在您的机器上为每个可用的 CPU 生成一个工作线程。让我们看看它的实际效果：

<video controls width="100%"><source src="/videos/tutorial/scaling-up.mp4" /></video>

如您在地址栏中所见，每个浏览器标签页连接到不同的 Socket.IO 服务器，适配器只是简单地在它们之间转发 `chat message` 事件。

:::tip

目前有 5 种官方适配器实现：

- [Redis 适配器](../categories/05-Adapters/adapter-redis.md)
- [Redis Streams 适配器](../categories/05-Adapters/adapter-redis-streams.md)
- [MongoDB 适配器](../categories/05-Adapters/adapter-mongo.md)
- [Postgres 适配器](../categories/05-Adapters/adapter-postgres.md)
- [集群适配器](../categories/05-Adapters/adapter-cluster.md)

您可以选择最适合您需求的那个。不过，请注意某些实现不支持连接状态恢复功能，您可以在[这里](../categories/01-Documentation/connection-state-recovery.md#compatibility-with-existing-adapters)找到兼容性矩阵。

:::

:::note

在大多数情况下，您还需要确保 Socket.IO 会话的所有 HTTP 请求都到达同一服务器（也称为“粘性会话”）。不过这里不需要这样，因为每个 Socket.IO 服务器都有自己的端口。

更多信息请查看[这里](../categories/02-Server/using-multiple-nodes.md)。

:::

这就完成了我们的聊天应用程序！在本教程中，我们学习了如何：

- 在客户端和服务器之间发送事件
- 向所有或部分连接的客户端广播事件
- 处理临时断线
- 扩展

您现在应该对 Socket.IO 提供的功能有更好的了解。现在是您构建自己的实时应用程序的时候了！

:::info

<Tabs groupId="lang">
  <TabItem value="cjs" label="CommonJS" default attributes={{ className: 'display-none' }}>

您可以在浏览器中直接运行此示例：

- [CodeSandbox](https://codesandbox.io/p/sandbox/github/socketio/chat-example/tree/cjs/step9?file=index.js)
- [StackBlitz](https://stackblitz.com/github/socketio/chat-example/tree/cjs/step9?file=index.js)


  </TabItem>
  <TabItem value="mjs" label="ES modules" attributes={{ className: 'display-none' }}>

您可以在浏览器中直接运行此示例：

- [CodeSandbox](https://codesandbox.io/p/sandbox/github/socketio/chat-example/tree/esm/step9?file=index.js)
- [StackBlitz](https://stackblitz.com/github/socketio/chat-example/tree/esm/step9?file=index.js)
- [Repl.it](https://replit.com/github/socketio/chat-example)


  </TabItem>
</Tabs>

:::