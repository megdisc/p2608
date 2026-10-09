-- ==========================================
-- システム統合シードデータ (Single Consolidated Seed)
-- ==========================================

-- 1. Auth Users (auth.users スキーマ)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) VALUES 
('00000000-0000-0000-0000-000000000000', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', 'authenticated', 'authenticated', 'staff-001@example.com', '', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', 'de2d336b-254d-4af7-8e49-5acbda340e67', 'authenticated', 'authenticated', 'staff-002@example.com', '', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'authenticated', 'authenticated', 'staff-003@example.com', '', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'authenticated', 'authenticated', 'member-001@example.com', '', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 'authenticated', 'authenticated', 'member-002@example.com', '', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'authenticated', 'authenticated', 'member-003@example.com', '', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'authenticated', 'authenticated', 'member-004@example.com', '', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', 'c5555555-5555-5555-5555-555555555555', 'authenticated', 'authenticated', 'member-005@example.com', '', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', 'c6666666-6666-6666-6666-666666666666', 'authenticated', 'authenticated', 'member-006@example.com', '', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- 2. Public Auth Users (public.auth_users テーブル)
INSERT INTO public.auth_users (id, email, role, user_type) VALUES
('563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', 'staff-001@example.com', 'Administrator', 'staff'),
('de2d336b-254d-4af7-8e49-5acbda340e67', 'staff-002@example.com', 'Staff', 'staff'),
('5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'staff-003@example.com', 'Staff', 'staff'),
('b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'member-001@example.com', 'Member', 'member'),
('e98c7634-1eb3-4e42-b062-841f39c043e0', 'member-002@example.com', 'Member', 'member'),
('a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'member-003@example.com', 'Member', 'member'),
('f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'member-004@example.com', 'Member', 'member'),
('c5555555-5555-5555-5555-555555555555', 'member-005@example.com', 'Member', 'member'),
('c6666666-6666-6666-6666-666666666666', 'member-006@example.com', 'Member', 'member')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  user_type = EXCLUDED.user_type;

-- 3. 法人 & 事業所マスタ (organizations / offices)
INSERT INTO public.organizations (id, name, representative_name, corporate_number) VALUES
('11111111-1111-1111-1111-111111111111', '社会福祉法人未来福祉会', '理事長 山田太郎', '1234567890123')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.offices (id, code, name, short_name, unit_price) VALUES
('22222222-2222-2222-2222-222222222222', 'OFF-001', '指定多機能型障害者就労支援事業所 ワークステーション未来あかすみ', 'WS未来', 10.68),
('33333333-3333-3333-3333-333333333333', 'OFF-002', '指定障害福祉サービス事業所 就労継続支援B型 未来ワークスあすか', '未来ワークス', 10.50),
('44444444-4444-4444-4444-444444444444', 'OFF-003', '就労移行・定着・自立複合支援センター 未来オアシスガーデン', '未来オアシス', 11.00)
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code,
  name = EXCLUDED.name,
  short_name = EXCLUDED.short_name,
  unit_price = EXCLUDED.unit_price;

INSERT INTO public.addresses (id, postal_code_prefix, postal_code_suffix, prefecture, city, town_street, building) VALUES
('aaaaa222-2222-2222-2222-222222222222', '100', '0001', '東京都', '千代田区', '千代田1-2', 'ワークステーションビル 1F'),
('aaaaa333-3333-3333-3333-333333333333', '150', '0002', '東京都', '渋谷区', '渋谷2-3', '未来ワークスビル 2F'),
('aaaaa444-4444-4444-4444-444444444444', '160', '0003', '東京都', '新宿区', '新宿3-4', 'オアシスプラザ 3F')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.entity_address_settings (owner_type, owner_id, address_id) VALUES
('office', '22222222-2222-2222-2222-222222222222', 'aaaaa222-2222-2222-2222-222222222222'),
('office', '33333333-3333-3333-3333-333333333333', 'aaaaa333-3333-3333-3333-333333333333'),
('office', '44444444-4444-4444-4444-444444444444', 'aaaaa444-4444-4444-4444-444444444444')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.phone_numbers (id, phone_type, phone_number) VALUES
('bbbbb333-3333-3333-3333-333333333333', 'phone', '03-9876-5432'),
('bbbbb444-4444-4444-4444-444444444444', 'fax', '03-9876-5433'),
('bbbbb555-5555-5555-5555-555555555555', 'phone', '03-8765-4321'),
('bbbbb666-6666-6666-6666-666666666666', 'phone', '03-7654-3210')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.entity_phone_settings (owner_type, owner_id, phone_number_id) VALUES
('office', '22222222-2222-2222-2222-222222222222', 'bbbbb333-3333-3333-3333-333333333333'),
('office', '22222222-2222-2222-2222-222222222222', 'bbbbb444-4444-4444-4444-444444444444'),
('office', '33333333-3333-3333-3333-333333333333', 'bbbbb555-5555-5555-5555-555555555555'),
('office', '44444444-4444-4444-4444-444444444444', 'bbbbb666-6666-6666-6666-666666666666')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.email_addresses (id, email) VALUES
('ccccc222-2222-2222-2222-222222222222', 'office@mirai-fukushi.or.jp'),
('ccccc333-3333-3333-3333-333333333333', 'asuka@mirai-fukushi.or.jp'),
('ccccc444-4444-4444-4444-444444444444', 'oasis@mirai-fukushi.or.jp')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.entity_email_settings (owner_type, owner_id, email_address_id) VALUES
('office', '22222222-2222-2222-2222-222222222222', 'ccccc222-2222-2222-2222-222222222222'),
('office', '33333333-3333-3333-3333-333333333333', 'ccccc333-3333-3333-3333-333333333333'),
('office', '44444444-4444-4444-4444-444444444444', 'ccccc444-4444-4444-4444-444444444444')
ON CONFLICT (id) DO NOTHING;

-- 3.1 支援種別マスタ & 資格マスタ (service_types / qualifications)
INSERT INTO public.service_types (id, code, name, description, is_active) VALUES
('11111111-0000-0000-0000-000000000001', '21', '就労継続支援B型', '就労機会の提供および生産活動の機会の提供を行う障害福祉サービス', true),
('11111111-0000-0000-0000-000000000002', '22', '就労継続支援A型', '雇用契約に基づく就労の機会の提供および知識能力向上のための訓練を行う障害福祉サービス', false),
('11111111-0000-0000-0000-000000000003', '15', '就労移行支援', '一般企業等への就労を希望する障害者に対する就労支援および知識能力向上支援サービス', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.office_service_type_settings (id, office_id, service_type_id, capacity) VALUES
('33333333-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', '11111111-0000-0000-0000-000000000001', 20),
('33333333-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', '11111111-0000-0000-0000-000000000001', 20),
('33333333-0000-0000-0000-000000000003', '44444444-4444-4444-4444-444444444444', '11111111-0000-0000-0000-000000000001', 20)
ON CONFLICT (id) DO NOTHING;

-- 4. 加算手当・控除項目マスタ (allowance_deduction_items)
INSERT INTO public.allowance_deduction_items (id, office_id, name, item_category, occurrence_type, calc_trigger_basis, threshold_value, threshold_unit, threshold_operator, unit_price) VALUES
-- 事業所1: ワークステーション未来
('44444444-2222-4444-4444-444444444401', '22222222-2222-2222-2222-222222222222', '精勤手当', 'allowance', 'monthly', 'attendance_days', 15.00, 'days', 'gte', 3000.00),
('44444444-2222-4444-4444-444444444402', '22222222-2222-2222-2222-222222222222', '皆勤手当', 'allowance', 'monthly', 'attendance_days', 20.00, 'days', 'gte', 2000.00),
('44444444-2222-4444-4444-444444444403', '22222222-2222-2222-2222-222222222222', '昼食代', 'deduction', 'daily', 'meal_count', NULL, 'times', '', 200.00),
('44444444-2222-4444-4444-444444444404', '22222222-2222-2222-2222-222222222222', '飲料設備代', 'deduction', 'daily', 'attendance_days', NULL, 'days', '', 30.00),
-- 事業所2: 未来ワークスあすか
('44444444-3333-4444-4444-444444444401', '33333333-3333-3333-3333-333333333333', '精勤手当', 'allowance', 'monthly', 'attendance_days', 15.00, 'days', 'gte', 3000.00),
('44444444-3333-4444-4444-444444444402', '33333333-3333-3333-3333-333333333333', '皆勤手当', 'allowance', 'monthly', 'attendance_days', 20.00, 'days', 'gte', 2000.00),
('44444444-3333-4444-4444-444444444403', '33333333-3333-3333-3333-333333333333', '昼食代', 'deduction', 'daily', 'meal_count', NULL, 'times', '', 200.00),
('44444444-3333-4444-4444-444444444404', '33333333-3333-3333-3333-333333333333', '飲料設備代', 'deduction', 'daily', 'attendance_days', NULL, 'days', '', 30.00),
-- 事業所3: 未来オアシス
('44444444-4444-4444-4444-444444444401', '44444444-4444-4444-4444-444444444444', '精勤手当', 'allowance', 'monthly', 'attendance_days', 15.00, 'days', 'gte', 3000.00),
('44444444-4444-4444-4444-444444444402', '44444444-4444-4444-4444-444444444444', '皆勤手当', 'allowance', 'monthly', 'attendance_days', 20.00, 'days', 'gte', 2000.00),
('44444444-4444-4444-4444-444444444403', '44444444-4444-4444-4444-444444444444', '昼食代', 'deduction', 'daily', 'meal_count', NULL, 'times', '', 200.00),
('44444444-4444-4444-4444-444444444404', '44444444-4444-4444-4444-444444444444', '飲料設備代', 'deduction', 'daily', 'attendance_days', NULL, 'days', '', 30.00)
ON CONFLICT (id) DO UPDATE SET
  office_id = EXCLUDED.office_id,
  name = EXCLUDED.name,
  item_category = EXCLUDED.item_category,
  occurrence_type = EXCLUDED.occurrence_type,
  calc_trigger_basis = EXCLUDED.calc_trigger_basis,
  threshold_value = EXCLUDED.threshold_value,
  threshold_unit = EXCLUDED.threshold_unit,
  threshold_operator = EXCLUDED.threshold_operator,
  unit_price = EXCLUDED.unit_price;

-- 4.1 積立金項目マスタ (reserve_items)
INSERT INTO public.reserve_items (id, office_id, name, calc_type, fixed_amount, fixed_rate) VALUES
('77777777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222', '工賃変動積立金', 'fixed_amount', 1000.00, 0.00),
('77777777-7777-7777-7777-777777777778', '22222222-2222-2222-2222-222222222222', '設備等修繕維持積立金', 'fixed_amount', 500.00, 0.00),
('77777777-3333-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333', '工賃変動積立金', 'fixed_amount', 2000.00, 0.00),
('77777777-3333-7777-7777-777777777778', '33333333-3333-3333-3333-333333333333', '設備等修繕維持積立金', 'fixed_amount', 500.00, 0.00),
('77777777-4444-7777-7777-777777777777', '44444444-4444-4444-4444-444444444444', '工賃変動積立金', 'fixed_amount', 3000.00, 0.00),
('77777777-4444-7777-7777-777777777778', '44444444-4444-4444-4444-444444444444', '設備等修繕維持積立金', 'fixed_amount', 2500.00, 0.00)
ON CONFLICT (id) DO NOTHING;

-- 5. 職員マスタ (staffs)
INSERT INTO public.staffs (id, user_id, code, name, yomigana) VALUES
('563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', 'S-000001', '相澤翔太', 'あいざわしょうた'),
('de2d336b-254d-4af7-8e49-5acbda340e67', 'de2d336b-254d-4af7-8e49-5acbda340e67', 'S-000002', '井上結衣', 'いのうえゆい'),
('5ff5e55e-186f-43ce-84d2-aa751d8341b5', '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'S-000003', '上田拓海', 'うえだたくみ')
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  code = EXCLUDED.code,
  name = EXCLUDED.name,
  yomigana = EXCLUDED.yomigana;

-- 6. 工賃単価項目マスタ (wage_rate_items)
INSERT INTO public.wage_rate_items (id, office_id, wage, description) VALUES
('a1b2c3d4-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 100, '新人レベル'),
('a1b2c3d4-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 250, '中堅レベル'),
('a1b2c3d4-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 500, 'ベテランレベル'),
('a1b2c3d4-3333-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 120, 'ステップ1（見習い）'),
('a1b2c3d4-3333-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 300, 'ステップ2（標準作業）'),
('a1b2c3d4-3333-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 450, 'ステップ3（熟練作業）'),
('a1b2c3d4-4444-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 400, '専門クリエイティブ単価'),
('a1b2c3d4-4444-0000-0000-000000000002', '44444444-4444-4444-4444-444444444444', 800, '高度制作単価')
ON CONFLICT (id) DO NOTHING;

-- 7. 利用者マスタ & 事業所割当 (members / office_member_settings)
INSERT INTO public.members (id, user_id, code, name, yomigana) VALUES
('b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'M-000001', '江口春奈', 'えぐちはるな'),
('e98c7634-1eb3-4e42-b062-841f39c043e0', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 'M-000002', '大西智也', 'おおにしともや'),
('a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'M-000003', '佐藤健太', 'さとうけんた'),
('f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'M-000004', '高橋結衣', 'たかはしゆい'),
('c5555555-5555-5555-5555-555555555555', 'c5555555-5555-5555-5555-555555555555', 'M-000005', '渡辺修', 'わたなべおさむ'),
('c6666666-6666-6666-6666-666666666666', 'c6666666-6666-6666-6666-666666666666', 'M-000006', '小林さくら', 'こばやしさくら')
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  code = EXCLUDED.code,
  name = EXCLUDED.name,
  yomigana = EXCLUDED.yomigana;

INSERT INTO public.office_member_settings (office_id, member_id) VALUES
('22222222-2222-2222-2222-222222222222', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a'),
('22222222-2222-2222-2222-222222222222', 'e98c7634-1eb3-4e42-b062-841f39c043e0'),
('33333333-3333-3333-3333-333333333333', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0'),
('33333333-3333-3333-3333-333333333333', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2'),
('44444444-4444-4444-4444-444444444444', 'c5555555-5555-5555-5555-555555555555'),
('44444444-4444-4444-4444-444444444444', 'c6666666-6666-6666-6666-666666666666')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.member_recipient_certificates (id, member_id, certificate_number, issuing_municipality, income_category, copayment_limit_amount, disability_support_class, copayment_management_type, copayment_office_id, copayment_office_code, copayment_office_name, valid_from, valid_to, remarks) VALUES
('99000000-0000-0000-0000-000000000001', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', '1234567890', '横浜市中区', 'low_income', 0, 'class_2', 'self_internal', '22222222-2222-2222-2222-222222222222', NULL, '', '2025-04-01', '2026-03-31', '継続申請済み'),
('99000000-0000-0000-0000-000000000003', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '9876543210', '川崎市川崎区', 'general_1', 9300, 'class_1', 'other', NULL, '1410100001', 'ワークステーションみらい', '2025-04-01', '2026-03-31', '他法人上限額管理'),
('99000000-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', '1122334455', '東京都千代田区', 'welfare', 0, 'none', 'none', NULL, NULL, '', '2025-04-01', '2026-03-31', '新規支給決定'),
('99000000-0000-0000-0000-000000000005', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', '5566778899', '東京都世田谷区', 'general_2', 37200, 'class_3', 'self_internal', '33333333-3333-3333-3333-333333333333', NULL, '', '2025-04-01', '2026-03-31', '自法人にて上限管理実施'),
('99000000-0000-0000-0000-000000000006', 'c5555555-5555-5555-5555-555555555555', '6677889900', '東京都新宿区', 'low_income', 0, 'class_1', 'self_internal', '44444444-4444-4444-4444-444444444444', NULL, '', '2025-04-01', '2026-03-31', '新規決定'),
('99000000-0000-0000-0000-000000000007', 'c6666666-6666-6666-6666-666666666666', '7788990011', '東京都渋谷区', 'general_1', 9300, 'class_2', 'self_internal', '44444444-4444-4444-4444-444444444444', NULL, '', '2025-04-01', '2026-03-31', '新規決定')
ON CONFLICT (id) DO UPDATE SET
  member_id = EXCLUDED.member_id,
  certificate_number = EXCLUDED.certificate_number,
  issuing_municipality = EXCLUDED.issuing_municipality,
  income_category = EXCLUDED.income_category,
  copayment_limit_amount = EXCLUDED.copayment_limit_amount,
  disability_support_class = EXCLUDED.disability_support_class,
  copayment_management_type = EXCLUDED.copayment_management_type,
  copayment_office_id = EXCLUDED.copayment_office_id,
  copayment_office_code = EXCLUDED.copayment_office_code,
  copayment_office_name = EXCLUDED.copayment_office_name,
  valid_from = EXCLUDED.valid_from,
  valid_to = EXCLUDED.valid_to,
  remarks = EXCLUDED.remarks;

-- 8. 利用者工賃単価割当 (member_wage_settings)
INSERT INTO public.member_wage_settings (member_id, wage_rate_id) VALUES
('b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'a1b2c3d4-0000-0000-0000-000000000001'),
('e98c7634-1eb3-4e42-b062-841f39c043e0', 'a1b2c3d4-0000-0000-0000-000000000002'),
('a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'a1b2c3d4-3333-0000-0000-000000000002'),
('f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'a1b2c3d4-3333-0000-0000-000000000003'),
('c5555555-5555-5555-5555-555555555555', 'a1b2c3d4-4444-0000-0000-000000000001'),
('c6666666-6666-6666-6666-666666666666', 'a1b2c3d4-4444-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- 9. 取引先マスタ (partners)
INSERT INTO public.partners (id, code, name, yomigana, is_customer, is_subcontractor, is_other) VALUES 
('73ab0c05-9915-4894-a083-6bccf7a66d2a', 'C-000001', '株式会社テクノソリューションズ', 'かぶしきがいしゃてくのそりゅーしょんず', true, false, false),
('bac1fb37-abfa-4eb3-9454-d72fb7b3b7e8', 'C-000002', 'グローバルインダストリー株式会社', 'ぐろーばるいんだすとりーかぶしきがいしゃ', true, true, false),
('0ff5f11e-b752-4b06-aaab-86984a67eec7', 'C-000003', '合同会社イノベーションラボ', 'ごうどうがいしゃいのべーしょんらぼ', false, true, false)
ON CONFLICT (id) DO NOTHING;

-- 11. 案件 & タスク (projects / project_tasks)
INSERT INTO public.projects (id, office_id, name, code, project_type) VALUES 
('00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'その他', 'P-000000', 'other') 
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.project_tasks (id, project_id, name) VALUES 
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'その他作業') 
ON CONFLICT (id) DO NOTHING;

-- 事業所1 (WS未来) 案件
INSERT INTO public.projects (id, office_id, name, code, client_id, project_type) VALUES 
('418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', '22222222-2222-2222-2222-222222222222', '本社オフィスネットワーク構築', 'P-000001', '73ab0c05-9915-4894-a083-6bccf7a66d2a', 'one-off'),
('d8c0b5c1-1e3c-4c7b-b384-5f5a8947f631', '22222222-2222-2222-2222-222222222222', 'パンの販売・カフェ運営', 'P-000005', NULL, 'ongoing') 
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.project_tasks (id, project_id, name, assignee_type) VALUES 
('aaceaea1-43df-42c1-bfc6-1794a4eb9e16', '418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', '要件定義', 'internal'),
('8daa6b8b-ddb2-462a-9594-1738f004832f', '418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', '構築・テスト', 'internal'),
('e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 'd8c0b5c1-1e3c-4c7b-b384-5f5a8947f631', '製造業務', 'internal'),
('1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 'd8c0b5c1-1e3c-4c7b-b384-5f5a8947f631', '販売・接客業務', 'internal')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.task_assignee_settings (task_id, member_id) VALUES 
('aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a'),
('8daa6b8b-ddb2-462a-9594-1738f004832f', 'e98c7634-1eb3-4e42-b062-841f39c043e0'),
('e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a'),
('1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 'e98c7634-1eb3-4e42-b062-841f39c043e0')
ON CONFLICT (id) DO NOTHING;

-- 事業所2 (未来ワークス) 案件
INSERT INTO public.projects (id, office_id, name, code, client_id, project_type, settlement_year_month) VALUES 
('52532aea-8f77-478e-ae37-c0ef57ee5cf5', '33333333-3333-3333-3333-333333333333', '支社サーバーリプレイス', 'P-000002', 'bac1fb37-abfa-4eb3-9454-d72fb7b3b7e8', 'one-off', '2026-08'),
('33333333-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', '軽作業・封入梱包受託', 'P-000003', 'bac1fb37-abfa-4eb3-9454-d72fb7b3b7e8', 'ongoing', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.project_tasks (id, project_id, name, assignee_type) VALUES 
('adc26f10-909b-4ae1-b255-a86a5014dd3d', '52532aea-8f77-478e-ae37-c0ef57ee5cf5', 'サーバー構築', 'internal'),
('33333333-1111-0000-0000-000000000003', '33333333-0000-0000-0000-000000000003', '封入・封かん作業', 'internal')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.task_assignee_settings (task_id, member_id) VALUES 
('adc26f10-909b-4ae1-b255-a86a5014dd3d', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0'),
('33333333-1111-0000-0000-000000000003', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2')
ON CONFLICT (id) DO NOTHING;

-- 事業所3 (未来オアシス) 案件
INSERT INTO public.projects (id, office_id, name, code, client_id, project_type) VALUES 
('44444444-0000-0000-0000-000000000004', '44444444-4444-4444-4444-444444444444', 'Webサイト制作・デザイン', 'P-000004', '73ab0c05-9915-4894-a083-6bccf7a66d2a', 'ongoing'),
('44444444-0000-0000-0000-000000000006', '44444444-4444-4444-4444-444444444444', '動画編集・制作受託', 'P-000006', '0ff5f11e-b752-4b06-aaab-86984a67eec7', 'ongoing')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.project_tasks (id, project_id, name, assignee_type) VALUES 
('44444444-1111-0000-0000-000000000004', '44444444-0000-0000-0000-000000000004', 'Webデザイン・コーディング', 'internal'),
('44444444-1111-0000-0000-000000000006', '44444444-0000-0000-0000-000000000006', 'テロップ・字幕編集', 'internal')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.task_assignee_settings (task_id, member_id) VALUES 
('44444444-1111-0000-0000-000000000004', 'c5555555-5555-5555-5555-555555555555'),
('44444444-1111-0000-0000-000000000006', 'c6666666-6666-6666-6666-666666666666')
ON CONFLICT (id) DO NOTHING;

-- 12. 事業所職員割当 (office_staff_settings)
INSERT INTO public.office_staff_settings (office_id, staff_id, is_primary) VALUES
('22222222-2222-2222-2222-222222222222', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', true),
('33333333-3333-3333-3333-333333333333', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false),
('22222222-2222-2222-2222-222222222222', 'de2d336b-254d-4af7-8e49-5acbda340e67', true),
('33333333-3333-3333-3333-333333333333', '5ff5e55e-186f-43ce-84d2-aa751d8341b5', true),
('44444444-4444-4444-4444-444444444444', '5ff5e55e-186f-43ce-84d2-aa751d8341b5', false)
ON CONFLICT DO NOTHING;

-- 13. 作業実績データ (member_work_records) 2026年1月〜12月 各事業所
INSERT INTO public.member_work_records (office_id, target_period, member_id, task_id, work_time) VALUES
-- 事業所1 (WS未来) 2026年1月〜12月
('22222222-2222-2222-2222-222222222222', '2026-01-15', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 4),
('22222222-2222-2222-2222-222222222222', '2026-01-16', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 4),
('22222222-2222-2222-2222-222222222222', '2026-01-15', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '8daa6b8b-ddb2-462a-9594-1738f004832f', 5),
('22222222-2222-2222-2222-222222222222', '2026-01-16', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '8daa6b8b-ddb2-462a-9594-1738f004832f', 5),

('22222222-2222-2222-2222-222222222222', '2026-06-15', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 4),
('22222222-2222-2222-2222-222222222222', '2026-06-16', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 4),
('22222222-2222-2222-2222-222222222222', '2026-06-15', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '8daa6b8b-ddb2-462a-9594-1738f004832f', 5),
('22222222-2222-2222-2222-222222222222', '2026-06-16', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '8daa6b8b-ddb2-462a-9594-1738f004832f', 5),

-- 事業所2 (未来ワークス) 2026年1月〜12月
('33333333-3333-3333-3333-333333333333', '2026-01-15', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'adc26f10-909b-4ae1-b255-a86a5014dd3d', 5),
('33333333-3333-3333-3333-333333333333', '2026-01-16', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'adc26f10-909b-4ae1-b255-a86a5014dd3d', 5),
('33333333-3333-3333-3333-333333333333', '2026-01-15', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', '33333333-1111-0000-0000-000000000003', 4),
('33333333-3333-3333-3333-333333333333', '2026-01-16', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', '33333333-1111-0000-0000-000000000003', 4),

('33333333-3333-3333-3333-333333333333', '2026-06-15', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'adc26f10-909b-4ae1-b255-a86a5014dd3d', 5),
('33333333-3333-3333-3333-333333333333', '2026-06-16', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'adc26f10-909b-4ae1-b255-a86a5014dd3d', 5),
('33333333-3333-3333-3333-333333333333', '2026-06-15', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', '33333333-1111-0000-0000-000000000003', 4),
('33333333-3333-3333-3333-333333333333', '2026-06-16', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', '33333333-1111-0000-0000-000000000003', 4),

-- 事業所3 (未来オアシス) 2026年1月〜12月
('44444444-4444-4444-4444-444444444444', '2026-01-15', 'c5555555-5555-5555-5555-555555555555', '44444444-1111-0000-0000-000000000004', 6),
('44444444-4444-4444-4444-444444444444', '2026-01-16', 'c5555555-5555-5555-5555-555555555555', '44444444-1111-0000-0000-000000000004', 6),
('44444444-4444-4444-4444-444444444444', '2026-01-15', 'c6666666-6666-6666-6666-666666666666', '44444444-1111-0000-0000-000000000006', 5),
('44444444-4444-4444-4444-444444444444', '2026-01-16', 'c6666666-6666-6666-6666-666666666666', '44444444-1111-0000-0000-000000000006', 5),

('44444444-4444-4444-4444-444444444444', '2026-06-15', 'c5555555-5555-5555-5555-555555555555', '44444444-1111-0000-0000-000000000004', 6),
('44444444-4444-4444-4444-444444444444', '2026-06-16', 'c5555555-5555-5555-5555-555555555555', '44444444-1111-0000-0000-000000000004', 6),
('44444444-4444-4444-4444-444444444444', '2026-06-15', 'c6666666-6666-6666-6666-666666666666', '44444444-1111-0000-0000-000000000006', 5),
('44444444-4444-4444-4444-444444444444', '2026-06-16', 'c6666666-6666-6666-6666-666666666666', '44444444-1111-0000-0000-000000000006', 5)
ON CONFLICT (id) DO NOTHING;

-- 14. 月次工賃サマリー (wage_summaries) 各事業所 2026年1月〜12月
INSERT INTO public.wage_summaries (id, office_id, target_period, member_id, work_time, wage_rate, basic_wage, incentive_total, other_allowance_total, wage_total, deduction_total, payment) VALUES
-- WS未来
('a0000001-2222-42ea-800b-5e476066c581', '22222222-2222-2222-2222-222222222222', '2026-01', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 50, 100, 5000, 8000, 3000, 16000, 200, 15800),
('a0000001-2222-42ea-800b-5e476066c582', '22222222-2222-2222-2222-222222222222', '2026-01', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 60, 250, 15000, 10000, 3000, 28000, 200, 27800),
('a0000006-2222-42ea-800b-5e476066c581', '22222222-2222-2222-2222-222222222222', '2026-06', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 52, 100, 5200, 8500, 3000, 16700, 200, 16500),
('a0000006-2222-42ea-800b-5e476066c582', '22222222-2222-2222-2222-222222222222', '2026-06', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 64, 250, 16000, 10500, 3000, 29500, 200, 29300),

-- 未来ワークス
('a0000001-3333-42ea-800b-5e476066c581', '33333333-3333-3333-3333-333333333333', '2026-01', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', 55, 300, 16500, 7000, 3000, 26500, 200, 26300),
('a0000001-3333-42ea-800b-5e476066c582', '33333333-3333-3333-3333-333333333333', '2026-01', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 65, 450, 29250, 9000, 3000, 41250, 200, 41050),
('a0000006-3333-42ea-800b-5e476066c581', '33333333-3333-3333-3333-333333333333', '2026-06', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', 58, 300, 17400, 7500, 3000, 27900, 200, 27700),
('a0000006-3333-42ea-800b-5e476066c582', '33333333-3333-3333-3333-333333333333', '2026-06', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 68, 450, 30600, 9500, 3000, 43100, 200, 42900),

-- 未来オアシス
('a0000001-4444-42ea-800b-5e476066c581', '44444444-4444-4444-4444-444444444444', '2026-01', 'c5555555-5555-5555-5555-555555555555', 70, 400, 28000, 12000, 3000, 43000, 200, 42800),
('a0000001-4444-4444-800b-5e476066c582', '44444444-4444-4444-4444-444444444444', '2026-01', 'c6666666-6666-6666-6666-666666666666', 75, 800, 60000, 15000, 3000, 78000, 200, 77800),
('a0000006-4444-42ea-800b-5e476066c581', '44444444-4444-4444-4444-444444444444', '2026-06', 'c5555555-5555-5555-5555-555555555555', 72, 400, 28800, 12500, 3000, 44300, 200, 44100),
('a0000006-4444-4444-800b-5e476066c582', '44444444-4444-4444-4444-444444444444', '2026-06', 'c6666666-6666-6666-6666-666666666666', 78, 800, 62400, 16000, 3000, 81400, 200, 81200)
ON CONFLICT (office_id, target_period, member_id) DO UPDATE SET
  work_time = EXCLUDED.work_time,
  wage_rate = EXCLUDED.wage_rate,
  basic_wage = EXCLUDED.basic_wage,
  incentive_total = EXCLUDED.incentive_total,
  other_allowance_total = EXCLUDED.other_allowance_total,
  wage_total = EXCLUDED.wage_total,
  deduction_total = EXCLUDED.deduction_total,
  payment = EXCLUDED.payment;

-- 15. 収支記録 (general_financial_details) 各事業所 2026年1月〜12月
-- 事業所1: ワークステーション未来あかすみ (22222222-2222-2222-2222-222222222222)
INSERT INTO public.general_financial_details (id, office_id, target_period, project_id, client_id, recorded_by, type, activity_category, cost_category, subject, amount, remarks) VALUES
-- 2026年1月〜12月の月次データ
-- 1月
('f1111111-2222-0101-a111-111111111111', '22222222-2222-2222-2222-222222222222', '2026-01-01', '418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', '73ab0c05-9915-4894-a083-6bccf7a66d2a', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', 'revenue', 'production', 'manufacturing', '就労支援事業収益', 520000, 'ネットワーク構築受託売上(1月)'),
('f1111111-2222-0105-a111-111111111111', '22222222-2222-2222-2222-222222222222', '2026-01-05', 'd8c0b5c1-1e3c-4c7b-b384-5f5a8947f631', NULL, 'de2d336b-254d-4af7-8e49-5acbda340e67', 'revenue', 'production', 'manufacturing', '就労支援事業収益', 310000, 'パン販売売上(1月)'),
('f1111111-2222-0110-a111-111111111111', '22222222-2222-2222-2222-222222222222', '2026-01-10', '418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', NULL, '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', 'expense', 'production', 'manufacturing', '材料費', 48000, 'ネットワーク資材費'),
('f1111111-2222-0112-a111-111111111111', '22222222-2222-2222-2222-222222222222', '2026-01-12', 'd8c0b5c1-1e3c-4c7b-b384-5f5a8947f631', NULL, 'de2d336b-254d-4af7-8e49-5acbda340e67', 'expense', 'production', 'manufacturing', '材料費', 78000, '製パン材料費'),
('f1111111-2222-0125-a111-111111111111', '22222222-2222-2222-2222-222222222222', '2026-01-25', NULL, NULL, '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', 'expense', 'production', 'manufacturing', '労務費（利用者工賃）', 43600, '1月度利用者工賃支払'),
('f1111111-2222-0125-a111-222222222222', '22222222-2222-2222-2222-222222222222', '2026-01-25', NULL, NULL, '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', 'expense', 'production', 'manufacturing', '労務費（その他）', 120000, '1月度指導員人件費'),
('f1111111-2222-0128-a111-111111111111', '22222222-2222-2222-2222-222222222222', '2026-01-28', '418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', NULL, '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', 'expense', 'production', 'manufacturing', '外注加工費', 28000, '1月度外部技術委託'),
('f1111111-2222-0128-a111-222222222222', '22222222-2222-2222-2222-222222222222', '2026-01-28', NULL, NULL, '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', 'expense', 'production', 'manufacturing', 'その他経費', 38000, '1月度消耗品・水道光熱費'),
('f1111111-2222-0128-a111-333333333333', '22222222-2222-2222-2222-222222222222', '2026-01-28', '418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', NULL, '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', 'reserve', 'production', 'manufacturing', '工賃変動積立金', 10000, '1月度工賃変動積立'),
('f1111111-2222-0128-a111-444444444444', '22222222-2222-2222-2222-222222222222', '2026-01-28', 'd8c0b5c1-1e3c-4c7b-b384-5f5a8947f631', NULL, 'de2d336b-254d-4af7-8e49-5acbda340e67', 'reserve', 'production', 'manufacturing', '設備等修繕維持積立金', 5000, '1月度設備修繕積立'),
('f1111111-2222-0115-b111-111111111111', '22222222-2222-2222-2222-222222222222', '2026-01-15', NULL, NULL, '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', 'revenue', 'welfare', 'manufacturing', '事業収益', 1800000, '1月度障害福祉サービス給付費'),
('f1111111-2222-0128-b111-222222222222', '22222222-2222-2222-2222-222222222222', '2026-01-28', NULL, NULL, '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', 'revenue', 'welfare', 'manufacturing', '控除', 4000, '1月度食費・体験費控除'),
('f1111111-2222-0125-b111-333333333333', '22222222-2222-2222-2222-222222222222', '2026-01-25', NULL, NULL, '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', 'expense', 'welfare', 'manufacturing', '事業費用・経費', 1420000, '1月度福祉事業運営費用'),

-- 6月
('f1111111-2222-0601-a111-111111111111', '22222222-2222-2222-2222-222222222222', '2026-06-01', '418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', 'bac1fb37-abfa-4eb3-9454-d72fb7b3b7e8', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', 'revenue', 'production', 'manufacturing', '就労支援事業収益', 500000, 'ECサイト制作売上(6月)'),
('f1111111-2222-0615-a111-111111111111', '22222222-2222-2222-2222-222222222222', '2026-06-15', '418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', NULL, '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', 'expense', 'production', 'manufacturing', '材料費', 50000, '開発用消耗品費'),
('f1111111-2222-0630-a111-111111111111', '22222222-2222-2222-2222-222222222222', '2026-06-30', NULL, NULL, '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', 'expense', 'production', 'manufacturing', '労務費（利用者工賃）', 45800, '6月度工賃支払'),
('f1111111-2222-0630-a111-222222222222', '22222222-2222-2222-2222-222222222222', '2026-06-30', NULL, NULL, '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', 'expense', 'production', 'manufacturing', '労務費（その他）', 125000, '6月度人件費'),
('f1111111-2222-0630-a111-333333333333', '22222222-2222-2222-2222-222222222222', '2026-06-30', '418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', NULL, '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', 'reserve', 'production', 'manufacturing', '工賃変動積立金', 10000, '6月度工賃変動積立'),
('f1111111-2222-0630-a111-444444444444', '22222222-2222-2222-2222-222222222222', '2026-06-30', 'd8c0b5c1-1e3c-4c7b-b384-5f5a8947f631', NULL, 'de2d336b-254d-4af7-8e49-5acbda340e67', 'reserve', 'production', 'manufacturing', '設備等修繕維持積立金', 5000, '6月度設備修繕積立'),
('f1111111-2222-0615-b111-111111111111', '22222222-2222-2222-2222-222222222222', '2026-06-15', NULL, NULL, '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', 'revenue', 'welfare', 'manufacturing', '事業収益', 1850000, '6月度障害福祉サービス給付費'),
('f1111111-2222-0630-b111-222222222222', '22222222-2222-2222-2222-222222222222', '2026-06-30', NULL, NULL, '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', 'revenue', 'welfare', 'manufacturing', '控除', 4000, '6月度食費控除'),
('f1111111-2222-0630-b111-333333333333', '22222222-2222-2222-2222-222222222222', '2026-06-30', NULL, NULL, '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', 'expense', 'welfare', 'manufacturing', '事業費用・経費', 1450000, '6月度福祉事業運営費用'),

-- 事業所2: 未来ワークスあすか (33333333-3333-3333-3333-333333333333)
-- 1月
('f2222222-3333-0101-a111-111111111111', '33333333-3333-3333-3333-333333333333', '2026-01-01', '52532aea-8f77-478e-ae37-c0ef57ee5cf5', 'bac1fb37-abfa-4eb3-9454-d72fb7b3b7e8', '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'revenue', 'production', 'manufacturing', '就労支援事業収益', 450000, 'サーバー構築売上(1月)'),
('f2222222-3333-0105-a111-111111111111', '33333333-3333-3333-3333-333333333333', '2026-01-05', '33333333-0000-0000-0000-000000000003', 'bac1fb37-abfa-4eb3-9454-d72fb7b3b7e8', '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'revenue', 'production', 'manufacturing', '就労支援事業収益', 280000, 'DM封入受託売上(1月)'),
('f2222222-3333-0110-a111-111111111111', '33333333-3333-3333-3333-333333333333', '2026-01-10', '33333333-0000-0000-0000-000000000003', NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'expense', 'production', 'manufacturing', '材料費', 35000, '梱包資材費(1月)'),
('f2222222-3333-0125-a111-111111111111', '33333333-3333-3333-3333-333333333333', '2026-01-25', NULL, NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'expense', 'production', 'manufacturing', '労務費（利用者工賃）', 67350, '1月度工賃支払'),
('f2222222-3333-0125-a111-222222222222', '33333333-3333-3333-3333-333333333333', '2026-01-25', NULL, NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'expense', 'production', 'manufacturing', '労務費（その他）', 95000, '1月度指導員人件費'),
('f2222222-3333-0128-a111-111111111111', '33333333-3333-3333-3333-333333333333', '2026-01-28', '52532aea-8f77-478e-ae37-c0ef57ee5cf5', NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'expense', 'production', 'manufacturing', '外注加工費', 25000, '1月度外部技術支援'),
('f2222222-3333-0128-a111-222222222222', '33333333-3333-3333-3333-333333333333', '2026-01-28', NULL, NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'expense', 'production', 'manufacturing', 'その他経費', 30000, '1月度作業所水光熱費'),
('f2222222-3333-0128-a111-333333333333', '33333333-3333-3333-3333-333333333333', '2026-01-28', '52532aea-8f77-478e-ae37-c0ef57ee5cf5', NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'reserve', 'production', 'manufacturing', '工賃変動積立金', 8000, '1月度積立金'),
('f2222222-3333-0128-a111-444444444444', '33333333-3333-3333-3333-333333333333', '2026-01-28', '33333333-0000-0000-0000-000000000003', NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'reserve', 'production', 'manufacturing', '設備等修繕維持積立金', 4000, '1月度設備修繕積立'),
('f2222222-3333-0115-b111-111111111111', '33333333-3333-3333-3333-333333333333', '2026-01-15', NULL, NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'revenue', 'welfare', 'manufacturing', '事業収益', 1500000, '1月度給付費収入'),
('f2222222-3333-0128-b111-222222222222', '33333333-3333-3333-3333-333333333333', '2026-01-28', NULL, NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'revenue', 'welfare', 'manufacturing', '控除', 3500, '1月度食費控除'),
('f2222222-3333-0125-b111-333333333333', '33333333-3333-3333-3333-333333333333', '2026-01-25', NULL, NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'expense', 'welfare', 'manufacturing', '事業費用・経費', 1150000, '1月度福祉事業運営費用'),

-- 6月
('f2222222-3333-0601-a111-111111111111', '33333333-3333-3333-3333-333333333333', '2026-06-01', '52532aea-8f77-478e-ae37-c0ef57ee5cf5', 'bac1fb37-abfa-4eb3-9454-d72fb7b3b7e8', '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'revenue', 'production', 'manufacturing', '就労支援事業収益', 470000, 'サーバー構築売上(6月)'),
('f2222222-3333-0605-a111-111111111111', '33333333-3333-3333-3333-333333333333', '2026-06-05', '33333333-0000-0000-0000-000000000003', 'bac1fb37-abfa-4eb3-9454-d72fb7b3b7e8', '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'revenue', 'production', 'manufacturing', '就労支援事業収益', 290000, 'DM封入受託売上(6月)'),
('f2222222-3333-0610-a111-111111111111', '33333333-3333-3333-3333-333333333333', '2026-06-10', '33333333-0000-0000-0000-000000000003', NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'expense', 'production', 'manufacturing', '材料費', 38000, '梱包資材費(6月)'),
('f2222222-3333-0625-a111-111111111111', '33333333-3333-3333-3333-333333333333', '2026-06-25', NULL, NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'expense', 'production', 'manufacturing', '労務費（利用者工賃）', 70600, '6月度工賃支払'),
('f2222222-3333-0625-a111-222222222222', '33333333-3333-3333-3333-333333333333', '2026-06-25', NULL, NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'expense', 'production', 'manufacturing', '労務費（その他）', 98000, '6月度人件費'),
('f2222222-3333-0628-a111-333333333333', '33333333-3333-3333-3333-333333333333', '2026-06-28', '52532aea-8f77-478e-ae37-c0ef57ee5cf5', NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'reserve', 'production', 'manufacturing', '工賃変動積立金', 8000, '6月度積立金'),
('f2222222-3333-0628-a111-444444444444', '33333333-3333-3333-3333-333333333333', '2026-06-28', '33333333-0000-0000-0000-000000000003', NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'reserve', 'production', 'manufacturing', '設備等修繕維持積立金', 4000, '6月度設備修繕積立'),
('f2222222-3333-0615-b111-111111111111', '33333333-3333-3333-3333-333333333333', '2026-06-15', NULL, NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'revenue', 'welfare', 'manufacturing', '事業収益', 1520000, '6月度給付費収入'),
('f2222222-3333-0628-b111-222222222222', '33333333-3333-3333-3333-333333333333', '2026-06-28', NULL, NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'revenue', 'welfare', 'manufacturing', '控除', 3500, '6月度食費控除'),
('f2222222-3333-0625-b111-333333333333', '33333333-3333-3333-3333-333333333333', '2026-06-25', NULL, NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'expense', 'welfare', 'manufacturing', '事業費用・経費', 1180000, '6月度福祉事業運営費用'),

-- 事業所3: 未来オアシスガーデン (44444444-4444-4444-4444-444444444444)
-- 1月
('f3333333-4444-0101-a111-111111111111', '44444444-4444-4444-4444-444444444444', '2026-01-01', '44444444-0000-0000-0000-000000000004', '73ab0c05-9915-4894-a083-6bccf7a66d2a', '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'revenue', 'production', 'manufacturing', '就労支援事業収益', 650000, 'Web制作受託売上(1月)'),
('f3333333-4444-0105-a111-111111111111', '44444444-4444-4444-4444-444444444444', '2026-01-05', '44444444-0000-0000-0000-000000000006', '0ff5f11e-b752-4b06-aaab-86984a67eec7', '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'revenue', 'production', 'manufacturing', '就労支援事業収益', 420000, '動画制作受託売上(1月)'),
('f3333333-4444-0110-a111-111111111111', '44444444-4444-4444-4444-444444444444', '2026-01-10', '44444444-0000-0000-0000-000000000004', NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'expense', 'production', 'manufacturing', '材料費', 60000, 'サーバー・ドメイン・素材費(1月)'),
('f3333333-4444-0125-a111-111111111111', '44444444-4444-4444-4444-444444444444', '2026-01-25', NULL, NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'expense', 'production', 'manufacturing', '労務費（利用者工賃）', 120800, '1月度工賃支払'),
('f3333333-4444-0125-a111-222222222222', '44444444-4444-4444-4444-444444444444', '2026-01-25', NULL, NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'expense', 'production', 'manufacturing', '労務費（その他）', 150000, '1月度クリエイティブ指導員人件費'),
('f3333333-4444-0128-a111-111111111111', '44444444-4444-4444-4444-444444444444', '2026-01-28', '44444444-0000-0000-0000-000000000006', NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'expense', 'production', 'manufacturing', '外注加工費', 40000, '1月度ナレーション外部委託'),
('f3333333-4444-0128-a111-222222222222', '44444444-4444-4444-4444-444444444444', '2026-01-28', NULL, NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'expense', 'production', 'manufacturing', 'その他経費', 50000, '1月度デザインソフトライセンス費'),
('f3333333-4444-0128-a111-333333333333', '44444444-4444-4444-4444-444444444444', '2026-01-28', '44444444-0000-0000-0000-000000000004', NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'reserve', 'production', 'manufacturing', '工賃変動積立金', 12000, '1月度工賃積立'),
('f3333333-4444-0128-a111-444444444444', '44444444-4444-4444-4444-444444444444', '2026-01-28', '44444444-0000-0000-0000-000000000006', NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'reserve', 'production', 'manufacturing', '設備等修繕維持積立金', 8000, '1月度PC機材修繕積立'),
('f3333333-4444-0115-b111-111111111111', '44444444-4444-4444-4444-444444444444', '2026-01-15', NULL, NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'revenue', 'welfare', 'manufacturing', '事業収益', 2100000, '1月度給付費収入'),
('f3333333-4444-0128-b111-222222222222', '44444444-4444-4444-4444-444444444444', '2026-01-28', NULL, NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'revenue', 'welfare', 'manufacturing', '控除', 5000, '1月度昼食代控除'),
('f3333333-4444-0125-b111-333333333333', '44444444-4444-4444-4444-444444444444', '2026-01-25', NULL, NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'expense', 'welfare', 'manufacturing', '事業費用・経費', 1650000, '1月度施設運営経費'),

-- 6月
('f3333333-4444-0601-a111-111111111111', '44444444-4444-4444-4444-444444444444', '2026-06-01', '44444444-0000-0000-0000-000000000004', '73ab0c05-9915-4894-a083-6bccf7a66d2a', '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'revenue', 'production', 'manufacturing', '就労支援事業収益', 680000, 'Web制作受託売上(6月)'),
('f3333333-4444-0605-a111-111111111111', '44444444-4444-4444-4444-444444444444', '2026-06-05', '44444444-0000-0000-0000-000000000006', '0ff5f11e-b752-4b06-aaab-86984a67eec7', '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'revenue', 'production', 'manufacturing', '就労支援事業収益', 450000, '動画制作受託売上(6月)'),
('f3333333-4444-0610-a111-111111111111', '44444444-4444-4444-4444-444444444444', '2026-06-10', '44444444-0000-0000-0000-000000000004', NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'expense', 'production', 'manufacturing', '材料費', 65000, '素材ライセンス費(6月)'),
('f3333333-4444-0625-a111-111111111111', '44444444-4444-4444-4444-444444444444', '2026-06-25', NULL, NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'expense', 'production', 'manufacturing', '労務費（利用者工賃）', 125500, '6月度工賃支払'),
('f3333333-4444-0625-a111-222222222222', '44444444-4444-4444-4444-444444444444', '2026-06-25', NULL, NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'expense', 'production', 'manufacturing', '労務費（その他）', 155000, '6月度指導員人件費'),
('f3333333-4444-0628-a111-333333333333', '44444444-4444-4444-4444-444444444444', '2026-06-28', '44444444-0000-0000-0000-000000000004', NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'reserve', 'production', 'manufacturing', '工賃変動積立金', 12000, '6月度工賃積立'),
('f3333333-4444-0628-a111-444444444444', '44444444-4444-4444-4444-444444444444', '2026-06-28', '44444444-0000-0000-0000-000000000006', NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'reserve', 'production', 'manufacturing', '設備等修繕維持積立金', 8000, '6月度PC機材修繕積立'),
('f3333333-4444-0615-b111-111111111111', '44444444-4444-4444-4444-444444444444', '2026-06-15', NULL, NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'revenue', 'welfare', 'manufacturing', '事業収益', 2150000, '6月度給付費収入'),
('f3333333-4444-0628-b111-222222222222', '44444444-4444-4444-4444-444444444444', '2026-06-28', NULL, NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'revenue', 'welfare', 'manufacturing', '控除', 5000, '6月度昼食代控除'),
('f3333333-4444-0625-b111-333333333333', '44444444-4444-4444-4444-444444444444', '2026-06-25', NULL, NULL, '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'expense', 'welfare', 'manufacturing', '事業費用・経費', 1680000, '6月度施設運営経費')
ON CONFLICT (id) DO NOTHING;
