# REA 复刻记录

调查日期：2026-11-20（Asia/Shanghai）。工作区：`F:/UnityStorming/MDEditor`。

## 目标与实现

用户消息的实际目标链接为 `https://markdown.com.cn/wechat/`，链接展示文字中的 GitHub URL 指向 REA 项目。本次复刻实际目标页面。

REA 使用临时 Chrome 配置录制目标页面，捕获 DOM、无障碍树、网络资源与截图。目标是纯前端站点，公开脚本包含主题定义、示例模板、Markdown 转换器、源码高亮和编辑器交互。完整资源下载后保留原实现，使本地行为和样式与所观察版本一致。

新增 Node 静态服务器、Windows 启动脚本、验证脚本和来源文档。原站 favicon 请求返回 404，本地新增与页面 W 标志相符的 SVG。HTML、CSS、五份业务 JS 保持原站内容。

## 证据与结果

| 项目 | 结果 | REA Evidence ID / 文件 |
| --- | --- | --- |
| 原站初始页面 | 已观察；DOM、无障碍、截图和 8 个网络事务；原站 favicon 为 404 | `ev_ba896f94b8c8e9f3780994f93b5f98835842bdaa95200eaea9a07d99a136578f` |
| 本地初始页面 | 已观察；所有 8 个网络事务均为本地 2xx | `ev_fd7f4ea2b81d918e72725075499ff79ae05b8b6f46c9366a6643e047868ca070` |
| 桌面截图比较 | 1440×1000，阈值 0；差异像素 0，像素差异比例 0 | `ev_76371dba3a877659bcdac4535b7b4f3abdeea48f868980ebcebd833607571461` |
| 本地交互验证 | 18 项通过，无脚本异常，无外部 HTTP(S) 运行依赖请求 | `evidence/browser-verification.json` |
| 390 px 手机布局 | 无页面横向溢出，已截图人工检查 | `evidence/local-mobile.png` |

两张桌面 PNG 的 SHA-256 均为 `cfddd65e1dc29fe21de1eb43838bc3ea512215e72571352350867f2aa01ca0e2`。

`evidence/rea-original.json` 是最初录制的导出；`evidence/rea-complete.json` 包含最终录制与比较记录。`evidence/resource-manifest.json` 记录本地化资源的来源 URL、字节数与 SHA-256。

## 覆盖边界

截图相同仅证明本次桌面首屏在相同 Chrome、视口与语言下逐像素相同。移动截图和本地交互由独立 Playwright 检查验证。富文本复制已实际读回系统剪贴板中的 HTML 与纯文本；微信公众号后台最终粘贴和发布未在本次调查中操作。原站未来更新不会自动同步至本地副本。
