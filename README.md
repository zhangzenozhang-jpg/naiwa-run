# 奶蛙快跑 3D

浏览器 3D 跑酷游戏。此发布包对应已移除豆奶的第 9 版。

## Render 发布

[一键打开 Render 发布配置](https://render.com/deploy?repo=https://github.com/zhangzenozhang-jpg/naiwa-run)

使用免费 Static Site。仓库内的 `render.yaml` 已包含发布设置：

- Build Command: `test -f dist/index.html`
- Publish Directory: `dist`
- 不需要环境变量、数据库或登录服务。

全部模型、JavaScript 依赖和音效随站点提供。
三维运行库的许可见 `dist/vendor/THREE-LICENSE.txt`；音效说明见 `dist/assets/CREDITS.txt`。

发布后需检测新域名在中国大陆的实际连通性，示例站点可访问不代表所有网络均可访问。
