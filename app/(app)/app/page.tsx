import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SignOutButton from "@/components/SignOutButton";

export default async function AppHomePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const memberships = await prisma.spaceMember.findMany({
    where: { userId: session.user.id },
    include: { space: true },
    orderBy: { createdAt: "asc" }
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">我的账本</h1>
          <p className="text-sm text-slate-500">选择要进入的账本</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span>{session.user.email}</span>
          <SignOutButton />
        </div>
      </div>

      <div className="flex justify-end">
        <Link
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          href="/app/spaces/new"
        >
          新建家庭账本
        </Link>
      </div>

      <ul className="space-y-4">
        {memberships.map((membership) => (
          <li key={membership.id}>
            <Link
              href={`/app/spaces/${membership.space.id}`}
              className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold text-slate-900">
                    {membership.space.name}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {membership.space.type === "personal" ? "个人账本" : "家庭账本"}
                    <span className="mx-2">·</span>
                    {membership.role === "owner"
                      ? "拥有者"
                      : membership.role === "member"
                        ? "成员"
                        : "只读"}
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  进入
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
