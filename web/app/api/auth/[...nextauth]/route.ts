// Auth.js catch-all Route Handler —— 暴露 GET/POST 给 /api/auth/*（signin、callback、verify 等）。
import { handlers } from '@/lib/auth/config';

export const { GET, POST } = handlers;
