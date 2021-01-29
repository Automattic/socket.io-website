title: Using multiple nodes
permalink: /docs/v3/using-multiple-nodes/
alias: /docs/using-multiple-nodes/
release: v3
type: docs
order: 209
---

When deploying multiple Socket.IO servers, there are two things to take care of:

- enabling sticky session, if HTTP long-polling is enabled (which is the default): see [below](#Sticky-load-balancing)
- using the Redis adapter (or another compatible [Adapter](/docs/v3/glossary/#Adapter)): see [below](#Passing-events-between-nodes)

## Sticky load balancing

If you plan to distribute the load of connections among different processes or machines, you have to make sure that requests associated with a particular session id connect to the process that originated them.

This is due to certain transports like XHR Polling or JSONP Polling relying on firing several requests during the lifetime of the &#8220;socket&#8221;. Failing to enable sticky balancing will result in the dreaded:

```
Error during WebSocket handshake: Unexpected response code: 400
```

Which means that the upgrade request was sent to a node which did not know the given socket id, hence the HTTP 400 response.

To illustrate why this is needed, consider the example of emitting an event to all connected clients:

```js
io.emit('hi', 'all sockets');
```

Chances are that some of those clients might have an active bi-directional communication channel like `WebSocket` that we can write to immediately, but some of them might be using long-polling.

If they&#8217;re using long polling, they might or might not have sent a request that we can write to. They could be &#8220;in between&#8221; those requests. In those situations, it means we have to buffer messages in the process. In order for the client to successfully claim those messages when he sends his request, the easiest way is for him to connect to be routed to that same process.

As noted above, `WebSocket` transport do not have this limitation, since the underlying TCP connection is kept open between the client and the given server. That's why you might find some suggestions to only use the `WebSocket` transport:

```js
const client = io('https://io.yourhost.com', {
  // WARNING: in that case, there is no fallback to long-polling
  transports: [ 'websocket' ] // or [ 'websocket', 'polling' ], which is the same thing
})
```

Both means that there is **NO FALLBACK** to long-polling when the websocket connection cannot be established, which is in fact one of the key feature of Socket.IO. In that case, you should maybe consider using raw [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket), or a thin wrapper like [robust-websocket](https://github.com/appuri/robust-websocket).

To achieve sticky-session, there are two main solutions:

- routing clients based on a cookie (recommended solution)
- routing clients based on their originating address


### NginX configuration

Within the `http { }` section of your `nginx.conf` file, you can declare a `upstream` section with a list of Socket.IO process you want to balance load between:

```nginx
http {
  server {
    listen 3000;
    server_name io.yourhost.com;

    location / {
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header Host $host;

      proxy_pass http://nodes;

      # enable WebSockets
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
    }
  }

  upstream nodes {
    # enable sticky session based on IP
    ip_hash;

    server app01:3000;
    server app02:3000;
    server app03:3000;
  }
}
```

Notice the `ip_hash` instruction that indicates the connections will be sticky.

Make sure you also configure `worker_processes` in the topmost level to indicate how many workers NginX should use. You might also want to look into tweaking the `worker_connections` setting within the `events { }` block.

[Example](https://github.com/socketio/socket.io/tree/master/examples/cluster-nginx)

### Apache HTTPD configuration

```apache
Header add Set-Cookie "SERVERID=sticky.%{BALANCER_WORKER_ROUTE}e; path=/" env=BALANCER_ROUTE_CHANGED

<Proxy "balancer://nodes_polling">
    BalancerMember "http://app01:3000" route=app01
    BalancerMember "http://app02:3000" route=app02
    BalancerMember "http://app03:3000" route=app03
    ProxySet stickysession=SERVERID
</Proxy>

<Proxy "balancer://nodes_ws">
    BalancerMember "ws://app01:3000" route=app01
    BalancerMember "ws://app02:3000" route=app02
    BalancerMember "ws://app03:3000" route=app03
    ProxySet stickysession=SERVERID
</Proxy>

RewriteEngine On
RewriteCond %{HTTP:Upgrade} =websocket [NC]
RewriteRule /(.*) balancer://nodes_ws/$1 [P,L]
RewriteCond %{HTTP:Upgrade} !=websocket [NC]
RewriteRule /(.*) balancer://nodes_polling/$1 [P,L]

ProxyTimeout 3
```

[Example](https://github.com/socketio/socket.io/tree/master/examples/cluster-httpd)

### HAProxy configuration

```
# Reference: http://blog.haproxy.com/2012/11/07/websockets-load-balancing-with-haproxy/

listen chat
  bind *:80
  default_backend nodes

backend nodes
  option httpchk HEAD /health
  http-check expect status 200
  cookie io prefix indirect nocache # using the `io` cookie set upon handshake
  server app01 app01:3000 check cookie app01
  server app02 app02:3000 check cookie app02
  server app03 app03:3000 check cookie app03
```

[Example](https://github.com/socketio/socket.io/tree/master/examples/cluster-haproxy)

### Using Node.JS Cluster

Just like NginX, Node.JS comes with built-in clustering support through the `cluster` module.

There are several solutions, depending on your use case:

| NPM package | How it works |
|:------:| ------------ |
| [`@socket.io/sticky`](https://github.com/darrachequesne/socket.io-sticky) | the routing is based on the `sid` query parameter |
| [`sticky-session`](https://github.com/indutny/sticky-session) | the routing is based on `connection.remoteAddress` |
| [`socketio-sticky-session`](https://github.com/wzrdtales/socket-io-sticky-session) | the routing based on the `x-forwarded-for` header) |

Example with `@socket.io/sticky`:

```js
const cluster = require("cluster");
const http = require("http");
const { Server } = require("socket.io");
const redisAdapter = require("socket.io-redis");
const numCPUs = require("os").cpus().length;
const { setupMaster, setupWorker } = require("@socket.io/sticky");

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  const httpServer = http.createServer();
  setupMaster(httpServer, {
    loadBalancingMethod: "least-connection", // either "random", "round-robin" or "least-connection"
  });
  httpServer.listen(3000);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  console.log(`Worker ${process.pid} started`);

  const httpServer = http.createServer();
  const io = new Server(httpServer);
  io.adapter(redisAdapter({ host: "localhost", port: 6379 }));
  setupWorker(io);

  io.on("connection", (socket) => {
    /* ... */
  });
}
```

## Passing events between nodes

### The Redis adapter

Now that you have multiple Socket.IO nodes accepting connections, if you want to broadcast events to all clients (or to the clients in a certain [room](/docs/v3/rooms/)) you&#8217;ll need some way of passing messages between processes or computers.

The interface in charge of routing messages is what we call the [Adapter](/docs/v3/glossary/#Adapter). You can implement your own on top of the [socket.io-adapter](https://github.com/socketio/socket.io-adapter) (by inheriting from it) or you can use the one we provide on top of [Redis](https://redis.io/): [socket.io-redis](https://github.com/socketio/socket.io-redis):

```js
const io = require('socket.io')(3000);
const redis = require('socket.io-redis');
io.adapter(redis({ host: 'localhost', port: 6379 }));
```

Then the following call:

```js
io.emit('hi', 'all sockets');
```

will be broadcast to every clients through the [Pub/Sub mechanism](https://redis.io/topics/pubsub) of Redis:

![Broadcasting with Redis](/images/broadcasting-redis.png)

### Sending messages from the outside world

Using the Redis adapter has another benefit: you can now emit events from outside the context of your Socket.IO processes.

![Diagram with Redis adapter and external emitter](/images/emitter.png)

This emitter is available in several languages:

- Javascript: https://github.com/socketio/socket.io-emitter
- Java: https://github.com/sunsus/socket.io-java-emitter
- Python: https://pypi.org/project/socket.io-emitter/
- PHP: https://github.com/rase-/socket.io-php-emitter
- Golang: https://github.com/yosuke-furukawa/socket.io-go-emitter
- Perl: https://metacpan.org/pod/SocketIO::Emitter
- Rust: https://github.com/epli2/socketio-rust-emitter
