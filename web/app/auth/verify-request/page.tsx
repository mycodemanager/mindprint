// verify-request 页：Magic Link 已发出后的提示页。
// 白名单与非白名单提交都跳到这里（AC11：不泄露成员身份）。
// ⚠️ 视觉系统属 Story 1.4；此处仅极简语义结构。
export default function VerifyRequestPage() {
  return (
    <main
      id="main"
      className="flex flex-1 flex-col items-center justify-center gap-6 px-margin-mobile text-center"
    >
      <h1 className="font-serif text-headline-md text-on-surface">MindPrint</h1>
      <p className="font-serif text-body-lg text-on-surface-variant">已发送 Magic Link。</p>
      <p className="font-serif text-body-lg text-on-surface-variant">请去邮箱点击链接登录。</p>
    </main>
  );
}
