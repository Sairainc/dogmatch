import { forgotPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";

export default async function ForgotPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-2">パスワードリセット</h1>
        <p className="text-sm text-gray-600 text-center mb-8">
          登録したメールアドレスを入力してください。
          パスワードリセット用のリンクを送信します。
        </p>
        <form className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input name="email" placeholder="example@email.com" required />
          </div>
          <SubmitButton 
            formAction={forgotPasswordAction}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-full mt-4"
          >
            リセットリンクを送信
          </SubmitButton>
          <div className="text-center mt-4">
            <Link
              className="text-sm text-pink-500 hover:underline"
              href="/sign-in"
            >
              ログインに戻る
            </Link>
          </div>
          <FormMessage message={searchParams} />
        </form>
      </div>
      <SmtpMessage />
    </div>
  );
}
