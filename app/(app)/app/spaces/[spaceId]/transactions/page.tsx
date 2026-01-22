import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TransactionsClient from "./transactions-client";

export default async function TransactionsPage({
  params,
  searchParams
}: {
  params: { spaceId: string };
  searchParams?: { new?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const membership = await prisma.spaceMember.findUnique({
    where: {
      spaceId_userId: {
        spaceId: params.spaceId,
        userId: session.user.id
      }
    }
  });

  if (!membership) {
    notFound();
  }

  const transactions = await prisma.transaction.findMany({
    where: { spaceId: params.spaceId },
    orderBy: { date: "desc" }
  });

  return (
    <TransactionsClient
      spaceId={params.spaceId}
      userId={session.user.id}
      role={membership.role}
      openOnLoad={searchParams?.new === "1"}
      initialTransactions={transactions.map((transaction) => ({
        ...transaction,
        date: transaction.date.toISOString(),
        createdAt: transaction.createdAt.toISOString(),
        updatedAt: transaction.updatedAt.toISOString()
      }))}
    />
  );
}
