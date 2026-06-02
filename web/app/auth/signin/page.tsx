// 登录页（Server Component）。极简：MindPrint wordmark + 邮箱 + 「发送 Magic Link」。
// 无注册 / 无社交 / 无找回密码（EXPERIENCE.md：单一登录入口）。
// ⚠️ 视觉系统属 Story 1.4；此处仅极简语义结构 + 基础布局，不引入 DESIGN.md tokens。
import { redirect } from 'next/navigation';
import { signIn } from '@/lib/auth/config';
import { isAllowedEmail } from '@/lib/auth/allowlist';

export default function SignInPage() {
  async function sendMagicLink(formData: FormData) {
    'use server';
    const email = String(formData.get('email') ?? '')
      .trim()
      .toLowerCase();

    // 白名单前置校验（AC11）：非白名单 → 不调 signIn（不发信、不写 token），统一跳 verify-request。
    // 这样无论邮箱是否在白名单，UI 都走向 verify-request，不泄露成员身份；
    // 真正的发信前拦截另由 callbacks.signIn 兜底（lib/auth/config.ts，同样落到 verify-request）。
    if (!isAllowedEmail(email)) {
      console.log('[auth] sign-in rejected (not allowlisted)');
      redirect('/auth/verify-request');
    }

    // 白名单：发 Magic Link；signIn 成功后由 Auth.js 跳到 verifyRequest 页（pages 配置）。
    await signIn('resend', { email, redirectTo: '/' });
  }

  return (
    <main
      id="main"
      className="flex flex-1 flex-col items-center justify-center gap-10 px-margin-mobile"
    >
      <h1 className="font-serif text-headline-md text-on-surface">MindPrint</h1>
      <form action={sendMagicLink} className="flex w-full max-w-xs flex-col gap-6">
        <label htmlFor="email" className="sr-only">
          邮箱
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="邮箱"
          className="border-b border-outline-variant bg-transparent px-1 py-2 font-sans text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-primary"
        />
        <button
          type="submit"
          className="rounded bg-primary px-5 py-2 font-sans text-label-caps uppercase text-on-primary shadow-card-rest transition hover:brightness-95"
        >
          发送 Magic Link
        </button>
      </form>
    </main>
  );
}
