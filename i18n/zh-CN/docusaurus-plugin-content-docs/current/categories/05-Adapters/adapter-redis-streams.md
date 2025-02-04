---
title: Redis Streams 适配器
sidebar_position: 3
slug: /redis-streams-adapter/
---

## 工作原理 {#how-it-works}

该适配器将使用 [Redis 流](https://redis.io/docs/data-types/streams/) 在 Socket.IO 服务器之间转发数据包。

与现有的 Redis 适配器（使用 [Redis Pub/Sub 机制](https://redis.io/docs/manual/pubsub/)）的主要区别在于，该适配器将正确处理与 Redis 服务器的任何临时断开连接，并在不丢失任何数据包的情况下恢复流。

注意事项：

- 所有命名空间使用单个流
- `maxLen` 选项允许限制流的大小
- 与基于 Redis PUB/SUB 机制的适配器不同，该适配器将正确处理与 Redis 服务器的任何临时断开连接，并恢复流
- 如果启用了[连接状态恢复](../01-Documentation/connection-state-recovery.md)，会话将作为经典的键/值对存储在 Redis 中

源代码: https://github.com/socketio/socket.io-redis-streams-adapter

## 安装 {#installation}

```
npm install @socket.io/redis-streams-adapter redis
```

## 使用方法 {#usage}

```js
import { createClient } from "redis";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-streams-adapter";

const redisClient = createClient({ host: "localhost", port: 6379 });

await redisClient.connect();

const io = new Server({
  adapter: createAdapter(redisClient)
});

io.listen(3000);
```

## 选项 {#options}

| 名称                | 描述                                                              | 默认值        |
|---------------------|-------------------------------------------------------------------|---------------|
| `streamName`        | Redis 流的名称。                                                  | `socket.io`   |
| `maxLen`            | 流的最大大小。使用近似修剪（~）。                                 | `10_000`      |
| `readCount`         | 每次 XREAD 调用要获取的元素数量。                                 | `100`         |
| `heartbeatInterval` | 两次心跳之间的毫秒数。                                            | `5_000`       |
| `heartbeatTimeout`  | 在我们认为节点宕机之前没有心跳的毫秒数。                          | `10_000`      |

## 常见问题 {#common-questions}

- 使用 Redis Streams 适配器时，我仍然需要启用粘性会话吗？

是的。如果不这样做，将导致 HTTP 400 响应（您正在访问一个不了解 Socket.IO 会话的服务器）。

更多信息请参见[这里](../02-Server/using-multiple-nodes.md#why-is-sticky-session-required)。

- 当 Redis 服务器宕机时会发生什么？

与经典的 [Redis 适配器](./adapter-redis.md)不同，该适配器将正确处理与 Redis 服务器的任何临时断开连接，并在不丢失任何数据包的情况下恢复流。

## 最新版本 {#latest-releases}

- [0.1.0](https://github.com/socketio/socket.io-redis-streams-adapter/releases/tag/0.1.0) (2023年4月)
