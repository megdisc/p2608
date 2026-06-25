import re

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    blocks = []
    current_block = []
    in_dollar_quote = False
    
    for line in lines:
        current_block.append(line)
        count_dollars = line.count('$$')
        if count_dollars % 2 != 0:
            in_dollar_quote = not in_dollar_quote
            
        if not in_dollar_quote and line.strip().endswith(';'):
            # It's a statement boundary
            blocks.append("".join(current_block))
            current_block = []

    if current_block and "".join(current_block).strip():
        blocks.append("".join(current_block))

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

    for block in blocks:
        text = block.strip()
        if not text:
            continue
            
        # Strip leading comments for matching
        lines_no_comments = [l for l in text.split('\n') if not l.strip().startswith('--') and l.strip()]
        if not lines_no_comments:
            categories['Config'].append(block)
            continue
            
        first_line = lines_no_comments[0].strip()
        
        if first_line.startswith('SET ') or first_line.startswith('SELECT pg_catalog') or first_line.startswith('CREATE EXTENSION') or first_line.startswith('COMMENT ON SCHEMA'):
            categories['Config'].append(block)
        elif first_line.startswith('CREATE TYPE') or first_line.startswith('ALTER TYPE'):
            categories['Types'].append(block)
        elif first_line.startswith('CREATE TABLE') or (first_line.startswith('ALTER TABLE') and 'OWNER TO' in first_line):
            categories['Tables'].append(block)
        elif first_line.startswith('CREATE OR REPLACE VIEW') or first_line.startswith('CREATE VIEW') or (first_line.startswith('ALTER TABLE') and ' v_' in first_line and 'OWNER TO' in first_line) or (first_line.startswith('ALTER VIEW')):
            categories['Views'].append(block)
        elif first_line.startswith('CREATE OR REPLACE FUNCTION') or first_line.startswith('CREATE FUNCTION') or (first_line.startswith('ALTER FUNCTION')):
            categories['Functions'].append(block)
        elif 'ADD CONSTRAINT' in first_line and 'FOREIGN KEY' in first_line:
            categories['ForeignKeys'].append(block)
        elif 'ADD CONSTRAINT' in first_line or 'ALTER COLUMN' in first_line:
            categories['Constraints'].append(block)
        elif first_line.startswith('CREATE INDEX') or first_line.startswith('CREATE UNIQUE INDEX'):
            categories['Indexes'].append(block)
        elif 'TRIGGER' in first_line and ('CREATE TRIGGER' in first_line or 'CREATE OR REPLACE TRIGGER' in first_line):
            categories['Triggers'].append(block)
        elif first_line.startswith('CREATE POLICY') or 'ENABLE ROW LEVEL SECURITY' in first_line:
            categories['Policies'].append(block)
        elif first_line.startswith('GRANT') or first_line.startswith('REVOKE') or first_line.startswith('ALTER DEFAULT PRIVILEGES'):
            categories['Grants'].append(block)
        else:
            # Fallback
            categories['Config'].append(block)

    def format_table_block(block):
        lines_no_comments = [l for l in block.split('\n') if not l.strip().startswith('--') and l.strip()]
        if not lines_no_comments: return block
        first_line = lines_no_comments[0].strip()
        
        if first_line.startswith('CREATE TABLE'):
            match = re.search(r'CREATE TABLE (IF NOT EXISTS )?"?public"?\."?([a-zA-Z0-9_]+)"?', first_line)
            if match:
                t_name = match.group(2)
                jp_name = table_names.get(t_name, '')
                comment = f'\n-- ==========================================\n-- テーブル: {t_name} ({jp_name})\n-- ==========================================\n' if jp_name else f'\n-- ==========================================\n-- テーブル: {t_name}\n-- ==========================================\n'
                return comment + block.strip() + '\n'
        return block.strip() + '\n'

    final_sql = []
    
    final_sql.append('-- ==========================================')
    final_sql.append('-- 1. 初期設定・拡張機能 (Config & Extensions)')
    final_sql.append('-- ==========================================\n')
    final_sql.extend([b.strip() + '\n' for b in categories['Config']])

    if categories['Types']:
        final_sql.append('\n-- ==========================================')
        final_sql.append('-- 2. カスタム型 (Custom Types)')
        final_sql.append('-- ==========================================\n')
        final_sql.extend([b.strip() + '\n' for b in categories['Types']])

    if categories['Tables']:
        final_sql.append('\n-- ==========================================')
        final_sql.append('-- 3. テーブル定義 (Tables)')
        final_sql.append('-- ==========================================\n')
        for tb in categories['Tables']:
            final_sql.append(format_table_block(tb))

    if categories['Views']:
        final_sql.append('\n-- ==========================================')
        final_sql.append('-- 4. ビュー定義 (Views)')
        final_sql.append('-- ==========================================\n')
        final_sql.extend([b.strip() + '\n' for b in categories['Views']])

    if categories['Functions']:
        final_sql.append('\n-- ==========================================')
        final_sql.append('-- 5. 関数・RPC (Functions)')
        final_sql.append('-- ==========================================\n')
        final_sql.extend([b.strip() + '\n' for b in categories['Functions']])

    if categories['Constraints']:
        final_sql.append('\n-- ==========================================')
        final_sql.append('-- 6. 主キー・制約 (Primary Keys & Constraints)')
        final_sql.append('-- ==========================================\n')
        final_sql.extend([b.strip() + '\n' for b in categories['Constraints']])

    if categories['Indexes']:
        final_sql.append('\n-- ==========================================')
        final_sql.append('-- 7. インデックス (Indexes)')
        final_sql.append('-- ==========================================\n')
        final_sql.extend([b.strip() + '\n' for b in categories['Indexes']])

    if categories['ForeignKeys']:
        final_sql.append('\n-- ==========================================')
        final_sql.append('-- 8. 外部キー (Foreign Keys)')
        final_sql.append('-- ==========================================\n')
        final_sql.extend([b.strip() + '\n' for b in categories['ForeignKeys']])

    if categories['Triggers']:
        final_sql.append('\n-- ==========================================')
        final_sql.append('-- 9. トリガー (Triggers)')
        final_sql.append('-- ==========================================\n')
        final_sql.extend([b.strip() + '\n' for b in categories['Triggers']])

    if categories['Policies']:
        final_sql.append('\n-- ==========================================')
        final_sql.append('-- 10. RLSポリシー (Row Level Security)')
        final_sql.append('-- ==========================================\n')
        final_sql.extend([b.strip() + '\n' for b in categories['Policies']])

    if categories['Grants']:
        final_sql.append('\n-- ==========================================')
        final_sql.append('-- 11. 権限 (Grants)')
        final_sql.append('-- ==========================================\n')
        final_sql.extend([b.strip() + '\n' for b in categories['Grants']])

    final_sql.append('\n-- ==========================================')
    final_sql.append('-- 検索パスの修正 (Fix for seed.sql)')
    final_sql.append('-- ==========================================')
    final_sql.append('SET search_path = public, extensions;\n')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(final_sql))

process_file('supabase/migrations/20260625000000_init_schema.sql')
