'use client'

import { createBrowserClient } from "@supabase/ssr";

// Supabaseクライアントインスタンスの作成
export const createClient = () => {
  // 環境変数を取得
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  console.log("Supabase URL:", supabaseUrl); // Debug
  
  return createBrowserClient(supabaseUrl, supabaseKey);
};
