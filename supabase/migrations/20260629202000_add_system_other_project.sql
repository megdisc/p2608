-- Create "Other" Project (System reserved)
INSERT INTO projects (id, name, yomigana, project_type, start_date)
VALUES ('00000000-0000-0000-0000-000000000001', 'その他', 'んんん', 'その他', '2000-01-01')
ON CONFLICT (id) DO NOTHING;

-- Create "Other" Task (System reserved)
INSERT INTO project_tasks (id, project_id, name, yomigana)
VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'その他', 'んんん')
ON CONFLICT (id) DO NOTHING;
