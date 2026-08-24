-- Auth users
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) VALUES ('00000000-0000-0000-0000-000000000000', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', 'authenticated', 'authenticated', 'staff-001@example.com', '', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) VALUES ('00000000-0000-0000-0000-000000000000', 'de2d336b-254d-4af7-8e49-5acbda340e67', 'authenticated', 'authenticated', 'staff-002@example.com', '', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) VALUES ('00000000-0000-0000-0000-000000000000', '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'authenticated', 'authenticated', 'staff-003@example.com', '', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) VALUES ('00000000-0000-0000-0000-000000000000', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'authenticated', 'authenticated', 'member-001@example.com', '', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) VALUES ('00000000-0000-0000-0000-000000000000', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 'authenticated', 'authenticated', 'member-002@example.com', '', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) VALUES ('00000000-0000-0000-0000-000000000000', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'authenticated', 'authenticated', 'member-003@example.com', '', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) VALUES ('00000000-0000-0000-0000-000000000000', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'authenticated', 'authenticated', 'member-004@example.com', '', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');

-- Staffs
INSERT INTO staffs (id, code, name, yomigana, email, role) VALUES ('563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', 'S-000001', '相澤翔太', 'あいざわしょうた', 'staff-001@example.com', 'システム管理者');
INSERT INTO staffs (id, code, name, yomigana, email, role) VALUES ('de2d336b-254d-4af7-8e49-5acbda340e67', 'S-000002', '井上結衣', 'いのうえゆい', 'staff-002@example.com', '職員');
INSERT INTO staffs (id, code, name, yomigana, email, role) VALUES ('5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'S-000003', '上田拓海', 'うえだたくみ', 'staff-003@example.com', '職員');

-- Wage Rates
INSERT INTO wage_rates (id, wage, description) VALUES ('a1b2c3d4-0000-0000-0000-000000000001', 100, '新人レベル');
INSERT INTO wage_rates (id, wage, description) VALUES ('a1b2c3d4-0000-0000-0000-000000000002', 250, '中堅レベル');
INSERT INTO wage_rates (id, wage, description) VALUES ('a1b2c3d4-0000-0000-0000-000000000003', 500, 'ベテランレベル');
-- Categories

-- Locations

-- Suppliers

-- Items


-- Transactions

-- Stocktakings

-- Members
INSERT INTO members (id, code, name, yomigana, role, email, wage_rate_id) VALUES ('b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'M-000001', '江口春奈', 'えぐちはるな', '利用者', 'member-001@example.com', 'a1b2c3d4-0000-0000-0000-000000000001');
INSERT INTO members (id, code, name, yomigana, role, email, wage_rate_id) VALUES ('e98c7634-1eb3-4e42-b062-841f39c043e0', 'M-000002', '大西智也', 'おおにしともや', '利用者', 'member-002@example.com', 'a1b2c3d4-0000-0000-0000-000000000002');
INSERT INTO members (id, code, name, yomigana, role, email, wage_rate_id) VALUES ('a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'M-000003', '佐藤健太', 'さとうけんた', '利用者', 'member-003@example.com', 'a1b2c3d4-0000-0000-0000-000000000002');
INSERT INTO members (id, code, name, yomigana, role, email, wage_rate_id) VALUES ('f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'M-000004', '高橋結衣', 'たかはしゆい', '利用者', 'member-004@example.com', 'a1b2c3d4-0000-0000-0000-000000000003');

-- Partners
INSERT INTO partners (id, code, name, yomigana, contact_person, phone) VALUES ('73ab0c05-9915-4894-a083-6bccf7a66d2a', 'C-000001', '株式会社テクノソリューションズ', 'かぶしきがいしゃてくのそりゅーしょんず', '佐々木凛', '0312345678');
INSERT INTO partners (id, code, name, yomigana, contact_person, phone) VALUES ('bac1fb37-abfa-4eb3-9454-d72fb7b3b7e8', 'C-000002', 'グローバルインダストリー株式会社', 'ぐろーばるいんだすとりーかぶしきがいしゃ', '清水蒼', '0698765432');
INSERT INTO partners (id, code, name, yomigana, contact_person, phone) VALUES ('0ff5f11e-b752-4b06-aaab-86984a67eec7', 'C-000003', '合同会社イノベーションラボ', 'ごうどうがいしゃいのべーしょんらぼ', '杉山結愛', '05011112222');

-- Skills
INSERT INTO skills (id, name, yomigana, description) VALUES ('ec4310ed-27ab-4cb7-a13a-8c937bfc2a42', 'ネットワーク設計', 'ねっとわーくせっけい', 'ネットワーク構成の設計・構築');
INSERT INTO skills (id, name, yomigana, description) VALUES ('817f8df7-05bc-4610-8a37-9609ff4ae89d', 'Cisco', 'しすこ', 'Cisco製ネットワーク機器の設定・管理');
INSERT INTO skills (id, name, yomigana, description) VALUES ('f3b0d9b2-ab80-48e1-abf2-7f7b6653b6d2', 'Linux', 'りなっくす', 'Linuxサーバーの構築・運用');
INSERT INTO skills (id, name, yomigana, description) VALUES ('8172c05b-207d-4ca4-82e5-c8e51328accc', 'Windows Server', 'うぃんどうずさーばー', 'Windows Serverの構築・運用');
INSERT INTO skills (id, name, yomigana, description) VALUES ('676fa8f0-b4d8-4035-ae3f-de391ece3a63', 'React', 'りあくと', 'Reactによるフロントエンド開発');
INSERT INTO skills (id, name, yomigana, description) VALUES ('38eb7141-55bd-43d0-a6a5-7d028233eb17', 'TypeScript', 'たいぷすくりぷと', 'TypeScriptによる静的型付け');
INSERT INTO skills (id, name, yomigana, description) VALUES ('9322b5f6-fbb0-4a6e-a365-b814fbca7d49', 'Figma', 'ふぃぐま', 'Figmaを用いたUI/UXデザイン');
INSERT INTO skills (id, name, yomigana, description) VALUES ('3beb5767-f4b8-4c92-a9b8-be10e94ac7d6', 'Oracle', 'おらくる', 'Oracle Databaseの設計・運用');
INSERT INTO skills (id, name, yomigana, description) VALUES ('740001dd-4b33-4d53-8b05-f08d178a408c', 'PL/SQL', 'ぴーえるえすきゅーえる', 'PL/SQLによるデータベースプログラミング');
INSERT INTO skills (id, name, yomigana, description) VALUES ('baf4f0c2-954d-46ac-a3e4-a0ad211155c8', 'Python', 'ぱいそん', 'Pythonによるバックエンド開発・データ処理');
INSERT INTO skills (id, name, yomigana, description) VALUES ('074ce5ed-005a-4a3d-8681-a9eed17c4986', 'セキュリティ監査', 'せきゅりてぃかんさ', '情報セキュリティの監査・評価');
INSERT INTO skills (id, name, yomigana, description) VALUES ('f0624c11-e56b-4267-a730-75dd6980b578', 'ペネトレーションテスト', 'ぺねとれーしょんてすと', 'システムへの侵入テスト');
INSERT INTO skills (id, name, yomigana, description) VALUES ('128b9cc4-7e82-4f3b-b2ab-94f83b1c67d3', '製パン技術', 'せいぱんぎじゅつ', 'パンの製造および関連技術');
INSERT INTO skills (id, name, yomigana, description) VALUES ('874c9f1a-5d6b-4e2c-9a3e-781f2a5b0c9d', '接客・販売', 'せっきゃく・はんばい', '店舗での接客、販売業務全般');

-- Skill Levels
INSERT INTO skill_levels (id, level_value, description) VALUES ('e24bd35c-7833-41c3-ab5b-5136db6d75d1', 1, '基本的な作業はできるが、サポートが必要');
INSERT INTO skill_levels (id, level_value, description) VALUES ('cdfc7a4d-c124-41d3-98cb-fb1b15ad39bb', 2, '日常的な作業を自立して行える');
INSERT INTO skill_levels (id, level_value, description) VALUES ('9b139db0-a352-4f38-89c0-9dff60a4f66a', 3, '他者のサポートやトラブルシューティングができる');


-- Projects
INSERT INTO projects (id, name, code, project_type) VALUES ('00000000-0000-0000-0000-000000000001', 'その他', 'P-000000', 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO project_tasks (id, project_id, name, code) VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'その他作業', 'T-00A000') ON CONFLICT (id) DO NOTHING;

INSERT INTO projects (id, name, code, client_id) VALUES ('418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', '本社オフィスネットワーク構築', 'P-000001', '73ab0c05-9915-4894-a083-6bccf7a66d2a');
INSERT INTO project_tasks (id, project_id, name, code, assignee_type) VALUES ('aaceaea1-43df-42c1-bfc6-1794a4eb9e16', '418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', '要件定義', 'T-26A001', 'internal');
INSERT INTO project_task_skills (task_id, skill_id, skill_level_id) VALUES ('aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 'ec4310ed-27ab-4cb7-a13a-8c937bfc2a42', 'cdfc7a4d-c124-41d3-98cb-fb1b15ad39bb');
INSERT INTO project_task_skills (task_id, skill_id, skill_level_id) VALUES ('aaceaea1-43df-42c1-bfc6-1794a4eb9e16', '817f8df7-05bc-4610-8a37-9609ff4ae89d', '9b139db0-a352-4f38-89c0-9dff60a4f66a');
INSERT INTO project_task_assignees (task_id, member_id) VALUES ('aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a');
INSERT INTO project_tasks (id, project_id, name, code, assignee_type) VALUES ('3334e7a8-684e-4695-a503-5cccdc2b0e50', '418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', '基本・詳細設計', 'T-26A002', 'external');
INSERT INTO project_task_skills (task_id, skill_id, skill_level_id) VALUES ('3334e7a8-684e-4695-a503-5cccdc2b0e50', 'ec4310ed-27ab-4cb7-a13a-8c937bfc2a42', 'e24bd35c-7833-41c3-ab5b-5136db6d75d1');
INSERT INTO project_task_skills (task_id, skill_id, skill_level_id) VALUES ('3334e7a8-684e-4695-a503-5cccdc2b0e50', '817f8df7-05bc-4610-8a37-9609ff4ae89d', 'cdfc7a4d-c124-41d3-98cb-fb1b15ad39bb');
INSERT INTO project_task_assignees (task_id, client_id) VALUES ('3334e7a8-684e-4695-a503-5cccdc2b0e50', 'bac1fb37-abfa-4eb3-9454-d72fb7b3b7e8');
INSERT INTO project_tasks (id, project_id, name, code, assignee_type) VALUES ('8daa6b8b-ddb2-462a-9594-1738f004832f', '418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', '構築・テスト', 'T-26A003', 'internal');
INSERT INTO project_task_skills (task_id, skill_id, skill_level_id) VALUES ('8daa6b8b-ddb2-462a-9594-1738f004832f', '817f8df7-05bc-4610-8a37-9609ff4ae89d', '9b139db0-a352-4f38-89c0-9dff60a4f66a');
INSERT INTO project_task_skills (task_id, skill_id, skill_level_id) VALUES ('8daa6b8b-ddb2-462a-9594-1738f004832f', 'f3b0d9b2-ab80-48e1-abf2-7f7b6653b6d2', '9b139db0-a352-4f38-89c0-9dff60a4f66a');
INSERT INTO project_task_assignees (task_id, member_id) VALUES ('8daa6b8b-ddb2-462a-9594-1738f004832f', 'e98c7634-1eb3-4e42-b062-841f39c043e0');
INSERT INTO project_task_assignees (task_id, member_id) VALUES ('8daa6b8b-ddb2-462a-9594-1738f004832f', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a');
INSERT INTO project_task_assignees (task_id, member_id) VALUES ('3334e7a8-684e-4695-a503-5cccdc2b0e50', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a');
INSERT INTO project_task_assignees (task_id, member_id) VALUES ('3334e7a8-684e-4695-a503-5cccdc2b0e50', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0');
INSERT INTO projects (id, name, code, client_id, project_type, settlement_year_month) VALUES ('52532aea-8f77-478e-ae37-c0ef57ee5cf5', '支社サーバーリプレイス', 'P-000002', 'bac1fb37-abfa-4eb3-9454-d72fb7b3b7e8', 'one-off', '2026-08');
INSERT INTO project_tasks (id, project_id, name, code, assignee_type, status, completed_at) VALUES ('adc26f10-909b-4ae1-b255-a86a5014dd3d', '52532aea-8f77-478e-ae37-c0ef57ee5cf5', 'サーバー構築', 'T-26D001', 'external', 'completed', '2026-08-31 23:59:59+09');
INSERT INTO project_task_skills (task_id, skill_id, skill_level_id) VALUES ('adc26f10-909b-4ae1-b255-a86a5014dd3d', 'f3b0d9b2-ab80-48e1-abf2-7f7b6653b6d2', 'cdfc7a4d-c124-41d3-98cb-fb1b15ad39bb');
INSERT INTO project_task_skills (task_id, skill_id, skill_level_id) VALUES ('adc26f10-909b-4ae1-b255-a86a5014dd3d', '8172c05b-207d-4ca4-82e5-c8e51328accc', 'e24bd35c-7833-41c3-ab5b-5136db6d75d1');
INSERT INTO project_task_assignees (task_id, client_id) VALUES ('adc26f10-909b-4ae1-b255-a86a5014dd3d', '0ff5f11e-b752-4b06-aaab-86984a67eec7');

-- Additional Projects with Staff and Members
INSERT INTO projects (id, name, code, client_id, created_at) VALUES ('a91b78c8-8047-4dad-924c-1ee58074ff78', '新規Webサービス開発支援', 'P-000003', '73ab0c05-9915-4894-a083-6bccf7a66d2a', '2025-10-01 09:00:00+09');
INSERT INTO project_tasks (id, project_id, name, code, assignee_type) VALUES ('9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 'a91b78c8-8047-4dad-924c-1ee58074ff78', 'UI/UXデザイン', 'T-25J001', 'internal');
INSERT INTO project_task_skills (task_id, skill_id, skill_level_id) VALUES ('9f95bc37-68fb-43ab-99b0-49eb8d0f500e', '676fa8f0-b4d8-4035-ae3f-de391ece3a63', 'e24bd35c-7833-41c3-ab5b-5136db6d75d1');
INSERT INTO project_task_skills (task_id, skill_id, skill_level_id) VALUES ('9f95bc37-68fb-43ab-99b0-49eb8d0f500e', '38eb7141-55bd-43d0-a6a5-7d028233eb17', 'e24bd35c-7833-41c3-ab5b-5136db6d75d1');
INSERT INTO project_task_assignees (task_id, staff_id) VALUES ('9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 'de2d336b-254d-4af7-8e49-5acbda340e67');
INSERT INTO project_task_assignees (task_id, member_id) VALUES ('9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a');
INSERT INTO project_task_assignees (task_id, member_id) VALUES ('9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0');
INSERT INTO project_tasks (id, project_id, name, code, assignee_type) VALUES ('b6ed11d0-6084-48d5-bda3-6971fa912e5f', 'a91b78c8-8047-4dad-924c-1ee58074ff78', 'フロントエンド実装', 'T-25J002', 'internal');
INSERT INTO project_task_skills (task_id, skill_id, skill_level_id) VALUES ('b6ed11d0-6084-48d5-bda3-6971fa912e5f', '676fa8f0-b4d8-4035-ae3f-de391ece3a63', '9b139db0-a352-4f38-89c0-9dff60a4f66a');
INSERT INTO project_task_skills (task_id, skill_id, skill_level_id) VALUES ('b6ed11d0-6084-48d5-bda3-6971fa912e5f', '38eb7141-55bd-43d0-a6a5-7d028233eb17', 'cdfc7a4d-c124-41d3-98cb-fb1b15ad39bb');
INSERT INTO project_task_assignees (task_id, staff_id) VALUES ('b6ed11d0-6084-48d5-bda3-6971fa912e5f', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa');
INSERT INTO project_task_assignees (task_id, member_id) VALUES ('b6ed11d0-6084-48d5-bda3-6971fa912e5f', 'e98c7634-1eb3-4e42-b062-841f39c043e0');
INSERT INTO project_task_assignees (task_id, member_id) VALUES ('b6ed11d0-6084-48d5-bda3-6971fa912e5f', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2');
INSERT INTO projects (id, name, code, client_id, project_type) VALUES ('7e3a29d8-9ba7-49c1-b7a0-24e894f92098', '社内基幹システム移行', 'P-000004', '73ab0c05-9915-4894-a083-6bccf7a66d2a', 'one-off');
INSERT INTO project_tasks (id, project_id, name, code, status, is_canceled, assignee_type) VALUES ('d6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', '7e3a29d8-9ba7-49c1-b7a0-24e894f92098', 'データ移行計画', 'T-26A004', 'in_progress', false, 'internal');
INSERT INTO project_task_assignees (task_id, staff_id) VALUES ('d6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa');
INSERT INTO project_task_assignees (task_id, member_id) VALUES ('d6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a');
INSERT INTO project_task_assignees (task_id, member_id) VALUES ('d6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', 'e98c7634-1eb3-4e42-b062-841f39c043e0');

-- Additional Daily Work Records
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-15', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 2);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-15', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', '9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 2);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-15', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', 2);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-15', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '8daa6b8b-ddb2-462a-9594-1738f004832f', 2);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-15', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 'b6ed11d0-6084-48d5-bda3-6971fa912e5f', 2);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-15', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', 2);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-16', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 3);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-16', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', '9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 3);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-16', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', 3);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-16', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '8daa6b8b-ddb2-462a-9594-1738f004832f', 3);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-16', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 'b6ed11d0-6084-48d5-bda3-6971fa912e5f', 3);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-16', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', 3);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-17', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 4);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-17', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', 1);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-17', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 'b6ed11d0-6084-48d5-bda3-6971fa912e5f', 2);

-- Additional Task Progress

-- Additional Member Contributions

-- 2026-07 Task Progress and Allocations

-- 2026-08 Task Progress and Allocations

-- Continuous Project (Internal Business)
INSERT INTO projects (id, name, code, client_id, project_type, created_at) VALUES ('d8c0b5c1-1e3c-4c7b-b384-5f5a8947f631', 'パンの販売・カフェ運営', 'P-000005', NULL, 'ongoing', '2026-06-01 09:00:00+09');
INSERT INTO project_tasks (id, project_id, name, code, assignee_type) VALUES ('e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 'd8c0b5c1-1e3c-4c7b-b384-5f5a8947f631', '製造業務', 'T-26F001', 'internal');
INSERT INTO project_task_skills (task_id, skill_id, skill_level_id) VALUES ('e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', '128b9cc4-7e82-4f3b-b2ab-94f83b1c67d3', 'cdfc7a4d-c124-41d3-98cb-fb1b15ad39bb');
INSERT INTO project_task_assignees (task_id, staff_id) VALUES ('e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa');
INSERT INTO project_task_assignees (task_id, member_id) VALUES ('e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a');

INSERT INTO project_tasks (id, project_id, name, code, assignee_type) VALUES ('1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 'd8c0b5c1-1e3c-4c7b-b384-5f5a8947f631', '販売・接客業務', 'T-26F002', 'internal');
INSERT INTO project_task_skills (task_id, skill_id, skill_level_id) VALUES ('1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', '874c9f1a-5d6b-4e2c-9a3e-781f2a5b0c9d', 'e24bd35c-7833-41c3-ab5b-5136db6d75d1');
INSERT INTO project_task_assignees (task_id, staff_id) VALUES ('1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 'de2d336b-254d-4af7-8e49-5acbda340e67');
INSERT INTO project_task_assignees (task_id, member_id) VALUES ('1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 'e98c7634-1eb3-4e42-b062-841f39c043e0');

-- One-off Project (Internal Business)
INSERT INTO projects (id, name, code, client_id, project_type, settlement_year_month) VALUES ('b2f5d91c-1234-4567-89ab-cdef01234567', '社内業務マニュアル作成', 'P-000006', NULL, 'one-off', '2026-08');
INSERT INTO project_tasks (id, project_id, name, code, assignee_type, status, completed_at) VALUES ('884d9f1a-5d6b-4e2c-9a3e-781f2a5b0c9d', 'b2f5d91c-1234-4567-89ab-cdef01234567', 'マニュアル作成', 'T-26G001', 'internal', 'completed', '2026-08-31 23:59:59+09');
INSERT INTO project_task_assignees (task_id, staff_id) VALUES ('884d9f1a-5d6b-4e2c-9a3e-781f2a5b0c9d', '5ff5e55e-186f-43ce-84d2-aa751d8341b5');

-- Continuous Project (With Client)
INSERT INTO projects (id, name, code, client_id, project_type) VALUES ('c1234567-89ab-cdef-0123-456789abcdef', '基幹システム保守運用', 'P-000007', '73ab0c05-9915-4894-a083-6bccf7a66d2a', 'ongoing');
INSERT INTO project_tasks (id, project_id, name, code, assignee_type) VALUES ('a1234567-89ab-cdef-0123-456789abcdef', 'c1234567-89ab-cdef-0123-456789abcdef', '保守運用業務', 'T-26E001', 'internal');
INSERT INTO project_task_assignees (task_id, staff_id) VALUES ('a1234567-89ab-cdef-0123-456789abcdef', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa');
INSERT INTO project_task_assignees (task_id, staff_id) VALUES ('a1234567-89ab-cdef-0123-456789abcdef', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa');

-- Project Budgets
INSERT INTO project_budgets (project_id, category, subject, amount) VALUES ('418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', 'revenue', '就労支援事業収益', 3300000);
INSERT INTO project_budgets (project_id, category, subject, task_id, amount) VALUES ('418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', 'expense', '労務費・外注加工費（要件定義）', 'aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 1500000);
INSERT INTO project_budgets (project_id, category, subject, task_id, amount) VALUES ('418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', 'expense', '労務費・外注加工費（基本・詳細設計）', '3334e7a8-684e-4695-a503-5cccdc2b0e50', 500000);
INSERT INTO project_budgets (project_id, category, subject, task_id, amount) VALUES ('418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', 'expense', '労務費・外注加工費（構築・テスト）', '8daa6b8b-ddb2-462a-9594-1738f004832f', 800000);

-- 完了案件の収支記録のシード
INSERT INTO financial_records (period, type, subject, amount, project_id, is_limited, recorded_date) VALUES ('2026-06-01', 'expense', '労務費（利用者工賃）', 2300000, '418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', false, '2026-06-30');
INSERT INTO project_budgets (project_id, category, subject, amount) VALUES ('418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', 'reserve', '工賃変動積立金', 500000);

INSERT INTO project_budgets (project_id, category, subject, amount) VALUES ('52532aea-8f77-478e-ae37-c0ef57ee5cf5', 'revenue', '就労支援事業収益', 350000);
INSERT INTO project_budgets (project_id, category, subject, task_id, amount) VALUES ('52532aea-8f77-478e-ae37-c0ef57ee5cf5', 'expense', '外注加工費（サーバー構築）', 'adc26f10-909b-4ae1-b255-a86a5014dd3d', 300000);
INSERT INTO project_budgets (project_id, category, subject, amount) VALUES ('52532aea-8f77-478e-ae37-c0ef57ee5cf5', 'reserve', '設備等修繕維持積立金', 50000);

-- 新規サービスLP制作
INSERT INTO project_budgets (project_id, category, subject, amount) VALUES ('a91b78c8-8047-4dad-924c-1ee58074ff78', 'revenue', '就労支援事業収益', 1000000);
INSERT INTO project_budgets (project_id, category, subject, task_id, amount) VALUES ('a91b78c8-8047-4dad-924c-1ee58074ff78', 'expense', '労務費・外注加工費（UI/UXデザイン）', '9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 600000);
INSERT INTO project_budgets (project_id, category, subject, task_id, amount) VALUES ('a91b78c8-8047-4dad-924c-1ee58074ff78', 'expense', '労務費・外注加工費（フロントエンド実装）', 'b6ed11d0-6084-48d5-bda3-6971fa912e5f', 400000);

-- 完了案件の収支記録のシード (新規Webサービス開発支援)
INSERT INTO financial_records (period, type, subject, amount, project_id, is_limited, recorded_date) VALUES ('2026-06-01', 'expense', '労務費（利用者工賃）', 996500, 'a91b78c8-8047-4dad-924c-1ee58074ff78', false, '2026-06-30');

-- 社内基幹システム移行
INSERT INTO project_budgets (project_id, category, subject, amount) VALUES ('7e3a29d8-9ba7-49c1-b7a0-24e894f92098', 'revenue', '就労支援事業収益', 1200000);
INSERT INTO project_budgets (project_id, category, subject, task_id, amount) VALUES ('7e3a29d8-9ba7-49c1-b7a0-24e894f92098', 'expense', '外注加工費（データ移行計画）', 'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', 1200000);

-- パンの販売・カフェ運営
INSERT INTO project_budgets (project_id, category, subject, amount) VALUES ('d8c0b5c1-1e3c-4c7b-b384-5f5a8947f631', 'revenue', '就労支援事業収益', 500000);
INSERT INTO project_budgets (project_id, category, subject, task_id, amount) VALUES ('d8c0b5c1-1e3c-4c7b-b384-5f5a8947f631', 'expense', '労務費（利用者工賃）（製造業務）', 'e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 200000);
INSERT INTO project_budgets (project_id, category, subject, task_id, amount) VALUES ('d8c0b5c1-1e3c-4c7b-b384-5f5a8947f631', 'expense', '労務費（利用者工賃）（販売・接客業務）', '1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 300000);

-- 社内業務マニュアル作成
INSERT INTO project_budgets (project_id, category, subject, amount) VALUES ('b2f5d91c-1234-4567-89ab-cdef01234567', 'revenue', '就労支援事業収益', 100000);
INSERT INTO project_budgets (project_id, category, subject, task_id, amount) VALUES ('b2f5d91c-1234-4567-89ab-cdef01234567', 'expense', '労務費（利用者工賃）（マニュアル作成）', '884d9f1a-5d6b-4e2c-9a3e-781f2a5b0c9d', 100000);

-- 基幹システム保守運用
INSERT INTO project_budgets (project_id, category, subject, amount) VALUES ('c1234567-89ab-cdef-0123-456789abcdef', 'revenue', '就労支援事業収益', 500000);
INSERT INTO project_budgets (project_id, category, subject, task_id, amount) VALUES ('c1234567-89ab-cdef-0123-456789abcdef', 'expense', '労務費（利用者工賃）（保守運用業務）', 'a1234567-89ab-cdef-0123-456789abcdef', 500000);

-- Add daily work records for 2026-06-29
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-29', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 3);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-29', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', '9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 2);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-29', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', '00000000-0000-0000-0000-000000000002', 1);

INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-29', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '8daa6b8b-ddb2-462a-9594-1738f004832f', 4);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-29', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 'b6ed11d0-6084-48d5-bda3-6971fa912e5f', 1);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-29', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '00000000-0000-0000-0000-000000000002', 1);

INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-29', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', '9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 5);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-29', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', '00000000-0000-0000-0000-000000000002', 2);

-- Add daily work records for 2026-06-30
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-30', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', 4);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-30', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', '00000000-0000-0000-0000-000000000002', 1.5);

INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-30', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 'b6ed11d0-6084-48d5-bda3-6971fa912e5f', 3);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-30', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', 2);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-30', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '00000000-0000-0000-0000-000000000002', 0.5);

INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-30', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'b6ed11d0-6084-48d5-bda3-6971fa912e5f', 5);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-30', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', '00000000-0000-0000-0000-000000000002', 2);

-- Member Skill Evaluations
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'ec4310ed-27ab-4cb7-a13a-8c937bfc2a42', 'e24bd35c-7833-41c3-ab5b-5136db6d75d1'); -- 江口春奈: ネットワーク設計 (1.初級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('b362ad61-3ab9-42b3-a53c-1b77f985b85a', '817f8df7-05bc-4610-8a37-9609ff4ae89d', '9b139db0-a352-4f38-89c0-9dff60a4f66a'); -- 江口春奈: Cisco (3.上級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'f3b0d9b2-ab80-48e1-abf2-7f7b6653b6d2', 'e24bd35c-7833-41c3-ab5b-5136db6d75d1'); -- 江口春奈: Linux (1.初級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('b362ad61-3ab9-42b3-a53c-1b77f985b85a', '8172c05b-207d-4ca4-82e5-c8e51328accc', 'e24bd35c-7833-41c3-ab5b-5136db6d75d1'); -- 江口春奈: Windows Server (1.初級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('b362ad61-3ab9-42b3-a53c-1b77f985b85a', '676fa8f0-b4d8-4035-ae3f-de391ece3a63', '9b139db0-a352-4f38-89c0-9dff60a4f66a'); -- 江口春奈: React (3.上級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('b362ad61-3ab9-42b3-a53c-1b77f985b85a', '38eb7141-55bd-43d0-a6a5-7d028233eb17', 'e24bd35c-7833-41c3-ab5b-5136db6d75d1'); -- 江口春奈: TypeScript (1.初級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('b362ad61-3ab9-42b3-a53c-1b77f985b85a', '9322b5f6-fbb0-4a6e-a365-b814fbca7d49', 'e24bd35c-7833-41c3-ab5b-5136db6d75d1'); -- 江口春奈: Figma (1.初級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('b362ad61-3ab9-42b3-a53c-1b77f985b85a', '3beb5767-f4b8-4c92-a9b8-be10e94ac7d6', '9b139db0-a352-4f38-89c0-9dff60a4f66a'); -- 江口春奈: Oracle (3.上級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('b362ad61-3ab9-42b3-a53c-1b77f985b85a', '740001dd-4b33-4d53-8b05-f08d178a408c', '9b139db0-a352-4f38-89c0-9dff60a4f66a'); -- 江口春奈: PL/SQL (3.上級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'baf4f0c2-954d-46ac-a3e4-a0ad211155c8', 'e24bd35c-7833-41c3-ab5b-5136db6d75d1'); -- 江口春奈: Python (1.初級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('b362ad61-3ab9-42b3-a53c-1b77f985b85a', '074ce5ed-005a-4a3d-8681-a9eed17c4986', 'e24bd35c-7833-41c3-ab5b-5136db6d75d1'); -- 江口春奈: セキュリティ監査 (1.初級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'f0624c11-e56b-4267-a730-75dd6980b578', 'e24bd35c-7833-41c3-ab5b-5136db6d75d1'); -- 江口春奈: ペネトレーションテスト (1.初級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('b362ad61-3ab9-42b3-a53c-1b77f985b85a', '128b9cc4-7e82-4f3b-b2ab-94f83b1c67d3', 'e24bd35c-7833-41c3-ab5b-5136db6d75d1'); -- 江口春奈: 製パン技術 (1.初級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('b362ad61-3ab9-42b3-a53c-1b77f985b85a', '874c9f1a-5d6b-4e2c-9a3e-781f2a5b0c9d', 'cdfc7a4d-c124-41d3-98cb-fb1b15ad39bb'); -- 江口春奈: 接客・販売 (2.中級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('e98c7634-1eb3-4e42-b062-841f39c043e0', 'ec4310ed-27ab-4cb7-a13a-8c937bfc2a42', 'cdfc7a4d-c124-41d3-98cb-fb1b15ad39bb'); -- 大西健太: ネットワーク設計 (2.中級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('e98c7634-1eb3-4e42-b062-841f39c043e0', '817f8df7-05bc-4610-8a37-9609ff4ae89d', 'cdfc7a4d-c124-41d3-98cb-fb1b15ad39bb'); -- 大西健太: Cisco (2.中級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('e98c7634-1eb3-4e42-b062-841f39c043e0', 'f3b0d9b2-ab80-48e1-abf2-7f7b6653b6d2', 'e24bd35c-7833-41c3-ab5b-5136db6d75d1'); -- 大西健太: Linux (1.初級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('e98c7634-1eb3-4e42-b062-841f39c043e0', '8172c05b-207d-4ca4-82e5-c8e51328accc', 'e24bd35c-7833-41c3-ab5b-5136db6d75d1'); -- 大西健太: Windows Server (1.初級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('e98c7634-1eb3-4e42-b062-841f39c043e0', '676fa8f0-b4d8-4035-ae3f-de391ece3a63', 'e24bd35c-7833-41c3-ab5b-5136db6d75d1'); -- 大西健太: React (1.初級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('e98c7634-1eb3-4e42-b062-841f39c043e0', '38eb7141-55bd-43d0-a6a5-7d028233eb17', '9b139db0-a352-4f38-89c0-9dff60a4f66a'); -- 大西健太: TypeScript (3.上級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('e98c7634-1eb3-4e42-b062-841f39c043e0', '9322b5f6-fbb0-4a6e-a365-b814fbca7d49', 'cdfc7a4d-c124-41d3-98cb-fb1b15ad39bb'); -- 大西健太: Figma (2.中級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('e98c7634-1eb3-4e42-b062-841f39c043e0', '3beb5767-f4b8-4c92-a9b8-be10e94ac7d6', 'e24bd35c-7833-41c3-ab5b-5136db6d75d1'); -- 大西健太: Oracle (1.初級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('e98c7634-1eb3-4e42-b062-841f39c043e0', '740001dd-4b33-4d53-8b05-f08d178a408c', '9b139db0-a352-4f38-89c0-9dff60a4f66a'); -- 大西健太: PL/SQL (3.上級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('e98c7634-1eb3-4e42-b062-841f39c043e0', 'baf4f0c2-954d-46ac-a3e4-a0ad211155c8', '9b139db0-a352-4f38-89c0-9dff60a4f66a'); -- 大西健太: Python (3.上級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('e98c7634-1eb3-4e42-b062-841f39c043e0', '074ce5ed-005a-4a3d-8681-a9eed17c4986', 'cdfc7a4d-c124-41d3-98cb-fb1b15ad39bb'); -- 大西健太: セキュリティ監査 (2.中級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('e98c7634-1eb3-4e42-b062-841f39c043e0', 'f0624c11-e56b-4267-a730-75dd6980b578', 'cdfc7a4d-c124-41d3-98cb-fb1b15ad39bb'); -- 大西健太: ペネトレーションテスト (2.中級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('e98c7634-1eb3-4e42-b062-841f39c043e0', '128b9cc4-7e82-4f3b-b2ab-94f83b1c67d3', '9b139db0-a352-4f38-89c0-9dff60a4f66a'); -- 大西健太: 製パン技術 (3.上級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('e98c7634-1eb3-4e42-b062-841f39c043e0', '874c9f1a-5d6b-4e2c-9a3e-781f2a5b0c9d', 'cdfc7a4d-c124-41d3-98cb-fb1b15ad39bb'); -- 大西健太: 接客・販売 (2.中級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'ec4310ed-27ab-4cb7-a13a-8c937bfc2a42', 'e24bd35c-7833-41c3-ab5b-5136db6d75d1'); -- 佐藤花子: ネットワーク設計 (1.初級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('a1b2c3d4-e5f6-7890-1234-56789abcdef0', '817f8df7-05bc-4610-8a37-9609ff4ae89d', 'e24bd35c-7833-41c3-ab5b-5136db6d75d1'); -- 佐藤花子: Cisco (1.初級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'f3b0d9b2-ab80-48e1-abf2-7f7b6653b6d2', 'e24bd35c-7833-41c3-ab5b-5136db6d75d1'); -- 佐藤花子: Linux (1.初級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('a1b2c3d4-e5f6-7890-1234-56789abcdef0', '8172c05b-207d-4ca4-82e5-c8e51328accc', '9b139db0-a352-4f38-89c0-9dff60a4f66a'); -- 佐藤花子: Windows Server (3.上級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('a1b2c3d4-e5f6-7890-1234-56789abcdef0', '676fa8f0-b4d8-4035-ae3f-de391ece3a63', 'e24bd35c-7833-41c3-ab5b-5136db6d75d1'); -- 佐藤花子: React (1.初級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('a1b2c3d4-e5f6-7890-1234-56789abcdef0', '38eb7141-55bd-43d0-a6a5-7d028233eb17', '9b139db0-a352-4f38-89c0-9dff60a4f66a'); -- 佐藤花子: TypeScript (3.上級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('a1b2c3d4-e5f6-7890-1234-56789abcdef0', '9322b5f6-fbb0-4a6e-a365-b814fbca7d49', 'e24bd35c-7833-41c3-ab5b-5136db6d75d1'); -- 佐藤花子: Figma (1.初級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('a1b2c3d4-e5f6-7890-1234-56789abcdef0', '3beb5767-f4b8-4c92-a9b8-be10e94ac7d6', '9b139db0-a352-4f38-89c0-9dff60a4f66a'); -- 佐藤花子: Oracle (3.上級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('a1b2c3d4-e5f6-7890-1234-56789abcdef0', '740001dd-4b33-4d53-8b05-f08d178a408c', '9b139db0-a352-4f38-89c0-9dff60a4f66a'); -- 佐藤花子: PL/SQL (3.上級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'baf4f0c2-954d-46ac-a3e4-a0ad211155c8', '9b139db0-a352-4f38-89c0-9dff60a4f66a'); -- 佐藤花子: Python (3.上級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('a1b2c3d4-e5f6-7890-1234-56789abcdef0', '074ce5ed-005a-4a3d-8681-a9eed17c4986', 'cdfc7a4d-c124-41d3-98cb-fb1b15ad39bb'); -- 佐藤花子: セキュリティ監査 (2.中級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'f0624c11-e56b-4267-a730-75dd6980b578', '9b139db0-a352-4f38-89c0-9dff60a4f66a'); -- 佐藤花子: ペネトレーションテスト (3.上級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('a1b2c3d4-e5f6-7890-1234-56789abcdef0', '128b9cc4-7e82-4f3b-b2ab-94f83b1c67d3', 'e24bd35c-7833-41c3-ab5b-5136db6d75d1'); -- 佐藤花子: 製パン技術 (1.初級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('a1b2c3d4-e5f6-7890-1234-56789abcdef0', '874c9f1a-5d6b-4e2c-9a3e-781f2a5b0c9d', 'cdfc7a4d-c124-41d3-98cb-fb1b15ad39bb'); -- 佐藤花子: 接客・販売 (2.中級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'ec4310ed-27ab-4cb7-a13a-8c937bfc2a42', '9b139db0-a352-4f38-89c0-9dff60a4f66a'); -- 高橋次郎: ネットワーク設計 (3.上級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('f0e9d8c7-b6a5-4321-0987-6543210fedc2', '817f8df7-05bc-4610-8a37-9609ff4ae89d', '9b139db0-a352-4f38-89c0-9dff60a4f66a'); -- 高橋次郎: Cisco (3.上級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'f3b0d9b2-ab80-48e1-abf2-7f7b6653b6d2', 'cdfc7a4d-c124-41d3-98cb-fb1b15ad39bb'); -- 高橋次郎: Linux (2.中級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('f0e9d8c7-b6a5-4321-0987-6543210fedc2', '8172c05b-207d-4ca4-82e5-c8e51328accc', '9b139db0-a352-4f38-89c0-9dff60a4f66a'); -- 高橋次郎: Windows Server (3.上級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('f0e9d8c7-b6a5-4321-0987-6543210fedc2', '676fa8f0-b4d8-4035-ae3f-de391ece3a63', 'e24bd35c-7833-41c3-ab5b-5136db6d75d1'); -- 高橋次郎: React (1.初級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('f0e9d8c7-b6a5-4321-0987-6543210fedc2', '38eb7141-55bd-43d0-a6a5-7d028233eb17', 'cdfc7a4d-c124-41d3-98cb-fb1b15ad39bb'); -- 高橋次郎: TypeScript (2.中級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('f0e9d8c7-b6a5-4321-0987-6543210fedc2', '9322b5f6-fbb0-4a6e-a365-b814fbca7d49', 'e24bd35c-7833-41c3-ab5b-5136db6d75d1'); -- 高橋次郎: Figma (1.初級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('f0e9d8c7-b6a5-4321-0987-6543210fedc2', '3beb5767-f4b8-4c92-a9b8-be10e94ac7d6', 'e24bd35c-7833-41c3-ab5b-5136db6d75d1'); -- 高橋次郎: Oracle (1.初級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('f0e9d8c7-b6a5-4321-0987-6543210fedc2', '740001dd-4b33-4d53-8b05-f08d178a408c', '9b139db0-a352-4f38-89c0-9dff60a4f66a'); -- 高橋次郎: PL/SQL (3.上級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'baf4f0c2-954d-46ac-a3e4-a0ad211155c8', 'e24bd35c-7833-41c3-ab5b-5136db6d75d1'); -- 高橋次郎: Python (1.初級)
INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('f0e9d8c7-b6a5-4321-0987-6543210fedc2', '074ce5ed-005a-4a3d-8681-a9eed17c4986', 'cdfc7a4d-c124-41d3-98cb-fb1b15ad39bb'); -- 高橋次郎: セキュリティ監査 (2.中級)

-- Financial Records (Manually Input Seed Data - ~60 records)
INSERT INTO financial_records (period, project_id, client_id, type, subject, amount, recorded_date, recorded_by, is_limited, remarks, activity_category) VALUES
-- 2026-01
('2026-01-01', '418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', '73ab0c05-9915-4894-a083-6bccf7a66d2a', 'revenue', '就労支援事業収益', 2800000, '2026-01-25', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false, '請求書No. INV-202601-01', 'production'),
('2026-01-01', '418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', '73ab0c05-9915-4894-a083-6bccf7a66d2a', 'expense', '材料費', 60000, '2026-01-26', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false, '領収書No. R-202601-05 (木材・接着剤)', 'production'),
('2026-01-01', NULL, NULL, 'expense', '労務費（利用者工賃）', 0, '2026-01-28', 'de2d336b-254d-4af7-8e49-5acbda340e67', false, '1月分工賃一括振込', 'production'),
('2026-01-01', NULL, NULL, 'revenue', '控除', 0, '2026-01-28', 'de2d336b-254d-4af7-8e49-5acbda340e67', false, '1月分控除一括', 'welfare'),
('2026-01-01', '418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', '73ab0c05-9915-4894-a083-6bccf7a66d2a', 'expense', '外注加工費', 150000, '2026-01-29', '5ff5e55e-186f-43ce-84d2-aa751d8341b5', false, '請求書No. EXT-202601-10', 'production'),
('2026-01-01', NULL, NULL, 'reserve', '工賃変動積立金', 80000, '2026-01-30', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false, '1月分積立確定', 'production'),

-- 2026-02
('2026-02-01', '52532aea-8f77-478e-ae37-c0ef57ee5cf5', 'bac1fb37-abfa-4eb3-9454-d72fb7b3b7e8', 'revenue', '就労支援事業収益', 3100000, '2026-02-24', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false, '請求書No. INV-202602-02', 'production'),
('2026-02-01', '52532aea-8f77-478e-ae37-c0ef57ee5cf5', 'bac1fb37-abfa-4eb3-9454-d72fb7b3b7e8', 'expense', '材料費', 75000, '2026-02-25', 'de2d336b-254d-4af7-8e49-5acbda340e67', false, '領収書No. R-202602-12 (梱包資材・ダンボール)', 'production'),
('2026-02-01', NULL, NULL, 'expense', '労務費（利用者工賃）', 0, '2026-02-26', 'de2d336b-254d-4af7-8e49-5acbda340e67', false, '2月分工賃一括振込', 'production'),
('2026-02-01', NULL, NULL, 'revenue', '控除', 0, '2026-02-26', 'de2d336b-254d-4af7-8e49-5acbda340e67', false, '2月分控除一括', 'welfare'),
('2026-02-01', '52532aea-8f77-478e-ae37-c0ef57ee5cf5', 'bac1fb37-abfa-4eb3-9454-d72fb7b3b7e8', 'expense', '経費', 90000, '2026-02-27', '5ff5e55e-186f-43ce-84d2-aa751d8341b5', false, '領収書No. R-202602-18 (事務用品・印刷費)', 'production'),
('2026-02-01', NULL, NULL, 'reserve', '設備等修繕維持積立金', 50000, '2026-02-28', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false, '2月分修繕積立', 'production'),

-- 2026-03
('2026-03-01', 'a91b78c8-8047-4dad-924c-1ee58074ff78', '0ff5f11e-b752-4b06-aaab-86984a67eec7', 'revenue', '就労支援事業収益', 2500000, '2026-03-25', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false, '請求書No. INV-202603-03', 'production'),
('2026-03-01', 'a91b78c8-8047-4dad-924c-1ee58074ff78', '0ff5f11e-b752-4b06-aaab-86984a67eec7', 'expense', '材料費', 120000, '2026-03-26', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false, '領収書No. R-202603-08 (電装部品・基板)', 'production'),
('2026-03-01', NULL, NULL, 'expense', '労務費（利用者工賃）', 0, '2026-03-27', 'de2d336b-254d-4af7-8e49-5acbda340e67', false, '3月分工賃一括振込', 'production'),
('2026-03-01', NULL, NULL, 'revenue', '控除', 0, '2026-03-27', 'de2d336b-254d-4af7-8e49-5acbda340e67', false, '3月分控除一括', 'welfare'),
('2026-03-01', 'a91b78c8-8047-4dad-924c-1ee58074ff78', '0ff5f11e-b752-4b06-aaab-86984a67eec7', 'expense', '外注加工費', 100000, '2026-03-28', '5ff5e55e-186f-43ce-84d2-aa751d8341b5', false, '請求書No. EXT-202603-02', 'production'),
('2026-03-01', NULL, NULL, 'reserve', '工賃変動積立金', 100000, '2026-03-29', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false, '3月分積立確定', 'production'),

-- 2026-04
('2026-04-01', '418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', '73ab0c05-9915-4894-a083-6bccf7a66d2a', 'revenue', '就労支援事業収益', 3000000, '2026-04-25', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false, '請求書No. INV-202604-01', 'production'),
('2026-04-01', '418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', '73ab0c05-9915-4894-a083-6bccf7a66d2a', 'expense', '材料費', 55000, '2026-04-26', 'de2d336b-254d-4af7-8e49-5acbda340e67', false, '領収書No. R-202604-15 (塗料・工具類)', 'production'),
('2026-04-01', NULL, NULL, 'expense', '労務費（利用者工賃）', 0, '2026-04-27', 'de2d336b-254d-4af7-8e49-5acbda340e67', false, '4月分工賃一括振込', 'production'),
('2026-04-01', NULL, NULL, 'revenue', '控除', 0, '2026-04-27', 'de2d336b-254d-4af7-8e49-5acbda340e67', false, '4月分控除一括', 'welfare'),
('2026-04-01', NULL, NULL, 'expense', '労務費（利用者工賃以外）', 250000, '2026-04-28', '5ff5e55e-186f-43ce-84d2-aa751d8341b5', false, '臨時指導員給与', 'production'),
('2026-04-01', NULL, NULL, 'reserve', '設備等修繕維持積立金', 60000, '2026-04-29', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false, '4月分修繕積立', 'production'),

-- 2026-05
('2026-05-01', '52532aea-8f77-478e-ae37-c0ef57ee5cf5', 'bac1fb37-abfa-4eb3-9454-d72fb7b3b7e8', 'revenue', '就労支援事業収益', 3400000, '2026-05-25', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false, '請求書No. INV-202605-02', 'production'),
('2026-05-01', '52532aea-8f77-478e-ae37-c0ef57ee5cf5', 'bac1fb37-abfa-4eb3-9454-d72fb7b3b7e8', 'expense', '材料費', 68000, '2026-05-26', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false, '領収書No. R-202605-03 (アクリル板・ネジ)', 'production'),
('2026-05-01', NULL, NULL, 'expense', '労務費（利用者工賃）', 0, '2026-05-27', 'de2d336b-254d-4af7-8e49-5acbda340e67', false, '5月分工賃一括振込', 'production'),
('2026-05-01', NULL, NULL, 'revenue', '控除', 0, '2026-05-27', 'de2d336b-254d-4af7-8e49-5acbda340e67', false, '5月分控除一括', 'welfare'),
('2026-05-01', '52532aea-8f77-478e-ae37-c0ef57ee5cf5', 'bac1fb37-abfa-4eb3-9454-d72fb7b3b7e8', 'expense', '外注加工費', 220000, '2026-05-28', '5ff5e55e-186f-43ce-84d2-aa751d8341b5', false, '請求書No. EXT-202605-08', 'production'),
('2026-05-01', NULL, NULL, 'reserve', '工賃変動積立金', 120000, '2026-05-29', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false, '5月分積立確定', 'production'),

-- 2026-06
('2026-06-01', 'd8c0b5c1-1e3c-4c7b-b384-5f5a8947f631', '73ab0c05-9915-4894-a083-6bccf7a66d2a', 'revenue', '就労支援事業収益', 450000, '2026-06-30', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false, '請求書No. INV-202606-01', 'production'),
('2026-06-01', 'd8c0b5c1-1e3c-4c7b-b384-5f5a8947f631', '73ab0c05-9915-4894-a083-6bccf7a66d2a', 'expense', '材料費', 40000, '2026-06-30', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false, '領収書No. R-202606-20 (製菓材料類)', 'production'),
('2026-06-01', NULL, NULL, 'expense', '労務費（利用者工賃）', 15525, '2026-06-30', 'de2d336b-254d-4af7-8e49-5acbda340e67', false, '6月分工賃一括振込', 'production'),
('2026-06-01', NULL, NULL, 'revenue', '控除', 0, '2026-06-30', 'de2d336b-254d-4af7-8e49-5acbda340e67', false, '6月分控除一括', 'welfare'),
('2026-06-01', NULL, NULL, 'expense', '労務費（利用者工賃以外）', 300000, '2026-06-30', 'de2d336b-254d-4af7-8e49-5acbda340e67', false, '外部講習講師謝礼', 'production'),

-- 2026-07
-- (No separate manual financial records for 2026-07; see ongoing project seed section below)


-- 2026-08
('2026-08-01', '418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', '73ab0c05-9915-4894-a083-6bccf7a66d2a', 'revenue', '就労支援事業収益', 1000000, '2026-08-01', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false, '請求書No. INV-202608-01', 'production'),
('2026-08-01', '418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', '73ab0c05-9915-4894-a083-6bccf7a66d2a', 'expense', '材料費', 40000, '2026-08-01', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false, '領収書No. R-202608-01 (清掃用具・洗浄液)', 'production'),
('2026-08-01', NULL, NULL, 'expense', '労務費（利用者工賃）', 600000, '2026-08-01', 'de2d336b-254d-4af7-8e49-5acbda340e67', false, '8月概算工賃', 'production'),
('2026-08-01', NULL, NULL, 'revenue', '控除', 0, '2026-08-01', 'de2d336b-254d-4af7-8e49-5acbda340e67', false, '8月概算控除', 'welfare'),
('2026-08-01', NULL, NULL, 'expense', '労務費（利用者工賃以外）', 150000, '2026-08-01', 'de2d336b-254d-4af7-8e49-5acbda340e67', false, '専門指導員手当', 'production'),
('2026-08-01', 'a91b78c8-8047-4dad-924c-1ee58074ff78', '0ff5f11e-b752-4b06-aaab-86984a67eec7', 'expense', '経費', 20000, '2026-08-01', '5ff5e55e-186f-43ce-84d2-aa751d8341b5', false, '領収書No. R-202608-04 (消耗品代)', 'production'),
('2026-08-01', NULL, NULL, 'reserve', '工賃変動積立金', 100000, '2026-08-01', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false, '8月分積立予定', 'production'),
('2026-08-01', NULL, NULL, 'reserve', '設備等修繕維持積立金', 50000, '2026-08-01', 'de2d336b-254d-4af7-8e49-5acbda340e67', false, '8月分修繕積立予定', 'production'),

-- 2026-09
('2026-09-01', 'a91b78c8-8047-4dad-924c-1ee58074ff78', '0ff5f11e-b752-4b06-aaab-86984a67eec7', 'revenue', '就労支援事業収益', 2900000, '2026-09-25', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false, '請求書No. INV-202609-03', 'production'),
('2026-09-01', 'a91b78c8-8047-4dad-924c-1ee58074ff78', '0ff5f11e-b752-4b06-aaab-86984a67eec7', 'expense', '材料費', 85000, '2026-09-26', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false, '領収書No. R-202609-10 (特殊塗料・溶剤)', 'production'),
('2026-09-01', NULL, NULL, 'expense', '労務費（利用者工賃）', 0, '2026-09-27', 'de2d336b-254d-4af7-8e49-5acbda340e67', false, '9月分工賃一括振込', 'production'),
('2026-09-01', NULL, NULL, 'revenue', '控除', 0, '2026-09-27', 'de2d336b-254d-4af7-8e49-5acbda340e67', false, '9月分控除一括', 'welfare'),
('2026-09-01', 'a91b78c8-8047-4dad-924c-1ee58074ff78', '0ff5f11e-b752-4b06-aaab-86984a67eec7', 'expense', '外注加工費', 180000, '2026-09-28', '5ff5e55e-186f-43ce-84d2-aa751d8341b5', false, '請求書No. EXT-202609-04', 'production'),
('2026-09-01', NULL, NULL, 'reserve', '工賃変動積立金', 90000, '2026-09-29', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false, '9月分積立確定', 'production'),

-- 2026-10
('2026-10-01', '418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', '73ab0c05-9915-4894-a083-6bccf7a66d2a', 'revenue', '就労支援事業収益', 3200000, '2026-10-25', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false, '請求書No. INV-202610-01', 'production'),
('2026-10-01', '418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', '73ab0c05-9915-4894-a083-6bccf7a66d2a', 'expense', '材料費', 62000, '2026-10-26', 'de2d336b-254d-4af7-8e49-5acbda340e67', false, '領収書No. R-202610-07 (配線材・端子)', 'production'),
('2026-10-01', NULL, NULL, 'expense', '労務費（利用者工賃）', 0, '2026-10-27', 'de2d336b-254d-4af7-8e49-5acbda340e67', false, '10月分工賃一括振込', 'production'),
('2026-10-01', NULL, NULL, 'revenue', '控除', 0, '2026-10-27', 'de2d336b-254d-4af7-8e49-5acbda340e67', false, '10月分控除一括', 'welfare'),
('2026-10-01', NULL, NULL, 'expense', '労務費（利用者工賃以外）', 220000, '2026-10-28', '5ff5e55e-186f-43ce-84d2-aa751d8341b5', false, '専門員派遣費用', 'production'),
('2026-10-01', NULL, NULL, 'reserve', '設備等修繕維持積立金', 70000, '2026-10-29', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false, '10月分修繕積立', 'production'),

-- 2026-11
('2026-11-01', '52532aea-8f77-478e-ae37-c0ef57ee5cf5', 'bac1fb37-abfa-4eb3-9454-d72fb7b3b7e8', 'revenue', '就労支援事業収益', 3500000, '2026-11-25', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false, '請求書No. INV-202611-02', 'production'),
('2026-11-01', '52532aea-8f77-478e-ae37-c0ef57ee5cf5', 'bac1fb37-abfa-4eb3-9454-d72fb7b3b7e8', 'expense', '材料費', 70000, '2026-11-26', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false, '領収書No. R-202611-19 (梱包テープ・緩衝材)', 'production'),
('2026-11-01', NULL, NULL, 'expense', '労務費（利用者工賃）', 0, '2026-11-27', 'de2d336b-254d-4af7-8e49-5acbda340e67', false, '11月分工賃一括振込', 'production'),
('2026-11-01', NULL, NULL, 'revenue', '控除', 0, '2026-11-27', 'de2d336b-254d-4af7-8e49-5acbda340e67', false, '11月分控除一括', 'welfare'),
('2026-11-01', '52532aea-8f77-478e-ae37-c0ef57ee5cf5', 'bac1fb37-abfa-4eb3-9454-d72fb7b3b7e8', 'expense', '外注加工費', 250000, '2026-11-28', '5ff5e55e-186f-43ce-84d2-aa751d8341b5', false, '請求書No. EXT-202611-09', 'production'),
('2026-11-01', NULL, NULL, 'reserve', '工賃変動積立金', 150000, '2026-11-29', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false, '11月分積立確定', 'production'),

-- 2026-12
('2026-12-01', 'a91b78c8-8047-4dad-924c-1ee58074ff78', '0ff5f11e-b752-4b06-aaab-86984a67eec7', 'revenue', '就労支援事業収益', 3800000, '2026-12-25', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false, '請求書No. INV-202612-03', 'production'),
('2026-12-01', 'a91b78c8-8047-4dad-924c-1ee58074ff78', '0ff5f11e-b752-4b06-aaab-86984a67eec7', 'expense', '材料費', 95000, '2026-12-26', 'de2d336b-254d-4af7-8e49-5acbda340e67', false, '領収書No. R-202612-22 (年末備品・工具)', 'production'),
('2026-12-01', NULL, NULL, 'expense', '労務費（利用者工賃）', 0, '2026-12-27', 'de2d336b-254d-4af7-8e49-5acbda340e67', false, '12月分工賃一括振込', 'production'),
('2026-12-01', NULL, NULL, 'revenue', '控除', 0, '2026-12-27', 'de2d336b-254d-4af7-8e49-5acbda340e67', false, '12月分控除一括', 'welfare'),
('2026-12-01', NULL, NULL, 'expense', '労務費（利用者工賃以外）', 350000, '2026-12-28', '5ff5e55e-186f-43ce-84d2-aa751d8341b5', false, '年末特別手当', 'production'),
('2026-12-01', 'a91b78c8-8047-4dad-924c-1ee58074ff78', '0ff5f11e-b752-4b06-aaab-86984a67eec7', 'expense', '経費', 120000, '2026-12-29', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false, '領収書No. R-202612-30 (年物消耗品・文具)', 'production'),
('2026-12-01', NULL, NULL, 'reserve', '工賃変動積立金', 200000, '2026-12-30', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false, '12月分積立確定', 'production');

-- === COMPREHENSIVE GENERATED SEED DATA FOR 2026-06 to 2026-08 ===

-- === COMPREHENSIVE GENERATED SEED DATA FOR 2026-06 to 2026-08 ===
INSERT INTO project_task_progress (year_month, task_id, status) VALUES ('2026-06', 'aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 'in_progress');
INSERT INTO project_task_progress (year_month, task_id, status) VALUES ('2026-07', 'aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 'completed');
INSERT INTO project_task_progress (year_month, task_id, status) VALUES ('2026-08', 'aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 'completed');
INSERT INTO project_task_progress (year_month, task_id, status) VALUES ('2026-06', '3334e7a8-684e-4695-a503-5cccdc2b0e50', 'in_progress');
INSERT INTO project_task_progress (year_month, task_id, status) VALUES ('2026-07', '3334e7a8-684e-4695-a503-5cccdc2b0e50', 'in_progress');
INSERT INTO project_task_progress (year_month, task_id, status) VALUES ('2026-08', '3334e7a8-684e-4695-a503-5cccdc2b0e50', 'completed');
INSERT INTO project_task_progress (year_month, task_id, status) VALUES ('2026-06', '8daa6b8b-ddb2-462a-9594-1738f004832f', 'in_progress');
INSERT INTO project_task_progress (year_month, task_id, status) VALUES ('2026-07', '8daa6b8b-ddb2-462a-9594-1738f004832f', 'in_progress');
INSERT INTO project_task_progress (year_month, task_id, status) VALUES ('2026-08', '8daa6b8b-ddb2-462a-9594-1738f004832f', 'canceled');
INSERT INTO project_task_progress (year_month, task_id, status) VALUES ('2026-06', 'adc26f10-909b-4ae1-b255-a86a5014dd3d', 'in_progress');
INSERT INTO project_task_progress (year_month, task_id, status) VALUES ('2026-07', 'adc26f10-909b-4ae1-b255-a86a5014dd3d', 'completed');
INSERT INTO project_task_progress (year_month, task_id, status) VALUES ('2026-08', 'adc26f10-909b-4ae1-b255-a86a5014dd3d', 'completed');
INSERT INTO project_task_progress (year_month, task_id, status) VALUES ('2026-06', '9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 'in_progress');
INSERT INTO project_task_progress (year_month, task_id, status) VALUES ('2026-07', '9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 'in_progress');
INSERT INTO project_task_progress (year_month, task_id, status) VALUES ('2026-08', '9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 'canceled');
INSERT INTO project_task_progress (year_month, task_id, status) VALUES ('2026-06', 'b6ed11d0-6084-48d5-bda3-6971fa912e5f', 'in_progress');
INSERT INTO project_task_progress (year_month, task_id, status) VALUES ('2026-07', 'b6ed11d0-6084-48d5-bda3-6971fa912e5f', 'in_progress');
INSERT INTO project_task_progress (year_month, task_id, status) VALUES ('2026-08', 'b6ed11d0-6084-48d5-bda3-6971fa912e5f', 'completed');
INSERT INTO project_task_progress (year_month, task_id, status) VALUES ('2026-06', 'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', 'in_progress');
INSERT INTO project_task_progress (year_month, task_id, status) VALUES ('2026-07', 'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', 'in_progress');
INSERT INTO project_task_progress (year_month, task_id, status) VALUES ('2026-08', 'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', 'in_progress');
INSERT INTO project_task_progress (year_month, task_id, status) VALUES ('2026-06', 'e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 'in_progress');
INSERT INTO project_task_progress (year_month, task_id, status) VALUES ('2026-07', 'e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 'in_progress');
INSERT INTO project_task_progress (year_month, task_id, status) VALUES ('2026-08', 'e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 'completed');
INSERT INTO project_task_progress (year_month, task_id, status) VALUES ('2026-06', '1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 'in_progress');
INSERT INTO project_task_progress (year_month, task_id, status) VALUES ('2026-07', '1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 'in_progress');
INSERT INTO project_task_progress (year_month, task_id, status) VALUES ('2026-08', '1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 'canceled');
INSERT INTO project_task_progress (year_month, task_id, status) VALUES ('2026-06', '884d9f1a-5d6b-4e2c-9a3e-781f2a5b0c9d', 'in_progress');
INSERT INTO project_task_progress (year_month, task_id, status) VALUES ('2026-07', '884d9f1a-5d6b-4e2c-9a3e-781f2a5b0c9d', 'completed');
INSERT INTO project_task_progress (year_month, task_id, status) VALUES ('2026-08', '884d9f1a-5d6b-4e2c-9a3e-781f2a5b0c9d', 'completed');
INSERT INTO project_task_progress (year_month, task_id, status) VALUES ('2026-06', 'a1234567-89ab-cdef-0123-456789abcdef', 'in_progress');
INSERT INTO project_task_progress (year_month, task_id, status) VALUES ('2026-07', 'a1234567-89ab-cdef-0123-456789abcdef', 'in_progress');
INSERT INTO project_task_progress (year_month, task_id, status) VALUES ('2026-08', 'a1234567-89ab-cdef-0123-456789abcdef', 'completed');


-- === GENERATED DAILY WORK RECORDS FOR 2026-08 ===
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-01', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', '8daa6b8b-ddb2-462a-9594-1738f004832f', 2);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-01', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 'adc26f10-909b-4ae1-b255-a86a5014dd3d', 2);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-02', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 3);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-02', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'b6ed11d0-6084-48d5-bda3-6971fa912e5f', 3);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-03', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', 4);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-03', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'adc26f10-909b-4ae1-b255-a86a5014dd3d', 4);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-04', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', '9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 1);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-04', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'b6ed11d0-6084-48d5-bda3-6971fa912e5f', 1);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-05', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', 2);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-05', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 'e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 2);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-06', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 3);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-06', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', '884d9f1a-5d6b-4e2c-9a3e-781f2a5b0c9d', 3);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-07', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'a1234567-89ab-cdef-0123-456789abcdef', 4);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-07', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 4);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-08', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', '1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 1);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-08', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', '884d9f1a-5d6b-4e2c-9a3e-781f2a5b0c9d', 1);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-09', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'a1234567-89ab-cdef-0123-456789abcdef', 2);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-09', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 'aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 2);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-10', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '3334e7a8-684e-4695-a503-5cccdc2b0e50', 3);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-10', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', '8daa6b8b-ddb2-462a-9594-1738f004832f', 3);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-11', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'adc26f10-909b-4ae1-b255-a86a5014dd3d', 4);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-11', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 4);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-12', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', '3334e7a8-684e-4695-a503-5cccdc2b0e50', 1);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-12', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', '8daa6b8b-ddb2-462a-9594-1738f004832f', 1);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-13', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'adc26f10-909b-4ae1-b255-a86a5014dd3d', 2);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-13', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 2);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-14', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 'b6ed11d0-6084-48d5-bda3-6971fa912e5f', 3);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-14', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', 3);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-15', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 4);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-15', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', '9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 4);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-16', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'b6ed11d0-6084-48d5-bda3-6971fa912e5f', 1);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-16', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', 1);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-17', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 2);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-17', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 2);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-18', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '884d9f1a-5d6b-4e2c-9a3e-781f2a5b0c9d', 3);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-18', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'a1234567-89ab-cdef-0123-456789abcdef', 3);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-19', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 4);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-19', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', '1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 4);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-20', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', '884d9f1a-5d6b-4e2c-9a3e-781f2a5b0c9d', 1);
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-08-20', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'a1234567-89ab-cdef-0123-456789abcdef', 1);

-- === SEED DAILY WORK CONFIRMATIONS (<= 2026-08-16) ===
UPDATE daily_work_records SET is_confirmed = true WHERE date <= '2026-08-16';

-- === SEED DATA FOR 2027-07 (MOCKUP SAMPLE) ===
INSERT INTO projects (id, name, code, client_id, project_type, settlement_year_month, created_at) VALUES 
('77777777-7777-4777-a777-777777777777', '次世代AI基盤システム開発', 'P-000008', '73ab0c05-9915-4894-a083-6bccf7a66d2a', 'one-off', '2027-07', '2027-07-01 09:00:00+09')
ON CONFLICT (id) DO UPDATE SET settlement_year_month = '2027-07';

INSERT INTO project_tasks (id, project_id, name, code, assignee_type, status, completed_at) VALUES 
('77777777-7777-4777-a777-777777770001', '77777777-7777-4777-a777-777777777777', '要件定義・AIモデル選定', 'T-27G001', 'internal', 'completed', '2027-07-15 18:00:00+09'),
('77777777-7777-4777-a777-777777770002', '77777777-7777-4777-a777-777777777777', '学習データ作成・パイプライン構築', 'T-27G002', 'internal', 'completed', '2027-07-28 18:00:00+09'),
('77777777-7777-4777-a777-777777770003', '77777777-7777-4777-a777-777777777777', 'インフラ環境構築', 'T-27G003', 'external', 'completed', '2027-07-30 18:00:00+09')
ON CONFLICT (id) DO NOTHING;

INSERT INTO project_task_assignees (task_id, member_id, staff_id, client_id) VALUES
('77777777-7777-4777-a777-777777770001', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', NULL, NULL),
('77777777-7777-4777-a777-777777770001', 'e98c7634-1eb3-4e42-b062-841f39c043e0', NULL, NULL),
('77777777-7777-4777-a777-777777770001', NULL, '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', NULL),
('77777777-7777-4777-a777-777777770002', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', NULL, NULL),
('77777777-7777-4777-a777-777777770002', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', NULL, NULL),
('77777777-7777-4777-a777-777777770002', NULL, 'de2d336b-254d-4af7-8e49-5acbda340e67', NULL),
('77777777-7777-4777-a777-777777770003', NULL, NULL, 'bac1fb37-abfa-4eb3-9454-d72fb7b3b7e8');

INSERT INTO project_budgets (project_id, category, subject, amount, task_id) VALUES
('77777777-7777-4777-a777-777777777777', 'revenue', '売上', 3500000, NULL),
('77777777-7777-4777-a777-777777777777', 'expense', '労務費（要件定義・AIモデル選定）', 600000, '77777777-7777-4777-a777-777777770001'),
('77777777-7777-4777-a777-777777777777', 'expense', '労務費（学習データ作成・パイプライン構築）', 800000, '77777777-7777-4777-a777-777777770002'),
('77777777-7777-4777-a777-777777777777', 'expense', '外注加工費（インフラ環境構築）', 500000, '77777777-7777-4777-a777-777777770003'),
('77777777-7777-4777-a777-777777777777', 'expense', '材料費', 400000, NULL),
('77777777-7777-4777-a777-777777777777', 'expense', '経費', 200000, NULL),
('77777777-7777-4777-a777-777777777777', 'reserve', '予備費', 1000000, NULL);

INSERT INTO financial_records (period, project_id, type, subject, amount, recorded_date, activity_category) VALUES
('2027-07-01', '77777777-7777-4777-a777-777777777777', 'revenue', '売上', 3500000, '2027-07-31', 'production'),
('2027-07-01', '77777777-7777-4777-a777-777777777777', 'expense', '労務費（要件定義・AIモデル選定）', 600000, '2027-07-31', 'production'),
('2027-07-01', '77777777-7777-4777-a777-777777777777', 'expense', '労務費（学習データ作成・パイプライン構築）', 800000, '2027-07-31', 'production'),
('2027-07-01', '77777777-7777-4777-a777-777777777777', 'expense', '外注加工費（インフラ環境構築）', 500000, '2027-07-31', 'production'),
('2027-07-01', '77777777-7777-4777-a777-777777777777', 'expense', '材料費', 400000, '2027-07-31', 'production'),
('2027-07-01', '77777777-7777-4777-a777-777777777777', 'expense', '経費', 200000, '2027-07-31', 'production'),
('2027-07-01', '77777777-7777-4777-a777-777777777777', 'reserve', '予備費', 1000000, '2027-07-31', 'production');

INSERT INTO daily_work_records (date, member_id, task_id, work_time, is_confirmed) VALUES
('2027-07-01', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', '77777777-7777-4777-a777-777777770001', 3, true),
('2027-07-01', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '77777777-7777-4777-a777-777777770001', 3, true),
('2027-07-01', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', '77777777-7777-4777-a777-777777770002', 4, true),
('2027-07-01', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', '77777777-7777-4777-a777-777777770002', 4, true),
('2027-07-02', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', '77777777-7777-4777-a777-777777770001', 3, true),
('2027-07-02', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '77777777-7777-4777-a777-777777770001', 3, true),
('2027-07-02', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', '77777777-7777-4777-a777-777777770002', 4, true),
('2027-07-02', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', '77777777-7777-4777-a777-777777770002', 4, true),
('2027-07-05', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', '77777777-7777-4777-a777-777777770001', 3, true),
('2027-07-05', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '77777777-7777-4777-a777-777777770001', 3, true),
('2027-07-05', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', '77777777-7777-4777-a777-777777770002', 4, true),
('2027-07-05', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', '77777777-7777-4777-a777-777777770002', 4, true),
('2027-07-06', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', '77777777-7777-4777-a777-777777770001', 3, true),
('2027-07-06', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '77777777-7777-4777-a777-777777770001', 3, true),
('2027-07-06', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', '77777777-7777-4777-a777-777777770002', 4, true),
('2027-07-06', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', '77777777-7777-4777-a777-777777770002', 4, true),
('2027-07-07', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', '77777777-7777-4777-a777-777777770001', 3, true),
('2027-07-07', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '77777777-7777-4777-a777-777777770001', 3, true),
('2027-07-07', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', '77777777-7777-4777-a777-777777770002', 4, true),
('2027-07-07', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', '77777777-7777-4777-a777-777777770002', 4, true),
('2027-07-08', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', '77777777-7777-4777-a777-777777770001', 3, true),
('2027-07-08', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '77777777-7777-4777-a777-777777770001', 3, true),
('2027-07-08', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', '77777777-7777-4777-a777-777777770002', 4, true),
('2027-07-08', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', '77777777-7777-4777-a777-777777770002', 4, true),
('2027-07-09', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', '77777777-7777-4777-a777-777777770001', 3, true),
('2027-07-09', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '77777777-7777-4777-a777-777777770001', 3, true),
('2027-07-09', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', '77777777-7777-4777-a777-777777770002', 4, true),
('2027-07-09', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', '77777777-7777-4777-a777-777777770002', 4, true),
('2027-07-12', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', '77777777-7777-4777-a777-777777770001', 3, true),
('2027-07-12', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '77777777-7777-4777-a777-777777770001', 3, true),
('2027-07-12', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', '77777777-7777-4777-a777-777777770002', 4, true),
('2027-07-12', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', '77777777-7777-4777-a777-777777770002', 4, true),
('2027-07-13', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', '77777777-7777-4777-a777-777777770001', 3, true),
('2027-07-13', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '77777777-7777-4777-a777-777777770001', 3, true),
('2027-07-13', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', '77777777-7777-4777-a777-777777770002', 4, true),
('2027-07-13', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', '77777777-7777-4777-a777-777777770002', 4, true),
('2027-07-14', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', '77777777-7777-4777-a777-777777770001', 3, true),
('2027-07-14', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '77777777-7777-4777-a777-777777770001', 3, true),
('2027-07-14', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', '77777777-7777-4777-a777-777777770002', 4, true),
('2027-07-14', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', '77777777-7777-4777-a777-777777770002', 4, true),
('2027-07-15', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', '77777777-7777-4777-a777-777777770001', 3, true),
('2027-07-15', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '77777777-7777-4777-a777-777777770001', 3, true),
('2027-07-15', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', '77777777-7777-4777-a777-777777770002', 4, true),
('2027-07-15', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', '77777777-7777-4777-a777-777777770002', 4, true);

UPDATE daily_work_records SET is_confirmed = true WHERE date >= '2027-07-01' AND date <= '2027-07-31';

-- === SEED MONTHLY INCENTIVE ALLOCATIONS (<= 2027-07) ===
INSERT INTO monthly_incentive_allocations (year_month, is_confirmed) VALUES
('2026-01', true), ('2026-02', true), ('2026-03', true), ('2026-04', true), ('2026-05', true), ('2026-06', true), ('2026-07', true), ('2027-07', true);

-- === SEED DATA FOR 2026-07 ONGOING PROJECTS ===
INSERT INTO financial_records (period, project_id, type, subject, amount, recorded_date, activity_category) VALUES
('2026-07-01', 'd8c0b5c1-1e3c-4c7b-b384-5f5a8947f631', 'revenue', '就労支援事業収益', 500000, '2026-07-31', 'production'),
('2026-07-01', 'd8c0b5c1-1e3c-4c7b-b384-5f5a8947f631', 'expense', '労務費（製造業務）', 200000, '2026-07-31', 'production'),
('2026-07-01', 'd8c0b5c1-1e3c-4c7b-b384-5f5a8947f631', 'expense', '労務費（販売・接客業務）', 300000, '2026-07-31', 'production');

INSERT INTO monthly_incentive_allocations (year_month, project_id, task_id, allocation_amount, is_confirmed) VALUES
('2026-07', 'd8c0b5c1-1e3c-4c7b-b384-5f5a8947f631', 'e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 200000, true),
('2026-07', 'd8c0b5c1-1e3c-4c7b-b384-5f5a8947f631', '1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 300000, true);

INSERT INTO daily_work_records (date, member_id, task_id, work_time, is_confirmed) VALUES
('2026-07-01', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 3, true),
('2026-07-01', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 3, true),
('2026-07-02', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 3, true),
('2026-07-02', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 3, true),
('2026-07-03', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 3, true),
('2026-07-03', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 3, true),
('2026-07-06', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 3, true),
('2026-07-06', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 3, true),
('2026-07-07', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 3, true),
('2026-07-07', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 3, true),
('2026-07-08', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 3, true),
('2026-07-08', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 3, true),
('2026-07-09', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 3, true),
('2026-07-09', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 3, true),
('2026-07-10', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 3, true),
('2026-07-10', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 3, true);

UPDATE daily_work_records SET is_confirmed = true WHERE date >= '2026-07-01' AND date <= '2026-07-31';

-- === SEED MONTHLY WAGE RECORDS ===
INSERT INTO monthly_wage_records (id, year_month, member_id, work_time, wage_rate, basic_wage, incentive_total, wage_total, deduction_total, payment, is_confirmed) VALUES
('ad3d75e0-3cf0-42ea-800b-5e476066c58c', '2026-01', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 0, 100, 0, 0, 0, 0, 0, true),
('c1e12adb-6dad-415f-97e0-5a07b3949836', '2026-01', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 0, 250, 0, 0, 0, 0, 0, true),
('cef35b6d-7133-4d2f-880a-50c262c06f3b', '2026-01', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', 0, 250, 0, 0, 0, 0, 0, true),
('d7180e25-0901-4201-bcf7-b9ee5259d860', '2026-01', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 0, 500, 0, 0, 0, 0, 0, true),
('3042a15f-805d-482e-87e3-5a1b136c4451', '2026-02', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 0, 100, 0, 0, 0, 0, 0, true),
('7f5f196b-3a6b-4cfa-b7c3-eb329ba4e000', '2026-02', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 0, 250, 0, 0, 0, 0, 0, true),
('c9c7f1fa-e2b5-4df1-aa6d-a540faaa62ad', '2026-02', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', 0, 250, 0, 0, 0, 0, 0, true),
('d6d8557b-7044-4909-9e57-98a17e669536', '2026-02', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 0, 500, 0, 0, 0, 0, 0, true),
('b9a01407-e335-4434-8931-5e735dc5fe7f', '2026-03', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 0, 100, 0, 0, 0, 0, 0, true),
('61ddfdcc-5451-4a4d-9e8e-474078a6295e', '2026-03', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 0, 250, 0, 0, 0, 0, 0, true),
('1e09b4ee-d18b-4661-a313-3ce8a4e030f9', '2026-03', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', 0, 250, 0, 0, 0, 0, 0, true),
('3db6bc43-344a-428a-ba32-9f40cfbafa94', '2026-03', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 0, 500, 0, 0, 0, 0, 0, true),
('a4cd77bd-90fd-4e33-bfba-3154fa030ef1', '2026-04', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 0, 100, 0, 0, 0, 0, 0, true),
('5c461933-8b79-4236-b542-61059495be0b', '2026-04', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 0, 250, 0, 0, 0, 0, 0, true),
('035ca0c9-2740-4225-be33-3b6f04186e9e', '2026-04', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', 0, 250, 0, 0, 0, 0, 0, true),
('020c0f31-5b26-46ad-87dd-acdf11c7573d', '2026-04', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 0, 500, 0, 0, 0, 0, 0, true),
('3af0ffdd-6af4-4bf6-ac12-d4dffd623e8c', '2026-05', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 0, 100, 0, 0, 0, 0, 0, true),
('4b7e4e6f-6da3-4602-b881-847457736534', '2026-05', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 0, 250, 0, 0, 0, 0, 0, true),
('7fbc0915-2966-42a5-9386-66a5f96cbd7b', '2026-05', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', 0, 250, 0, 0, 0, 0, 0, true),
('0b6151e8-92f0-4e2b-9fcf-3d2df534bdd2', '2026-05', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 0, 500, 0, 0, 0, 0, 0, true),
('d3e89abe-6c97-4db2-9b63-b150b617265c', '2026-06', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 31.5, 100, 3150, 0, 3150, 0, 3150, true),
('2303c545-f66e-4281-8054-50556c339f5e', '2026-06', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 28.5, 250, 7125, 0, 7125, 0, 7125, true),
('959467f4-744a-4411-a8de-9a5ac099a0e0', '2026-06', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', 7, 250, 1750, 0, 1750, 0, 1750, true),
('814bbf38-d47f-40e5-a6ee-08426717c202', '2026-06', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 7, 500, 3500, 0, 3500, 0, 3500, true),
('dcca4c16-23fa-487d-82a8-ab6e3c72dae3', '2026-07', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 24, 100, 2400, 147600, 150000, 0, 150000, true),
('5551e252-e3cb-4a10-a9af-57baf5990027', '2026-07', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 24, 250, 6000, 219000, 225000, 0, 225000, true),
('53b517ad-52ee-47e4-b909-d68cd9156950', '2026-07', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', 0, 250, 0, 0, 0, 0, 0, true),
('af1a428b-560b-477d-b6fa-50e466cfebbb', '2026-07', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 0, 500, 0, 0, 0, 0, 0, true),
('ccf50898-7814-4019-b0f6-100c538d7caa', '2026-08', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 25, 100, 2500, 147500, 150000, 0, 150000, false),
('717f8429-0f28-4d4e-866f-8733804b1c51', '2026-08', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 25, 250, 6250, 143750, 150000, 0, 150000, false),
('42d8e95e-52e5-40de-a06e-76f79ad68a01', '2026-08', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', 15, 250, 3750, 146250, 150000, 0, 150000, false),
('c42d5da8-a361-4344-88c1-9aeaedbe1c34', '2026-08', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 35, 500, 17500, 132500, 150000, 0, 150000, false),
('77777777-7777-4777-a777-777777779001', '2027-07', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 36, 100, 3600, 221400, 225000, 0, 225000, true),
('77777777-7777-4777-a777-777777779002', '2027-07', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 36, 250, 9000, 216000, 225000, 0, 225000, true),
('77777777-7777-4777-a777-777777779003', '2027-07', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', 48, 250, 12000, 288000, 300000, 0, 300000, true),
('77777777-7777-4777-a777-777777779004', '2027-07', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 48, 500, 24000, 276000, 300000, 0, 300000, true)
ON CONFLICT (year_month, member_id) DO NOTHING;
