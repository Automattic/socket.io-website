---
title: "教程步骤 #5 - 广播"
sidebar_label: "步骤 #5: 广播"
slug: step-5
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 广播

接下来的目标是从服务器向其他用户发送事件。

为了向所有人发送事件，Socket.IO 提供了 `io.emit()` 方法。

```js
// 这将向所有连接的套接字发送事件
io.emit('hello', 'world'); 
```

如果你想向除某个特定发送套接字之外的所有人发送消息，可以使用 `broadcast` 标志从该套接字发送：

```js
io.on('connection', (socket) => {
  socket.broadcast.emit('hi');
});
```

在这个例子中，为了简单起见，我们将向所有人发送消息，包括发送者。

```js
io.on('connection', (socket) => {
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });
});
```

在客户端，当我们捕获到 `chat message` 事件时，会将其显示在页面中。

<Tabs groupId="syntax">
  <TabItem value="es6" label="ES6" default>

```html
<script src="/socket.io/socket.io.js"></script>
<script>
  const socket = io();

  const form = document.getElementById('form');
  const input = document.getElementById('input');
  // highlight-start
  const messages = document.getElementById('messages');
  // highlight-end

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value) {
      socket.emit('chat message', input.value);
      input.value = '';
    }
  });

  // highlight-start
  socket.on('chat message', (msg) => {
    const item = document.createElement('li');
    item.textContent = msg;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
  });
  // highlight-end
</script>
```

  </TabItem>
  <TabItem value="es5" label="ES5">

```html
<script src="/socket.io/socket.io.js"></script>
<script>
  var socket = io();

  var form = document.getElementById('form');
  var input = document.getElementById('input');
  // highlight-start
  var messages = document.getElementById('messages');
  // highlight-end

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value) {
      socket.emit('chat message', input.value);
      input.value = '';
    }
  });

  // highlight-start
  socket.on('chat message', function(msg) {
    var item = document.createElement('li');
    item.textContent = msg;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
  });
  // highlight-end
</script>
```

  </TabItem>
</Tabs>

让我们看看实际效果：

<video controls autoplay="" loop="" width="100%"><source src="https://i.cloudup.com/transcoded/J4xwRU9DRn.mp4" /></video>

:::info

<Tabs groupId="lang">
  <TabItem value="cjs" label="CommonJS" default attributes={{ className: 'display-none' }}>

你可以在浏览器中直接运行这个示例：

- [CodeSandbox](https://codesandbox.io/p/sandbox/github/socketio/chat-example/tree/cjs/step5?file=index.js)
- [StackBlitz](https://stackblitz.com/github/socketio/chat-example/tree/cjs/step5?file=index.js)


  </TabItem>
  <TabItem value="mjs" label="ES modules" attributes={{ className: 'display-none' }}>

你可以在浏览器中直接运行这个示例：

- [CodeSandbox](https://codesandbox.io/p/sandbox/github/socketio/chat-example/tree/esm/step5?file=index.js)
- [StackBlitz](https://stackblitz.com/github/socketio/chat-example/tree/esm/step5?file=index.js)


  </TabItem>
</Tabs>

:::