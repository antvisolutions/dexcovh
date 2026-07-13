import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ifdxilrqamdpxxqtgyup.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmZHhpbHJxYW1kcHh4cXRneXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MjI2ODUsImV4cCI6MjA4Nzk5ODY4NX0.sbtEotWEh-mKlbTF5sP4FfDpKgR19t4dnckjSW6eHRc';

export const supabase = createClient(supabaseUrl, supabaseKey);
