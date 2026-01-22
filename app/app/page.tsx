import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AppHomePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const memberships = await prisma.spaceMember.findMany({
    where: { userId: session.user.id },
    include: { space: true }
  });

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">当前用户</h2>
        <div className="mt-4 space-y-1 text-sm text-slate-600">
          <p>用户 ID：{session.user.id}</p>
          <p>邮箱：{session.user.email}</p>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">可访问的账本</h2>
          <Link
            className="text-sm font-medium text-slate-900 underline"
            href="/app/spaces/new"
          >
            新建家庭账本
          </Link>
        </div>
        <ul className="mt-4 space-y-3">
          {memberships.map((membership) => (
            <li
              key={membership.id}
              className="rounded-md border border-slate-200 px-4 py-3 text-sm"
            >
              <div className="font-medium text-slate-900">
                {membership.space.name}
              </div>
              <div className="text-slate-600">
                类型：{membership.space.type} · 我的角色：{membership.role}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
