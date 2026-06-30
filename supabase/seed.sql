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
INSERT INTO categories (id, code, name, yomigana, description) VALUES ('fca14a0d-8f82-4203-a761-e712fd6bbf95', 'CAT-001', '粉類', 'こなるい', '強力粉、薄力粉、ライ麦粉など');
INSERT INTO categories (id, code, name, yomigana, description) VALUES ('3e32eddf-b3d1-495a-9f0e-00e6ed06e7bb', 'CAT-002', '酵母・膨張剤', 'こうぼ・ぼうちょうざい', 'イースト、ベーキングパウダーなど');
INSERT INTO categories (id, code, name, yomigana, description) VALUES ('d738928f-ae63-469d-8665-faff952e075e', 'CAT-003', '糖類', 'とうるい', '上白糖、グラニュー糖、三温糖など');
INSERT INTO categories (id, code, name, yomigana, description) VALUES ('04d086c7-1b60-4c3a-b96d-204300ec49ba', 'CAT-004', '調味料', 'ちょうみりょう', '塩、スパイス類など');
INSERT INTO categories (id, code, name, yomigana, description) VALUES ('ee588c63-abfa-4694-81a8-cb929e0c6fb8', 'CAT-005', '乳製品', 'にゅうせいひん', 'バター、牛乳、チーズなど');
INSERT INTO categories (id, code, name, yomigana, description) VALUES ('d8974612-313d-445c-90c9-f9b55f6c854a', 'CAT-006', '生鮮食品', 'せいせんしょくひん', '卵、生鮮フルーツ、野菜など');

-- Locations
INSERT INTO locations (id, code, name, yomigana, description) VALUES ('4f3672e8-daf7-4ee6-a289-1b99ad9a512c', 'LOC-001', '倉庫A', 'そうこA', '粉類・乾物用メイン倉庫');
INSERT INTO locations (id, code, name, yomigana, description) VALUES ('b5ee50db-97a6-4a16-ba0d-982cef68a39d', 'LOC-002', '倉庫B', 'そうこB', '調味料・糖類・包材');
INSERT INTO locations (id, code, name, yomigana, description) VALUES ('0a41bdf2-7741-48f9-9215-cdcd042ca397', 'LOC-003', '冷蔵庫1', 'れいぞうこ1', 'イースト・仕込み水用');
INSERT INTO locations (id, code, name, yomigana, description) VALUES ('132dc5ef-c24f-4f02-b734-15b6acb6620b', 'LOC-004', '冷蔵庫2', 'れいぞうこ2', '乳製品（バター・牛乳等）');
INSERT INTO locations (id, code, name, yomigana, description) VALUES ('f15ee998-9c5c-40e2-b190-1928ebb9d82c', 'LOC-005', '冷蔵庫3', 'れいぞうこ3', '生鮮食品（卵・フィリング等）');
INSERT INTO locations (id, code, name, yomigana, description) VALUES ('0e833132-a18a-4f96-8ae7-cbd98727413c', 'LOC-006', '冷凍庫A', 'れいとうこA', '冷凍生地・冷凍フルーツ');

-- Suppliers
INSERT INTO suppliers (id, code, name, yomigana, contact_person, phone) VALUES ('97ed7a81-8160-4a50-9cfa-edf6a7d18019', 'SUP-001', '関東製菓材料卸(株)', 'かんとうせいかざいりょうおろし', '加藤 剛', '0311110001');
INSERT INTO suppliers (id, code, name, yomigana, contact_person, phone) VALUES ('f7b80af7-8479-40fe-9bce-cf36fe91d40e', 'SUP-002', '第一食材商事', 'だいいちしょくざいしょうじ', '木下 楓', '0311110002');
INSERT INTO suppliers (id, code, name, yomigana, contact_person, phone) VALUES ('ff4c7a97-a5d1-44ff-b7b9-f36412c97b1e', 'SUP-003', '丸越乳業販売(株)', 'まるこしにゅうぎょうはんばい', '工藤 蓮', '0311110003');
INSERT INTO suppliers (id, code, name, yomigana, contact_person, phone) VALUES ('2faff51b-529c-486c-ba7d-4cc90d8582cc', 'SUP-004', '新鮮農産流通協同組合', 'しんせんのうさんりゅうつうきょうどうくみあい', '小泉 葵', '0421110004');

