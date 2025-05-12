import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  // This `try/catch` block is only here for the interactive tutorial.
  // Feel free to remove once you have Supabase connected.
  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const { data: { user } } = await supabase.auth.getUser();

    // 認証が必要なルート
    if (request.nextUrl.pathname.startsWith("/protected") && !user) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    // 登録ページへのアクセスは常に許可
    if (request.nextUrl.pathname === "/register") {
      return response;
    }

    // ログイン済みユーザーのプロフィール完了確認
    if (user && !request.nextUrl.pathname.startsWith("/api") && 
        !request.nextUrl.pathname.includes('_next') && 
        !request.nextUrl.pathname.includes('favicon') &&
        request.nextUrl.pathname !== "/register") {
      
      // プロフィール情報を取得
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, is_profile_completed')
        .eq('id', user.id)
        .single();
      
      // プロフィールが未完了の場合は登録ページへリダイレクト
      if (!profile || !profile.is_profile_completed) {
        return NextResponse.redirect(new URL("/register", request.url));
      }
    }

    // ルートページにアクセスした場合
    if (request.nextUrl.pathname === "/") {
      if (!user) {
        // 未認証の場合はサインインページにリダイレクト
        return NextResponse.redirect(new URL("/sign-in", request.url));
      } else {
        // 認証済みの場合はディスカバリーページにリダイレクト
        return NextResponse.redirect(new URL("/discovery", request.url));
      }
    }

    return response;
  } catch (e) {
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    // Check out http://localhost:3000 for Next Steps.
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
