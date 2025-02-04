---
title: 教程 - 介绍
sidebar_label: 介绍
slug: introduction
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 入门指南

欢迎来到 Socket.IO 教程！

在本教程中，我们将创建一个基本的聊天应用程序。几乎不需要任何 Node.JS 或 Socket.IO 的基础知识，因此适合所有知识水平的用户。

## 介绍

使用像 LAMP（PHP）这样的流行 Web 应用程序栈编写聊天应用程序通常非常困难。它涉及轮询服务器以获取更改、跟踪时间戳，并且速度比预期的要慢得多。

套接字传统上是大多数实时聊天系统构建的解决方案，提供客户端和服务器之间的双向通信通道。

这意味着服务器可以*推送*消息给客户端。每当您编写聊天消息时，服务器会获取它并将其推送给所有其他已连接的客户端。

## 如何使用本教程

### 工具

任何文本编辑器（从基本文本编辑器到完整的 IDE，如 [VS Code](https://code.visualstudio.com/)）都足以完成本教程。

此外，在每个步骤的末尾，您会找到一些在线平台的链接（如 [CodeSandbox](https://codesandbox.io) 和 [StackBlitz](https://stackblitz.com)），允许您直接从浏览器运行代码：

![CodeSandbox 平台截图](/images/codesandbox.png)

### 语法设置

在 Node.js 世界中，有两种方式导入模块：

- 标准方式：ECMAScript 模块（或 ESM）

```js
import { Server } from "socket.io";
```

参考：https://nodejs.org/api/esm.html

- 传统方式：CommonJS

```js
const { Server } = require("socket.io");
```

参考：https://nodejs.org/api/modules.html

Socket.IO 支持这两种语法。

:::tip

我们建议在您的项目中使用 ESM 语法，但由于某些包不支持此语法，这可能并不总是可行。

:::

为了方便您，在整个教程中，每个代码块都允许您选择首选的语法：

<Tabs groupId="lang">
  <TabItem value="cjs" label="CommonJS" default>

```js
const { Server } = require("socket.io");
```

  </TabItem>
  <TabItem value="mjs" label="ES modules">

```js
import { Server } from "socket.io";
```

  </TabItem>
</Tabs>

准备好了吗？点击“下一步”开始吧。