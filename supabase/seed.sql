-- Auth users
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) VALUES ('00000000-0000-0000-0000-000000000000', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', 'authenticated', 'authenticated', 'staff-001@example.com', '', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) VALUES ('00000000-0000-0000-0000-000000000000', 'de2d336b-254d-4af7-8e49-5acbda340e67', 'authenticated', 'authenticated', 'staff-002@example.com', '', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) VALUES ('00000000-0000-0000-0000-000000000000', '5ff5e55e-186f-43ce-84d2-aa751d8341b5', 'authenticated', 'authenticated', 'staff-003@example.com', '', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');

-- Staffs
INSERT INTO staffs (id, name, role, status) VALUES ('563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', '佐藤健', '管理者', 'active');
INSERT INTO staffs (id, name, role, status) VALUES ('de2d336b-254d-4af7-8e49-5acbda340e67', '鈴木美咲', 'スタッフ', 'active');
INSERT INTO staffs (id, name, role, status) VALUES ('5ff5e55e-186f-43ce-84d2-aa751d8341b5', '高橋大輔', 'スタッフ', 'inactive');

-- Categories
INSERT INTO categories (id, code, name, description) VALUES ('fca14a0d-8f82-4203-a761-e712fd6bbf95', 'CAT-001', '粉類', '強力粉、薄力粉、ライ麦粉など');
INSERT INTO categories (id, code, name, description) VALUES ('3e32eddf-b3d1-495a-9f0e-00e6ed06e7bb', 'CAT-002', '酵母・膨張剤', 'イースト、ベーキングパウダーなど');
INSERT INTO categories (id, code, name, description) VALUES ('d738928f-ae63-469d-8665-faff952e075e', 'CAT-003', '糖類', '上白糖、グラニュー糖、三温糖など');
INSERT INTO categories (id, code, name, description) VALUES ('04d086c7-1b60-4c3a-b96d-204300ec49ba', 'CAT-004', '調味料', '塩、スパイス類など');
INSERT INTO categories (id, code, name, description) VALUES ('ee588c63-abfa-4694-81a8-cb929e0c6fb8', 'CAT-005', '乳製品', 'バター、牛乳、チーズなど');
INSERT INTO categories (id, code, name, description) VALUES ('d8974612-313d-445c-90c9-f9b55f6c854a', 'CAT-006', '生鮮食品', '卵、生鮮フルーツ、野菜など');

-- Locations
INSERT INTO locations (id, code, name, description) VALUES ('4f3672e8-daf7-4ee6-a289-1b99ad9a512c', 'LOC-001', '倉庫A', '粉類・乾物用メイン倉庫');
INSERT INTO locations (id, code, name, description) VALUES ('b5ee50db-97a6-4a16-ba0d-982cef68a39d', 'LOC-002', '倉庫B', '調味料・糖類・包材');
INSERT INTO locations (id, code, name, description) VALUES ('0a41bdf2-7741-48f9-9215-cdcd042ca397', 'LOC-003', '冷蔵庫1', 'イースト・仕込み水用');
INSERT INTO locations (id, code, name, description) VALUES ('132dc5ef-c24f-4f02-b734-15b6acb6620b', 'LOC-004', '冷蔵庫2', '乳製品（バター・牛乳等）');
INSERT INTO locations (id, code, name, description) VALUES ('f15ee998-9c5c-40e2-b190-1928ebb9d82c', 'LOC-005', '冷蔵庫3', '生鮮食品（卵・フィリング等）');
INSERT INTO locations (id, code, name, description) VALUES ('0e833132-a18a-4f96-8ae7-cbd98727413c', 'LOC-006', '冷凍庫A', '冷凍生地・冷凍フルーツ');

-- Suppliers
INSERT INTO suppliers (id, code, name, contact_person, phone) VALUES ('97ed7a81-8160-4a50-9cfa-edf6a7d18019', 'SUP-001', '関東製菓材料卸(株)', '山田太郎', '0311110001');
INSERT INTO suppliers (id, code, name, contact_person, phone) VALUES ('f7b80af7-8479-40fe-9bce-cf36fe91d40e', 'SUP-002', '第一食材商事', '佐藤花子', '0311110002');
INSERT INTO suppliers (id, code, name, contact_person, phone) VALUES ('ff4c7a97-a5d1-44ff-b7b9-f36412c97b1e', 'SUP-003', '丸越乳業販売(株)', '鈴木一郎', '0311110003');
INSERT INTO suppliers (id, code, name, contact_person, phone) VALUES ('2faff51b-529c-486c-ba7d-4cc90d8582cc', 'SUP-004', '新鮮農産流通協同組合', '田中次郎', '0421110004');

