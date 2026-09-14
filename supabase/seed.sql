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
('00000000-0000-0000-0000-000000000000', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'authenticated', 'authenticated', 'member-004@example.com', '', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- 2. Public Auth Users (public.auth_users テーブル)
INSERT INTO public.auth_users (id, email, role, user_type) VALUES
('563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', 'staff-001@example.com', 'Administrator', 'staff'),
('de2d336b-254d-4af7-8e49-5acbda340e67', 'staff-002@example.com', 'Staff', 'staff'),
('5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'staff-003@example.com', 'Staff', 'staff'),
('b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'member-001@example.com', 'Member', 'member'),
('e98c7634-1eb3-4e42-b062-841f39c043e0', 'member-002@example.com', 'Member', 'member'),
('a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'member-003@example.com', 'Member', 'member'),
('f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'member-004@example.com', 'Member', 'member')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  user_type = EXCLUDED.user_type;

-- 3. 法人 & 事業所マスタ (organizations / offices)
INSERT INTO public.organizations (id, code, name, yomigana, representative_name, corporate_number) VALUES
('11111111-1111-1111-1111-111111111111', 'ORG-001', '社会福祉法人未来福祉会', 'しゃかいふくしほうじんみらいふくしかい', '理事長 山田太郎', '1234567890123')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.offices (id, organization_id, code, name, is_type_b, is_type_a, is_transition, unit_price) VALUES
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'OFF-001', '多機能型事業所 ワークステーション未来', true, true, false, 10.68)
ON CONFLICT (id) DO NOTHING;

-- 4. サービス体系 & 項目マスタ (service_schemes / service_items)
INSERT INTO public.service_schemes (id, name, service_type, description, basic_reward_unit) VALUES
('33333333-3333-3333-3333-333333333333', '就労継続支援B型標準サービス体系', 'type_b', '就労継続支援B型の標準的な給付費・加減算体系', 580.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.service_items (id, service_scheme_id, name, item_category, occurrence_type, unit_value, calc_rate, value_type, monthly_limit_count, affects_reward_units, is_auto_calculated) VALUES
('44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333333', '送迎加算', 'reward_addition', 'daily', 21.00, 0, 'unit', NULL, true, false),
('44444444-4444-4444-4444-444444444402', '33333333-3333-3333-3333-333333333333', '欠席時対応加算', 'reward_addition', 'daily', 94.00, 0, 'unit', 4, true, true),
('44444444-4444-4444-4444-444444444403', '33333333-3333-3333-3333-333333333333', '福祉・介護職員等処遇改善加算Ⅰ', 'reward_addition', 'monthly', 0, 9.30, 'rate', NULL, true, true),
('44444444-4444-4444-4444-444444444404', '33333333-3333-3333-3333-333333333333', '資格手当', 'allowance', 'daily', 500.00, 0, 'yen', NULL, false, false),
('44444444-4444-4444-4444-444444444405', '33333333-3333-3333-3333-333333333333', '昼食代控除', 'deduction', 'daily', 350.00, 0, 'yen', NULL, false, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.office_service_settings (office_id, service_scheme_id, valid_from) VALUES
('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '2025-04-01')
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
INSERT INTO public.wage_rate_items (id, service_scheme_id, wage, description) VALUES
('a1b2c3d4-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 100, '新人レベル'),
('a1b2c3d4-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 250, '中堅レベル'),
('a1b2c3d4-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 500, 'ベテランレベル')
ON CONFLICT (id) DO NOTHING;

-- 7. 利用者マスタ & 事業所割当 (members / office_member_settings)
INSERT INTO public.members (id, user_id, code, name, yomigana) VALUES
('b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'M-000001', '江口春奈', 'えぐちはるな'),
('e98c7634-1eb3-4e42-b062-841f39c043e0', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 'M-000002', '大西智也', 'おおにしともや'),
('a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'M-000003', '佐藤健太', 'さとうけんた'),
('f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'M-000004', '高橋結衣', 'たかはしゆい')
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  code = EXCLUDED.code,
  name = EXCLUDED.name,
  yomigana = EXCLUDED.yomigana;

INSERT INTO public.office_member_settings (office_id, member_id, is_primary) VALUES
('22222222-2222-2222-2222-222222222222', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', true),
('22222222-2222-2222-2222-222222222222', 'e98c7634-1eb3-4e42-b062-841f39c043e0', true),
('22222222-2222-2222-2222-222222222222', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', true),
('22222222-2222-2222-2222-222222222222', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', true)
ON CONFLICT (id) DO NOTHING;

-- 8. 利用者工賃単価割当 (member_wage_settings)
INSERT INTO public.member_wage_settings (member_id, wage_rate_id) VALUES
('b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'a1b2c3d4-0000-0000-0000-000000000001'),
('e98c7634-1eb3-4e42-b062-841f39c043e0', 'a1b2c3d4-0000-0000-0000-000000000002'),
('a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'a1b2c3d4-0000-0000-0000-000000000002'),
('f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'a1b2c3d4-0000-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;

-- 9. 取引先マスタ (partners)
INSERT INTO public.partners (id, code, name, yomigana, contact_person, is_customer, is_subcontractor) VALUES 
('73ab0c05-9915-4894-a083-6bccf7a66d2a', 'C-000001', '株式会社テクノソリューションズ', 'かぶしきがいしゃてくのそりゅーしょんず', '佐々木凛', true, false),
('bac1fb37-abfa-4eb3-9454-d72fb7b3b7e8', 'C-000002', 'グローバルインダストリー株式会社', 'ぐろーばるいんだすとりーかぶしきがいしゃ', '清水蒼', true, true),
('0ff5f11e-b752-4b06-aaab-86984a67eec7', 'C-000003', '合同会社イノベーションラボ', 'ごうどうがいしゃいのべーしょんらぼ', '杉山結愛', false, true)
ON CONFLICT (id) DO NOTHING;

-- 10. スキル体系 & スキル項目マスタ (skill_schemes / skill_items / skill_level_items)
INSERT INTO public.skill_schemes (id, name, description) VALUES
('55555555-5555-5555-5555-555555555555', '全社標準スキル体系', 'IT作業・オフィス作業・製造業務の標準スキル分類')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.skill_items (id, skill_scheme_id, name, description) VALUES
('ec4310ed-27ab-4cb7-a13a-8c937bfc2a42', '55555555-5555-5555-5555-555555555555', 'ネットワーク設計', 'ネットワーク構成の設計・構築'),
('817f8df7-05bc-4610-8a37-9609ff4ae89d', '55555555-5555-5555-5555-555555555555', 'Cisco', 'Cisco製ネットワーク機器の設定・管理'),
('f3b0d9b2-ab80-48e1-abf2-7f7b6653b6d2', '55555555-5555-5555-5555-555555555555', 'Linux', 'Linuxサーバーの構築・運用'),
('8172c05b-207d-4ca4-82e5-c8e51328accc', '55555555-5555-5555-5555-555555555555', 'Windows Server', 'Windows Serverの構築・運用'),
('676fa8f0-b4d8-4035-ae3f-de391ece3a63', '55555555-5555-5555-5555-555555555555', 'React', 'Reactによるフロントエンド開発'),
('38eb7141-55bd-43d0-a6a5-7d028233eb17', '55555555-5555-5555-5555-555555555555', 'TypeScript', 'TypeScriptによる静的型付け'),
('9322b5f6-fbb0-4a6e-a365-b814fbca7d49', '55555555-5555-5555-5555-555555555555', 'Figma', 'Figmaを用いたUI/UXデザイン'),
('3beb5767-f4b8-4c92-a9b8-be10e94ac7d6', '55555555-5555-5555-5555-555555555555', 'Oracle', 'Oracle Databaseの設計・運用'),
('740001dd-4b33-4d53-8b05-f08d178a408c', '55555555-5555-5555-5555-555555555555', 'PL/SQL', 'PL/SQLによるデータベースプログラミング'),
('baf4f0c2-954d-46ac-a3e4-a0ad211155c8', '55555555-5555-5555-5555-555555555555', 'Python', 'Pythonによるバックエンド開発・データ処理'),
('074ce5ed-005a-4a3d-8681-a9eed17c4986', '55555555-5555-5555-5555-555555555555', 'セキュリティ監査', '情報セキュリティの監査・評価'),
('f0624c11-e56b-4267-a730-75dd6980b578', '55555555-5555-5555-5555-555555555555', 'ペネトレーションテスト', 'システムへの侵入テスト'),
('128b9cc4-7e82-4f3b-b2ab-94f83b1c67d3', '55555555-5555-5555-5555-555555555555', '製パン技術', 'パンの製造および関連技術'),
('874c9f1a-5d6b-4e2c-9a3e-781f2a5b0c9d', '55555555-5555-5555-5555-555555555555', '接客・販売', '店舗での接客、販売業務全般')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.skill_level_items (id, skill_scheme_id, level_value, description) VALUES
('e24bd35c-7833-41c3-ab5b-5136db6d75d1', '55555555-5555-5555-5555-555555555555', 1, '基本的な作業はできるが、サポートが必要'),
('cdfc7a4d-c124-41d3-98cb-fb1b15ad39bb', '55555555-5555-5555-5555-555555555555', 2, '日常的な作業を自立して行える'),
('9b139db0-a352-4f38-89c0-9dff60a4f66a', '55555555-5555-5555-5555-555555555555', 3, '他者のサポートやトラブルシューティングができる')
ON CONFLICT (id) DO NOTHING;

-- 11. 案件 & タスク (projects / project_tasks)
INSERT INTO public.projects (id, name, code, project_type) VALUES ('00000000-0000-0000-0000-000000000001', 'その他', 'P-000000', 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.project_tasks (id, project_id, name) VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'その他作業') ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, name, code, client_id) VALUES ('418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', '本社オフィスネットワーク構築', 'P-000001', '73ab0c05-9915-4894-a083-6bccf7a66d2a') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.project_tasks (id, project_id, name, assignee_type) VALUES ('aaceaea1-43df-42c1-bfc6-1794a4eb9e16', '418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', '要件定義', 'internal') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.task_skill_settings (task_id, skill_id, skill_level_id) VALUES ('aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 'ec4310ed-27ab-4cb7-a13a-8c937bfc2a42', 'cdfc7a4d-c124-41d3-98cb-fb1b15ad39bb') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.task_skill_settings (task_id, skill_id, skill_level_id) VALUES ('aaceaea1-43df-42c1-bfc6-1794a4eb9e16', '817f8df7-05bc-4610-8a37-9609ff4ae89d', '9b139db0-a352-4f38-89c0-9dff60a4f66a') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.task_assignee_settings (task_id, member_id) VALUES ('aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a') ON CONFLICT (id) DO NOTHING;

INSERT INTO public.project_tasks (id, project_id, name, assignee_type) VALUES ('3334e7a8-684e-4695-a503-5cccdc2b0e50', '418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', '基本・詳細設計', 'external') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.task_skill_settings (task_id, skill_id, skill_level_id) VALUES ('3334e7a8-684e-4695-a503-5cccdc2b0e50', 'ec4310ed-27ab-4cb7-a13a-8c937bfc2a42', 'e24bd35c-7833-41c3-ab5b-5136db6d75d1') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.task_skill_settings (task_id, skill_id, skill_level_id) VALUES ('3334e7a8-684e-4695-a503-5cccdc2b0e50', '817f8df7-05bc-4610-8a37-9609ff4ae89d', 'cdfc7a4d-c124-41d3-98cb-fb1b15ad39bb') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.task_assignee_settings (task_id, client_id) VALUES ('3334e7a8-684e-4695-a503-5cccdc2b0e50', 'bac1fb37-abfa-4eb3-9454-d72fb7b3b7e8') ON CONFLICT (id) DO NOTHING;

INSERT INTO public.project_tasks (id, project_id, name, assignee_type) VALUES ('8daa6b8b-ddb2-462a-9594-1738f004832f', '418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', '構築・テスト', 'internal') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.task_skill_settings (task_id, skill_id, skill_level_id) VALUES ('8daa6b8b-ddb2-462a-9594-1738f004832f', '817f8df7-05bc-4610-8a37-9609ff4ae89d', '9b139db0-a352-4f38-89c0-9dff60a4f66a') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.task_skill_settings (task_id, skill_id, skill_level_id) VALUES ('8daa6b8b-ddb2-462a-9594-1738f004832f', 'f3b0d9b2-ab80-48e1-abf2-7f7b6653b6d2', '9b139db0-a352-4f38-89c0-9dff60a4f66a') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.task_assignee_settings (task_id, member_id) VALUES ('8daa6b8b-ddb2-462a-9594-1738f004832f', 'e98c7634-1eb3-4e42-b062-841f39c043e0') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.task_assignee_settings (task_id, member_id) VALUES ('8daa6b8b-ddb2-462a-9594-1738f004832f', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a') ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, name, code, client_id, project_type, settlement_year_month) VALUES ('52532aea-8f77-478e-ae37-c0ef57ee5cf5', '支社サーバーリプレイス', 'P-000002', 'bac1fb37-abfa-4eb3-9454-d72fb7b3b7e8', 'one-off', '2026-08') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.project_tasks (id, project_id, name, assignee_type, is_completed, completed_at) VALUES ('adc26f10-909b-4ae1-b255-a86a5014dd3d', '52532aea-8f77-478e-ae37-c0ef57ee5cf5', 'サーバー構築', 'external', true, '2026-08-31 23:59:59+09') ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, name, code, client_id, project_type, created_at) VALUES ('d8c0b5c1-1e3c-4c7b-b384-5f5a8947f631', 'パンの販売・カフェ運営', 'P-000005', NULL, 'ongoing', '2026-06-01 09:00:00+09') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.project_tasks (id, project_id, name, assignee_type) VALUES ('e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 'd8c0b5c1-1e3c-4c7b-b384-5f5a8947f631', '製造業務', 'internal') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.task_assignee_settings (task_id, member_id) VALUES ('e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.project_tasks (id, project_id, name, assignee_type) VALUES ('1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 'd8c0b5c1-1e3c-4c7b-b384-5f5a8947f631', '販売・接客業務', 'internal') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.task_assignee_settings (task_id, member_id) VALUES ('1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 'e98c7634-1eb3-4e42-b062-841f39c043e0') ON CONFLICT (id) DO NOTHING;

-- 12. 作業実績 (work_records) & 出欠実績 (attendance_records)
INSERT INTO public.attendance_records (office_id, target_period, member_id, status, contact_date, is_absentee_supported, remarks) VALUES
('22222222-2222-2222-2222-222222222222', '2026-06-15', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'present', NULL, false, '通常通所'),
('22222222-2222-2222-2222-222222222222', '2026-06-15', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 'present', NULL, false, '通常通所'),
('22222222-2222-2222-2222-222222222222', '2026-06-16', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'present', NULL, false, '通常通所'),
('22222222-2222-2222-2222-222222222222', '2026-06-16', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 'present', NULL, false, '通常通所'),
('22222222-2222-2222-2222-222222222222', '2026-06-17', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'present', NULL, false, '通常通所'),
('22222222-2222-2222-2222-222222222222', '2026-06-17', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 'absent', '2026-06-16', true, '体調不良欠席（前日連絡・加算適用）')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.work_records (office_id, target_period, member_id, task_id, work_time) VALUES
('22222222-2222-2222-2222-222222222222', '2026-06-15', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 2),
('22222222-2222-2222-2222-222222222222', '2026-06-15', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '8daa6b8b-ddb2-462a-9594-1738f004832f', 2),
('22222222-2222-2222-2222-222222222222', '2026-06-16', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 3),
('22222222-2222-2222-2222-222222222222', '2026-06-16', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '8daa6b8b-ddb2-462a-9594-1738f004832f', 3),
('22222222-2222-2222-2222-222222222222', '2026-06-17', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 4)
ON CONFLICT (id) DO NOTHING;

-- 13. 日次確定 (daily_record_closings)
INSERT INTO public.daily_record_closings (target_period, is_confirmed) VALUES
('2026-06-15', true), ('2026-06-16', true), ('2026-06-17', true), ('2026-06-29', true), ('2026-06-30', true)
ON CONFLICT (target_period) DO NOTHING;

-- 14. 月次工賃サマリー (wage_summaries)
INSERT INTO public.wage_summaries (id, target_period, member_id, work_time, wage_rate, basic_wage, incentive_total, other_allowance_total, wage_total, deduction_total, payment) VALUES
('ad3d75e0-3cf0-42ea-800b-5e476066c58c', '2026-06', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 31.5, 100, 3150, 0, 0, 3150, 0, 3150),
('c1e12adb-6dad-415f-97e0-5a07b3949836', '2026-06', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 28.5, 250, 7125, 0, 0, 7125, 0, 7125),
('cef35b6d-7133-4d2f-880a-50c262c06f3b', '2026-06', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', 7, 250, 1750, 0, 0, 1750, 0, 1750),
('d7180e25-0901-4201-bcf7-b9ee5259d860', '2026-06', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 7, 500, 3500, 0, 0, 3500, 0, 3500)
ON CONFLICT (target_period, member_id) DO NOTHING;
