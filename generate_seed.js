const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const tablesDir = path.join(__dirname, 'src', 'mock', 'tables');

function getMockData(fileName) {
    const filePath = path.join(tablesDir, fileName);
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/import.*?;\n/g, ''); // remove imports
    content = content.replace(/export const \w+:\s*.*?\[/s, '['); // strip export declaration
    content = content.replace(/;\s*$/, ''); // strip trailing semicolon
    
    // Some keys might not be quoted, but eval handles that
    let obj;
    try {
        obj = eval('(' + content + ')');
    } catch (e) {
        console.error("Error evaluating " + fileName, e);
        process.exit(1);
    }
    return obj;
}

const staffs = getMockData('staff.ts');
const categories = getMockData('category.ts');
const locations = getMockData('location.ts');
const suppliers = getMockData('supplier.ts');
const units = getMockData('unit.ts');
const items = getMockData('master.ts');
const inventories = getMockData('inventory.ts');
const transactions = getMockData('transaction.ts');
const stocktakings = getMockData('stocktaking.ts');

const idMap = {};
function getUuid(oldId) {
    if (!oldId) return null;
    if (!idMap[oldId]) {
        idMap[oldId] = crypto.randomUUID();
    }
    return idMap[oldId];
}

let sql = '';
function escapeSql(str) {
    if (str === null || str === undefined) return 'NULL';
    if (typeof str === 'number') return str.toString();
    return "'" + str.toString().replace(/'/g, "''") + "'";
}

// 1. users (for staffs)
sql += '-- Auth users\n';
staffs.forEach(s => {
    const uuid = getUuid(s.id);
    const email = `\${s.id.toLowerCase()}@example.com`;
    sql += `INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) VALUES ('00000000-0000-0000-0000-000000000000', '${uuid}', 'authenticated', 'authenticated', '${email}', '', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');\n`;
});

sql += '\n-- Staffs\n';
staffs.forEach(s => {
    sql += `INSERT INTO staffs (id, name, role, status) VALUES ('${getUuid(s.id)}', ${escapeSql(s.name)}, ${escapeSql(s.role)}, ${escapeSql(s.status)});\n`;
});

sql += '\n-- Categories\n';
categories.forEach(c => {
    sql += `INSERT INTO categories (id, code, name, description) VALUES ('${getUuid(c.id)}', ${escapeSql(c.code)}, ${escapeSql(c.name)}, ${escapeSql(c.description)});\n`;
});

sql += '\n-- Locations\n';
locations.forEach(l => {
    sql += `INSERT INTO locations (id, code, name, description) VALUES ('${getUuid(l.id)}', ${escapeSql(l.code)}, ${escapeSql(l.name)}, ${escapeSql(l.description)});\n`;
});

sql += '\n-- Suppliers\n';
suppliers.forEach(s => {
    sql += `INSERT INTO suppliers (id, code, name, contact_person, phone) VALUES ('${getUuid(s.id)}', ${escapeSql(s.code)}, ${escapeSql(s.name)}, ${escapeSql(s.contact_person)}, ${escapeSql(s.phone)});\n`;
});

sql += '\n-- Units\n';
units.forEach(u => {
    sql += `INSERT INTO units (id, code, name, description) VALUES ('${getUuid(u.id)}', ${escapeSql(u.code)}, ${escapeSql(u.name)}, ${escapeSql(u.description)});\n`;
});

sql += '\n-- Items\n';
items.forEach(i => {
    sql += `INSERT INTO items (id, code, name, manufacturer, content_amount, unit_id, supplier_id, standard_price, standard_purchase_qty, category_id, location_id) VALUES ('${getUuid(i.id)}', ${escapeSql(i.code)}, ${escapeSql(i.name)}, ${escapeSql(i.manufacturer)}, ${i.content_amount}, '${getUuid(i.unit_id)}', '${getUuid(i.supplier_id)}', ${i.standard_price}, ${i.standard_purchase_qty}, '${getUuid(i.category_id)}', '${getUuid(i.location_id)}');\n`;
});

sql += '\n-- Inventories\n';
inventories.forEach(i => {
    sql += `INSERT INTO inventories (id, item_id, location_id, quantity) VALUES ('${crypto.randomUUID()}', '${getUuid(i.item_id)}', '${getUuid(i.location_id)}', ${i.quantity});\n`;
});

sql += '\n-- Transactions\n';
transactions.forEach(t => {
    sql += `INSERT INTO transactions (id, date, item_id, type, quantity, location_id, staff_id) VALUES ('${crypto.randomUUID()}', ${escapeSql(t.date)}, '${getUuid(t.item_id)}', ${escapeSql(t.type)}, ${t.quantity}, '${getUuid(t.location_id)}', '${getUuid(t.staff_id)}');\n`;
});

sql += '\n-- Stocktakings\n';
stocktakings.forEach(s => {
    sql += `INSERT INTO stocktakings (id, date, item_id, system_qty, actual_qty, difference, staff_id, location_id) VALUES ('${crypto.randomUUID()}', ${escapeSql(s.date)}, '${getUuid(s.item_id)}', ${s.system_qty}, ${s.actual_qty}, ${s.difference}, '${getUuid(s.staff_id)}', '${getUuid(s.location_id)}');\n`;
});

fs.writeFileSync(path.join(__dirname, 'supabase', 'seed.sql'), sql);
console.log('Seed generated!');
