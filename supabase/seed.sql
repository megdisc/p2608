-- Auth users
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) VALUES ('00000000-0000-0000-0000-000000000000', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', 'authenticated', 'authenticated', 'staff-001@example.com', '', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) VALUES ('00000000-0000-0000-0000-000000000000', 'de2d336b-254d-4af7-8e49-5acbda340e67', 'authenticated', 'authenticated', 'staff-002@example.com', '', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) VALUES ('00000000-0000-0000-0000-000000000000', '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'authenticated', 'authenticated', 'staff-003@example.com', '', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) VALUES ('00000000-0000-0000-0000-000000000000', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'authenticated', 'authenticated', 'member-001@example.com', '', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) VALUES ('00000000-0000-0000-0000-000000000000', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 'authenticated', 'authenticated', 'member-002@example.com', '', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) VALUES ('00000000-0000-0000-0000-000000000000', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'authenticated', 'authenticated', 'member-003@example.com', '', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) VALUES ('00000000-0000-0000-0000-000000000000', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'authenticated', 'authenticated', 'member-004@example.com', '', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');

-- Staffs
INSERT INTO staffs (id, name, yomigana, email, role) VALUES ('563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', '相澤翔太', 'あいざわしょうた', 'staff-001@example.com', 'システム管理者');
INSERT INTO staffs (id, name, yomigana, email, role) VALUES ('de2d336b-254d-4af7-8e49-5acbda340e67', '井上結衣', 'いのうえゆい', 'staff-002@example.com', '職員');
INSERT INTO staffs (id, name, yomigana, email, role) VALUES ('5ff5e55e-186f-43ce-84d2-aa751d8341b5', '上田拓海', 'うえだたくみ', 'staff-003@example.com', '職員');

-- Base Wages
INSERT INTO base_wages (id, wage, description) VALUES ('a1b2c3d4-0000-0000-0000-000000000001', 100, '新人レベル');
INSERT INTO base_wages (id, wage, description) VALUES ('a1b2c3d4-0000-0000-0000-000000000002', 250, '中堅レベル');
INSERT INTO base_wages (id, wage, description) VALUES ('a1b2c3d4-0000-0000-0000-000000000003', 500, 'ベテランレベル');
-- Categories

-- Locations

-- Suppliers

-- Items


-- Transactions

-- Stocktakings

-- Members
INSERT INTO members (id, name, yomigana, role, email, base_wage_id) VALUES ('b362ad61-3ab9-42b3-a53c-1b77f985b85a', '江口春奈', 'えぐちはるな', '利用者', 'member-001@example.com', 'a1b2c3d4-0000-0000-0000-000000000001');
INSERT INTO members (id, name, yomigana, role, email, base_wage_id) VALUES ('e98c7634-1eb3-4e42-b062-841f39c043e0', '大西智也', 'おおにしともや', '利用者', 'member-002@example.com', 'a1b2c3d4-0000-0000-0000-000000000002');
INSERT INTO members (id, name, yomigana, role, email, base_wage_id) VALUES ('a1b2c3d4-e5f6-7890-1234-56789abcdef0', '佐藤健太', 'さとうけんた', '利用者', 'member-003@example.com', 'a1b2c3d4-0000-0000-0000-000000000002');
INSERT INTO members (id, name, yomigana, role, email, base_wage_id) VALUES ('f0e9d8c7-b6a5-4321-0987-6543210fedc2', '高橋結衣', 'たかはしゆい', '利用者', 'member-004@example.com', 'a1b2c3d4-0000-0000-0000-000000000003');

-- Clients
INSERT INTO clients (id, name, yomigana, contact_person, phone) VALUES ('73ab0c05-9915-4894-a083-6bccf7a66d2a', '株式会社テクノソリューションズ', 'かぶしきがいしゃてくのそりゅーしょんず', '佐々木凛', '0312345678');
INSERT INTO clients (id, name, yomigana, contact_person, phone) VALUES ('bac1fb37-abfa-4eb3-9454-d72fb7b3b7e8', 'グローバルインダストリー株式会社', 'ぐろーばるいんだすとりーかぶしきがいしゃ', '清水蒼', '0698765432');
INSERT INTO clients (id, name, yomigana, contact_person, phone) VALUES ('0ff5f11e-b752-4b06-aaab-86984a67eec7', '合同会社イノベーションラボ', 'ごうどうがいしゃいのべーしょんらぼ', '杉山結愛', '05011112222');

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
INSERT INTO projects (id, name, yomigana, client_id, start_date, end_date) VALUES ('418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', '本社オフィスネットワーク構築', 'ほんしゃおふぃすねっとわーくこうちく', '73ab0c05-9915-4894-a083-6bccf7a66d2a', '2026-01', '2026-12');
INSERT INTO project_tasks (id, project_id, name, yomigana, assignee_type) VALUES ('aaceaea1-43df-42c1-bfc6-1794a4eb9e16', '418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', '要件定義', 'ようけんていぎ', 'internal');
INSERT INTO project_task_skills (task_id, skill_id, skill_level_id) VALUES ('aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 'ec4310ed-27ab-4cb7-a13a-8c937bfc2a42', 'cdfc7a4d-c124-41d3-98cb-fb1b15ad39bb');
INSERT INTO project_task_skills (task_id, skill_id, skill_level_id) VALUES ('aaceaea1-43df-42c1-bfc6-1794a4eb9e16', '817f8df7-05bc-4610-8a37-9609ff4ae89d', '9b139db0-a352-4f38-89c0-9dff60a4f66a');
INSERT INTO project_task_assignees (task_id, member_id) VALUES ('aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a');
INSERT INTO project_tasks (id, project_id, name, yomigana, assignee_type) VALUES ('3334e7a8-684e-4695-a503-5cccdc2b0e50', '418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', '基本・詳細設計', 'きほん・しょうさいせっけい', 'external');
INSERT INTO project_task_skills (task_id, skill_id, skill_level_id) VALUES ('3334e7a8-684e-4695-a503-5cccdc2b0e50', 'ec4310ed-27ab-4cb7-a13a-8c937bfc2a42', 'e24bd35c-7833-41c3-ab5b-5136db6d75d1');
INSERT INTO project_task_skills (task_id, skill_id, skill_level_id) VALUES ('3334e7a8-684e-4695-a503-5cccdc2b0e50', '817f8df7-05bc-4610-8a37-9609ff4ae89d', 'cdfc7a4d-c124-41d3-98cb-fb1b15ad39bb');
INSERT INTO project_task_assignees (task_id, client_id) VALUES ('3334e7a8-684e-4695-a503-5cccdc2b0e50', 'bac1fb37-abfa-4eb3-9454-d72fb7b3b7e8');
INSERT INTO project_tasks (id, project_id, name, yomigana, assignee_type) VALUES ('8daa6b8b-ddb2-462a-9594-1738f004832f', '418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', '構築・テスト', 'こうちく・てすと', 'internal');
INSERT INTO project_task_skills (task_id, skill_id, skill_level_id) VALUES ('8daa6b8b-ddb2-462a-9594-1738f004832f', '817f8df7-05bc-4610-8a37-9609ff4ae89d', '9b139db0-a352-4f38-89c0-9dff60a4f66a');
INSERT INTO project_task_skills (task_id, skill_id, skill_level_id) VALUES ('8daa6b8b-ddb2-462a-9594-1738f004832f', 'f3b0d9b2-ab80-48e1-abf2-7f7b6653b6d2', '9b139db0-a352-4f38-89c0-9dff60a4f66a');
INSERT INTO project_task_assignees (task_id, member_id) VALUES ('8daa6b8b-ddb2-462a-9594-1738f004832f', 'e98c7634-1eb3-4e42-b062-841f39c043e0');
INSERT INTO project_task_assignees (task_id, member_id) VALUES ('8daa6b8b-ddb2-462a-9594-1738f004832f', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a');
INSERT INTO project_task_assignees (task_id, member_id) VALUES ('3334e7a8-684e-4695-a503-5cccdc2b0e50', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a');
INSERT INTO project_task_assignees (task_id, member_id) VALUES ('3334e7a8-684e-4695-a503-5cccdc2b0e50', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0');
INSERT INTO projects (id, name, yomigana, client_id, start_date, end_date) VALUES ('52532aea-8f77-478e-ae37-c0ef57ee5cf5', '支社サーバーリプレイス', 'ししゃさーばーりぷれいす', 'bac1fb37-abfa-4eb3-9454-d72fb7b3b7e8', '2026-04', '2026-08');
INSERT INTO project_tasks (id, project_id, name, yomigana, assignee_type) VALUES ('adc26f10-909b-4ae1-b255-a86a5014dd3d', '52532aea-8f77-478e-ae37-c0ef57ee5cf5', 'サーバー構築', 'さーばーこうちく', 'external');
INSERT INTO project_task_skills (task_id, skill_id, skill_level_id) VALUES ('adc26f10-909b-4ae1-b255-a86a5014dd3d', 'f3b0d9b2-ab80-48e1-abf2-7f7b6653b6d2', 'cdfc7a4d-c124-41d3-98cb-fb1b15ad39bb');
INSERT INTO project_task_skills (task_id, skill_id, skill_level_id) VALUES ('adc26f10-909b-4ae1-b255-a86a5014dd3d', '8172c05b-207d-4ca4-82e5-c8e51328accc', 'e24bd35c-7833-41c3-ab5b-5136db6d75d1');
INSERT INTO project_task_assignees (task_id, client_id) VALUES ('adc26f10-909b-4ae1-b255-a86a5014dd3d', '0ff5f11e-b752-4b06-aaab-86984a67eec7');

-- Additional Projects with Staff and Members
INSERT INTO projects (id, name, yomigana, client_id, start_date, end_date) VALUES ('a91b78c8-8047-4dad-924c-1ee58074ff78', '新規Webサービス開発支援', 'しんきうぇぶさーびすかいはつしえん', '73ab0c05-9915-4894-a083-6bccf7a66d2a', '2025-10', '2026-09');
INSERT INTO project_tasks (id, project_id, name, yomigana, assignee_type) VALUES ('9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 'a91b78c8-8047-4dad-924c-1ee58074ff78', 'UI/UXデザイン', 'ゆーあいゆーえっくすでざいん', 'internal');
INSERT INTO project_task_skills (task_id, skill_id, skill_level_id) VALUES ('9f95bc37-68fb-43ab-99b0-49eb8d0f500e', '676fa8f0-b4d8-4035-ae3f-de391ece3a63', 'e24bd35c-7833-41c3-ab5b-5136db6d75d1');
INSERT INTO project_task_skills (task_id, skill_id, skill_level_id) VALUES ('9f95bc37-68fb-43ab-99b0-49eb8d0f500e', '38eb7141-55bd-43d0-a6a5-7d028233eb17', 'e24bd35c-7833-41c3-ab5b-5136db6d75d1');
INSERT INTO project_task_assignees (task_id, staff_id) VALUES ('9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 'de2d336b-254d-4af7-8e49-5acbda340e67');
INSERT INTO project_task_assignees (task_id, member_id) VALUES ('9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a');
INSERT INTO project_task_assignees (task_id, member_id) VALUES ('9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0');
INSERT INTO project_tasks (id, project_id, name, yomigana, assignee_type) VALUES ('b6ed11d0-6084-48d5-bda3-6971fa912e5f', 'a91b78c8-8047-4dad-924c-1ee58074ff78', 'フロントエンド実装', 'ふろんとえんどじっそう', 'internal');
INSERT INTO project_task_skills (task_id, skill_id, skill_level_id) VALUES ('b6ed11d0-6084-48d5-bda3-6971fa912e5f', '676fa8f0-b4d8-4035-ae3f-de391ece3a63', '9b139db0-a352-4f38-89c0-9dff60a4f66a');
INSERT INTO project_task_skills (task_id, skill_id, skill_level_id) VALUES ('b6ed11d0-6084-48d5-bda3-6971fa912e5f', '38eb7141-55bd-43d0-a6a5-7d028233eb17', 'cdfc7a4d-c124-41d3-98cb-fb1b15ad39bb');
INSERT INTO project_task_assignees (task_id, staff_id) VALUES ('b6ed11d0-6084-48d5-bda3-6971fa912e5f', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa');
INSERT INTO project_task_assignees (task_id, member_id) VALUES ('b6ed11d0-6084-48d5-bda3-6971fa912e5f', 'e98c7634-1eb3-4e42-b062-841f39c043e0');
INSERT INTO project_task_assignees (task_id, member_id) VALUES ('b6ed11d0-6084-48d5-bda3-6971fa912e5f', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2');
INSERT INTO projects (id, name, yomigana, client_id, start_date, end_date) VALUES ('7e3a29d8-9ba7-49c1-b7a0-24e894f92098', '社内基幹システム移行', 'しゃないきかんしすてむいこう', '73ab0c05-9915-4894-a083-6bccf7a66d2a', '2026-01', '2026-11');
INSERT INTO project_tasks (id, project_id, name, yomigana, is_canceled, assignee_type) VALUES ('d6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', '7e3a29d8-9ba7-49c1-b7a0-24e894f92098', 'データ移行計画', 'でーたいこうけいかく', true, 'internal');
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
INSERT INTO projects (id, name, yomigana, client_id, start_date, end_date, project_type) VALUES ('d8c0b5c1-1e3c-4c7b-b384-5f5a8947f631', 'パンの販売・カフェ運営', 'ぱんのはんばい・かふぇうんえい', NULL, '2026-06', NULL, 'ongoing');
INSERT INTO project_tasks (id, project_id, name, yomigana, assignee_type) VALUES ('e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 'd8c0b5c1-1e3c-4c7b-b384-5f5a8947f631', '製造業務', 'せいぞうぎょうむ', 'internal');
INSERT INTO project_task_skills (task_id, skill_id, skill_level_id) VALUES ('e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', '128b9cc4-7e82-4f3b-b2ab-94f83b1c67d3', 'cdfc7a4d-c124-41d3-98cb-fb1b15ad39bb');
INSERT INTO project_task_assignees (task_id, staff_id) VALUES ('e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa');
INSERT INTO project_task_assignees (task_id, member_id) VALUES ('e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a');

INSERT INTO project_tasks (id, project_id, name, yomigana, assignee_type) VALUES ('1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 'd8c0b5c1-1e3c-4c7b-b384-5f5a8947f631', '販売・接客業務', 'はんばい・せっきゃくぎょうむ', 'internal');
INSERT INTO project_task_skills (task_id, skill_id, skill_level_id) VALUES ('1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', '874c9f1a-5d6b-4e2c-9a3e-781f2a5b0c9d', 'e24bd35c-7833-41c3-ab5b-5136db6d75d1');
INSERT INTO project_task_assignees (task_id, staff_id) VALUES ('1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 'de2d336b-254d-4af7-8e49-5acbda340e67');
INSERT INTO project_task_assignees (task_id, member_id) VALUES ('1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 'e98c7634-1eb3-4e42-b062-841f39c043e0');

-- One-off Project (Internal Business)
INSERT INTO projects (id, name, yomigana, client_id, start_date, end_date, project_type) VALUES ('b2f5d91c-1234-4567-89ab-cdef01234567', '社内業務マニュアル作成', 'しゃないぎょうむまにゅあるさくせい', NULL, '2026-07', '2026-08', 'one-off');
INSERT INTO project_tasks (id, project_id, name, yomigana, assignee_type) VALUES ('884d9f1a-5d6b-4e2c-9a3e-781f2a5b0c9d', 'b2f5d91c-1234-4567-89ab-cdef01234567', 'マニュアル作成', 'まにゅあるさくせい', 'internal');
INSERT INTO project_task_assignees (task_id, staff_id) VALUES ('884d9f1a-5d6b-4e2c-9a3e-781f2a5b0c9d', '5ff5e55e-186f-43ce-84d2-aa751d8341b5');

-- Continuous Project (With Client)
INSERT INTO projects (id, name, yomigana, client_id, start_date, end_date, project_type) VALUES ('c1234567-89ab-cdef-0123-456789abcdef', '基幹システム保守運用', 'きかんしすてむほしゅうんよう', '73ab0c05-9915-4894-a083-6bccf7a66d2a', '2026-05', NULL, 'ongoing');
INSERT INTO project_tasks (id, project_id, name, yomigana, assignee_type) VALUES ('a1234567-89ab-cdef-0123-456789abcdef', 'c1234567-89ab-cdef-0123-456789abcdef', '保守運用業務', 'ほしゅうんようぎょうむ', 'internal');
INSERT INTO project_task_assignees (task_id, staff_id) VALUES ('a1234567-89ab-cdef-0123-456789abcdef', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa');

-- Project Budgets
INSERT INTO project_budget_items (project_id, category, subject, amount) VALUES ('418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', 'revenue', '売上', 3300000);
INSERT INTO project_budget_items (project_id, category, subject, task_id, amount) VALUES ('418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', 'expense', '労務費・外注加工費（要件定義）', 'aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 1500000);
INSERT INTO project_budget_items (project_id, category, subject, task_id, amount) VALUES ('418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', 'expense', '労務費・外注加工費（基本・詳細設計）', '3334e7a8-684e-4695-a503-5cccdc2b0e50', 500000);
INSERT INTO project_budget_items (project_id, category, subject, task_id, amount) VALUES ('418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', 'expense', '労務費・外注加工費（構築・テスト）', '8daa6b8b-ddb2-462a-9594-1738f004832f', 800000);

-- 完了案件の収支記録のシード
INSERT INTO financial_records (period, type, subject, amount, project_id, is_limited, recorded_date) VALUES ('2026-06-01', 'expense', '労務費（利用者工賃）', 2300000, '418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', false, '2026-06-30');
INSERT INTO project_budget_items (project_id, category, subject, amount) VALUES ('418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', 'reserve', '工賃変動積立金', 500000);

INSERT INTO project_budget_items (project_id, category, subject, amount) VALUES ('52532aea-8f77-478e-ae37-c0ef57ee5cf5', 'revenue', '売上', 350000);
INSERT INTO project_budget_items (project_id, category, subject, task_id, amount) VALUES ('52532aea-8f77-478e-ae37-c0ef57ee5cf5', 'expense', '外注加工費（サーバー構築）', 'adc26f10-909b-4ae1-b255-a86a5014dd3d', 300000);
INSERT INTO project_budget_items (project_id, category, subject, amount) VALUES ('52532aea-8f77-478e-ae37-c0ef57ee5cf5', 'reserve', '設備等修繕維持積立金', 50000);

-- 新規サービスLP制作
INSERT INTO project_budget_items (project_id, category, subject, amount) VALUES ('a91b78c8-8047-4dad-924c-1ee58074ff78', 'revenue', '売上', 1000000);
INSERT INTO project_budget_items (project_id, category, subject, task_id, amount) VALUES ('a91b78c8-8047-4dad-924c-1ee58074ff78', 'expense', '労務費・外注加工費（UI/UXデザイン）', '9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 600000);
INSERT INTO project_budget_items (project_id, category, subject, task_id, amount) VALUES ('a91b78c8-8047-4dad-924c-1ee58074ff78', 'expense', '労務費・外注加工費（フロントエンド実装）', 'b6ed11d0-6084-48d5-bda3-6971fa912e5f', 400000);

-- 完了案件の収支記録のシード (新規Webサービス開発支援)
INSERT INTO financial_records (period, type, subject, amount, project_id, is_limited, recorded_date) VALUES ('2026-06-01', 'expense', '労務費（利用者工賃）', 996500, 'a91b78c8-8047-4dad-924c-1ee58074ff78', false, '2026-06-30');

-- 社内基幹システム移行
INSERT INTO project_budget_items (project_id, category, subject, amount) VALUES ('7e3a29d8-9ba7-49c1-b7a0-24e894f92098', 'revenue', '売上', 1200000);
INSERT INTO project_budget_items (project_id, category, subject, task_id, amount) VALUES ('7e3a29d8-9ba7-49c1-b7a0-24e894f92098', 'expense', '外注加工費（データ移行計画）', 'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', 1200000);

-- パンの販売・カフェ運営
INSERT INTO project_budget_items (project_id, category, subject, amount) VALUES ('d8c0b5c1-1e3c-4c7b-b384-5f5a8947f631', 'revenue', '売上', 500000);
INSERT INTO project_budget_items (project_id, category, subject, task_id, amount) VALUES ('d8c0b5c1-1e3c-4c7b-b384-5f5a8947f631', 'expense', '労務費（利用者工賃）（製造業務）', 'e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 200000);
INSERT INTO project_budget_items (project_id, category, subject, task_id, amount) VALUES ('d8c0b5c1-1e3c-4c7b-b384-5f5a8947f631', 'expense', '労務費（利用者工賃）（販売・接客業務）', '1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 300000);

-- 社内業務マニュアル作成
INSERT INTO project_budget_items (project_id, category, subject, amount) VALUES ('b2f5d91c-1234-4567-89ab-cdef01234567', 'revenue', '売上', 100000);
INSERT INTO project_budget_items (project_id, category, subject, task_id, amount) VALUES ('b2f5d91c-1234-4567-89ab-cdef01234567', 'expense', '労務費（利用者工賃）（マニュアル作成）', '884d9f1a-5d6b-4e2c-9a3e-781f2a5b0c9d', 100000);

-- 基幹システム保守運用
INSERT INTO project_budget_items (project_id, category, subject, amount) VALUES ('c1234567-89ab-cdef-0123-456789abcdef', 'revenue', '売上', 500000);
INSERT INTO project_budget_items (project_id, category, subject, task_id, amount) VALUES ('c1234567-89ab-cdef-0123-456789abcdef', 'expense', '労務費（利用者工賃）（保守運用業務）', 'a1234567-89ab-cdef-0123-456789abcdef', 500000);

-- Add daily work records for 2026-06-29
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-29', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 3) ON CONFLICT DO NOTHING;
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-29', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', '9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 2) ON CONFLICT DO NOTHING;
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-29', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', '00000000-0000-0000-0000-000000000002', 1) ON CONFLICT DO NOTHING;

INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-29', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '8daa6b8b-ddb2-462a-9594-1738f004832f', 4) ON CONFLICT DO NOTHING;
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-29', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 'b6ed11d0-6084-48d5-bda3-6971fa912e5f', 1) ON CONFLICT DO NOTHING;
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-29', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '00000000-0000-0000-0000-000000000002', 1) ON CONFLICT DO NOTHING;

INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-29', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', '9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 5) ON CONFLICT DO NOTHING;
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-29', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', '00000000-0000-0000-0000-000000000002', 2) ON CONFLICT DO NOTHING;

-- Add daily work records for 2026-06-30
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-30', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', 4) ON CONFLICT DO NOTHING;
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-30', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', '00000000-0000-0000-0000-000000000002', 1.5) ON CONFLICT DO NOTHING;

INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-30', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 'b6ed11d0-6084-48d5-bda3-6971fa912e5f', 3) ON CONFLICT DO NOTHING;
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-30', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', 2) ON CONFLICT DO NOTHING;
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-30', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '00000000-0000-0000-0000-000000000002', 0.5) ON CONFLICT DO NOTHING;

INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-30', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'b6ed11d0-6084-48d5-bda3-6971fa912e5f', 5) ON CONFLICT DO NOTHING;
INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-30', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', '00000000-0000-0000-0000-000000000002', 2) ON CONFLICT DO NOTHING;

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

-- Financial Records (Manually Input Seed Data)
INSERT INTO financial_records (period, project_id, type, subject, amount, recorded_date, recorded_by, is_limited) VALUES
('2026-06-01', '418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', 'revenue', '売上', 3300000, '2026-06-30', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false),
('2026-06-01', NULL, 'revenue', 'その他収益', 50000, '2026-06-30', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false),
('2026-06-01', NULL, 'expense', '労務費（その他）', 300000, '2026-06-30', 'de2d336b-254d-4af7-8e49-5acbda340e67', false),
('2026-06-01', '418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', 'expense', '外注加工費', 200000, '2026-06-30', '5ff5e55e-186f-43ce-84d2-aa751d8341b5', false),
('2026-06-01', NULL, 'expense', 'その他費用', 100000, '2026-06-30', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false),

('2026-07-01', '52532aea-8f77-478e-ae37-c0ef57ee5cf5', 'revenue', '売上', 1500000, '2026-07-15', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false),
('2026-07-01', NULL, 'expense', '労務費（利用者工賃）', 800000, '2026-07-15', 'de2d336b-254d-4af7-8e49-5acbda340e67', false),
('2026-07-01', '52532aea-8f77-478e-ae37-c0ef57ee5cf5', 'expense', '外注加工費', 300000, '2026-07-15', '5ff5e55e-186f-43ce-84d2-aa751d8341b5', false),
('2026-07-01', NULL, 'expense', 'その他費用', 50000, '2026-07-15', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false),

('2026-08-01', NULL, 'revenue', 'その他収益', 10000, '2026-08-01', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false),
('2026-08-01', NULL, 'expense', '労務費（その他）', 150000, '2026-08-01', 'de2d336b-254d-4af7-8e49-5acbda340e67', false),
('2026-08-01', NULL, 'expense', 'その他費用', 20000, '2026-08-01', '5ff5e55e-186f-43ce-84d2-aa751d8341b5', false),

('2026-08-01', NULL, 'reserve', '工賃変動積立金', 100000, '2026-08-01', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false),
('2026-08-01', NULL, 'reserve', '設備等修繕維持積立金', 50000, '2026-08-01', 'de2d336b-254d-4af7-8e49-5acbda340e67', false);

-- === COMPREHENSIVE GENERATED SEED DATA FOR 2026-06 to 2026-08 ===

-- === COMPREHENSIVE GENERATED SEED DATA FOR 2026-06 to 2026-08 ===
INSERT INTO monthly_task_progress (year_month, task_id, status) VALUES ('2026-06', 'aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 'in_progress');
INSERT INTO monthly_task_progress (year_month, task_id, status) VALUES ('2026-07', 'aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 'completed');
INSERT INTO monthly_task_progress (year_month, task_id, status) VALUES ('2026-08', 'aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 'completed');
INSERT INTO monthly_task_progress (year_month, task_id, status) VALUES ('2026-06', '3334e7a8-684e-4695-a503-5cccdc2b0e50', 'in_progress');
INSERT INTO monthly_task_progress (year_month, task_id, status) VALUES ('2026-07', '3334e7a8-684e-4695-a503-5cccdc2b0e50', 'in_progress');
INSERT INTO monthly_task_progress (year_month, task_id, status) VALUES ('2026-08', '3334e7a8-684e-4695-a503-5cccdc2b0e50', 'completed');
INSERT INTO monthly_task_progress (year_month, task_id, status) VALUES ('2026-06', '8daa6b8b-ddb2-462a-9594-1738f004832f', 'in_progress');
INSERT INTO monthly_task_progress (year_month, task_id, status) VALUES ('2026-07', '8daa6b8b-ddb2-462a-9594-1738f004832f', 'in_progress');
INSERT INTO monthly_task_progress (year_month, task_id, status) VALUES ('2026-08', '8daa6b8b-ddb2-462a-9594-1738f004832f', 'canceled');
INSERT INTO monthly_task_progress (year_month, task_id, status) VALUES ('2026-06', 'adc26f10-909b-4ae1-b255-a86a5014dd3d', 'in_progress');
INSERT INTO monthly_task_progress (year_month, task_id, status) VALUES ('2026-07', 'adc26f10-909b-4ae1-b255-a86a5014dd3d', 'completed');
INSERT INTO monthly_task_progress (year_month, task_id, status) VALUES ('2026-08', 'adc26f10-909b-4ae1-b255-a86a5014dd3d', 'completed');
INSERT INTO monthly_task_progress (year_month, task_id, status) VALUES ('2026-06', '9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 'in_progress');
INSERT INTO monthly_task_progress (year_month, task_id, status) VALUES ('2026-07', '9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 'in_progress');
INSERT INTO monthly_task_progress (year_month, task_id, status) VALUES ('2026-08', '9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 'canceled');
INSERT INTO monthly_task_progress (year_month, task_id, status) VALUES ('2026-06', 'b6ed11d0-6084-48d5-bda3-6971fa912e5f', 'in_progress');
INSERT INTO monthly_task_progress (year_month, task_id, status) VALUES ('2026-07', 'b6ed11d0-6084-48d5-bda3-6971fa912e5f', 'in_progress');
INSERT INTO monthly_task_progress (year_month, task_id, status) VALUES ('2026-08', 'b6ed11d0-6084-48d5-bda3-6971fa912e5f', 'completed');
INSERT INTO monthly_task_progress (year_month, task_id, status) VALUES ('2026-06', 'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', 'in_progress');
INSERT INTO monthly_task_progress (year_month, task_id, status) VALUES ('2026-07', 'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', 'completed');
INSERT INTO monthly_task_progress (year_month, task_id, status) VALUES ('2026-08', 'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', 'completed');
INSERT INTO monthly_task_progress (year_month, task_id, status) VALUES ('2026-06', 'e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 'in_progress');
INSERT INTO monthly_task_progress (year_month, task_id, status) VALUES ('2026-07', 'e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 'in_progress');
INSERT INTO monthly_task_progress (year_month, task_id, status) VALUES ('2026-08', 'e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 'completed');
INSERT INTO monthly_task_progress (year_month, task_id, status) VALUES ('2026-06', '1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 'in_progress');
INSERT INTO monthly_task_progress (year_month, task_id, status) VALUES ('2026-07', '1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 'in_progress');
INSERT INTO monthly_task_progress (year_month, task_id, status) VALUES ('2026-08', '1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 'canceled');
INSERT INTO monthly_task_progress (year_month, task_id, status) VALUES ('2026-06', '884d9f1a-5d6b-4e2c-9a3e-781f2a5b0c9d', 'in_progress');
INSERT INTO monthly_task_progress (year_month, task_id, status) VALUES ('2026-07', '884d9f1a-5d6b-4e2c-9a3e-781f2a5b0c9d', 'completed');
INSERT INTO monthly_task_progress (year_month, task_id, status) VALUES ('2026-08', '884d9f1a-5d6b-4e2c-9a3e-781f2a5b0c9d', 'completed');
INSERT INTO monthly_task_progress (year_month, task_id, status) VALUES ('2026-06', 'a1234567-89ab-cdef-0123-456789abcdef', 'in_progress');
INSERT INTO monthly_task_progress (year_month, task_id, status) VALUES ('2026-07', 'a1234567-89ab-cdef-0123-456789abcdef', 'in_progress');
INSERT INTO monthly_task_progress (year_month, task_id, status) VALUES ('2026-08', 'a1234567-89ab-cdef-0123-456789abcdef', 'completed');
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-06', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 60, 20000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-06', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 40, 15000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-07', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 60, 20000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-07', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 40, 15000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-06', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', '3334e7a8-684e-4695-a503-5cccdc2b0e50', 60, 40000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-06', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '3334e7a8-684e-4695-a503-5cccdc2b0e50', 40, 30000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-07', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', '3334e7a8-684e-4695-a503-5cccdc2b0e50', 60, 40000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-07', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '3334e7a8-684e-4695-a503-5cccdc2b0e50', 40, 30000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-08', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', '3334e7a8-684e-4695-a503-5cccdc2b0e50', 60, 40000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-08', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '3334e7a8-684e-4695-a503-5cccdc2b0e50', 40, 30000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-06', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '8daa6b8b-ddb2-462a-9594-1738f004832f', 60, 60000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-06', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', '8daa6b8b-ddb2-462a-9594-1738f004832f', 40, 45000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-07', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '8daa6b8b-ddb2-462a-9594-1738f004832f', 60, 60000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-07', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', '8daa6b8b-ddb2-462a-9594-1738f004832f', 40, 45000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-06', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'adc26f10-909b-4ae1-b255-a86a5014dd3d', 60, 80000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-06', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'adc26f10-909b-4ae1-b255-a86a5014dd3d', 40, 60000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-07', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'adc26f10-909b-4ae1-b255-a86a5014dd3d', 60, 80000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-07', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'adc26f10-909b-4ae1-b255-a86a5014dd3d', 40, 60000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-06', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', '9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 60, 100000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-06', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', '9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 40, 75000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-07', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', '9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 60, 100000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-07', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', '9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 40, 75000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-06', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'b6ed11d0-6084-48d5-bda3-6971fa912e5f', 60, 120000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-06', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 'b6ed11d0-6084-48d5-bda3-6971fa912e5f', 40, 90000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-07', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'b6ed11d0-6084-48d5-bda3-6971fa912e5f', 60, 120000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-07', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 'b6ed11d0-6084-48d5-bda3-6971fa912e5f', 40, 90000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-08', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'b6ed11d0-6084-48d5-bda3-6971fa912e5f', 60, 120000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-08', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 'b6ed11d0-6084-48d5-bda3-6971fa912e5f', 40, 90000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-06', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', 60, 140000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-06', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', 40, 105000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-07', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', 60, 140000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-07', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', 40, 105000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-06', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 60, 160000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-06', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 40, 120000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-07', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 60, 160000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-07', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 40, 120000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-08', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 60, 160000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-08', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 40, 120000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-06', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', '1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 60, 180000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-06', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', '1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 40, 135000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-07', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', '1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 60, 180000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-07', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', '1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 40, 135000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-06', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', '884d9f1a-5d6b-4e2c-9a3e-781f2a5b0c9d', 60, 200000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-06', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '884d9f1a-5d6b-4e2c-9a3e-781f2a5b0c9d', 40, 150000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-07', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', '884d9f1a-5d6b-4e2c-9a3e-781f2a5b0c9d', 60, 200000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-07', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '884d9f1a-5d6b-4e2c-9a3e-781f2a5b0c9d', 40, 150000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-06', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 'a1234567-89ab-cdef-0123-456789abcdef', 60, 220000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-06', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'a1234567-89ab-cdef-0123-456789abcdef', 40, 165000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-07', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 'a1234567-89ab-cdef-0123-456789abcdef', 60, 220000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-07', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'a1234567-89ab-cdef-0123-456789abcdef', 40, 165000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-08', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 'a1234567-89ab-cdef-0123-456789abcdef', 60, 220000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-08', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'a1234567-89ab-cdef-0123-456789abcdef', 40, 165000);

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
