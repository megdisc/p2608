import re

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split into blocks. Usually statements are separated by double or triple newlines.
    # We will split by \n\n but be careful about strings. Actually, simple regex matching is safer.
    blocks = re.split(r'\n\n+', content.strip())
    
    categories = {
        'Config': [],
        'Types': [],
        'Tables': [],
        'Views': [],
        'Functions': [],
        'Constraints': [],
        'ForeignKeys': [],
        'Indexes': [],
        'Triggers': [],
        'Policies': [],
        'Grants': []
    }

    table_names = {
        'categories': 'カテゴリ',
        'clients': '顧客',
        'daily_work_records': '日次作業記録',
        'items': '品目・在庫品',
        'locations': '保管場所',
        'members': '利用者',
        'monthly_member_contributions': '月次利用者貢献度',
        'monthly_task_progress': '月次タスク進捗',
        'project_budget_items': '案件予算項目',
        'project_task_assignees': 'タスク担当者',
        'project_task_skills': 'タスク要求スキル',
        'project_tasks': '案件タスク',
        'projects': '案件',
        'skills': 'スキル',
        'staffs': '職員',
        'stocktakings': '棚卸記録',
        'suppliers': '仕入先',
        'transactions': '入出庫履歴'
    }

    # Group the blocks
    for block in blocks:
        block = block.strip()
        if not block: continue

        if block.startswith('SET ') or block.startswith('SELECT pg_catalog') or block.startswith('CREATE EXTENSION') or block.startswith('COMMENT ON SCHEMA'):
            categories['Config'].append(block)
        elif block.startswith('CREATE TYPE'):
            categories['Types'].append(block)
        elif block.startswith('CREATE TABLE') or block.startswith('ALTER TABLE') and 'OWNER TO' in block:
            categories['Tables'].append(block)
        elif block.startswith('CREATE OR REPLACE VIEW') or block.startswith('CREATE VIEW'):
            categories['Views'].append(block)
        elif block.startswith('CREATE OR REPLACE FUNCTION') or block.startswith('CREATE FUNCTION'):
            categories['Functions'].append(block)
        elif 'ADD CONSTRAINT' in block and 'FOREIGN KEY' in block:
            categories['ForeignKeys'].append(block)
        elif 'ADD CONSTRAINT' in block:
            categories['Constraints'].append(block)
        elif block.startswith('CREATE INDEX') or block.startswith('CREATE UNIQUE INDEX'):
            categories['Indexes'].append(block)
        elif 'TRIGGER' in block and ('CREATE TRIGGER' in block or 'CREATE OR REPLACE TRIGGER' in block):
            categories['Triggers'].append(block)
        elif block.startswith('CREATE POLICY') or 'ENABLE ROW LEVEL SECURITY' in block:
            categories['Policies'].append(block)
        elif block.startswith('GRANT') or block.startswith('REVOKE') or block.startswith('ALTER DEFAULT PRIVILEGES'):
            categories['Grants'].append(block)
        else:
            # Fallback
            categories['Config'].append(block)

    # Function to add comment to a table
    def format_table_block(block):
        if block.startswith('CREATE TABLE'):
            match = re.search(r'CREATE TABLE (IF NOT EXISTS )?"?public"?\."?([a-zA-Z0-9_]+)"?', block)
            if match:
                t_name = match.group(2)
                jp_name = table_names.get(t_name, '')
                comment = f'-- ==========================================\n-- テーブル: {t_name} ({jp_name})\n-- ==========================================\n' if jp_name else f'-- ==========================================\n-- テーブル: {t_name}\n-- ==========================================\n'
                return comment + block
        return block

    # Compile the final SQL
    final_sql = []
    
    final_sql.append('-- ==========================================')
    final_sql.append('-- 1. 初期設定・拡張機能 (Config & Extensions)')
    final_sql.append('-- ==========================================')
    final_sql.extend(categories['Config'])
    final_sql.append('\n')

    if categories['Types']:
        final_sql.append('-- ==========================================')
        final_sql.append('-- 2. カスタム型 (Custom Types)')
        final_sql.append('-- ==========================================')
        final_sql.extend(categories['Types'])
        final_sql.append('\n')

    if categories['Functions']:
        final_sql.append('-- ==========================================')
        final_sql.append('-- 3. 関数・RPC (Functions)')
        final_sql.append('-- ==========================================')
        final_sql.extend(categories['Functions'])
        final_sql.append('\n')

    if categories['Tables']:
        final_sql.append('-- ==========================================')
        final_sql.append('-- 4. テーブル定義 (Tables)')
        final_sql.append('-- ==========================================')
        for tb in categories['Tables']:
            final_sql.append(format_table_block(tb))
        final_sql.append('\n')

    if categories['Views']:
        final_sql.append('-- ==========================================')
        final_sql.append('-- 5. ビュー定義 (Views)')
        final_sql.append('-- ==========================================')
        final_sql.extend(categories['Views'])
        final_sql.append('\n')

    if categories['Constraints']:
        final_sql.append('-- ==========================================')
        final_sql.append('-- 6. 主キー・制約 (Primary Keys & Constraints)')
        final_sql.append('-- ==========================================')
        final_sql.extend(categories['Constraints'])
        final_sql.append('\n')

    if categories['Indexes']:
        final_sql.append('-- ==========================================')
        final_sql.append('-- 7. インデックス (Indexes)')
        final_sql.append('-- ==========================================')
        final_sql.extend(categories['Indexes'])
        final_sql.append('\n')

    if categories['ForeignKeys']:
        final_sql.append('-- ==========================================')
        final_sql.append('-- 8. 外部キー (Foreign Keys)')
        final_sql.append('-- ==========================================')
        final_sql.extend(categories['ForeignKeys'])
        final_sql.append('\n')

    if categories['Triggers']:
        final_sql.append('-- ==========================================')
        final_sql.append('-- 9. トリガー (Triggers)')
        final_sql.append('-- ==========================================')
        final_sql.extend(categories['Triggers'])
        final_sql.append('\n')

    if categories['Policies']:
        final_sql.append('-- ==========================================')
        final_sql.append('-- 10. RLSポリシー (Row Level Security)')
        final_sql.append('-- ==========================================')
        final_sql.extend(categories['Policies'])
        final_sql.append('\n')

    if categories['Grants']:
        final_sql.append('-- ==========================================')
        final_sql.append('-- 11. 権限 (Grants)')
        final_sql.append('-- ==========================================')
        final_sql.extend(categories['Grants'])
        final_sql.append('\n')

    # Important: append the search_path fix at the very end
    final_sql.append('-- ==========================================')
    final_sql.append('-- 検索パスの修正 (Fix for seed.sql)')
    final_sql.append('-- ==========================================')
    final_sql.append('SET search_path = public, extensions;')
    final_sql.append('\n')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write('\n\n'.join(final_sql))

process_file('supabase/migrations/20260625000000_init_schema.sql')
