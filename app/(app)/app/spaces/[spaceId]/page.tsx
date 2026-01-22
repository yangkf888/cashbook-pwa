import { redirect } from "next/navigation";

export default function SpacePage({
  params
}: {
  params: { spaceId: string };
}) {
  redirect(`/app/spaces/${params.spaceId}/transactions`);
}
