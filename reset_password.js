const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qzsimgtlhaebdtljyozt.supabase.co';
// Using anon key - we'll send a password reset email
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6c2ltZ3RsaGFlYmR0bGp5b3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NDg2OTAsImV4cCI6MjA3OTMyNDY5MH0.BmpdtrReuRkAo6QzZB4aSrFWbdVaWePz8WdhlAPD-d0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetPassword() {
    console.log('Sending password reset email to macarrao.alexandre17@gmail.com...\n');

    const { data, error } = await supabase.auth.resetPasswordForEmail(
        'macarrao.alexandre17@gmail.com',
        {
            redirectTo: 'http://localhost:5173/reset-password',
        }
    );

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    console.log('✅ Password reset email sent!');
    console.log('\nCheck your email inbox for the reset link.');
    console.log('Note: If you don\'t have email configured in Supabase, this won\'t work.');
    console.log('\nAlternative: Use the Supabase Dashboard to reset the password manually:');
    console.log('1. Go to https://supabase.com/dashboard/project/qzsimgtlhaebdtljyozt/auth/users');
    console.log('2. Find macarrao.alexandre17@gmail.com');
    console.log('3. Click the three dots menu');
    console.log('4. Select "Reset Password"');
}

resetPassword();
