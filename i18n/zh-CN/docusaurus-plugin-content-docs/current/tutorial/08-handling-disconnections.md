---
title: 教程 - 处理断开连接
sidebar_label: 处理断开连接
slug: handling-disconnections
---

import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 处理断开连接

现在，让我们强调 Socket.IO 的两个非常重要的特性：

1. Socket.IO 客户端并不总是连接的
2. Socket.IO 服务器不存储任何事件

:::caution

即使在稳定的网络上，也无法永远保持连接。

:::

这意味着您的应用程序需要能够在临时断开连接后，将客户端的本地状态与服务器上的全局状态同步。

:::note

Socket.IO 客户端会在短暂延迟后自动尝试重新连接。然而，断开连接期间错过的任何事件对于该客户端来说将会丢失。

:::

在我们的聊天应用程序中，这意味着断开连接的客户端可能会错过一些消息：

<ThemedImage
  alt="断开连接的客户端未收到 'chat message' 事件"
  sources={{
    light: useBaseUrl('/images/tutorial/disconnected.png'),
    dark: useBaseUrl('/images/tutorial/disconnected-dark.png'),
  }}
/>

我们将在接下来的步骤中看到如何改进这一点。