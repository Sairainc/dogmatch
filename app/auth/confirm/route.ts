import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next") || "/protected";

  if (!token_hash || !type) {
    console.error("Missing token_hash or type");
    return NextResponse.redirect(new URL("/sign-in?error=Invalid+verification+link", requestUrl.origin));
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    });

    if (error) {
      console.error("Verification error:", error.message);
      return NextResponse.redirect(new URL(`/sign-in?error=${encodeURIComponent(error.message)}`, requestUrl.origin));
    }

    // 検証成功後、セッションを更新
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("Session error:", sessionError.message);
      return NextResponse.redirect(new URL(`/sign-in?error=${encodeURIComponent(sessionError.message)}`, requestUrl.origin));
    }

    if (!session) {
      console.error("No session after verification");
      return NextResponse.redirect(new URL("/sign-in?error=No+session+after+verification", requestUrl.origin));
    }

    return NextResponse.redirect(new URL(next, requestUrl.origin));
  } catch (e) {
    console.error("Unexpected error:", e);
    return NextResponse.redirect(new URL("/sign-in?error=Unexpected+error+during+verification", requestUrl.origin));
  }
} 