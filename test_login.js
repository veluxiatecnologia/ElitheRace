const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qzsimgtlhaebdtljyozt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6c2ltZ3RsaGFlYmR0bGp5b3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NDg2OTAsImV4cCI6MjA3OTMyNDY5MH0.BmpdtrReuRkAo6QzZB4aSrFWbdVaWePz8WdhlAPD-d0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
    console.log('Testing login for macarrao.alexandre17@gmail.com...\n');

    // First, sign out to ensure clean state
    await supabase.auth.signOut();

    // Try to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'macarrao.alexandre17@gmail.com',
        password: 'password123' // You'll need to use the correct password
    });

    if (error) {
        console.error('❌ Login failed:', error.message);
        console.log('\nPlease provide the correct password for this account.');
        return;
    }

    console.log('✅ Login successful!\n');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
    console.log('User Metadata:', JSON.stringify(data.user.user_metadata, null, 2));
    console.log('\nRole from user_metadata:', data.user.user_metadata?.role);

    if (data.user.user_metadata?.role === 'admin') {
        console.log('\n✅ User is correctly set as ADMIN');
    } else {
        console.log('\n❌ User role is NOT admin. Current role:', data.user.user_metadata?.role || 'undefined');
    }
}

testLogin();
