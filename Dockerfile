# 使用 Node.js 20 提高与 Strapi v5 的兼容性
FROM node:20-alpine

# 安装构建依赖（增加了 python3 和 make，这是 Strapi v5 某些原生模块必需的）
RUN apk update && apk add --no-cache build-base gcc autoconf automake libtool vips-dev zlib-dev libpng-dev python3 make

WORKDIR /opt/

# 先复制 package 文件
COPY package.json package-lock.json ./

# 增加下面这一行，用于打破构建缓存
RUN echo "build_id_$(date +%s)" > /build_id.txt

# 将 npm ci 改为 npm install，以解决 Windows 到 Linux 的锁文件兼容性问题
RUN npm install

# 复制其余文件
COPY . .

# 构建项目
ENV NODE_ENV=production
RUN npm run build

EXPOSE 1337

CMD ["npm", "run", "start"]