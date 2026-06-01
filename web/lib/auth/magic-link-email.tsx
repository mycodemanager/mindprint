// Magic Link 邮件模板（React Email）。
//
// 纯展示组件，无 DOM / 浏览器 API：由服务端 render()（@react-email/render）渲染为 HTML/纯文本，
// 经 Resend 发送（见 lib/auth/config.ts 的 sendVerificationRequest）。
//
// Voice（EXPERIENCE.md，严格匹配）：陈述、克制、句号收束、无 emoji / 无感叹号。
// ⚠️ 视觉系统（DESIGN.md tokens / 字体 / 暗色）属 Story 1.4；此处仅用邮件客户端必需的内联样式。
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components';

export function MagicLinkEmail({ url }: { url: string }) {
  return (
    <Html lang="zh-CN">
      <Head />
      <Preview>登录 MindPrint</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={wordmark}>MindPrint</Heading>
          <Text style={paragraph}>你请求登录 MindPrint。</Text>
          <Button href={url} style={button}>
            登录
          </Button>
          <Text style={muted}>如未请求可忽略。</Text>
        </Container>
      </Body>
    </Html>
  );
}

// 内联样式（邮件客户端不读外部 CSS）—— 中性、克制，非 DESIGN.md tokens。
const body: React.CSSProperties = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  color: '#18181b',
};

const container: React.CSSProperties = {
  margin: '0 auto',
  padding: '40px 24px',
  maxWidth: '420px',
};

const wordmark: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 600,
  letterSpacing: '-0.01em',
  margin: '0 0 24px',
};

const paragraph: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 24px',
};

const button: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#18181b',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 500,
  padding: '12px 24px',
  borderRadius: '8px',
  textDecoration: 'none',
};

const muted: React.CSSProperties = {
  fontSize: '13px',
  lineHeight: '20px',
  color: '#71717a',
  margin: '24px 0 0',
};
