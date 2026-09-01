import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length) {
        env[key.trim()] = values.join('=').trim().replace(/['"]/g, '');
    }
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function manualUpdates() {
    console.log(`🚀 Updating P27 name...`);
    const { error: p27Error } = await supabase
        .from('users')
        .update({ name: 'P27' })
        .eq('email', 'pranavvasu.027@gmail.com');
    if (p27Error) console.log(`❌ P27 Update failed:`, p27Error.message);
    else console.log(`✅ Name updated to P27 for pranavvasu.027@gmail.com`);

    // Link the Google account (we don't know the exact auth_id from here because Anon key can't query auth.users,
    // so we'll just insert the profile data and they can manually link the auth_id in the Table Editor)
    console.log(`\n🚀 Setting up PRANAV VASU (pranav.1251070582@vit.edu) as STUDENT...`);
    const { error: googleError } = await supabase
        .from('users')
        .upsert({
            email: 'pranav.1251070582@vit.edu',
            name: 'PRANAV VASU',
            user_type: 'STUDENT',
            college_id: 'VIT_PUNE',
            prn_or_roll: '15',
            branch: 'Computer Engineering',
            phone: '9307663768'
        }, { onConflict: 'email' });
        
    if (googleError) console.log(`❌ Failed to setup Google user:`, googleError.message);
    else console.log(`✅ Profile created for pranav.1251070582@vit.edu (STUDENT)`);
    
    console.log(`\n⚠️ Note: For the Google account, you need to copy its UID from the Authentication page and paste it into the 'auth_user_id' column in the Table Editor!`);
}

manualUpdates();
