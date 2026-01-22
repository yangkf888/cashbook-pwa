# Cashbook PWA (PR1)

PWA 风格的多用户个人/家庭记账本骨架，基于 Next.js 14 App Router + Auth.js(NextAuth) + Prisma + Postgres。

## 技术栈
- Next.js 14 + TypeScript + TailwindCSS
- Auth.js (NextAuth) Credentials 登录
- Prisma ORM + Postgres
- Docker Compose 一键启动（web + db）

## 功能范围（PR1）
- 用户注册/登录/退出（邮箱 + 密码）
- 注册后自动创建 personal space（默认“我的账本”）并加入 owner
- /app 首页显示当前用户信息 + 可访问 spaces 列表
- /app/spaces/new 创建家庭账本（family）
- API：/api/auth/register, /api/spaces(GET/POST)

## 项目结构
```
app/
  api/
  app/
  auth/
components/
lib/
prisma/
```

## 环境变量
复制 `.env.example` 为 `.env` 并填写：
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cashbook?schema=public
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-strong-secret
```

## 本地启动（pnpm）
```bash
pnpm install
pnpm bootstrap
pnpm dev
```
访问 http://localhost:3000

### Seed 账户
- alice@example.com / password123
- bob@example.com / password123

## Docker Compose 启动
1) 准备 `.env`
```bash
cp .env.example .env
```
2) 启动服务并初始化数据库（单条命令）
```bash
docker compose up -d --build && docker compose exec web pnpm bootstrap
```
访问 http://localhost:3000

## VPS 部署步骤
1) 同步代码并准备 `.env`
```bash
cp .env.example .env
```
2) 构建并启动容器（首次或更新版本）
```bash
docker compose up -d --build
```
3) 初始化数据库（首次部署或需要重置时）
```bash
docker compose exec web pnpm bootstrap
```
4) 验证 Prisma 客户端可用
```bash
docker compose exec web node -e "require('@prisma/client'); console.log('prisma ok')"
```
5) 访问登录页
```bash
http://<VPS_IP>:3000/auth/login
```

## Prisma 常用命令
```bash
pnpm bootstrap
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
```

## 常见问题
- **端口冲突**：确保 3000 和 5432 没有被占用。
- **数据库连接失败**：检查 `DATABASE_URL` 是否与容器/本地地址匹配。
- **首次登录失败**：请先运行 `pnpm prisma:migrate` 与 `pnpm prisma:seed`。
