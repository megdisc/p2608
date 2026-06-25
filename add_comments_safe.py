import re

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    out = []
    
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

    seen_sections = {
        'EXT': False,
        'TYPE': False,
        'FUNC': False,
        'TABLE': False,
        'VIEW': False,
        'PK': False,
        'FK': False,
        'TRIG': False,
        'RLS': False,
        'GRANT': False
    }

    section_count = 1

    def add_section(name, key):
        nonlocal section_count
        if not seen_sections[key]:
            out.append(f'\n-- ==========================================\n-- {section_count}. {name}\n-- ==========================================\n\n')
            seen_sections[key] = True
            section_count += 1

    for i, line in enumerate(lines):
        stripped = line.strip()
        
        # Determine sections based on first occurrence
        if stripped.startswith('CREATE EXTENSION') and not seen_sections['EXT']:
            add_section('初期設定・拡張機能 (Config & Extensions)', 'EXT')
            
        elif stripped.startswith('CREATE TYPE') and not seen_sections['TYPE']:
            add_section('カスタム型 (Custom Types)', 'TYPE')
            
        elif (stripped.startswith('CREATE OR REPLACE FUNCTION') or stripped.startswith('CREATE FUNCTION')) and not seen_sections['FUNC']:
            add_section('関数・RPC (Functions)', 'FUNC')
            
        elif stripped.startswith('CREATE TABLE'):
            if not seen_sections['TABLE']:
                add_section('テーブル定義 (Tables)', 'TABLE')
            
            # Add table specific comment
            match = re.search(r'CREATE TABLE (IF NOT EXISTS )?"?(public)?"?\.?"?([a-zA-Z0-9_]+)"?', stripped)
            if match:
                t_name = match.group(3)
                jp_name = table_names.get(t_name, '')
                if jp_name:
                    out.append(f'-- ------------------------------------------\n-- テーブル: {t_name} ({jp_name})\n-- ------------------------------------------\n')
                else:
                    out.append(f'-- ------------------------------------------\n-- テーブル: {t_name}\n-- ------------------------------------------\n')
                    
        elif (stripped.startswith('CREATE OR REPLACE VIEW') or stripped.startswith('CREATE VIEW')) and not seen_sections['VIEW']:
            add_section('ビュー定義 (Views)', 'VIEW')
            
        elif 'ADD CONSTRAINT' in stripped and 'PRIMARY KEY' in stripped and not seen_sections['PK']:
            # The 'ADD CONSTRAINT' is often on a new line after 'ALTER TABLE', we place the header before ALTER TABLE if possible
            # But just putting it here is fine enough since we are not splitting statements.
            # Actually, to make it look clean, we can just insert it.
            add_section('主キー・制約 (Primary Keys & Constraints)', 'PK')
            
        elif 'ADD CONSTRAINT' in stripped and 'FOREIGN KEY' in stripped and not seen_sections['FK']:
            add_section('外部キー制約 (Foreign Keys)', 'FK')
            
        elif stripped.startswith('CREATE TRIGGER') and not seen_sections['TRIG']:
            add_section('トリガー (Triggers)', 'TRIG')
            
        elif stripped.startswith('CREATE POLICY') and not seen_sections['RLS']:
            add_section('RLSポリシー (Row Level Security)', 'RLS')
            
        elif stripped.startswith('GRANT ') and not seen_sections['GRANT']:
            add_section('権限付与 (Grants)', 'GRANT')
            
        out.append(line)

    out.append('\n-- ==========================================\n')
    out.append(f'-- {section_count}. 検索パスの修正 (Search Path Fix)\n')
    out.append('-- ==========================================\n')
    out.append('SET search_path = public, extensions;\n')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(out)

process_file('supabase/migrations/20260625000000_init_schema.sql')
