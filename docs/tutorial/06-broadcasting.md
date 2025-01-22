---
title: "Tutorial step #5 - Broadcasting"
sidebar_label: "Step #5: Broadcasting"
slug: step-5
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Broadcasting

The next goal is for us to emit the event from the server to the rest of the users.

In order to send an event to everyone, Socket.IO gives us the `io.emit()` method.

```js
// this will emit the event to all connected sockets
// put this code on index.js file
io.emit('hello', 'world'); 
```

If you want to send a message to everyone except for a certain emitting socket, we have the `broadcast` flag for emitting from that socket:

```js
// put this code on index.js file
io.on('connection', (socket) => {
  socket.broadcast.emit('hi');
});
```

In this case, for the sake of simplicity we’ll send the message to everyone, including the sender.

```js
replace this line of code from index.js 
io.on('connection', (socket) => {
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });
});
```

And on the client side when we capture a `chat message` event we’ll include it in the page.

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

Let's see it in action:

<video controls autoplay="" loop="" width="100%"><source src="https://i.cloudup.com/transcoded/J4xwRU9DRn.mp4" /></video>

:::info

<Tabs groupId="lang">
  <TabItem value="cjs" label="CommonJS" default attributes={{ className: 'display-none' }}>

You can run this example directly in your browser on:

- [CodeSandbox](https://codesandbox.io/p/sandbox/github/socketio/chat-example/tree/cjs/step5?file=index.js)
- [StackBlitz](https://stackblitz.com/github/socketio/chat-example/tree/cjs/step5?file=index.js)


  </TabItem>
  <TabItem value="mjs" label="ES modules" attributes={{ className: 'display-none' }}>

You can run this example directly in your browser on:

- [CodeSandbox](https://codesandbox.io/p/sandbox/github/socketio/chat-example/tree/esm/step5?file=index.js)
- [StackBlitz](https://stackblitz.com/github/socketio/chat-example/tree/esm/step5?file=index.js)


  </TabItem>
</Tabs>

:::
