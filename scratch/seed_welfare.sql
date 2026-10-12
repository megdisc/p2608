-- 資格マスタ (qualifications)
INSERT INTO public.qualifications (id, code, name, category, description, is_active) VALUES
('55555555-0000-0000-0000-000000000001', '01', 'サービス管理責任者', '任用資格・研修修了', 'サービス管理責任者研修修了および実務経験要件を満たす者', true),
('55555555-0000-0000-0000-000000000002', '02', '管理者', '役職・管理', '事業所の運営および職員の管理を一元的に行う者', true),
('55555555-0000-0000-0000-000000000003', '03', '社会福祉士', '国家資格', '社会福祉士法に基づく国家資格保有者', true),
('55555555-0000-0000-0000-000000000004', '04', '精神保健福祉士', '国家資格', '精神保健福祉士法に基づく国家資格保有者', true),
('55555555-0000-0000-0000-000000000005', '05', '介護福祉士', '国家資格', '社会福祉士及び介護福祉士法に基づく国家資格保有者', true),
('55555555-0000-0000-0000-000000000006', '06', '公認心理師', '国家資格', '公認心理師法に基づく心理職国家資格保有者', true),
('55555555-0000-0000-0000-000000000007', '11', '職業指導員', '配置職種', '利用者の就労技術の指導および生産活動支援を行う者', true),
('55555555-0000-0000-0000-000000000008', '12', '生活支援員', '配置職種', '利用者の日常生活支援および健康管理等の支援を行う者', true),
('55555555-0000-0000-0000-000000000009', '13', '目標工賃達成指導員', '配置職種・加算', '就労継続支援B型における工賃向上計画の推進指導員', true)
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code,
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- 加算・減算項目マスタ (reward_items)
INSERT INTO public.reward_items (id, service_type_id, code, name, item_category, occurrence_type, unit_value, calc_rate, monthly_limit_count, is_active) VALUES
('66666666-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', '521111', '送迎加算(片道)', 'addition', 'daily', 10.00, 0.00, 54, true),
('66666666-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', '521112', '送迎加算(同一敷地内等)', 'addition', 'daily', 7.00, 0.00, 54, true),
('66666666-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', '521121', '欠席時対応加算(I)', 'addition', 'daily', 94.00, 0.00, 4, true),
('66666666-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001', '521131', '目標工賃達成指導員配置加算', 'addition', 'daily', 45.00, 0.00, NULL, true),
('66666666-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000001', '521141', '食事提供体制加算', 'addition', 'daily', 30.00, 0.00, 30, true),
('66666666-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000001', '521151', '福祉専門職員配置等加算(I)', 'addition', 'daily', 15.00, 0.00, NULL, true),
('66666666-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000001', '521161', '重度者支援体制加算', 'addition', 'daily', 20.00, 0.00, NULL, true),
('66666666-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000001', '521191', '定員超過減算', 'subtraction', 'monthly', 0.00, 30.00, NULL, true),
('66666666-0000-0000-0000-000000000009', '11111111-0000-0000-0000-000000000002', '521192', '人員基準欠如減算', 'subtraction', 'monthly', 0.00, 30.00, NULL, true)
ON CONFLICT (id) DO UPDATE SET
  service_type_id = EXCLUDED.service_type_id,
  code = EXCLUDED.code,
  name = EXCLUDED.name,
  item_category = EXCLUDED.item_category,
  occurrence_type = EXCLUDED.occurrence_type,
  unit_value = EXCLUDED.unit_value,
  calc_rate = EXCLUDED.calc_rate,
  monthly_limit_count = EXCLUDED.monthly_limit_count,
  is_active = EXCLUDED.is_active;

-- 職員資格割当 (staff_qualification_settings)
INSERT INTO public.staff_qualification_settings (id, staff_id, qualification_id, license_number, acquired_on, valid_until, is_primary) VALUES
('55555555-1111-0000-0000-000000000001', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', '55555555-0000-0000-0000-000000000001', 'SVR-2020-001', '2020-04-01', NULL, true),
('55555555-1111-0000-0000-000000000002', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', '55555555-0000-0000-0000-000000000003', 'SW-2015-1234', '2015-03-31', NULL, false),
('55555555-1111-0000-0000-000000000003', 'de2d336b-254d-4af7-8e49-5acbda340e67', '55555555-0000-0000-0000-000000000004', 'PSW-2018-5678', '2018-03-31', NULL, true),
('55555555-1111-0000-0000-000000000004', '5ff5e55e-186f-43ce-84d2-aa751d8341b5', '55555555-0000-0000-0000-000000000007', NULL, '2021-04-01', NULL, true)
ON CONFLICT (id) DO NOTHING;