-- Items
INSERT INTO items (id, code, name, yomigana, description, supplier_id, standard_price, standard_purchase_qty, category_id, location_id) VALUES ('ea8e1145-9aa7-422d-bd46-bfb76f2024e7', 'ING-001', '強力粉 (カメリヤ)', 'きょうりきこ', '日清製粉、25kg', '97ed7a81-8160-4a50-9cfa-edf6a7d18019', 7500, 1, 'fca14a0d-8f82-4203-a761-e712fd6bbf95', '4f3672e8-daf7-4ee6-a289-1b99ad9a512c');
INSERT INTO items (id, code, name, yomigana, description, supplier_id, standard_price, standard_purchase_qty, category_id, location_id) VALUES ('1cb7bb54-98f3-4ad5-8edd-f573cea0f7b0', 'ING-002', '薄力粉 (バイオレット)', 'はくりきこ', '日清製粉、25kg', '97ed7a81-8160-4a50-9cfa-edf6a7d18019', 6800, 1, 'fca14a0d-8f82-4203-a761-e712fd6bbf95', '4f3672e8-daf7-4ee6-a289-1b99ad9a512c');
INSERT INTO items (id, code, name, yomigana, description, supplier_id, standard_price, standard_purchase_qty, category_id, location_id) VALUES ('0e39e2fa-8c31-42c0-bf47-9f787d9f0179', 'ING-003', 'ドライイースト', 'どらいいーすと', 'ルサッフル、500g', '97ed7a81-8160-4a50-9cfa-edf6a7d18019', 1200, 10, '3e32eddf-b3d1-495a-9f0e-00e6ed06e7bb', '0a41bdf2-7741-48f9-9215-cdcd042ca397');
INSERT INTO items (id, code, name, yomigana, description, supplier_id, standard_price, standard_purchase_qty, category_id, location_id) VALUES ('6ed35b2c-48e3-44e0-b043-89cc0a0a6831', 'ING-004', '上白糖', 'じょうはくとう', '三井製糖、30kg', 'f7b80af7-8479-40fe-9bce-cf36fe91d40e', 5400, 1, 'd738928f-ae63-469d-8665-faff952e075e', 'b5ee50db-97a6-4a16-ba0d-982cef68a39d');
INSERT INTO items (id, code, name, yomigana, description, supplier_id, standard_price, standard_purchase_qty, category_id, location_id) VALUES ('1d5f185c-3de6-4ca2-a751-053ebb5f7d73', 'ING-005', '粗塩', 'あらじお', '伯方塩業、5kg', 'f7b80af7-8479-40fe-9bce-cf36fe91d40e', 850, 2, '04d086c7-1b60-4c3a-b96d-204300ec49ba', 'b5ee50db-97a6-4a16-ba0d-982cef68a39d');
INSERT INTO items (id, code, name, yomigana, description, supplier_id, standard_price, standard_purchase_qty, category_id, location_id) VALUES ('6cc79e42-65a4-41d9-bc63-ffa796887e26', 'ING-006', '無塩バター', 'むえんばたー', 'よつ葉乳業、450g', 'ff4c7a97-a5d1-44ff-b7b9-f36412c97b1e', 950, 30, 'ee588c63-abfa-4694-81a8-cb929e0c6fb8', '132dc5ef-c24f-4f02-b734-15b6acb6620b');
INSERT INTO items (id, code, name, yomigana, description, supplier_id, standard_price, standard_purchase_qty, category_id, location_id) VALUES ('a47b9b86-c9f0-456c-afd8-b0615b6fa9d4', 'ING-007', '牛乳 (業務用)', 'ぎゅうにゅう', '明治、1000ml', 'ff4c7a97-a5d1-44ff-b7b9-f36412c97b1e', 280, 12, 'ee588c63-abfa-4694-81a8-cb929e0c6fb8', '132dc5ef-c24f-4f02-b734-15b6acb6620b');
INSERT INTO items (id, code, name, yomigana, description, supplier_id, standard_price, standard_purchase_qty, category_id, location_id) VALUES ('0ac6f5e8-5bfb-40ee-ad58-e495866ad24e', 'ING-008', '鶏卵 (Lサイズ)', 'けいらん', 'JA全農、10kg', '2faff51b-529c-486c-ba7d-4cc90d8582cc', 3200, 2, 'd8974612-313d-445c-90c9-f9b55f6c854a', 'f15ee998-9c5c-40e2-b190-1928ebb9d82c');


