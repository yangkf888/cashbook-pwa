import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SpaceTabs from "@/components/SpaceTabs";

export default async function SpaceLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { spaceId: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const [space, membership] = await Promise.all([
    prisma.space.findUnique({
      where: { id: params.spaceId }
    }),
    prisma.spaceMember.findUnique({
      where: {
        spaceId_userId: {
          spaceId: params.spaceId,
          userId: session.user.id
        }
      }
    })
  ]);

  if (!space || !membership) {
    notFound();
  }

  const canCreate = membership.role !== "viewer";

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600"
            >
              返回
            </Link>
            <div>
              <div className="text-sm text-slate-500">当前账本</div>
              <div className="text-base font-semibold text-slate-900">
                {space.name}
              </div>
            </div>
          </div>
          {canCreate ? (
            <Link
              href={`/app/spaces/${params.spaceId}/transactions?new=1`}
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white"
            >
              + 记一笔
            </Link>
          ) : (
            <span className="rounded-full bg-slate-200 px-5 py-2 text-sm font-semibold text-slate-500">
              + 记一笔
            </span>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-5">{children}</main>
      <SpaceTabs spaceId={params.spaceId} isFamily={space.type === "family"} />
    </div>
  );
}
