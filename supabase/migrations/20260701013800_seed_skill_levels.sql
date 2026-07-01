INSERT INTO public.skill_levels (id, name, description, created_at, updated_at)
VALUES 
    (gen_random_uuid(), '初級', '基本的な作業が行えるレベル', now(), now()),
    (gen_random_uuid(), '中級', 'ある程度の経験があり、自律して作業が行えるレベル', now(), now()),
    (gen_random_uuid(), '上級', '豊富な経験があり、他者の指導や高度な判断が行えるレベル', now(), now())
ON CONFLICT DO NOTHING;
