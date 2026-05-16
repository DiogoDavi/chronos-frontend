// import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = 'https://gndfhfovqdhjpkrhwwck.supabase.co';
// const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduZGZoZm92cWRoanBrcmh3d2NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MDAxNjUsImV4cCI6MjA4ODQ3NjE2NX0.-smJ7gNSp7min8QU5GqUHUj_2PdVxRECVBbNRDhYi8U';

// export const supabase = createClient(supabaseUrl, supabaseKey);

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error("❌ Variáveis do Supabase não definidas no .env");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
