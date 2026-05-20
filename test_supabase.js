import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://fugcvuuoevmdlrejefxw.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1Z2N2dXVvZXZtZGxyZWplZnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MjQ1ODAsImV4cCI6MjA5NDUwMDU4MH0.jIr_ExRqC4sgIf_y9N4mZGV39USsWHECaXZ2N8vTRFU');

async function test() {
  const { data, error } = await supabase.from('family_updates').select('*');
  console.log('Select Result:', { data, error });
  
  const { data: iData, error: iError } = await supabase.from('family_updates').insert([{
    author_name: 'Test Bot',
    content: 'Testing insert',
    is_icon: true
  }]);
  console.log('Insert Result:', { iData, iError });
}
test();
