const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const tablesDir = path.join(__dirname, 'src', 'mock', 'tables');
const files = fs.readdirSync(tablesDir);

files.forEach(file => {
    if (!file.endsWith('.ts')) return;
    let content = fs.readFileSync(path.join(tablesDir, file), 'utf8');
    
    content = content.replace(/itemId:/g, 'item_id:');
    content = content.replace(/locationId:/g, 'location_id:');
    content = content.replace(/supplierId:/g, 'supplier_id:');
    content = content.replace(/categoryId:/g, 'category_id:');
    content = content.replace(/staffId:/g, 'staff_id:');
    content = content.replace(/contentAmount:/g, 'content_amount:');
    content = content.replace(/contentUnit:/g, 'unit_id:'); // Mocking string for now
    content = content.replace(/standardPrice:/g, 'standard_price:');
    content = content.replace(/standardPurchaseQty:/g, 'standard_purchase_qty:');
    content = content.replace(/contactPerson:/g, 'contact_person:');
    content = content.replace(/systemQty:/g, 'system_qty:');
    content = content.replace(/actualQty:/g, 'actual_qty:');
    
    // Convert string IDs to also have a code: if it's a master table or others that have code
    // Actually, I don't need to generate true UUIDs for id if I just change the type definition or just let it be strings.
    // Wait! The user approved UUID for id, and code for display. So mock data should have code: 'ING-001' and id: '<uuid>'.
    // To minimize frontend breakage right now, the components still use `id`. We need to rename `id` to `code` in mock data, and give a fake UUID to `id`.
    // But since this requires modifying all React components that use item.id, it might be better to just let `id` be string in db.ts for mock compatibility, OR properly update them.
    // The implementation plan says "Update src/types/db.ts to reflect the new UUID and code approach", which I did.
    
    fs.writeFileSync(path.join(tablesDir, file), content);
});
console.log("Replaced keys");
