-- profiles テーブルに is_profile_completed カラムを追加
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_profile_completed BOOLEAN DEFAULT false;

-- 既存のレコードでusernameが存在するものはプロフィール完了済みと見なす
UPDATE public.profiles
SET is_profile_completed = true
WHERE username IS NOT NULL AND username != '';

COMMENT ON COLUMN public.profiles.is_profile_completed IS 'ユーザーがプロフィール登録を完了したかどうかを示すフラグ'; 