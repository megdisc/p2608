import uuid
import random

items = [
    'ea8e1145-9aa7-422d-bd46-bfb76f2024e7', # ING-001 (in LOC-001 and LOC-002)
    '1cb7bb54-98f3-4ad5-8edd-f573cea0f7b0', # ING-002
    '0e39e2fa-8c31-42c0-bf47-9f787d9f0179', # ING-003
    '6ed35b2c-48e3-44e0-b043-89cc0a0a6831', # ING-004
    '1d5f185c-3de6-4ca2-a751-053ebb5f7d73', # ING-005
    '6cc79e42-65a4-41d9-bc63-ffa796887e26', # ING-006 (in LOC-004 and LOC-005)
    'a47b9b86-c9f0-456c-afd8-b0615b6fa9d4', # ING-007
    '0ac6f5e8-5bfb-40ee-ad58-e495866ad24e'  # ING-008
]

locations = {
    'ea8e1145-9aa7-422d-bd46-bfb76f2024e7': ['4f3672e8-daf7-4ee6-a289-1b99ad9a512c', 'b5ee50db-97a6-4a16-ba0d-982cef68a39d'],
    '1cb7bb54-98f3-4ad5-8edd-f573cea0f7b0': ['4f3672e8-daf7-4ee6-a289-1b99ad9a512c'],
    '0e39e2fa-8c31-42c0-bf47-9f787d9f0179': ['0a41bdf2-7741-48f9-9215-cdcd042ca397'],
    '6ed35b2c-48e3-44e0-b043-89cc0a0a6831': ['b5ee50db-97a6-4a16-ba0d-982cef68a39d'],
    '1d5f185c-3de6-4ca2-a751-053ebb5f7d73': ['b5ee50db-97a6-4a16-ba0d-982cef68a39d'],
    '6cc79e42-65a4-41d9-bc63-ffa796887e26': ['132dc5ef-c24f-4f02-b734-15b6acb6620b', 'f15ee998-9c5c-40e2-b190-1928ebb9d82c'],
    'a47b9b86-c9f0-456c-afd8-b0615b6fa9d4': ['132dc5ef-c24f-4f02-b734-15b6acb6620b'],
    '0ac6f5e8-5bfb-40ee-ad58-e495866ad24e': ['f15ee998-9c5c-40e2-b190-1928ebb9d82c']
}

staff = ['563bb18c-8d3b-44ca-8fec-1fb32a71c8aa', 'de2d336b-254d-4af7-8e49-5acbda340e67']

stocktakings = []
transactions = []

# Generate 10 stocktakings (on May 31)
for i in range(10):
    item_id = random.choice(items)
    location_id = random.choice(locations[item_id])
    stocktakings.append({
        'id': str(uuid.uuid4()),
        'date': f"2026-05-31 {10 + i}:00",
        'item_id': item_id,
        'system_qty': random.randint(10, 50),
        'actual_qty': random.randint(10, 50),
        'difference': 0, # will calculate
        'staff_id': random.choice(staff),
        'location_id': location_id
    })

# Generate 30 transactions (on May 15 ~ June 15)
for i in range(30):
    item_id = random.choice(items)
    location_id = random.choice(locations[item_id])
    month = random.choice([5, 6])
    if month == 5:
        day = random.randint(15, 31)
    else:
        day = random.randint(1, 15)
    hour = random.randint(8, 18)
    transactions.append({
        'id': str(uuid.uuid4()),
        'date': f"2026-{month:02d}-{day:02d} {hour:02d}:00",
        'item_id': item_id,
        'type': random.choice(['受入', '払出']),
        'quantity': random.randint(1, 20),
        'location_id': location_id,
        'staff_id': random.choice(staff)
    })

with open('/home/megdisc/dev/p2608/supabase/seed.sql', 'r') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if line.startswith('-- Transactions') or line.startswith('-- Stocktakings'):
        break
    new_lines.append(line)

new_lines.append('-- Transactions\n')
for t in sorted(transactions, key=lambda x: x['date']):
    new_lines.append(f"INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('{t['id']}', '{t['date']}', '{t['item_id']}', '{t['type']}', {t['quantity']}, '{t['location_id']}', '{t['staff_id']}');\n")

new_lines.append('\n-- Stocktakings\n')
for s in sorted(stocktakings, key=lambda x: x['date']):
    s['difference'] = s['actual_qty'] - s['system_qty']
    new_lines.append(f"INSERT INTO stocktakings (id, date, item_id, system_qty, actual_qty, difference, staff_id, location_id) VALUES ('{s['id']}', '{s['date']}', '{s['item_id']}', {s['system_qty']}, {s['actual_qty']}, {s['difference']}, '{s['staff_id']}', '{s['location_id']}');\n")

with open('/home/megdisc/dev/p2608/supabase/seed.sql', 'w') as f:
    f.writelines(new_lines)

print("Generated dummy data in seed.sql")
