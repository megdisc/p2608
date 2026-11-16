-- ==============================================================================
-- 20261116110000_rename_daily_closings_and_update_comments.sql
-- 日次締めの物理名改名 (daily_record_closings -> daily_closings)
-- およびレコード系・スナップショット系テーブルの論理名（COMMENT ON TABLE）更新
-- ==============================================================================

-- 1. daily_record_closings -> daily_closings への改名
DROP VIEW IF EXISTS public.daily_closings CASCADE;
ALTER TABLE IF EXISTS public.daily_record_closings RENAME TO daily_closings;

-- 2. 全9テーブルの論理名 (COMMENT ON TABLE) の更新
-- 日次実績の記録
COMMENT ON TABLE public.staff_attendance_records IS '職員勤務レコード';
COMMENT ON TABLE public.member_attendance_records IS '利用者出欠レコード';
COMMENT ON TABLE public.member_work_records IS '利用者作業レコード';
COMMENT ON TABLE public.allowance_deduction_records IS '加算手当・控除レコード';
COMMENT ON TABLE public.daily_closings IS '日次締め';

-- 月次実績の記録
COMMENT ON TABLE public.financial_records IS '収支レコード';
COMMENT ON TABLE public.incentive_records IS 'インセンティブ配分レコード';

-- 集計結果の記録（スナップショット）
COMMENT ON TABLE public.financial_snapshot IS '収支スナップショット';
COMMENT ON TABLE public.service_billing_snapshot IS 'サービス費用総額スナップショット';
COMMENT ON TABLE public.wage_snapshot IS '工賃・控除総額スナップショット';
COMMENT ON TABLE public.incentive_snapshot IS 'インセンティブスナップショット';
COMMENT ON TABLE public.allowance_deduction_snapshot IS '加算手当・実費控除スナップショット';
COMMENT ON TABLE public.monthly_closings IS '月次締め';

-- 3. 後方互換ビューの定義
CREATE OR REPLACE VIEW public.daily_record_closings AS 
    SELECT * FROM public.daily_closings;

CREATE OR REPLACE VIEW public.daily_work_confirmations AS 
    SELECT * FROM public.daily_closings;

-- 4. RLSポリシーの設定
ALTER TABLE public.daily_closings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON public.daily_closings;
CREATE POLICY "Allow all access" ON public.daily_closings FOR ALL USING (true) WITH CHECK (true);

