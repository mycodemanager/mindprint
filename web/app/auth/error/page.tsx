// auth error 页。
// ⚠️ 不回显任何邮箱 / 错误参数（AC9：不泄露白名单邮箱地址 / 成员身份）。
// ⚠️ 视觉系统属 Story 1.4；此处仅极简语义结构。
import Link from 'next/link';

export default function AuthErrorPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-xl font-semibold tracking-tight">MindPrint</h1>
      <p>无法登录。</p>
      <p>此账号不在允许列表内。</p>
      <Link href="/auth/signin" className="rounded-md border px-3 py-2 font-medium">
        返回
      </Link>
    </main>
  );
}
