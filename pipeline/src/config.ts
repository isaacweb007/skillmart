export function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`환경 변수 ${name} 누락 — .env.example 참고`);
  return v;
}
