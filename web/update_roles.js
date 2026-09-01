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

// Fix all roles to match exact casing the RoleRouter expects (lowercase match)
const roleUpdates = [
    // Owner
    { email: 'pranavvasu.027@gmail.com', role: 'Owner' },
    // Faculty
    { email: 'pranavnankade@gamil.com', role: 'Faculty' },
    // President
    { email: 'atharvadhokane1@gmail.com', role: 'President' },
    // Executives
    { email: 'bhalakshvairagkar@gamil.com', role: 'Executive' },
    { email: 'shubhamy3419@gmail.com', role: 'Executive' },
    { email: 'waghsanchit52@gmail.com', role: 'Executive' },
    // Secretaries
    { email: 'dipakvasu080@gamil.com', role: 'Secretary' },
    { email: 'pranavvasu.271@gmail.com', role: 'Secretary' },
    { email: 'samikshavasu70@gmail.com', role: 'Secretary' },
    // Co-ordinators
    { email: 'maddddd.124@gmail.com', role: 'Co-ordinator' },
    { email: 'editeam876@gmail.com', role: 'Co-ordinator' },
    { email: 'edit.project.team@gmail.com', role: 'Co-ordinator' },
    // Users
    { email: 'sayyeduzair4252@gmail.com', role: 'User' },
    { email: 'vedantlende5@gmail.com', role: 'User' },
    { email: 'pranav.1251070582@gmail.com', role: 'User' },
    { email: 'pranav.1251070582@vit.edu', role: 'User' },
];

async function fixAllRoles() {
    console.log('🚀 Standardizing all user_type values...\n');

    for (const u of roleUpdates) {
        const { error } = await supabase
            .from('users')
            .update({ user_type: u.role })
            .eq('email', u.email);

        if (error) {
            console.error(`❌ ${u.email}: ${error.message}`);
        } else {
            console.log(`✅ ${u.email} -> ${u.role}`);
        }
    }

    console.log('\n📋 Final verification:');
    const { data } = await supabase.from('users').select('name, email, user_type').order('user_type');
    console.table(data);
}

fixAllRoles();