-- Transactions
INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('bdd27aff-0b44-41ae-ad12-01c164c42f81', '2026-05-15 15:00', 'a47b9b86-c9f0-456c-afd8-b0615b6fa9d4', '受入', 4, '132dc5ef-c24f-4f02-b734-15b6acb6620b', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa');
INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('fa4598a9-3289-4458-9b28-adacab83ec16', '2026-05-16 10:00', '0e39e2fa-8c31-42c0-bf47-9f787d9f0179', '受入', 16, '0a41bdf2-7741-48f9-9215-cdcd042ca397', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa');
INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('7e76e32e-ad43-4861-95f9-cc3bec6b1619', '2026-05-16 14:00', '6ed35b2c-48e3-44e0-b043-89cc0a0a6831', '払出', 9, 'b5ee50db-97a6-4a16-ba0d-982cef68a39d', 'de2d336b-254d-4af7-8e49-5acbda340e67');
INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('caa41d7b-68d3-4e70-a520-13dfc35b96b5', '2026-05-17 08:00', '1d5f185c-3de6-4ca2-a751-053ebb5f7d73', '受入', 15, 'b5ee50db-97a6-4a16-ba0d-982cef68a39d', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa');
INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('d3da8aea-b0d8-4974-9de1-e20813cb2217', '2026-05-17 15:00', '6cc79e42-65a4-41d9-bc63-ffa796887e26', '受入', 7, '132dc5ef-c24f-4f02-b734-15b6acb6620b', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa');
INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('abcfce80-7e27-4436-a4dc-fa1d1ad7b6ae', '2026-05-17 17:00', '6cc79e42-65a4-41d9-bc63-ffa796887e26', '受入', 7, 'f15ee998-9c5c-40e2-b190-1928ebb9d82c', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa');
INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('f522181e-4b5b-474f-bb6c-f4ce03760451', '2026-05-18 09:00', '0e39e2fa-8c31-42c0-bf47-9f787d9f0179', '払出', 2, '0a41bdf2-7741-48f9-9215-cdcd042ca397', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa');
INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('90b6bd4d-bcac-476e-8954-f4391ed2970b', '2026-05-18 15:00', '0e39e2fa-8c31-42c0-bf47-9f787d9f0179', '受入', 11, '0a41bdf2-7741-48f9-9215-cdcd042ca397', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa');
INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('20f08016-3229-4b04-9d20-9d88324081fa', '2026-05-21 12:00', 'a47b9b86-c9f0-456c-afd8-b0615b6fa9d4', '払出', 15, '132dc5ef-c24f-4f02-b734-15b6acb6620b', 'de2d336b-254d-4af7-8e49-5acbda340e67');
INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('6cc17aa5-23b7-4d22-8882-5e6c1b6063ad', '2026-05-21 13:00', '6ed35b2c-48e3-44e0-b043-89cc0a0a6831', '払出', 5, 'b5ee50db-97a6-4a16-ba0d-982cef68a39d', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa');
INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('760a8e73-2006-4a9e-80b3-ba7c34ec85e7', '2026-05-22 11:00', '0e39e2fa-8c31-42c0-bf47-9f787d9f0179', '払出', 4, '0a41bdf2-7741-48f9-9215-cdcd042ca397', 'de2d336b-254d-4af7-8e49-5acbda340e67');
INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('8c4c999f-88c9-4972-9360-0d781f7460a8', '2026-05-22 17:00', '0ac6f5e8-5bfb-40ee-ad58-e495866ad24e', '払出', 17, 'f15ee998-9c5c-40e2-b190-1928ebb9d82c', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa');
INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('800a226a-0921-498a-aba7-4cce03398c08', '2026-05-23 11:00', '1d5f185c-3de6-4ca2-a751-053ebb5f7d73', '払出', 6, 'b5ee50db-97a6-4a16-ba0d-982cef68a39d', 'de2d336b-254d-4af7-8e49-5acbda340e67');
INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('7e0310dd-0d74-4541-bea3-712975f090be', '2026-05-23 15:00', '0ac6f5e8-5bfb-40ee-ad58-e495866ad24e', '受入', 17, 'f15ee998-9c5c-40e2-b190-1928ebb9d82c', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa');
INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('3ac293b9-e1ff-47f4-9a3c-8155ef678c3a', '2026-05-24 12:00', '0e39e2fa-8c31-42c0-bf47-9f787d9f0179', '払出', 18, '0a41bdf2-7741-48f9-9215-cdcd042ca397', 'de2d336b-254d-4af7-8e49-5acbda340e67');
INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('5586fa7b-c7e3-411c-969d-5804f1a11b6e', '2026-05-24 16:00', '1cb7bb54-98f3-4ad5-8edd-f573cea0f7b0', '払出', 12, '4f3672e8-daf7-4ee6-a289-1b99ad9a512c', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa');
INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('de33f728-aa8d-4737-8be0-9a30773ed4f5', '2026-05-28 08:00', '6cc79e42-65a4-41d9-bc63-ffa796887e26', '受入', 6, 'f15ee998-9c5c-40e2-b190-1928ebb9d82c', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa');
INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('6808bf72-a160-4564-8cd0-ce9c2c2f7087', '2026-05-30 17:00', '1cb7bb54-98f3-4ad5-8edd-f573cea0f7b0', '受入', 13, '4f3672e8-daf7-4ee6-a289-1b99ad9a512c', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa');
INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('035aa216-a905-4e8d-b9fe-7422e59ebdf0', '2026-05-31 14:00', '0e39e2fa-8c31-42c0-bf47-9f787d9f0179', '受入', 10, '0a41bdf2-7741-48f9-9215-cdcd042ca397', 'de2d336b-254d-4af7-8e49-5acbda340e67');
INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('5dbe663b-77d4-49e7-ad28-bf6a7224c8a2', '2026-06-01 11:00', '0ac6f5e8-5bfb-40ee-ad58-e495866ad24e', '受入', 2, 'f15ee998-9c5c-40e2-b190-1928ebb9d82c', 'de2d336b-254d-4af7-8e49-5acbda340e67');
INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('1cbd82f3-bd25-4458-bf26-b02cb98a08a1', '2026-06-02 16:00', '0ac6f5e8-5bfb-40ee-ad58-e495866ad24e', '受入', 20, 'f15ee998-9c5c-40e2-b190-1928ebb9d82c', 'de2d336b-254d-4af7-8e49-5acbda340e67');
INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('b73aa4b2-a206-42cb-8a13-3fccdc45aa24', '2026-06-03 12:00', '6ed35b2c-48e3-44e0-b043-89cc0a0a6831', '払出', 5, 'b5ee50db-97a6-4a16-ba0d-982cef68a39d', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa');
INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('a81312dc-a138-4198-8153-cd8c15efcf61', '2026-06-04 12:00', '1cb7bb54-98f3-4ad5-8edd-f573cea0f7b0', '受入', 16, '4f3672e8-daf7-4ee6-a289-1b99ad9a512c', 'de2d336b-254d-4af7-8e49-5acbda340e67');
INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('26f31bc2-2621-480c-8e57-6b412b6e24c7', '2026-06-05 13:00', 'a47b9b86-c9f0-456c-afd8-b0615b6fa9d4', '払出', 1, '132dc5ef-c24f-4f02-b734-15b6acb6620b', 'de2d336b-254d-4af7-8e49-5acbda340e67');
INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('03057490-1359-4a33-835e-474a2ecf2638', '2026-06-05 18:00', 'ea8e1145-9aa7-422d-bd46-bfb76f2024e7', '払出', 6, 'b5ee50db-97a6-4a16-ba0d-982cef68a39d', 'de2d336b-254d-4af7-8e49-5acbda340e67');
INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('f6021b47-d904-44f6-940f-01ae710f6f5f', '2026-06-09 18:00', '0e39e2fa-8c31-42c0-bf47-9f787d9f0179', '受入', 17, '0a41bdf2-7741-48f9-9215-cdcd042ca397', 'de2d336b-254d-4af7-8e49-5acbda340e67');
INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('88c9049a-300a-4dee-a90f-d8fe857d1018', '2026-06-10 09:00', '1cb7bb54-98f3-4ad5-8edd-f573cea0f7b0', '受入', 1, '4f3672e8-daf7-4ee6-a289-1b99ad9a512c', 'de2d336b-254d-4af7-8e49-5acbda340e67');
INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('4a72ead7-4056-4981-aa14-55b387237a98', '2026-06-10 11:00', '0e39e2fa-8c31-42c0-bf47-9f787d9f0179', '払出', 1, '0a41bdf2-7741-48f9-9215-cdcd042ca397', 'de2d336b-254d-4af7-8e49-5acbda340e67');
INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('dd66592d-ebd8-4b77-b425-f937d0abab2c', '2026-06-11 08:00', '0e39e2fa-8c31-42c0-bf47-9f787d9f0179', '受入', 4, '0a41bdf2-7741-48f9-9215-cdcd042ca397', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa');
INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('3c867780-39b4-4bb2-ac20-3b9d957fd035', '2026-06-15 10:00', '6ed35b2c-48e3-44e0-b043-89cc0a0a6831', '受入', 7, 'b5ee50db-97a6-4a16-ba0d-982cef68a39d', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa');

-- Stocktakings
INSERT INTO stocktakings (id, date, item_id, system_qty, actual_qty, difference, staff_id, location_id) VALUES ('79df6763-575e-4c34-a81e-a0e3e3d2c030', '2026-05-31 10:00', '0e39e2fa-8c31-42c0-bf47-9f787d9f0179', 29, 14, -15, 'de2d336b-254d-4af7-8e49-5acbda340e67', '0a41bdf2-7741-48f9-9215-cdcd042ca397');
INSERT INTO stocktakings (id, date, item_id, system_qty, actual_qty, difference, staff_id, location_id) VALUES ('3f171aba-2f60-4255-a012-c648dff4057d', '2026-05-31 11:00', '1d5f185c-3de6-4ca2-a751-053ebb5f7d73', 26, 12, -14, '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', 'b5ee50db-97a6-4a16-ba0d-982cef68a39d');
INSERT INTO stocktakings (id, date, item_id, system_qty, actual_qty, difference, staff_id, location_id) VALUES ('c5043c8d-aff9-477e-b2db-6c04c6d13613', '2026-05-31 12:00', 'ea8e1145-9aa7-422d-bd46-bfb76f2024e7', 31, 36, 5, '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', '4f3672e8-daf7-4ee6-a289-1b99ad9a512c');
INSERT INTO stocktakings (id, date, item_id, system_qty, actual_qty, difference, staff_id, location_id) VALUES ('c6e3deec-a899-49ba-931b-ecf0013f7e9c', '2026-05-31 13:00', '0ac6f5e8-5bfb-40ee-ad58-e495866ad24e', 45, 22, -23, 'de2d336b-254d-4af7-8e49-5acbda340e67', 'f15ee998-9c5c-40e2-b190-1928ebb9d82c');
INSERT INTO stocktakings (id, date, item_id, system_qty, actual_qty, difference, staff_id, location_id) VALUES ('5c1e9e25-77d3-43a6-b18b-a68dee7c32b5', '2026-05-31 14:00', 'a47b9b86-c9f0-456c-afd8-b0615b6fa9d4', 48, 41, -7, '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', '132dc5ef-c24f-4f02-b734-15b6acb6620b');
INSERT INTO stocktakings (id, date, item_id, system_qty, actual_qty, difference, staff_id, location_id) VALUES ('d94f0208-20c8-4286-9083-92c06fc7269a', '2026-05-31 15:00', 'a47b9b86-c9f0-456c-afd8-b0615b6fa9d4', 28, 16, -12, '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', '132dc5ef-c24f-4f02-b734-15b6acb6620b');
INSERT INTO stocktakings (id, date, item_id, system_qty, actual_qty, difference, staff_id, location_id) VALUES ('0e8c7941-4dbb-4e62-b422-8d7fa9992f6d', '2026-05-31 16:00', '6ed35b2c-48e3-44e0-b043-89cc0a0a6831', 28, 47, 19, 'de2d336b-254d-4af7-8e49-5acbda340e67', 'b5ee50db-97a6-4a16-ba0d-982cef68a39d');
INSERT INTO stocktakings (id, date, item_id, system_qty, actual_qty, difference, staff_id, location_id) VALUES ('60b38d5c-dc07-4343-ab39-171db5fb0dd8', '2026-05-31 17:00', '0e39e2fa-8c31-42c0-bf47-9f787d9f0179', 28, 12, -16, 'de2d336b-254d-4af7-8e49-5acbda340e67', '0a41bdf2-7741-48f9-9215-cdcd042ca397');
INSERT INTO stocktakings (id, date, item_id, system_qty, actual_qty, difference, staff_id, location_id) VALUES ('3307a58a-43d8-4c88-806a-baa66564fa21', '2026-05-31 18:00', '1d5f185c-3de6-4ca2-a751-053ebb5f7d73', 47, 43, -4, '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', 'b5ee50db-97a6-4a16-ba0d-982cef68a39d');
INSERT INTO stocktakings (id, date, item_id, system_qty, actual_qty, difference, staff_id, location_id) VALUES ('4be7e9b5-d0b9-45d5-8d53-878c16455fc4', '2026-05-31 19:00', 'ea8e1145-9aa7-422d-bd46-bfb76f2024e7', 17, 38, 21, 'de2d336b-254d-4af7-8e49-5acbda340e67', 'b5ee50db-97a6-4a16-ba0d-982cef68a39d');

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
INSERT INTO skill_levels (id, name, description) VALUES ('e24bd35c-7833-41c3-ab5b-5136db6d75d1', '1.初級', '基本的な作業はできるが、サポートが必要');
INSERT INTO skill_levels (id, name, description) VALUES ('cdfc7a4d-c124-41d3-98cb-fb1b15ad39bb', '2.中級', '日常的な作業を自立して行える');
INSERT INTO skill_levels (id, name, description) VALUES ('9b139db0-a352-4f38-89c0-9dff60a4f66a', '3.上級', '他者のサポートやトラブルシューティングができる');


-- Projects
INSERT INTO projects (id, name, yomigana, client_id, start_date, end_date) VALUES ('418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', '本社オフィスネットワーク構築', 'ほんしゃおふぃすねっとわーくこうちく', '73ab0c05-9915-4894-a083-6bccf7a66d2a', '2026-01-01', '2026-12-31');
INSERT INTO project_tasks (id, project_id, name, yomigana)  VALUES ('aaceaea1-43df-42c1-bfc6-1794a4eb9e16', '418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', '要件定義', 'ようけんていぎ');
INSERT INTO project_task_skills (task_id, skill_id) VALUES ('aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 'ec4310ed-27ab-4cb7-a13a-8c937bfc2a42');
INSERT INTO project_task_skills (task_id, skill_id) VALUES ('aaceaea1-43df-42c1-bfc6-1794a4eb9e16', '817f8df7-05bc-4610-8a37-9609ff4ae89d');
INSERT INTO project_task_assignees (task_id, member_id) VALUES ('aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a');
INSERT INTO project_tasks (id, project_id, name, yomigana)  VALUES ('3334e7a8-684e-4695-a503-5cccdc2b0e50', '418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', '基本・詳細設計', 'きほん・しょうさいせっけい');
INSERT INTO project_task_skills (task_id, skill_id) VALUES ('3334e7a8-684e-4695-a503-5cccdc2b0e50', 'ec4310ed-27ab-4cb7-a13a-8c937bfc2a42');
INSERT INTO project_task_skills (task_id, skill_id) VALUES ('3334e7a8-684e-4695-a503-5cccdc2b0e50', '817f8df7-05bc-4610-8a37-9609ff4ae89d');
INSERT INTO project_task_assignees (task_id, client_id) VALUES ('3334e7a8-684e-4695-a503-5cccdc2b0e50', 'bac1fb37-abfa-4eb3-9454-d72fb7b3b7e8');
INSERT INTO project_tasks (id, project_id, name, yomigana)  VALUES ('8daa6b8b-ddb2-462a-9594-1738f004832f', '418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', '構築・テスト', 'こうちく・てすと');
INSERT INTO project_task_skills (task_id, skill_id) VALUES ('8daa6b8b-ddb2-462a-9594-1738f004832f', '817f8df7-05bc-4610-8a37-9609ff4ae89d');
INSERT INTO project_task_skills (task_id, skill_id) VALUES ('8daa6b8b-ddb2-462a-9594-1738f004832f', 'f3b0d9b2-ab80-48e1-abf2-7f7b6653b6d2');
INSERT INTO project_task_assignees (task_id, member_id) VALUES ('8daa6b8b-ddb2-462a-9594-1738f004832f', 'e98c7634-1eb3-4e42-b062-841f39c043e0');
INSERT INTO project_task_assignees (task_id, member_id) VALUES ('8daa6b8b-ddb2-462a-9594-1738f004832f', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a');
INSERT INTO project_task_assignees (task_id, member_id) VALUES ('3334e7a8-684e-4695-a503-5cccdc2b0e50', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a');
INSERT INTO project_task_assignees (task_id, member_id) VALUES ('3334e7a8-684e-4695-a503-5cccdc2b0e50', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0');
INSERT INTO projects (id, name, yomigana, client_id, start_date, end_date) VALUES ('52532aea-8f77-478e-ae37-c0ef57ee5cf5', '支社サーバーリプレイス', 'ししゃさーばーりぷれいす', 'bac1fb37-abfa-4eb3-9454-d72fb7b3b7e8', '2026-04-01', '2026-08-20');
INSERT INTO project_tasks (id, project_id, name, yomigana)  VALUES ('adc26f10-909b-4ae1-b255-a86a5014dd3d', '52532aea-8f77-478e-ae37-c0ef57ee5cf5', 'サーバー構築', 'さーばーこうちく');
INSERT INTO project_task_skills (task_id, skill_id) VALUES ('adc26f10-909b-4ae1-b255-a86a5014dd3d', 'f3b0d9b2-ab80-48e1-abf2-7f7b6653b6d2');
INSERT INTO project_task_skills (task_id, skill_id) VALUES ('adc26f10-909b-4ae1-b255-a86a5014dd3d', '8172c05b-207d-4ca4-82e5-c8e51328accc');
INSERT INTO project_task_assignees (task_id, client_id) VALUES ('adc26f10-909b-4ae1-b255-a86a5014dd3d', '0ff5f11e-b752-4b06-aaab-86984a67eec7');

-- Additional Projects with Staff and Members
INSERT INTO projects (id, name, yomigana, client_id, start_date, end_date) VALUES ('a91b78c8-8047-4dad-924c-1ee58074ff78', '新規Webサービス開発支援', 'しんきうぇぶさーびすかいはつしえん', '73ab0c05-9915-4894-a083-6bccf7a66d2a', '2025-10-01', '2026-09-30');
INSERT INTO project_tasks (id, project_id, name, yomigana)  VALUES ('9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 'a91b78c8-8047-4dad-924c-1ee58074ff78', 'UI/UXデザイン', 'ゆーあいゆーえっくすでざいん');
INSERT INTO project_task_skills (task_id, skill_id) VALUES ('9f95bc37-68fb-43ab-99b0-49eb8d0f500e', '676fa8f0-b4d8-4035-ae3f-de391ece3a63');
INSERT INTO project_task_skills (task_id, skill_id) VALUES ('9f95bc37-68fb-43ab-99b0-49eb8d0f500e', '38eb7141-55bd-43d0-a6a5-7d028233eb17');
INSERT INTO project_task_assignees (task_id, staff_id) VALUES ('9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 'de2d336b-254d-4af7-8e49-5acbda340e67');
INSERT INTO project_task_assignees (task_id, member_id) VALUES ('9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a');
INSERT INTO project_task_assignees (task_id, member_id) VALUES ('9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0');
INSERT INTO project_tasks (id, project_id, name, yomigana)  VALUES ('b6ed11d0-6084-48d5-bda3-6971fa912e5f', 'a91b78c8-8047-4dad-924c-1ee58074ff78', 'フロントエンド実装', 'ふろんとえんどじっそう');
INSERT INTO project_task_skills (task_id, skill_id) VALUES ('b6ed11d0-6084-48d5-bda3-6971fa912e5f', '676fa8f0-b4d8-4035-ae3f-de391ece3a63');
INSERT INTO project_task_skills (task_id, skill_id) VALUES ('b6ed11d0-6084-48d5-bda3-6971fa912e5f', '38eb7141-55bd-43d0-a6a5-7d028233eb17');
INSERT INTO project_task_assignees (task_id, staff_id) VALUES ('b6ed11d0-6084-48d5-bda3-6971fa912e5f', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa');
INSERT INTO project_task_assignees (task_id, member_id) VALUES ('b6ed11d0-6084-48d5-bda3-6971fa912e5f', 'e98c7634-1eb3-4e42-b062-841f39c043e0');
INSERT INTO project_task_assignees (task_id, member_id) VALUES ('b6ed11d0-6084-48d5-bda3-6971fa912e5f', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2');
INSERT INTO projects (id, name, yomigana, client_id, start_date, end_date) VALUES ('7e3a29d8-9ba7-49c1-b7a0-24e894f92098', '社内基幹システム移行', 'しゃないきかんしすてむいこう', '73ab0c05-9915-4894-a083-6bccf7a66d2a', '2026-01-01', '2026-11-30');
INSERT INTO project_tasks (id, project_id, name, yomigana, is_canceled)  VALUES ('d6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', '7e3a29d8-9ba7-49c1-b7a0-24e894f92098', 'データ移行計画', 'でーたいこうけいかく', true);
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
INSERT INTO monthly_task_progress (year_month, task_id, current_progress) VALUES ('2026-05', 'aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 10);
INSERT INTO monthly_task_progress (year_month, task_id, current_progress) VALUES ('2026-05', '9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 20);
INSERT INTO monthly_task_progress (year_month, task_id, current_progress) VALUES ('2026-05', 'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', 15);
INSERT INTO monthly_task_progress (year_month, task_id, current_progress) VALUES ('2026-05', '8daa6b8b-ddb2-462a-9594-1738f004832f', 30);
INSERT INTO monthly_task_progress (year_month, task_id, current_progress) VALUES ('2026-05', 'b6ed11d0-6084-48d5-bda3-6971fa912e5f', 40);
INSERT INTO monthly_task_progress (year_month, task_id, current_progress) VALUES ('2026-06', 'aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 50);
INSERT INTO monthly_task_progress (year_month, task_id, current_progress) VALUES ('2026-06', '9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 100);
INSERT INTO monthly_task_progress (year_month, task_id, current_progress) VALUES ('2026-06', 'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', 80);
INSERT INTO monthly_task_progress (year_month, task_id, current_progress) VALUES ('2026-06', '8daa6b8b-ddb2-462a-9594-1738f004832f', 100);
INSERT INTO monthly_task_progress (year_month, task_id, current_progress) VALUES ('2026-06', 'b6ed11d0-6084-48d5-bda3-6971fa912e5f', 100);

-- Additional Member Contributions
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio) VALUES ('2026-05', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 100);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-05', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', '9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 60, 1000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-05', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', '9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 40, 500);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio) VALUES ('2026-05', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', 40);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio) VALUES ('2026-05', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', 60);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio) VALUES ('2026-05', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '8daa6b8b-ddb2-462a-9594-1738f004832f', 100);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-05', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 'b6ed11d0-6084-48d5-bda3-6971fa912e5f', 70, 2000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-05', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'b6ed11d0-6084-48d5-bda3-6971fa912e5f', 30, 0);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio) VALUES ('2026-06', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 100);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-06', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', '9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 60, 1000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-06', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', '9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 40, 500);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio) VALUES ('2026-06', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', 'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', 50);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio) VALUES ('2026-06', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', 50);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio) VALUES ('2026-06', 'e98c7634-1eb3-4e42-b062-841f39c043e0', '8daa6b8b-ddb2-462a-9594-1738f004832f', 100);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-06', 'e98c7634-1eb3-4e42-b062-841f39c043e0', 'b6ed11d0-6084-48d5-bda3-6971fa912e5f', 70, 2000);
INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('2026-06', 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', 'b6ed11d0-6084-48d5-bda3-6971fa912e5f', 30, 0);

-- Continuous Project (Internal Business)
INSERT INTO projects (id, name, yomigana, client_id, start_date, end_date, project_type) VALUES ('d8c0b5c1-1e3c-4c7b-b384-5f5a8947f631', 'パンの販売・カフェ運営', 'ぱんのはんばい・かふぇうんえい', NULL, '2026-06-01', NULL, 'ongoing');
INSERT INTO project_tasks (id, project_id, name, yomigana) VALUES ('e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 'd8c0b5c1-1e3c-4c7b-b384-5f5a8947f631', '製造業務', 'せいぞうぎょうむ');
INSERT INTO project_task_skills (task_id, skill_id) VALUES ('e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', '128b9cc4-7e82-4f3b-b2ab-94f83b1c67d3');
INSERT INTO project_task_assignees (task_id, staff_id) VALUES ('e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa');
INSERT INTO project_task_assignees (task_id, member_id) VALUES ('e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 'b362ad61-3ab9-42b3-a53c-1b77f985b85a');

INSERT INTO project_tasks (id, project_id, name, yomigana) VALUES ('1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 'd8c0b5c1-1e3c-4c7b-b384-5f5a8947f631', '販売・接客業務', 'はんばい・せっきゃくぎょうむ');
INSERT INTO project_task_skills (task_id, skill_id) VALUES ('1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', '874c9f1a-5d6b-4e2c-9a3e-781f2a5b0c9d');
INSERT INTO project_task_assignees (task_id, staff_id) VALUES ('1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 'de2d336b-254d-4af7-8e49-5acbda340e67');
INSERT INTO project_task_assignees (task_id, member_id) VALUES ('1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 'e98c7634-1eb3-4e42-b062-841f39c043e0');

-- One-off Project (Internal Business)
INSERT INTO projects (id, name, yomigana, client_id, start_date, end_date, project_type) VALUES ('b2f5d91c-1234-4567-89ab-cdef01234567', '社内業務マニュアル作成', 'しゃないぎょうむまにゅあるさくせい', NULL, '2026-07-01', '2026-08-31', 'one-off');
INSERT INTO project_tasks (id, project_id, name, yomigana) VALUES ('884d9f1a-5d6b-4e2c-9a3e-781f2a5b0c9d', 'b2f5d91c-1234-4567-89ab-cdef01234567', 'マニュアル作成', 'まにゅあるさくせい');
INSERT INTO project_task_assignees (task_id, staff_id) VALUES ('884d9f1a-5d6b-4e2c-9a3e-781f2a5b0c9d', '5ff5e55e-186f-43ce-84d2-aa751d8341b5');

-- Continuous Project (With Client)
INSERT INTO projects (id, name, yomigana, client_id, start_date, end_date, project_type) VALUES ('c1234567-89ab-cdef-0123-456789abcdef', '基幹システム保守運用', 'きかんしすてむほしゅうんよう', '73ab0c05-9915-4894-a083-6bccf7a66d2a', '2026-05-01', NULL, 'ongoing');
INSERT INTO project_tasks (id, project_id, name, yomigana) VALUES ('a1234567-89ab-cdef-0123-456789abcdef', 'c1234567-89ab-cdef-0123-456789abcdef', '保守運用業務', 'ほしゅうんようぎょうむ');
INSERT INTO project_task_assignees (task_id, staff_id) VALUES ('a1234567-89ab-cdef-0123-456789abcdef', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa');

-- Project Budgets
INSERT INTO project_budget_items (project_id, category, subject, amount) VALUES ('418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', 'revenue', '売上', 3300000);
INSERT INTO project_budget_items (project_id, category, subject, task_id, amount) VALUES ('418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', 'expense', '労務費・外注加工費', 'aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 1500000);
INSERT INTO project_budget_items (project_id, category, subject, task_id, amount) VALUES ('418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', 'expense', '労務費・外注加工費', '3334e7a8-684e-4695-a503-5cccdc2b0e50', 500000);
INSERT INTO project_budget_items (project_id, category, subject, task_id, amount) VALUES ('418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', 'expense', '労務費・外注加工費', '8daa6b8b-ddb2-462a-9594-1738f004832f', 800000);
INSERT INTO project_budget_items (project_id, category, subject, amount) VALUES ('418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', 'reserve', '工賃変動積立金', 500000);

INSERT INTO project_budget_items (project_id, category, subject, amount) VALUES ('52532aea-8f77-478e-ae37-c0ef57ee5cf5', 'revenue', '売上', 350000);
INSERT INTO project_budget_items (project_id, category, subject, task_id, amount) VALUES ('52532aea-8f77-478e-ae37-c0ef57ee5cf5', 'expense', '労務費・外注加工費', 'adc26f10-909b-4ae1-b255-a86a5014dd3d', 300000);
INSERT INTO project_budget_items (project_id, category, subject, amount) VALUES ('52532aea-8f77-478e-ae37-c0ef57ee5cf5', 'reserve', '設備等修繕維持積立金', 50000);

-- 新規サービスLP制作
INSERT INTO project_budget_items (project_id, category, subject, amount) VALUES ('a91b78c8-8047-4dad-924c-1ee58074ff78', 'revenue', '売上', 1000000);
INSERT INTO project_budget_items (project_id, category, subject, task_id, amount) VALUES ('a91b78c8-8047-4dad-924c-1ee58074ff78', 'expense', '労務費・外注加工費', '9f95bc37-68fb-43ab-99b0-49eb8d0f500e', 600000);
INSERT INTO project_budget_items (project_id, category, subject, task_id, amount) VALUES ('a91b78c8-8047-4dad-924c-1ee58074ff78', 'expense', '労務費・外注加工費', 'b6ed11d0-6084-48d5-bda3-6971fa912e5f', 400000);

-- 社内基幹システム移行
INSERT INTO project_budget_items (project_id, category, subject, amount) VALUES ('7e3a29d8-9ba7-49c1-b7a0-24e894f92098', 'revenue', '売上', 1200000);
INSERT INTO project_budget_items (project_id, category, subject, task_id, amount) VALUES ('7e3a29d8-9ba7-49c1-b7a0-24e894f92098', 'expense', '労務費・外注加工費', 'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', 1200000);

-- パンの販売・カフェ運営
INSERT INTO project_budget_items (project_id, category, subject, amount) VALUES ('d8c0b5c1-1e3c-4c7b-b384-5f5a8947f631', 'revenue', '売上', 500000);
INSERT INTO project_budget_items (project_id, category, subject, task_id, amount) VALUES ('d8c0b5c1-1e3c-4c7b-b384-5f5a8947f631', 'expense', '労務費・外注加工費', 'e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', 200000);
INSERT INTO project_budget_items (project_id, category, subject, task_id, amount) VALUES ('d8c0b5c1-1e3c-4c7b-b384-5f5a8947f631', 'expense', '労務費・外注加工費', '1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', 300000);

-- 社内業務マニュアル作成
INSERT INTO project_budget_items (project_id, category, subject, amount) VALUES ('b2f5d91c-1234-4567-89ab-cdef01234567', 'revenue', '売上', 100000);
INSERT INTO project_budget_items (project_id, category, subject, task_id, amount) VALUES ('b2f5d91c-1234-4567-89ab-cdef01234567', 'expense', '労務費・外注加工費', '884d9f1a-5d6b-4e2c-9a3e-781f2a5b0c9d', 100000);

-- 基幹システム保守運用
INSERT INTO project_budget_items (project_id, category, subject, amount) VALUES ('c1234567-89ab-cdef-0123-456789abcdef', 'revenue', '売上', 500000);
INSERT INTO project_budget_items (project_id, category, subject, task_id, amount) VALUES ('c1234567-89ab-cdef-0123-456789abcdef', 'expense', '労務費・外注加工費', 'a1234567-89ab-cdef-0123-456789abcdef', 500000);

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

-- Financial Records
INSERT INTO financial_records (period, project_id, type, subject, amount, recorded_date, recorded_by, is_limited) VALUES
('2026-06-30', '418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', 'revenue', '売上', 500000, '2026-06-30', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false),
('2026-06-30', '418efd88-75c7-4b89-8fe9-f1fb40fc3f6d', 'expense', '労務費・外注加工費', 120000, '2026-06-30', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', false);
