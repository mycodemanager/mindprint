// verify-request 页：Magic Link 已发出后的提示页。
// 白名单与非白名单提交都跳到这里（AC11：不泄露成员身份）。
// ⚠️ 视觉系统属 Story 1.4；此处仅极简语义结构。
export default function VerifyRequestPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-xl font-semibold tracking-tight">MindPrint</h1>
      <p>已发送 Magic Link。</p>
      <p>请去邮箱点击链接登录。</p>
    </main>
  );
}
