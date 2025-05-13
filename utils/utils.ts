import { redirect } from "next/navigation";

/**
 * Redirects to a specified path with an encoded message as a query parameter.
 * @param {('error' | 'success')} type - The type of message, either 'error' or 'success'.
 * @param {string} path - The path to redirect to.
 * @param {string} message - The message to be encoded and added as a query parameter.
 * @returns {never} This function doesn't return as it triggers a redirect.
 */
export function encodedRedirect(
  type: "error" | "success",
  path: string,
  message: string,
) {
  return redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

/**
 * 画像URLを修正し、正しい形式に変換します。
 * Supabaseのストレージから取得したURLが不完全な場合に修正します。
 * CORS問題を回避するためにプロキシを使用します。
 * 
 * @param {string} url - 修正したい画像URL
 * @returns {string} 修正されたURL
 */
export function fixImageUrl(url: string): string {
  console.log("Fixing image URL:", url); // 詳細なデバッグログ
  
  // インラインSVGをBase64エンコードしたプレースホルダー
  const placeholderSvg = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjEwMCIgeT0iMTAwIiBmb250LXNpemU9IjE4IiBmaWxsPSIjYWFhYWFhIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
  
  if (!url) return placeholderSvg;
  
  // ローカルパスの場合はそのまま返す
  if (url.startsWith('/')) {
    return url;
  }
  
  // 本番環境のプロキシが利用できないため、直接URLを返す
  if (url.includes('supabase.co/storage')) {
    console.log("Direct URL access:", url);
    return url;
  }
  
  // URLが既に他の完全な形式かチェック
  if (url.startsWith('http') || url.startsWith('data:')) {
    return url;
  }
  
  // Supabaseのストレージ関連の修正
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && (url.includes('supabase') || url.includes('storage') || url.includes('/'))) {
    // URLにバケット名とパスが含まれているか確認
    const fullUrl = url.includes('/') 
      ? `${supabaseUrl}/storage/v1/object/public/${url}`
      : `${supabaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    
    console.log("Generated full URL:", fullUrl);
    return fullUrl;
  }
  
  return url;
}
