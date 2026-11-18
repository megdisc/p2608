-- 20261118153000_seed_service_billing_details_and_current_month.sql
-- サービス費用明細スナップショット (service_billing_snapshot_details) の初期シード投入
-- および 2026年11月（最新月）の出勤・サービス費用スナップショットデータの投入

-- 1. 2026年11月の利用者出欠レコード (member_attendance_records)
INSERT INTO public.member_attendance_records (office_id, target_period, member_id, status, start_time, end_time, break_minutes, service_hours, has_meal, is_absentee_supported, has_pickup, has_dropoff)
SELECT 
  m.office_id,
  d::date AS target_period,
  m.member_id,
  'present' AS status,
  '09:30:00'::time AS start_time,
  '15:30:00'::time AS end_time,
  60 AS break_minutes,
  5.00 AS service_hours,
  (EXTRACT(DAY FROM d) IN (4, 11, 18)) AS has_meal,
  false AS is_absentee_supported,
  (EXTRACT(DOW FROM d) IN (1, 3)) AS has_pickup,
  (EXTRACT(DOW FROM d) IN (1, 3)) AS has_dropoff
FROM (
  SELECT '22222222-2222-2222-2222-222222222222'::uuid AS office_id, 'b362ad61-3ab9-42b3-a53c-1b77f985b85a'::uuid AS member_id UNION ALL
  SELECT '22222222-2222-2222-2222-222222222222'::uuid, 'e98c7634-1eb3-4e42-b062-841f39c043e0'::uuid UNION ALL
  SELECT '33333333-3333-3333-3333-333333333333'::uuid, 'a1b2c3d4-e5f6-7890-1234-56789abcdef0'::uuid UNION ALL
  SELECT '33333333-3333-3333-3333-333333333333'::uuid, 'f0e9d8c7-b6a5-4321-0987-6543210fedc2'::uuid UNION ALL
  SELECT '44444444-4444-4444-4444-444444444444'::uuid, 'c5555555-5555-5555-5555-555555555555'::uuid UNION ALL
  SELECT '44444444-4444-4444-4444-444444444444'::uuid, 'c6666666-6666-6666-6666-666666666666'::uuid
) m
CROSS JOIN (
  SELECT generate_series('2026-11-01'::date, '2026-11-20'::date, '1 day'::interval) AS d
) days
WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5
ON CONFLICT (target_period, member_id) DO NOTHING;

-- 2. 2026年11月のサービス費用総額スナップショット (service_billing_snapshot)
INSERT INTO public.service_billing_snapshot (id, office_id, member_id, target_period, attendance_days, base_reward_units, addition_units, subtraction_units, total_units, unit_price, total_cost_amount, calculated_copayment_amount, copayment_limit_amount, final_copayment_amount, benefit_billing_amount, actual_expense_amount, total_member_billed_amount, status) VALUES
-- WS未来 2026年11月
('b0000011-2222-42ea-800b-5e476066c581', '22222222-2222-2222-2222-222222222222', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', '2026-11', 15, 8760, 240, 0, 9000, 10.00, 90000, 9000, 0, 0, 90000, 600, 600, 'draft'),
('b0000011-2222-42ea-800b-5e476066c582', '22222222-2222-2222-2222-222222222222', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '2026-11', 15, 8760, 540, 0, 9300, 10.00, 93000, 9300, 9300, 9300, 83700, 600, 9900, 'draft'),

-- 未来ワークス 2026年11月
('b0000011-3333-42ea-800b-5e476066c581', '33333333-3333-3333-3333-333333333333', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', '2026-11', 15, 8760, 240, 0, 9000, 10.00, 90000, 9000, 0, 0, 90000, 600, 600, 'draft'),
('b0000011-3333-42ea-800b-5e476066c582', '33333333-3333-3333-3333-333333333333', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', '2026-11', 12, 7008, 432, 0, 7440, 10.00, 74400, 7440, 6200, 6200, 68200, 600, 6800, 'draft'),

-- 未来オアシス 2026年11月
('b0000011-4444-42ea-800b-5e476066c581', '44444444-4444-4444-4444-444444444444', 'c5555555-5555-5555-5555-555555555555', '2026-11', 15, 8760, 240, 0, 9000, 10.00, 90000, 9000, 0, 0, 90000, 600, 600, 'draft'),
('b0000011-4444-4444-800b-5e476066c582', '44444444-4444-4444-4444-444444444444', 'c6666666-6666-6666-6666-666666666666', '2026-11', 15, 8760, 540, 0, 9300, 10.00, 93000, 9300, 12400, 12400, 80600, 600, 13000, 'draft')
ON CONFLICT (office_id, target_period, member_id) DO UPDATE SET
  attendance_days = EXCLUDED.attendance_days,
  total_units = EXCLUDED.total_units,
  total_cost_amount = EXCLUDED.total_cost_amount,
  calculated_copayment_amount = EXCLUDED.calculated_copayment_amount,
  copayment_limit_amount = EXCLUDED.copayment_limit_amount,
  final_copayment_amount = EXCLUDED.final_copayment_amount,
  benefit_billing_amount = EXCLUDED.benefit_billing_amount,
  actual_expense_amount = EXCLUDED.actual_expense_amount,
  total_member_billed_amount = EXCLUDED.total_member_billed_amount,
  status = EXCLUDED.status;

-- 3. サービス費用明細スナップショット (service_billing_snapshot_details)
-- 2026-01, 2026-06, 2026-10, 2026-11 の各スナップショットに対する明細投入
INSERT INTO public.service_billing_snapshot_details (summary_id, reward_item_id, service_code, item_name, item_category, unit_value, count, total_item_units)
SELECT 
  s.id AS summary_id,
  NULL AS reward_item_id,
  '111111' AS service_code,
  '就労継続支援Ｂ型サービス費(7.5:1)' AS item_name,
  'base_reward' AS item_category,
  584.00 AS unit_value,
  s.attendance_days AS count,
  s.base_reward_units AS total_item_units
FROM public.service_billing_snapshot s
ON CONFLICT DO NOTHING;

-- 目標工賃達成指導員加算
INSERT INTO public.service_billing_snapshot_details (summary_id, reward_item_id, service_code, item_name, item_category, unit_value, count, total_item_units)
SELECT 
  s.id AS summary_id,
  '66666666-0000-0000-0000-000000000005'::uuid AS reward_item_id,
  '521131' AS service_code,
  '目標工賃達成指導員配置加算' AS item_name,
  'addition' AS item_category,
  16.00 AS unit_value,
  s.attendance_days AS count,
  s.attendance_days * 16 AS total_item_units
FROM public.service_billing_snapshot s
ON CONFLICT DO NOTHING;

-- 食事提供体制加算 (加算単位数が多い利用者向け)
INSERT INTO public.service_billing_snapshot_details (summary_id, reward_item_id, service_code, item_name, item_category, unit_value, count, total_item_units)
SELECT 
  s.id AS summary_id,
  '66666666-0000-0000-0000-000000000006'::uuid AS reward_item_id,
  '521141' AS service_code,
  '食事提供体制加算' AS item_name,
  'addition' AS item_category,
  30.00 AS unit_value,
  10 AS count,
  300 AS total_item_units
FROM public.service_billing_snapshot s
WHERE s.addition_units > 250
ON CONFLICT DO NOTHING;
