# Weaviate Web Console | Weaviate 控制台

> A modern web UI for managing [Weaviate](https://weaviate.io/) vector database. Built with Vue 3 + Vite + Element Plus.  
> 基于 Vue 3 + Vite + Element Plus 的 Weaviate 向量数据库管理界面。

[English](#english) | [中文](#中文)

---

<a name="english"></a>

## English

### Features

| Module | Description |
|--------|-------------|
| **Overview** | Service liveness/readiness status, instance metadata, response time chart, quick links |
| **Schema** | Create, view, delete Collections; add properties; view shards & vectorizer config |
| **Objects** | Browse objects by Collection, create/batch import/batch delete, view details with vector |
| **GraphQL** | Execute native GraphQL queries with syntax highlighting |
| **Classifications** | Query classification task status, create classification via POST |

### Tech Stack

- Vue 3 (Composition API + `<script setup>`)
- Vite 7
- TypeScript
- Element Plus
- Tailwind CSS 4
- Vue Router 5
- Pinia
- vue-i18n

### Languages

Supports 7 locales: **中文**, **繁體中文**, **English**, **日本語**, **한국어**, **Español**, **Русский**.

### Getting Started

**Prerequisites:** Weaviate running (e.g. `http://127.0.0.1:8182`)

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

In dev mode, requests to `/v1` are proxied to `http://127.0.0.1:8182` (configurable in `vite.config.ts`).

### Build

```bash
npm run build
```

Output: `dist/` (static files, deploy to any static host).

### Docker

镜像内置 nginx 反向代理，将 `/v1` 转发到宿主机 Weaviate，避免 CORS。

```bash
# 构建镜像
docker build -t weaviate-web-console .

# 运行（Mac/Windows 可直接用；Linux 需加 --add-host）
docker run -d -p 3000:80 --name weaviate-console weaviate-web-console

# Linux 需添加（否则无法解析 host.docker.internal）
docker run -d -p 3000:80 --add-host=host.docker.internal:host-gateway --name weaviate-console weaviate-web-console
```

浏览器访问 `http://localhost:3000`，默认使用同源 `/v1` 代理连接宿主机 Weaviate（端口 8182）。可在界面右上角齿轮中修改 API 地址。

### API Configuration

- **Dev:** Change proxy target in `vite.config.ts` if Weaviate is not at `127.0.0.1:8182`
- **Runtime:** Use the gear icon (API Settings) in the header to set the API base URL. Value is persisted in `localStorage`.

### API Docs

When connected, open: `http://<your-api>/v1/docs`

### Releases

When you [create a GitHub Release](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository), the [release workflow](.github/workflows/release.yml) automatically builds the project and uploads `weaviate-web-console-<tag>.zip` (built `dist/` contents) as a release asset. No manual build needed.

---

<a name="中文"></a>

## 中文

### 功能

| 模块 | 说明 |
|------|------|
| **概览** | 存活/就绪检查、实例元数据、响应时间曲线、快速入口 |
| **Schema 管理** | 创建、查看、删除 Collection；添加属性；查看 Shards 与向量化配置 |
| **对象管理** | 按 Collection 浏览对象，新建/批量导入/批量删除，查看详情与向量 |
| **GraphQL** | 执行原生 GraphQL 查询，支持语法高亮 |
| **分类任务** | 查询分类任务状态，通过 POST 创建分类 |

### 技术栈

- Vue 3（Composition API + `<script setup>`）
- Vite 7
- TypeScript
- Element Plus
- Tailwind CSS 4
- Vue Router 5
- Pinia
- vue-i18n

### 语言

支持 7 种语言：**中文**、**繁體中文**、**English**、**日本語**、**한국어**、**Español**、**Русский**。

### 快速开始

**前提：** 已运行 Weaviate（例如 `http://127.0.0.1:8182`）

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

开发模式下，`/v1` 请求会代理到 `http://127.0.0.1:8182`（可在 `vite.config.ts` 中修改）。

### 构建

```bash
npm run build
```

输出目录：`dist/`（静态文件，可部署到任意静态服务器）。

### API 配置

- **开发环境：** 若 Weaviate 不在 `127.0.0.1:8182`，修改 `vite.config.ts` 中的 proxy
- **运行时：** 使用右上角齿轮图标（API 设置）设置 API 地址，会保存到 `localStorage`

### API 文档

连接成功后访问：`http://<你的API>/v1/docs`

### 发布 Release

在 GitHub 上[创建 Release](https://docs.github.com/zh/repositories/releasing-projects-on-github/managing-releases-in-a-repository) 时，[发布工作流](.github/workflows/release.yml)会自动构建项目，并将 `weaviate-web-console-<tag>.zip`（构建产物 `dist/`）上传为 Release 附件，无需手动构建。
