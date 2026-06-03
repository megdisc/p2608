import { createClient } from '@supabase/supabase-js';

const supabase = createClient('http://127.0.0.1:54321', 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH');

async function test() {
  const { data: masters } = await supabase.from('items').select('id, name');
  const { data: locations } = await supabase.from('locations').select('id, name');
  const { data: staffs } = await supabase.from('staffs').select('id, name');

  console.log("Masters:", masters);

  const inserts = [{
    date: new Date().toISOString(),
    item_id: masters[0].id,
    type: '受入',
    quantity: 1,
    location_id: locations[0].id,
    staff_id: staffs[0].id
  }];

  const { data, error } = await supabase.from('transactions').insert(inserts);
  console.log("Error:", error);
  console.log("Data:", data);
}

test();
