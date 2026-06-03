// 临时烟雾测试（Story 2.1 AC8）—— 验证 R2 helper 端到端：upload → fetch → 字节一致 → 清理。
//
// 运行（从 web/，且 web/.env.local 已填真实 R2 凭据）：
//   node --conditions=react-server --env-file=.env.local --import tsx scripts/r2-smoke.ts
//   · --conditions=react-server：让 lib/env.ts / lib/r2/* 的 `import 'server-only'` 解析到空实现（否则抛错）
//   · --env-file=.env.local：Node ≥20.6 在任何模块导入前注入 env（env.ts 才读得到 R2 值）
//   （Node 太旧时改用：npx dotenv-cli -e .env.local -- node --conditions=react-server --import tsx scripts/r2-smoke.ts）
//
// 验证通过后本文件可删除（或保留备查）。
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { uploadEntryHtml } from '../lib/r2/upload';
import { fetchEntryHtml } from '../lib/r2/fetch';
import { r2Client } from '../lib/r2/client';
import { env } from '../lib/env';

const TEST_KEY = 'entries/_smoke/_smoke-test.html';
const PAYLOAD = '<html>hello</html>';

async function main() {
  console.log('[r2-smoke] uploading…', { key: TEST_KEY });
  await uploadEntryHtml(TEST_KEY, PAYLOAD);

  // upload 成功后，无论后续断言成败都必须清理 → try/finally（防孤儿对象）。
  try {
    console.log('[r2-smoke] fetching…');
    const res = await fetchEntryHtml(TEST_KEY);
    const got = await res.text();
    if (got !== PAYLOAD) {
      throw new Error(
        `[r2-smoke] ❌ 字节不一致：期望 ${JSON.stringify(PAYLOAD)}，得到 ${JSON.stringify(got)}`,
      );
    }
    console.log('[r2-smoke] ✅ round-trip 字节一致');

    // 私有性（AC8）：未授权（无签名）GET 必须非 200，否则 bucket 公开泄露 → 脚本自身断言并据此 fail。
    const objectUrl = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET_NAME}/${TEST_KEY}`;
    const anon = await fetch(objectUrl);
    if (anon.status === 200) {
      throw new Error(
        `[r2-smoke] ❌ bucket 非私有：未授权 GET 返回 200 → ${objectUrl}`,
      );
    }
    console.log(`[r2-smoke] ✅ bucket 私有：未授权 GET → HTTP ${anon.status}（非 200）`);
  } finally {
    await r2Client.send(
      new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: TEST_KEY }),
    );
    console.log('[r2-smoke] 🧹 已删除测试对象');
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
