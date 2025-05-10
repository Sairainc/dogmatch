import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-2">ログイン</h1>
        <p className="text-sm text-gray-600 text-center mb-8">
          アカウントをお持ちでない方は{" "}
          <Link className="text-pink-500 font-medium hover:underline" href="/sign-up">
            新規登録
          </Link>
        </p>
        <form className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input name="email" placeholder="example@email.com" required />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password">パスワード</Label>
              <Link
                className="text-xs text-pink-500 hover:underline"
                href="/forgot-password"
              >
                パスワードをお忘れですか？
              </Link>
            </div>
            <Input
              type="password"
              name="password"
              placeholder="パスワードを入力"
              required
            />
          </div>
          <SubmitButton 
            pendingText="ログイン中..." 
            formAction={signInAction}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-full mt-4"
          >
            ログイン
          </SubmitButton>
          <FormMessage message={searchParams} />
        </form>
      </div>
    </div>
  );
}
