'use client'

import { createBrowserClient } from "@supabase/ssr";

// Supabaseクライアントインスタンスの作成
export const createClient = () => {
  // 環境変数を取得
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  console.log("Supabase URL:", supabaseUrl); // Debug
  
  // クライアントインスタンスを作成し、カスタム設定を追加
  const client = createBrowserClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
    },
    global: {
      // バージョンを明示的に設定
      fetch: (url, options) => {
        // リクエストのURLをログ出力（デバッグ用）
        console.log("Supabase Fetch:", url);
        return fetch(url, {
          ...options,
          // CORSヘッダーを追加
          headers: {
            ...options?.headers,
            'Access-Control-Allow-Origin': '*',
          }
        });
      }
    }
  });
  
  return client;
};
