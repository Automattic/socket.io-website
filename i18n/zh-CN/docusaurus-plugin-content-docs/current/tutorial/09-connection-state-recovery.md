---
title: "教程步骤 #6 - 连接状态恢复"
sidebar_label: "步骤 #6: 连接状态恢复"
slug: step-6
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 连接状态恢复

首先，让我们通过假装没有断开连接来处理断开连接的情况：这个功能称为“连接状态恢复”。

此功能将**临时**存储服务器发送的所有事件，并在客户端重新连接时尝试恢复其状态：

- 恢复其房间
- 发送任何错过的事件

必须在服务器端启用此功能：

```js title="index.js"
const io = new Server(server, {
  // highlight-start
  connectionStateRecovery: {}
  // highlight-end
});
```

让我们看看它的实际效果：

<video controls width="100%"><source src="/videos/tutorial/connection-state-recovery.mp4" /></video>

如上面视频所示，当连接重新建立时，“实时”消息最终会被传递。

:::note

“断开连接”按钮是为了演示目的而添加的。

<details className="changelog">
    <summary>代码</summary>

<Tabs groupId="syntax">
  <TabItem value="es6" label="ES6" default>

```html
<form id="form" action="">
  <input id="input" autocomplete="off" /><button>发送</button>
  // highlight-start
  <button id="toggle-btn">断开连接</button>
  // highlight-end
</form>

<script>
  // highlight-start
  const toggleButton = document.getElementById('toggle-btn');

  toggleButton.addEventListener('click', (e) => {
    e.preventDefault();
    if (socket.connected) {
      toggleButton.innerText = '连接';
      socket.disconnect();
    } else {
      toggleButton.innerText = '断开连接';
      socket.connect();
    }
  });
  // highlight-end
</script>
```

  </TabItem>
  <TabItem value="es5" label="ES5">

```html
<form id="form" action="">
  <input id="input" autocomplete="off" /><button>发送</button>
  // highlight-start
  <button id="toggle-btn">断开连接</button>
  // highlight-end
</form>

<script>
  // highlight-start
  var toggleButton = document.getElementById('toggle-btn');

  toggleButton.addEventListener('click', function(e) {
    e.preventDefault();
    if (socket.connected) {
      toggleButton.innerText = '连接';
      socket.disconnect();
    } else {
      toggleButton.innerText = '断开连接';
      socket.connect();
    }
  });
  // highlight-end
</script>
```

  </TabItem>
</Tabs>
</details>

:::

很好！你可能会问：

> 这是一个很棒的功能，为什么默认没有启用呢？

原因有几个：

- 它并不总是有效，例如，如果服务器突然崩溃或重启，客户端状态可能无法保存
- 在扩展时并不总是可以启用此功能

:::tip

尽管如此，这确实是一个很棒的功能，因为在临时断开连接后（例如，当用户从 WiFi 切换到 4G 时），你不必同步客户端的状态。

:::

我们将在下一步探索一个更通用的解决方案。

:::info

<Tabs groupId="lang">
  <TabItem value="cjs" label="CommonJS" default attributes={{ className: 'display-none' }}>

你可以在浏览器中直接运行此示例：

- [CodeSandbox](https://codesandbox.io/p/sandbox/github/socketio/chat-example/tree/cjs/step6?file=index.js)
- [StackBlitz](https://stackblitz.com/github/socketio/chat-example/tree/cjs/step6?file=index.js)


  </TabItem>
  <TabItem value="mjs" label="ES modules" attributes={{ className: 'display-none' }}>

你可以在浏览器中直接运行此示例：

- [CodeSandbox](https://codesandbox.io/p/sandbox/github/socketio/chat-example/tree/esm/step6?file=index.js)
- [StackBlitz](https://stackblitz.com/github/socketio/chat-example/tree/esm/step6?file=index.js)


  </TabItem>
</Tabs>

:::