-- Units
INSERT INTO units (id, code, name, description) VALUES ('52b63cbb-d945-4cc2-b777-813dc7c96693', '''', 'g', 'グラム（重量）');
INSERT INTO units (id, code, name, description) VALUES ('8953b541-e95b-43e3-9fef-fa2dbf2bd307', '''', 'kg', 'キログラム（重量）');
INSERT INTO units (id, code, name, description) VALUES ('ee75e3af-1166-4292-86a5-c9fd3d033a12', '''', 'ml', 'ミリリットル（容量）');
INSERT INTO units (id, code, name, description) VALUES ('a528b698-8c6b-45dd-b402-ecc70153d434', '''', 'L', 'リットル（容量）');
INSERT INTO units (id, code, name, description) VALUES ('47daa560-5ef7-45f6-b8c1-7e7d819d37e3', '''', '個', '個数');
INSERT INTO units (id, code, name, description) VALUES ('c8a31a47-c973-4bf7-9b27-468abcdd3f9a', '''', '本', '本数');
INSERT INTO units (id, code, name, description) VALUES ('b8eb92de-121d-4b47-8ddd-7d015ae08028', '''', '枚', '枚数');
INSERT INTO units (id, code, name, description) VALUES ('d23f2dd3-bcd4-4686-8656-f37ceda2ee2a', '''', '箱', '箱・ケース');
INSERT INTO units (id, code, name, description) VALUES ('08b75333-f5af-4028-b8c1-331140e4be2a', '''', '袋', '袋');
INSERT INTO units (id, code, name, description) VALUES ('13fa93ae-6e0e-4483-99ca-b53715252020', '''', 'パック', 'パック');

-- Items
INSERT INTO items (id, code, name, manufacturer, content_amount, unit_id, supplier_id, standard_price, standard_purchase_qty, category_id, location_id) VALUES ('ea8e1145-9aa7-422d-bd46-bfb76f2024e7', 'ING-001', '強力粉 (カメリヤ)', '日清製粉', 25, 'b0b9cbe1-6053-46a8-857f-aa209092b1fb', '97ed7a81-8160-4a50-9cfa-edf6a7d18019', 7500, 1, 'fca14a0d-8f82-4203-a761-e712fd6bbf95', '4f3672e8-daf7-4ee6-a289-1b99ad9a512c');
INSERT INTO items (id, code, name, manufacturer, content_amount, unit_id, supplier_id, standard_price, standard_purchase_qty, category_id, location_id) VALUES ('1cb7bb54-98f3-4ad5-8edd-f573cea0f7b0', 'ING-002', '薄力粉 (バイオレット)', '日清製粉', 25, 'b0b9cbe1-6053-46a8-857f-aa209092b1fb', '97ed7a81-8160-4a50-9cfa-edf6a7d18019', 6800, 1, 'fca14a0d-8f82-4203-a761-e712fd6bbf95', '4f3672e8-daf7-4ee6-a289-1b99ad9a512c');
INSERT INTO items (id, code, name, manufacturer, content_amount, unit_id, supplier_id, standard_price, standard_purchase_qty, category_id, location_id) VALUES ('0e39e2fa-8c31-42c0-bf47-9f787d9f0179', 'ING-003', 'ドライイースト', 'ルサッフル', 500, '36f9a9bf-f926-4327-92a1-e1b0bf12b6a8', '97ed7a81-8160-4a50-9cfa-edf6a7d18019', 1200, 10, '3e32eddf-b3d1-495a-9f0e-00e6ed06e7bb', '0a41bdf2-7741-48f9-9215-cdcd042ca397');
INSERT INTO items (id, code, name, manufacturer, content_amount, unit_id, supplier_id, standard_price, standard_purchase_qty, category_id, location_id) VALUES ('6ed35b2c-48e3-44e0-b043-89cc0a0a6831', 'ING-004', '上白糖', '三井製糖', 30, 'b0b9cbe1-6053-46a8-857f-aa209092b1fb', 'f7b80af7-8479-40fe-9bce-cf36fe91d40e', 5400, 1, 'd738928f-ae63-469d-8665-faff952e075e', 'b5ee50db-97a6-4a16-ba0d-982cef68a39d');
INSERT INTO items (id, code, name, manufacturer, content_amount, unit_id, supplier_id, standard_price, standard_purchase_qty, category_id, location_id) VALUES ('1d5f185c-3de6-4ca2-a751-053ebb5f7d73', 'ING-005', '粗塩', '伯方塩業', 5, 'b0b9cbe1-6053-46a8-857f-aa209092b1fb', 'f7b80af7-8479-40fe-9bce-cf36fe91d40e', 850, 2, '04d086c7-1b60-4c3a-b96d-204300ec49ba', 'b5ee50db-97a6-4a16-ba0d-982cef68a39d');
INSERT INTO items (id, code, name, manufacturer, content_amount, unit_id, supplier_id, standard_price, standard_purchase_qty, category_id, location_id) VALUES ('6cc79e42-65a4-41d9-bc63-ffa796887e26', 'ING-006', '無塩バター', 'よつ葉乳業', 450, '36f9a9bf-f926-4327-92a1-e1b0bf12b6a8', 'ff4c7a97-a5d1-44ff-b7b9-f36412c97b1e', 950, 30, 'ee588c63-abfa-4694-81a8-cb929e0c6fb8', '132dc5ef-c24f-4f02-b734-15b6acb6620b');
INSERT INTO items (id, code, name, manufacturer, content_amount, unit_id, supplier_id, standard_price, standard_purchase_qty, category_id, location_id) VALUES ('a47b9b86-c9f0-456c-afd8-b0615b6fa9d4', 'ING-007', '牛乳 (業務用)', '明治', 1000, '16e5759f-3ad1-4ecd-8197-0ba6ff3ac678', 'ff4c7a97-a5d1-44ff-b7b9-f36412c97b1e', 280, 12, 'ee588c63-abfa-4694-81a8-cb929e0c6fb8', '132dc5ef-c24f-4f02-b734-15b6acb6620b');
INSERT INTO items (id, code, name, manufacturer, content_amount, unit_id, supplier_id, standard_price, standard_purchase_qty, category_id, location_id) VALUES ('0ac6f5e8-5bfb-40ee-ad58-e495866ad24e', 'ING-008', '鶏卵 (Lサイズ)', 'JA全農', 10, 'b0b9cbe1-6053-46a8-857f-aa209092b1fb', '2faff51b-529c-486c-ba7d-4cc90d8582cc', 3200, 2, 'd8974612-313d-445c-90c9-f9b55f6c854a', 'f15ee998-9c5c-40e2-b190-1928ebb9d82c');

-- Inventories
INSERT INTO inventories (id, item_id, location_id, quantity) VALUES ('59919801-653e-4897-92e7-6a773563f8ff', 'ea8e1145-9aa7-422d-bd46-bfb76f2024e7', '4f3672e8-daf7-4ee6-a289-1b99ad9a512c', 10);
INSERT INTO inventories (id, item_id, location_id, quantity) VALUES ('42d9bc4d-e83e-4a7b-b11a-b49ff83b006a', 'ea8e1145-9aa7-422d-bd46-bfb76f2024e7', 'b5ee50db-97a6-4a16-ba0d-982cef68a39d', 2);
INSERT INTO inventories (id, item_id, location_id, quantity) VALUES ('3c991d55-daca-464e-a1e9-dbccdaeec532', '1cb7bb54-98f3-4ad5-8edd-f573cea0f7b0', '4f3672e8-daf7-4ee6-a289-1b99ad9a512c', 5);
INSERT INTO inventories (id, item_id, location_id, quantity) VALUES ('a51a12c4-89c0-4130-b2c0-e23d6d359637', '0e39e2fa-8c31-42c0-bf47-9f787d9f0179', '0a41bdf2-7741-48f9-9215-cdcd042ca397', 20);
INSERT INTO inventories (id, item_id, location_id, quantity) VALUES ('61a7363f-e69b-43b7-8d02-f3a87bd3b5c2', '6ed35b2c-48e3-44e0-b043-89cc0a0a6831', 'b5ee50db-97a6-4a16-ba0d-982cef68a39d', 3);
INSERT INTO inventories (id, item_id, location_id, quantity) VALUES ('353019bd-a237-45f3-a431-60eb9f662f09', '1d5f185c-3de6-4ca2-a751-053ebb5f7d73', 'b5ee50db-97a6-4a16-ba0d-982cef68a39d', 8);
INSERT INTO inventories (id, item_id, location_id, quantity) VALUES ('5feabf2c-f9c0-434c-af84-46c1d1043003', '6cc79e42-65a4-41d9-bc63-ffa796887e26', '132dc5ef-c24f-4f02-b734-15b6acb6620b', 30);
INSERT INTO inventories (id, item_id, location_id, quantity) VALUES ('b6abe9da-e7cf-435e-b59d-0900d7f84638', '6cc79e42-65a4-41d9-bc63-ffa796887e26', 'f15ee998-9c5c-40e2-b190-1928ebb9d82c', 10);
INSERT INTO inventories (id, item_id, location_id, quantity) VALUES ('fe8e886b-8cff-42c3-b380-3704e30659ef', 'a47b9b86-c9f0-456c-afd8-b0615b6fa9d4', '132dc5ef-c24f-4f02-b734-15b6acb6620b', 24);
INSERT INTO inventories (id, item_id, location_id, quantity) VALUES ('ed04d5be-9298-48e3-b3e2-cbcc8a99adbd', '0ac6f5e8-5bfb-40ee-ad58-e495866ad24e', 'f15ee998-9c5c-40e2-b190-1928ebb9d82c', 4);

-- Transactions
INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('1f3b09db-1426-4d7c-b9d9-b72f0785b8c5', '2026-06-01 08:30', 'ea8e1145-9aa7-422d-bd46-bfb76f2024e7', '受入', 10, '4f3672e8-daf7-4ee6-a289-1b99ad9a512c', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa');
INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('cc31855b-eae8-4261-8a73-016ec14fd92e', '2026-06-01 09:15', '0e39e2fa-8c31-42c0-bf47-9f787d9f0179', '払出', 1, '0a41bdf2-7741-48f9-9215-cdcd042ca397', 'de2d336b-254d-4af7-8e49-5acbda340e67');
INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('2bbbf5b9-7c1c-4623-9657-280b4b5313f7', '2026-06-01 10:00', '6cc79e42-65a4-41d9-bc63-ffa796887e26', '払出', 2, '132dc5ef-c24f-4f02-b734-15b6acb6620b', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa');
INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('5377c01d-f552-43c7-8dcf-680047173af4', '2026-06-01 11:30', 'a47b9b86-c9f0-456c-afd8-b0615b6fa9d4', '受入', 12, '132dc5ef-c24f-4f02-b734-15b6acb6620b', 'de2d336b-254d-4af7-8e49-5acbda340e67');
INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('611ea8b0-1a34-458a-ad70-df9364e16d03', '2026-06-01 13:45', '0ac6f5e8-5bfb-40ee-ad58-e495866ad24e', '受入', 2, 'f15ee998-9c5c-40e2-b190-1928ebb9d82c', '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa');

-- Stocktakings
INSERT INTO stocktakings (id, date, item_id, system_qty, actual_qty, difference, staff_id, location_id) VALUES ('b19f193a-116a-4f48-9dec-fc6f1809cd90', '2026-05-31 18:00', 'ea8e1145-9aa7-422d-bd46-bfb76f2024e7', 12, 12, 0, '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', '4f3672e8-daf7-4ee6-a289-1b99ad9a512c');
INSERT INTO stocktakings (id, date, item_id, system_qty, actual_qty, difference, staff_id, location_id) VALUES ('accea02f-191b-47c9-b010-bd494adddcb7', '2026-05-31 18:15', '0e39e2fa-8c31-42c0-bf47-9f787d9f0179', 21, 20, -1, '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', '0a41bdf2-7741-48f9-9215-cdcd042ca397');
INSERT INTO stocktakings (id, date, item_id, system_qty, actual_qty, difference, staff_id, location_id) VALUES ('ac8c3f6d-fa62-4baf-89d3-b5094083660b', '2026-05-31 18:30', '6cc79e42-65a4-41d9-bc63-ffa796887e26', 40, 42, 2, 'de2d336b-254d-4af7-8e49-5acbda340e67', '132dc5ef-c24f-4f02-b734-15b6acb6620b');
INSERT INTO stocktakings (id, date, item_id, system_qty, actual_qty, difference, staff_id, location_id) VALUES ('26dfdc70-9811-43d8-8dc8-576dd2781637', '2026-05-31 18:45', '6ed35b2c-48e3-44e0-b043-89cc0a0a6831', 3, 3, 0, 'de2d336b-254d-4af7-8e49-5acbda340e67', 'b5ee50db-97a6-4a16-ba0d-982cef68a39d');
