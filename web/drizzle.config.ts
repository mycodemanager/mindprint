// Drizzle Kit 配置（dev 用 `push`；上线前 Story 4.5 切 `generate + migrate`）。
//
// drizzle-kit 不像 Next 那样自动加载 .env.local —— 这里用 dotenv 显式加载。
// dotenv 默认「不覆盖」已存在的 process.env，故 `DATABASE_URL=... npx drizzle-kit push`
// 仍可在 CI / 临时覆盖时生效（显式 env > .env.local，与 Next 的优先级一致）。
import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env.local' });

// 守卫：缺 DATABASE_URL 时给出明确指引，避免 drizzle-kit 抛含糊的连接错误。
// （drizzle.config 不经过 lib/env.ts 的 Zod 校验，故此处单独兜底。）
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL 未设置：请在 web/.env.local 填入 Neon 连接串，或运行时 `DATABASE_URL=... npx drizzle-kit push`。',
  );
}

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
