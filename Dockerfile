FROM node:18-alpine
# 安装构建依赖
RUN apk update && apk add --no-cache build-base gcc autoconf automake libtool vips-dev zlib-dev libpng-dev
WORKDIR /opt/
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NODE_ENV=production
RUN npm run build
EXPOSE 1337
CMD ["npm", "run", "start"]