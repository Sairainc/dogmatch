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
 * 画像URLを処理して表示用のURLを返します
 * @param {string} url - 処理する画像URL
 * @returns {string} 表示用の画像URL
 */
export function fixImageUrl(url: string): string {
  // URLがない場合はプレースホルダー画像を返す
  if (!url) {
    return '/placeholder-dog.jpg';
  }
  
  // ローカルパスの場合はそのまま返す
  if (url.startsWith('/')) {
    return url;
  }
  
  // HTTPまたはデータURLの場合はそのまま返す
  if (url.startsWith('http') || url.startsWith('data:')) {
    return url;
  }
  
  // Supabaseのストレージの場合は完全なURLを構築
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    return `${supabaseUrl}/storage/v1/object/public/${url}`;
  }
  
  // それ以外の場合は元のURLを返す
  return url;
}
