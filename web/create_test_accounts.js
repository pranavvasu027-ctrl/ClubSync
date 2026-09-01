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

async function createOwner() {
    const email = 'pranavvasu.027@gmail.com';
    const password = '123456';
    console.log(`🚀 Linking profile for Owner user: ${email}...`);

    // The user was successfully created in the previous step, so we just log in
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (authError) {
        console.error(`❌ Failed to login: ${authError.message}`);
        return;
    }

    const authUserId = authData?.user?.id;
    if (authUserId) {
        console.log(`✅ Logged in successfully (${authUserId})`);

        // 2. Insert into public.users without college_name
        const { error: insertError } = await supabase
            .from('users')
            .upsert({
                auth_user_id: authUserId,
                email: email,
                name: 'Pranav vasu',
                user_type: 'SUPER_ADMIN',
                college_id: 'VIT_PUNE',
                prn_or_roll: '1',
                branch: 'Computer Engineering',
                phone: '9307663768'
            }, { onConflict: 'email' });

        if (insertError) {
            console.error(`⚠️ Failed to create profile: ${insertError.message}`);
        } else {
            console.log(`🔗 Successfully created live profile for Owner!`);
        }
    }
}

createOwner();
