-- テーブル作成

-- 既存のprofilesテーブルに追加するカラム
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_id_verified BOOLEAN DEFAULT FALSE;
-- 管理者権限用のカラムを追加
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 身分証明書情報用のテーブル
CREATE TABLE IF NOT EXISTS id_verification (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id_front_url TEXT NOT NULL,
  id_back_url TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verification_notes TEXT,
  admin_user_id UUID REFERENCES auth.users(id)
);

-- ストレージバケット作成用のSQL
-- 注：実際のSupabaseプロジェクトでは管理画面から作成するか、Supabase CLIを使用して作成します
-- 以下はストレージバケットのポリシー設定例です

-- idverificationバケットのRLSポリシー例
/*
-- バケットが存在しない場合のみ作成（実際のプロジェクトではダッシュボードから作成済み）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'idverification') THEN
        INSERT INTO storage.buckets (id, name, public) VALUES ('idverification', 'idverification', FALSE);
    END IF;
END
$$;

-- 自分のIDカードを読み取るためのポリシー
CREATE POLICY "Users can view their own ID documents" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'idverification' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 自分のIDカードをアップロードするためのポリシー
CREATE POLICY "Users can upload their own ID documents" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'idverification' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 管理者のみが全てのIDを見れるポリシー（オプション）
CREATE POLICY "Admins can view all ID documents" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'idverification' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
  )
);
*/

-- 身分証明書検証用のRLSポリシー
/* 必要に応じて手動で実行してください
-- 1. ユーザーが自分の検証データを閲覧できるポリシー
CREATE POLICY "Users can view their own verification data"
ON id_verification FOR SELECT
USING (user_id = auth.uid());

-- 2. ユーザーが自分の検証データを登録できるポリシー
CREATE POLICY "Users can insert their own verification data"
ON id_verification FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 3. 管理者のみが検証ステータスを更新できるポリシー
CREATE POLICY "Only admins can update verification status"
ON id_verification FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
  )
);
*/

-- 管理者ユーザーを設定するためのSQLの例（必要に応じて実行）
-- あなたのユーザーIDを指定して管理者権限を付与
-- UPDATE profiles SET is_admin = TRUE WHERE id = 'あなたのユーザーID';

-- 注意事項：
-- 1. 実際のプロジェクトでは、このSQLをSupabase管理画面のSQLエディタか、CLIを使用して実行します
-- 2. ストレージバケットのポリシー設定は環境によって異なる場合があります
-- 3. 管理者機能を実装する場合はprofilesテーブルにis_adminカラムを追加する必要があります 