-- 福祉事業活動および就労支援事業活動の勘定科目を最新の標準表記に更新

-- 1. general_financial_records
UPDATE general_financial_records
SET subject = '訓練等給付費'
WHERE activity_category = 'welfare'
  AND (subject = '事業収益' OR subject ILIKE '%給付費%');

UPDATE general_financial_records
SET subject = 'その他福祉事業費用'
WHERE activity_category = 'welfare'
  AND (subject = '事業費用・経費' OR subject = '事業費用');

UPDATE general_financial_records
SET subject = '実費控除'
WHERE activity_category = 'welfare'
  AND subject = '控除';

UPDATE general_financial_records
SET subject = '労務費（利用者工賃以外）'
WHERE subject = '労務費（その他）';

UPDATE general_financial_records
SET subject = '経費'
WHERE subject = 'その他経費';

-- 2. general_financial_snapshot_details
UPDATE general_financial_snapshot_details
SET subject = '訓練等給付費'
WHERE activity_category = 'welfare'
  AND (subject = '事業収益' OR subject ILIKE '%給付費%');

UPDATE general_financial_snapshot_details
SET subject = 'その他福祉事業費用'
WHERE activity_category = 'welfare'
  AND (subject = '事業費用・経費' OR subject = '事業費用');

UPDATE general_financial_snapshot_details
SET subject = '実費控除'
WHERE activity_category = 'welfare'
  AND subject = '控除';

UPDATE general_financial_snapshot_details
SET subject = '労務費（利用者工賃以外）'
WHERE subject = '労務費（その他）';

UPDATE general_financial_snapshot_details
SET subject = '経費'
WHERE subject = 'その他経費';

