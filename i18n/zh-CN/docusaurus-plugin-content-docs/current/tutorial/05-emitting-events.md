---
title: "教程步骤 #4 - 触发事件"
sidebar_label: "步骤 #4: 触发事件"
slug: step-4
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 触发事件

Socket.IO 的核心理念是你可以发送和接收任何你想要的事件，并附带任何数据。任何可以编码为 JSON 的对象都可以使用，[二进制数据](/blog/introducing-socket-io-1-0/#binary) 也支持。

让我们实现一个功能，当用户输入消息时，服务器将其作为 `chat message` 事件接收。`index.html` 中的 `script` 部分应如下所示：

<Tabs groupId="syntax">
  <TabItem value="es6" label="ES6" default>

```html
<script src="/socket.io/socket.io.js"></script>
<script>
  const socket = io();

  const form = document.getElementById('form');
  const input = document.getElementById('input');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value) {
      socket.emit('chat message', input.value);
      input.value = '';
    }
  });
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

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value) {
      socket.emit('chat message', input.value);
      input.value = '';
    }
  });
</script>
```

  </TabItem>
</Tabs>

在 `index.js` 中，我们打印出 `chat message` 事件：

```js
io.on('connection', (socket) => {
  socket.on('chat message', (msg) => {
    console.log('message: ' + msg);
  });
});
```

结果应如下视频所示：

<video controls width="100%"><source src="https://i.cloudup.com/transcoded/zboNrGSsai.mp4" /></video>

:::info

<Tabs groupId="lang">
  <TabItem value="cjs" label="CommonJS" default attributes={{ className: 'display-none' }}>

你可以在浏览器中直接运行此示例：

- [CodeSandbox](https://codesandbox.io/p/sandbox/github/socketio/chat-example/tree/cjs/step4?file=index.js)
- [StackBlitz](https://stackblitz.com/github/socketio/chat-example/tree/cjs/step4?file=index.js)


  </TabItem>
  <TabItem value="mjs" label="ES modules" attributes={{ className: 'display-none' }}>

你可以在浏览器中直接运行此示例：

- [CodeSandbox](https://codesandbox.io/p/sandbox/github/socketio/chat-example/tree/esm/step4?file=index.js)
- [StackBlitz](https://stackblitz.com/github/socketio/chat-example/tree/esm/step4?file=index.js)


  </TabItem>
</Tabs>

:::