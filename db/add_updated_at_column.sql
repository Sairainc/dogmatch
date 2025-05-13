-- id_verification テーブルに updated_at カラムを追加
ALTER TABLE id_verification
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- 既存のレコードの updated_at を設定
UPDATE id_verification
SET updated_at = submitted_at
WHERE updated_at IS NULL; 