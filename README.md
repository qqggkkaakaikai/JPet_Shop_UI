# JPet Store（Vue 前端）

与后端项目 `pet_-shop` 配套：页面路由仍使用 `/index`、`/login` 等，由 Spring 转发到静态资源 `/spa/index.html`。

## 商家系统命名说明（已更新）

为和当前商家系统一致，文档与页面语义统一为：

- `购物车` -> `商品物流`
- `线上诊断` -> `商品上架审核`
- `我的服务` -> `商家服务`
- `个人简介` -> `商家介绍`

代码层仍保留部分历史路由路径（如 `/cart`、`/medical`）以兼容现有跳转，不影响页面显示文案。

## 开发

1. 启动后端（默认 `http://localhost:8080`）。
2. 在本目录执行：

```bash
npm install
npm run dev
```

浏览器访问：**http://localhost:5173/spa/**（注意带 `/spa/` 前缀，与生产 `base` 一致）。

接口与图片通过 Vite 代理到 8080（`/api`、`/user`、`/captcha`、`/images`）。

## 生产构建（写入后端 static）

```bash
npm run build
```

产物输出到：`../pet_-shop/src/main/resources/static/spa/`。

然后照常打包/运行 Spring Boot。访问示例：`http://localhost:8080/index`（会先进入 SPA）。

## 自定义 context-path

若 `application.yml` / `config.properties` 中 `app.contextPath` 非空，需同步：

- 在 `.env.production` 中设置 `VITE_CONTEXT_PATH=/你的前缀`
- 并将 `vite.config.js` 里的 `base` 改为 `` `${VITE_CONTEXT_PATH}/spa/` ``（可用 `loadEnv` 读取），再执行构建。

## 后端最小改动说明

- `PageController`：各页面 `GET` 改为 `forward:/spa/index.html`。
- `UserAuthController`：登录/注册失败改为 `redirect:/login?...`，便于 SPA 读取查询参数。
