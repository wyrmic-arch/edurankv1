import { redirect } from "next/navigation";

// Staff invite link: /join?code=XXXXXX → pre-fill the register form.
export default function JoinPage({ searchParams }: { searchParams: { code?: string } }) {
  const code = (searchParams.code ?? "").trim().toUpperCase();
  redirect(code ? `/register?invite=${encodeURIComponent(code)}` : "/register");
}
