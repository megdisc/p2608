-- Delete existing surplus records
DELETE FROM project_budget_items WHERE category = 'surplus';

-- Recreate enum without 'surplus'
ALTER TYPE budget_category RENAME TO budget_category_old;
CREATE TYPE budget_category AS ENUM ('revenue', 'expense', 'reserve');
ALTER TABLE project_budget_items ALTER COLUMN category TYPE budget_category USING category::text::budget_category;
DROP TYPE budget_category_old;
