// auth error 页。
// ⚠️ 通用文案，不区分错误类型（链接过期 / 坏 token / AccessDenied），也不回显邮箱 / 错误参数
//    （AC9 + code-review F6）：既避免误导 alex，也不让错误页参与「该邮箱是否在白名单」的成员身份
//    推断。具体错误原因只进服务端日志。
// ⚠️ 视觉系统属 Story 1.4；此处仅极简语义结构。
import Link from 'next/link';

export default function AuthErrorPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-xl font-semibold tracking-tight">MindPrint</h1>
      <p>无法完成登录。</p>
      <p>登录链接可能已失效或已被使用。请返回重新发送 Magic Link。</p>
      <Link href="/auth/signin" className="rounded-md border px-3 py-2 font-medium">
        返回
      </Link>
    </main>
  );
}
