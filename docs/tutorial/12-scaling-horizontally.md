---
title: "Tutorial step #9 - Scaling horizontally"
sidebar_label: "Step #9: Scaling horizontally"
slug: step-9
---

import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Scaling horizontally

Now that our application is resilient to temporary network interruptions, let's see how we can horizontally scale it in order to be able to support thousands of concurrent clients. 

:::note

- Horizontal scaling (also known as "scaling out") means adding new servers to your infrastructure to cope with new demands
- Vertical scaling (also known as "scaling up") means adding more resources (processing power, memory, storage, ...) to your existing infrastructure

:::

First step: let's use all the available cores of the host. By default, Node.js runs your Javascript code in a single thread, which means that even with a 32-core CPU, only one core will be used. Fortunately, the Node.js [`cluster` module](https://nodejs.org/api/cluster.html#cluster) provides a convenient way to create one worker thread per core.

We will also need a way to forward events between the Socket.IO servers. We call this component an "Adapter".

<ThemedImage
  alt="The 'hello' event is forwarded to the other servers"
  sources={{
    light: useBaseUrl('/images/tutorial/adapter.png'),
    dark: useBaseUrl('/images/tutorial/adapter-dark.png'),
  }}
/>

So let's install the cluster adapter:

<Tabs groupId="pm">
  <TabItem value="npm" label="NPM" default>

```sh
npm install '@socket.io/cluster-adapter'
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

Now we plug it in:

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
  // create one worker per available core
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork({
      PORT: 3000 + i
    });
  }
  
  // set up the adapter on the primary thread
  return setupPrimary();
  // highlight-end
}

async function main() {
  const app = express();
  const server = createServer(app);
  const io = new Server(server, {
    connectionStateRecovery: {},
    // highlight-start
    // set up the adapter on each worker thread
    adapter: createAdapter()
    // highlight-end
  });

  // [...]

  // highlight-start
  // each worker will listen on a distinct port
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
  // create one worker per available core
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork({
      PORT: 3000 + i
    });
  }
  
  // set up the adapter on the primary thread
  setupPrimary();
  // highlight-end
} else {
  const app = express();
  const server = createServer(app);
  const io = new Server(server, {
    connectionStateRecovery: {},
    // highlight-start
    // set up the adapter on each worker thread
    adapter: createAdapter()
    // highlight-end
  });

  // [...]

  // highlight-start
  // each worker will listen on a distinct port
  const port = process.env.PORT;

  server.listen(port, () => {
    console.log(`server running at http://localhost:${port}`);
  });
  // highlight-end
}
```

  </TabItem>
</Tabs>

That's it! This will spawn one worker thread per CPU available on your machine. Let's see it in action:

<video controls width="100%"><source src="/videos/tutorial/scaling-up.mp4" /></video>

As you can see in the address bar, each browser tab is connected to a different Socket.IO server, and the adapter is simply forwarding the `chat message` events between them.

:::tip

There are currently 5 official adapter implementations:

- the [Redis adapter](../categories/05-Adapters/adapter-redis.md)
- the [Redis Streams adapter](../categories/05-Adapters/adapter-redis-streams.md)
- the [MongoDB adapter](../categories/05-Adapters/adapter-mongo.md)
- the [Postgres adapter](../categories/05-Adapters/adapter-postgres.md)
- the [Cluster adapter](../categories/05-Adapters/adapter-cluster.md)

So you can choose the one that best suits your needs. However, please note that some implementations do not support the Connection state recovery feature, you can find the compatibility matrix [here](../categories/01-Documentation/connection-state-recovery.md#compatibility-with-existing-adapters).

:::

:::note

In most cases, you would also need to ensure that all the HTTP requests of a Socket.IO session reach the same server (also known as "sticky session"). This is not needed here though, as each Socket.IO server has its own port.

More information [here](../categories/02-Server/using-multiple-nodes.md).

:::

And that finally completes our chat application! In this tutorial, we have seen how to:

- send an event between the client and the server
- broadcast an event to all or a subset of connected clients
- handle temporary disconnections
- scale up

You should now have a better overview of the features provided by Socket.IO. Now it's your time to build your own realtime application!

:::info

<Tabs groupId="lang">
  <TabItem value="cjs" label="CommonJS" default attributes={{ className: 'display-none' }}>

You can run this example directly in your browser on:

- [CodeSandbox](https://codesandbox.io/p/sandbox/github/socketio/chat-example/tree/cjs/step9?file=index.js)
- [StackBlitz](https://stackblitz.com/github/socketio/chat-example/tree/cjs/step9?file=index.js)


  </TabItem>
  <TabItem value="mjs" label="ES modules" attributes={{ className: 'display-none' }}>

You can run this example directly in your browser on:

- [CodeSandbox](https://codesandbox.io/p/sandbox/github/socketio/chat-example/tree/esm/step9?file=index.js)
- [StackBlitz](https://stackblitz.com/github/socketio/chat-example/tree/esm/step9?file=index.js)
- [Repl.it](https://replit.com/github/socketio/chat-example)


  </TabItem>
</Tabs>

:::
