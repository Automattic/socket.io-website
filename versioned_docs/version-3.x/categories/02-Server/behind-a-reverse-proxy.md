---
title: Behind a reverse proxy
sidebar_position: 6
slug: /reverse-proxy/
---

You will find below the configuration needed for deploying a Socket.IO server behind a reverse-proxy solution, such as:

- [NginX](#nginx)
- [Apache HTTPD](#apache-httpd)
- [Node.js `http-proxy`](#nodejs-http-proxy)
- [Caddy 2](#caddy-2)

In a multi-server setup, please check the documentation [here](using-multiple-nodes.md).

## NginX

Content of `/etc/nginx/nginx.conf`:

```nginx
http {
  server {
    listen 80;

    location / {
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header Host $host;

      proxy_pass http://localhost:3000;

      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
    }
  }
}
```

Related:

- [proxy_pass documentation](http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass)
- [configuration in a multi-server setup](using-multiple-nodes.md#nginx-configuration)

If you only want to forward the Socket.IO requests (for example when NginX handles the static content):

```
http {
  server {
    listen 80;
    root /var/www/html;

    location /socket.io/ {
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header Host $host;

      proxy_pass http://localhost:3000;

      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
    }
  }
}
```

Or with a custom [path](server-initialization.md#path):

```
http {
  server {
    listen 80;
    root /var/www/html;

    location /my-custom-path/ {
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header Host $host;

      proxy_pass http://localhost:3000;

      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
    }
  }
}
```

In that case, the server and the client must be configured accordingly:

*Server*

```js
import { Server } from "socket.io";

const io = new Server({
  path: "/my-custom-path/"
});
```

*Client*

```js
import { io } from "socket.io-client";

const socket = io({
  path: "/my-custom-path/"
});
```

## Apache HTTPD

Content of `/usr/local/apache2/conf/httpd.conf`:

```apache
Listen 80

ServerName example.com

LoadModule mpm_event_module             modules/mod_mpm_event.so

LoadModule authn_file_module            modules/mod_authn_file.so
LoadModule authn_core_module            modules/mod_authn_core.so
LoadModule authz_host_module            modules/mod_authz_host.so
LoadModule authz_groupfile_module       modules/mod_authz_groupfile.so
LoadModule authz_user_module            modules/mod_authz_user.so
LoadModule authz_core_module            modules/mod_authz_core.so

LoadModule headers_module               modules/mod_headers.so
LoadModule lbmethod_byrequests_module   modules/mod_lbmethod_byrequests.so
LoadModule proxy_module                 modules/mod_proxy.so
LoadModule proxy_balancer_module        modules/mod_proxy_balancer.so
LoadModule proxy_http_module            modules/mod_proxy_http.so
LoadModule proxy_wstunnel_module        modules/mod_proxy_wstunnel.so
LoadModule rewrite_module               modules/mod_rewrite.so
LoadModule slotmem_shm_module           modules/mod_slotmem_shm.so
LoadModule unixd_module                 modules/mod_unixd.so

User daemon
Group daemon

ProxyPass / http://localhost:3000/
RewriteEngine on
RewriteCond %{HTTP:Upgrade} websocket [NC]
RewriteCond %{HTTP:Connection} upgrade [NC]
RewriteRule ^/?(.*) "ws://localhost:3000/$1" [P,L]

ProxyTimeout 3
```

Related:

- [mod_proxy_wstunnel documentation](https://httpd.apache.org/docs/2.4/en/mod/mod_proxy_wstunnel.html)
- [configuration in a multi-server setup](using-multiple-nodes.md#apache-httpd-configuration)

## Node.js `http-proxy`

Installation: `npm i http-proxy`

```js
const httpProxy = require("http-proxy");

httpProxy
  .createProxyServer({
    target: "http://localhost:3000",
    ws: true,
  })
  .listen(80);
```

[Documentation](https://github.com/http-party/node-http-proxy#readme)

## Caddy 2

Content of `Caddyfile` for [Caddy 2](https://caddyserver.com/v2)

```
example.com {
    reverse_proxy /socket.io/* localhost:3000
}
```

Related

- [Caddyfile reverse_proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy#reverse-proxy)
