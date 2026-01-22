import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import LoginForm from "./login-form";

type LoginPageProps = {
  searchParams?: {
    callbackUrl?: string;
  };
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    redirect("/app");
  }

  const rawCallbackUrl = searchParams?.callbackUrl;
  const callbackUrl =
    rawCallbackUrl && !rawCallbackUrl.startsWith("/auth") ? rawCallbackUrl : "/app";

  return <LoginForm callbackUrl={callbackUrl} />;
}
