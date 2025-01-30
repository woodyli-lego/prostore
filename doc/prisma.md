# prisma 备忘

## 初始化

1. 执行 `npm i prisma --save-dev` 安装 prisma。
2. 执行 `npx prisma init --datasource-provider postgresql` 初始化。
3. 在 `.env` 中添加数据库连接 `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/prostore?schema=public"`。

## 迭代操作

1. 在 `prisma/schema.prisma` 定义 model。
2. 执行 `npx prisma generate`，在 `node_modules/@prisma` 生成客户端代码。
