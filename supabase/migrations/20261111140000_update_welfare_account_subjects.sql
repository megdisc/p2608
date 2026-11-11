-- 福祉事業活動の勘定科目整理およびサービス利用料初期データ投入

-- 1. 不要な福祉科目（訓練等給付費、その他福祉事業収益、その他福祉事業費用、旧事業収益、旧事業費用等）の削除
DELETE FROM public.general_financial_records
WHERE activity_category = 'welfare'
  AND subject IN ('訓練等給付費', '事業収益', 'その他福祉事業費用', 'その他福祉事業収益', '事業費用・経費', '事業費用');

DELETE FROM public.general_financial_snapshot_details
WHERE activity_category = 'welfare'
  AND subject IN ('訓練等給付費', '事業収益', 'その他福祉事業費用', 'その他福祉事業収益', '事業費用・経費', '事業費用');

-- 2. 既存の '控除' を '実費控除' に統一
UPDATE public.general_financial_records
SET subject = '実費控除'
WHERE activity_category = 'welfare' AND subject = '控除';

UPDATE public.general_financial_snapshot_details
SET subject = '実費控除'
WHERE activity_category = 'welfare' AND subject = '控除';

-- 3. サービス利用料の初期スナップショットおよび実績データの投入
INSERT INTO public.general_financial_snapshot_details (id, office_id, target_period, project_id, client_id, recorded_by, type, activity_category, cost_category, subject, amount, remarks) VALUES
-- 事業所1 (WS未来): 1月, 6月, 10月
('f1111111-2222-0128-b111-333333333333', '22222222-2222-2222-2222-222222222222', '2026-01-28', NULL, NULL, '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', 'revenue', 'welfare', 'manufacturing', 'サービス利用料', 9300, '1月度サービス利用料（自己負担）'),
('f1111111-2222-0630-b111-333333333333', '22222222-2222-2222-2222-222222222222', '2026-06-30', NULL, NULL, '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', 'revenue', 'welfare', 'manufacturing', 'サービス利用料', 9300, '6月度サービス利用料（自己負担）'),
('f1111111-2222-1028-b111-333333333333', '22222222-2222-2222-2222-222222222222', '2026-10-28', NULL, NULL, '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', 'revenue', 'welfare', 'manufacturing', 'サービス利用料', 9300, '10月度サービス利用料（自己負担）'),

-- 事業所2 (未来ワークスあすか): 1月, 6月
('f2222222-3333-0128-b111-333333333333', '33333333-3333-3333-3333-333333333333', '2026-01-28', NULL, NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'revenue', 'welfare', 'manufacturing', 'サービス利用料', 6200, '1月度サービス利用料（自己負担）'),
('f2222222-3333-0628-b111-333333333333', '33333333-3333-3333-3333-333333333333', '2026-06-28', NULL, NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'revenue', 'welfare', 'manufacturing', 'サービス利用料', 6200, '6月度サービス利用料（自己負担）'),

-- 事業所3 (未来オアシスガーデン): 1月, 6月
('f3333333-4444-0128-b111-333333333333', '44444444-4444-4444-4444-444444444444', '2026-01-28', NULL, NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'revenue', 'welfare', 'manufacturing', 'サービス利用料', 12400, '1月度サービス利用料（自己負担）'),
('f3333333-4444-0628-b111-333333333333', '44444444-4444-4444-4444-444444444444', '2026-06-28', NULL, NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'revenue', 'welfare', 'manufacturing', 'サービス利用料', 12400, '6月度サービス利用料（自己負担）')
ON CONFLICT (id) DO UPDATE SET
  subject = EXCLUDED.subject,
  amount = EXCLUDED.amount,
  remarks = EXCLUDED.remarks;

INSERT INTO public.general_financial_records (id, office_id, target_period, project_id, client_id, recorded_by, type, activity_category, cost_category, subject, amount, remarks)
SELECT id, office_id, target_period, project_id, client_id, recorded_by, type, activity_category, cost_category, subject, amount, remarks
FROM public.general_financial_snapshot_details
WHERE subject = 'サービス利用料'
ON CONFLICT (id) DO UPDATE SET
  subject = EXCLUDED.subject,
  amount = EXCLUDED.amount,
  remarks = EXCLUDED.remarks;

-- 4. 受給者証の有効期限を2027年3月31日まで延長（2026年度通年対応）
UPDATE public.member_recipient_certificates
SET valid_to = '2027-03-31'
WHERE valid_to = '2026-03-31';

-- 5. 工賃サマリースナップショットへのサービス利用料自己負担額の反映
UPDATE public.wage_snapshot_summaries
SET service_fee_copayment = 9300, deduction_total = 9500, payment = wage_total - 9500
WHERE member_id = 'e98c7634-1eb3-4e42-b062-841f39c043e0';

UPDATE public.wage_snapshot_summaries
SET service_fee_copayment = 6200, deduction_total = 6400, payment = wage_total - 6400
WHERE member_id = 'f0e9d8c7-b6a5-4321-0987-6543210fedc2';

UPDATE public.wage_snapshot_summaries
SET service_fee_copayment = 12400, deduction_total = 12600, payment = wage_total - 12600
WHERE member_id = 'c6666666-6666-6666-6666-666666666666';
