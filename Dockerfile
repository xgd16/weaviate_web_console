# 多阶段构建：构建 + 运行
FROM node:20-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package.json package-lock.json ./
RUN npm ci

# 构建应用（同源代理模式，避免 CORS）
COPY . .
ARG VITE_DEFAULT_API_BASE=
ENV VITE_DEFAULT_API_BASE=$VITE_DEFAULT_API_BASE
RUN npm run build

# 运行阶段：Nginx 静态服务
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置（SPA 路由支持）
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
