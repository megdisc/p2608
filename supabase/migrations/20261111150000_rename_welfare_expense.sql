-- 福祉事業活動の費用科目を「福祉事業費用」に統一

UPDATE public.general_financial_records
SET subject = '福祉事業費用'
WHERE activity_category = 'welfare'
  AND subject IN ('その他福祉事業費用', 'その他事業費用', '事業費用・経費', '事業費用');

UPDATE public.general_financial_snapshot_details
SET subject = '福祉事業費用'
WHERE activity_category = 'welfare'
  AND subject IN ('その他福祉事業費用', 'その他事業費用', '事業費用・経費', '事業費用');

