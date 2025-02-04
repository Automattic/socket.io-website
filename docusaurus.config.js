const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

const helpItems = [
  {
    // 使用 'type: "doc"' 使链接在用户位于 "/docs" 目录中的页面时处于活动状态
    // 参见: https://github.com/facebook/docusaurus/issues/8018
    label: "故障排除",
    to: "/docs/v4/troubleshooting-connection-issues/",
  },
  {
    label: "Stack Overflow",
    href: "https://stackoverflow.com/questions/tagged/socket.io",
  },
  {
    label: "GitHub 讨论",
    href: "https://github.com/socketio/socket.io/discussions",
  },
  {
    label: "Slack",
    href: "https://socketio-slackin.herokuapp.com/",
  },
];

const toolsItems = [
  {
    label: "CDN",
    href: "https://cdn.socket.io",
  },
  {
    label: "管理界面",
    href: "https://admin.socket.io",
  },
];

const newsItems = [
  {
    label: "博客",
    to: "/blog",
  },
  {
    label: "Twitter",
    href: "https://twitter.com/SocketIO",
  },
];

const aboutItems = [
  {
    label: "常见问题",
    to: "/docs/v4/faq/",
  },
  {
    label: "更新日志",
    to: "/docs/v4/changelog/",
  },
  {
    label: "路线图",
    href: "https://github.com/orgs/socketio/projects/3",
  },
  {
    label: "成为赞助商",
    href: "https://opencollective.com/socketio",
  },
];

/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: "Socket.IO",
  tagline: "恐龙很酷",
  url: "https://socket.io",
  baseUrl: "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "images/favicon.png",
  organizationName: "socketio",
  projectName: "socket.io",
  themeConfig: {
    navbar: {
      title: "Socket.IO",
      hideOnScroll: true,
      logo: {
        alt: "Socket.IO 标志",
        src: "images/logo.svg",
        srcDark: "images/logo-dark.svg",
      },
      items: [
        {
          type: "dropdown",
          label: "文档",
          position: "left",
          items: [
            {
              type: "doc",
              label: "指南",
              docId: "categories/Documentation/index",
            },
            {
              type: "doc",
              label: "教程",
              docId: "tutorial/introduction",
            },
            {
              label: "示例",
              to: "/get-started/",
            },
            {
              type: "doc",
              label: "Emit 速查表",
              docId: "emit-cheatsheet"
            }
          ]
        },
        {
          type: "doc",
          docId: "server-api",
          position: "left",
          label: "服务器 API",
        },
        {
          type: "doc",
          docId: "client-api",
          position: "left",
          label: "客户端 API",
        },
        {
          type: "dropdown",
          label: "生态系统",
          position: "left",
          items: [
            {
              type: "html",
              className: "dropdown-category",
              value: "<b>帮助</b>",
            },
            ...helpItems,
            {
              type: "html",
              value: '<hr class="dropdown-separator">',
            },
            {
              type: "html",
              className: "dropdown-category",
              value: "<b>新闻</b>",
            },
            ...newsItems,
            {
              type: "html",
              value: '<hr class="dropdown-separator">',
            },
            {
              type: "html",
              className: "dropdown-category",
              value: "<b>工具</b>",
            },
            ...toolsItems,
          ],
        },
        {
          type: "dropdown",
          label: "关于",
          position: "left",
          items: aboutItems,
        },
        {
          type: "docsVersionDropdown",
          position: "right",
          dropdownItemsAfter: [
            {
              type: "html",
              value: '<hr class="dropdown-separator">',
            },
            {
              label: "更新日志",
              to: "/docs/v4/changelog/",
              activeBaseRegex: 'never',
            }
          ],
        },
        {
          type: "localeDropdown",
          position: "right",
        },
        {
          href: "https://github.com/socketio/socket.io",
          position: "right",
          className: "header-github-link",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "文档",
          items: [
            {
              label: "指南",
              to: "/docs/v4/",
            },
            {
              label: "教程",
              to: "/docs/v4/tutorial/introduction",
            },
            {
              label: "示例",
              to: "/get-started/",
            },
            {
              label: "服务器 API",
              to: "/docs/v4/server-api/",
            },
            {
              label: "客户端 API",
              to: "/docs/v4/client-api/",
            },
          ],
        },
        {
          title: "帮助",
          items: helpItems,
        },
        {
          title: "新闻",
          items: newsItems,
        },
        {
          title: "工具",
          items: toolsItems,
        },
        {
          title: "关于",
          items: aboutItems,
        },
      ],
      copyright: `版权所有 © ${new Date().getFullYear()} Socket.IO`,
    },
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    prism: {
      theme: lightCodeTheme,
      darkTheme: darkCodeTheme,
    },
    algolia: {
      apiKey: "bcf148e965eaca9ed2e6868a50a9e42c",
      appId: "ZM7QMFKQCJ",
      indexName: "socket_io",
    },
    announcementBar: {
      content:
        '最新博客文章 (2024年7月25日): <a href="/blog/npm-package-provenance/">npm 包来源</a>.',
      backgroundColor: "#25c2a0",
      isCloseable: true,
    },
  },
  presets: [
    [
      "@docusaurus/preset-classic",
      {
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          showLastUpdateTime: true,
          editUrl: "https://github.com/socketio/socket.io-website/edit/main/",
          lastVersion: "current",
          versions: {
            current: {
              label: "4.x",
              path: "v4",
            },
            "3.x": {
              label: "3.x",
              path: "v3",
            },
            "2.x": {
              label: "2.x",
              path: "v2",
            },
          },
          sidebarItemsGenerator({
            isCategoryIndex: defaultCategoryIndexMatcher,
            defaultSidebarItemsGenerator,
            ...args
          }) {
            return defaultSidebarItemsGenerator({
              ...args,
              isCategoryIndex() {
                return false;
              },
            });
          },
        },
        blog: {
          showReadingTime: true,
          editUrl: "https://github.com/socketio/socket.io-website/edit/main/",
          blogSidebarCount: 10,
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      },
    ],
  ],
  i18n: {
    defaultLocale: "zh-CN",
    locales: ["en", "fr", "pt-br", "zh-CN"],
  }
};
