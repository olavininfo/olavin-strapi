# 使用 Node.js 20 提高与 Strapi v5 的兼容性
FROM node:20-alpine

# 安装构建依赖
RUN apk update && apk add --no-cache build-base gcc autoconf automake libtool vips-dev zlib-dev libpng-dev python3 make

# 设置统一的工作目录
WORKDIR /opt/app

# 先复制 package 文件并强制安装
COPY package.json package-lock.json ./
# 增加 --prefer-offline 确保优先使用缓存，增加 --no-audit 减少报错
RUN npm install --prefer-offline --no-audit

# 复制其余项目文件
COPY . .

# 确保在容器内也能找到 node_modules
ENV NODE_PATH=/opt/app/node_modules
ENV NODE_ENV=production

# 构建项目
RUN npm run build

EXPOSE 1337

CMD ["npm", "run", "start"]