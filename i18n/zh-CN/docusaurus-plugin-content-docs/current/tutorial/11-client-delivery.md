---
title: "教程步骤 #8 - 客户端消息传递"
sidebar_label: "步骤 #8: 客户端消息传递"
slug: step-8
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 客户端消息传递

让我们看看如何确保服务器始终接收到客户端发送的消息。

:::info

默认情况下，Socket.IO 提供“最多一次”的传递保证（也称为“发送即忘”），这意味着如果消息未到达服务器，将不会重试。

:::

## 缓冲事件

当客户端断开连接时，任何对 `socket.emit()` 的调用都会被缓冲，直到重新连接：

<video controls width="100%"><source src="/videos/tutorial/buffered-events.mp4" /></video>

在上面的视频中，“实时”消息被缓冲，直到连接重新建立。

这种行为可能完全满足您的应用需求。然而，在以下几种情况下，消息可能会丢失：

- 在事件发送过程中连接中断
- 服务器在处理事件时崩溃或重启
- 数据库暂时不可用

## 至少一次

我们可以实现“至少一次”的传递保证：

- 手动使用确认机制：

```js
function emit(socket, event, arg) {
  socket.timeout(5000).emit(event, arg, (err) => {
    if (err) {
      // 服务器没有确认，重试
      emit(socket, event, arg);
    }
  });
}

emit(socket, 'hello', 'world');
```

- 或使用 `retries` 选项：

```js
const socket = io({
  ackTimeout: 10000,
  retries: 3
});

socket.emit('hello', 'world');
```

在这两种情况下，客户端将重试发送消息，直到收到服务器的确认：

```js
io.on('connection', (socket) => {
  socket.on('hello', (value, callback) => {
    // 一旦事件成功处理
    callback();
  });
})
```

:::tip

使用 `retries` 选项时，消息的顺序是有保证的，因为消息是逐个排队发送的。第一种方法则不保证顺序。

:::

## 精确一次

重试的问题在于服务器可能会多次接收到相同的消息，因此需要一种方法来唯一标识每条消息，并且只在数据库中存储一次。

让我们看看如何在聊天应用中实现“精确一次”的传递保证。

我们将从客户端为每条消息分配一个唯一标识符开始：

<Tabs groupId="syntax">
  <TabItem value="es6" label="ES6" default>

```html title="index.html"
<script>
  // highlight-next-line
  let counter = 0;

  const socket = io({
    auth: {
      serverOffset: 0
    },
    // highlight-start
    // 启用重试
    ackTimeout: 10000,
    retries: 3,
    // highlight-end
  });

  const form = document.getElementById('form');
  const input = document.getElementById('input');
  const messages = document.getElementById('messages');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value) {
      // highlight-start
      // 计算唯一偏移量
      const clientOffset = `${socket.id}-${counter++}`;
      socket.emit('chat message', input.value, clientOffset);
      // highlight-end
      input.value = '';
    }
  });

  socket.on('chat message', (msg, serverOffset) => {
    const item = document.createElement('li');
    item.textContent = msg;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
    socket.auth.serverOffset = serverOffset;
  });
</script>
```

  </TabItem>
  <TabItem value="es5" label="ES5">

```html title="index.html"
<script>
  // highlight-next-line
  var counter = 0;

  var socket = io({
    auth: {
      serverOffset: 0
    },
    // highlight-start
    // 启用重试
    ackTimeout: 10000,
    retries: 3,
    // highlight-end
  });

  var form = document.getElementById('form');
  var input = document.getElementById('input');
  var messages = document.getElementById('messages');

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value) {
      // highlight-start
      // 计算唯一偏移量
      var clientOffset = `${socket.id}-${counter++}`;
      socket.emit('chat message', input.value, clientOffset);
      // highlight-end
      input.value = '';
    }
  });

  socket.on('chat message', function(msg, serverOffset) {
    var item = document.createElement('li');
    item.textContent = msg;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
    socket.auth.serverOffset = serverOffset;
  });
</script>
```

  </TabItem>
</Tabs>

:::note

`socket.id` 属性是分配给每个连接的随机20字符标识符。

我们也可以使用 [`getRandomValues()`](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues) 来生成唯一偏移量。

:::

然后我们在服务器端将此偏移量与消息一起存储：

```js title="index.js"
// [...]

io.on('connection', async (socket) => {
  // highlight-next-line
  socket.on('chat message', async (msg, clientOffset, callback) => {
    let result;
    try {
      // highlight-next-line
      result = await db.run('INSERT INTO messages (content, client_offset) VALUES (?, ?)', msg, clientOffset);
    } catch (e) {
      // highlight-start
      if (e.errno === 19 /* SQLITE_CONSTRAINT */ ) {
        // 消息已插入，因此通知客户端
        callback();
      } else {
        // 无需操作，让客户端重试
      }
      return;
      // highlight-end
    }
    io.emit('chat message', msg, result.lastID);
    // highlight-start
    // 确认事件
    callback();
    // highlight-end
  });

  if (!socket.recovered) {
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
});

// [...]
```

这样，`client_offset` 列上的 UNIQUE 约束可以防止消息重复。

:::caution

不要忘记确认事件，否则客户端将继续重试（最多 `retries` 次）。

```js
socket.on('chat message', async (msg, clientOffset, callback) => {
  // ... 最后
  callback();
});
```

:::

:::info

同样，默认的“最多一次”保证可能足以满足您的应用需求，但现在您知道如何提高其可靠性。

:::

在下一步中，我们将了解如何横向扩展我们的应用。

:::info

<Tabs groupId="lang">
  <TabItem value="cjs" label="CommonJS" default attributes={{ className: 'display-none' }}>

您可以在浏览器中直接运行此示例：

- [CodeSandbox](https://codesandbox.io/p/sandbox/github/socketio/chat-example/tree/cjs/step8?file=index.js)
- [StackBlitz](https://stackblitz.com/github/socketio/chat-example/tree/cjs/step8?file=index.js)


  </TabItem>
  <TabItem value="mjs" label="ES modules" attributes={{ className: 'display-none' }}>

您可以在浏览器中直接运行此示例：

- [CodeSandbox](https://codesandbox.io/p/sandbox/github/socketio/chat-example/tree/esm/step8?file=index.js)
- [StackBlitz](https://stackblitz.com/github/socketio/chat-example/tree/esm/step8?file=index.js)


  </TabItem>
</Tabs>

:::