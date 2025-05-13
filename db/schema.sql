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

-- id_verificationバケットのRLSポリシー例（実際のSupabaseプロジェクトで実行）
/*
-- ストレージバケット作成（CLIからの場合）
INSERT INTO storage.buckets (id, name, public) VALUES ('id_verification', 'id_verification', FALSE);

-- 自分のIDカードを読み取るためのポリシー
CREATE POLICY "Users can view their own ID documents" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'id_verification' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 自分のIDカードをアップロードするためのポリシー
CREATE POLICY "Users can upload their own ID documents" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'id_verification' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 管理者のみが全てのIDを見れるポリシー（オプション）
CREATE POLICY "Admins can view all ID documents" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'id_verification' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
  )
);
*/

-- 身分証明書検証用のRLSポリシー
CREATE POLICY "Users can view their own verification data"
ON id_verification FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own verification data"
ON id_verification FOR INSERT
WITH CHECK (user_id = auth.uid());

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

-- 管理者ユーザーを設定するためのSQLの例（必要に応じて実行）
-- あなたのユーザーIDを指定して管理者権限を付与
-- UPDATE profiles SET is_admin = TRUE WHERE id = 'あなたのユーザーID';

-- 注意事項：
-- 1. 実際のプロジェクトでは、このSQLをSupabase管理画面のSQLエディタか、CLIを使用して実行します
-- 2. ストレージバケットのポリシー設定は環境によって異なる場合があります
-- 3. 管理者機能を実装する場合はprofilesテーブルにis_adminカラムを追加する必要があります 