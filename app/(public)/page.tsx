import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 py-12">
      <h1 className="text-3xl font-bold">Cashbook PWA</h1>
      <p className="text-center text-slate-600">
        欢迎使用多用户个人/家庭记账本。请先登录或注册。
      </p>
      <div className="flex gap-4">
        <Link className="rounded-md border border-slate-300 px-4 py-2 text-sm" href="/auth/login">
          登录
        </Link>
        <Link className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white" href="/auth/register">
          注册
        </Link>
      </div>
    </main>
  );
}
