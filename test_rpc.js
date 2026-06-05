import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data: masters } = await supabase.from('items').select('id, name, location:locations(name)').eq('is_deleted', false);
  console.log("masters:", masters);

  const { data: locations } = await supabase.from('locations').select('id, name').eq('is_deleted', false);
  console.log("locations:", locations);

  if (masters && masters.length > 0 && locations && locations.length > 0) {
    const item = masters[0];
    const location = locations.find(l => l.name === item.location?.name) || locations[0];
    
    console.log("testing rpc with:", item.id, location.id);
    const { data, error } = await supabase.rpc('calculate_book_inventory', {
      p_item_id: item.id,
      p_location_id: location.id,
      p_target_date: new Date().toISOString()
    });
    console.log("result:", data, "error:", error);
  }
}
test();
