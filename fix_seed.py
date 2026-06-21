import re

with open('supabase/seed.sql', 'r') as f:
    content = f.read()

# We want to replace spaces (both half and full-width) inside the single quotes of INSERT INTO statements
# specifically for names.

# Actually, we can just replace ' ' and '　' in lines starting with INSERT INTO staffs, members, clients
lines = content.split('\n')
for i, line in enumerate(lines):
    if line.startswith("INSERT INTO staffs") or line.startswith("INSERT INTO members"):
        # For staffs/members, we want to remove spaces from name and yomigana (index 1 and 2 in values)
        # e.g. VALUES ('id', '相澤 翔太', 'あいざわ しょうた', ...)
        parts = line.split("VALUES (")
        if len(parts) == 2:
            prefix = parts[0] + "VALUES ("
            # simple regex to find string literals:
            literals = re.findall(r"'[^']*'", parts[1])
            # name is literals[1], yomigana is literals[2]
            literals[1] = literals[1].replace(' ', '').replace('　', '')
            literals[2] = literals[2].replace(' ', '').replace('　', '')
            
            # replace in parts[1]
            # Since we only modify the second and third literal, let's just do it cleanly
            new_vals = parts[1]
            for j, lit in enumerate(re.findall(r"'[^']*'", parts[1])):
                if j in [1, 2]:
                    new_lit = lit.replace(' ', '').replace('　', '')
                    new_vals = new_vals.replace(lit, new_lit, 1)
            lines[i] = prefix + new_vals

    elif line.startswith("INSERT INTO clients"):
        parts = line.split("VALUES (")
        if len(parts) == 2:
            prefix = parts[0] + "VALUES ("
            literals = re.findall(r"'[^']*'", parts[1])
            # For clients, contact_person is literals[3]
            literals[3] = literals[3].replace(' ', '').replace('　', '')
            
            new_vals = parts[1]
            for j, lit in enumerate(re.findall(r"'[^']*'", parts[1])):
                if j == 3:
                    new_lit = lit.replace(' ', '').replace('　', '')
                    new_vals = new_vals.replace(lit, new_lit, 1)
            lines[i] = prefix + new_vals

with open('supabase/seed.sql', 'w') as f:
    f.write('\n'.join(lines))
