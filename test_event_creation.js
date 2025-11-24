const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qzsimgtlhaebdtljyozt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6c2ltZ3RsaGFlYmR0bGp5b3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NDg2OTAsImV4cCI6MjA3OTMyNDY5MH0.BmpdtrReuRkAo6QzZB4aSrFWbdVaWePz8WdhlAPD-d0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEventCreation() {
    console.log('Testing event creation without banner...\n');

    // Login first
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'macarrao.alexandre17@gmail.com',
        password: 'Admin@123'
    });

    if (authError) {
        console.error('❌ Login failed:', authError.message);
        return;
    }

    console.log('✅ Logged in successfully');
    const token = authData.session.access_token;

    // Try to create event via API
    const eventData = {
        nome: 'Teste API Direto',
        data: '2025-12-30',
        destino: 'Cidade Teste',
        link_maps_destino: '',
        link_inscricao: '',
        observacoes: 'Teste',
        pedagios: '',
        banner_url: '',
        pes: [
            {
                nome_pe: 'PE Teste',
                horario_pe: '08:00',
                link_maps_pe: ''
            }
        ]
    };

    console.log('\nSending event data:', JSON.stringify(eventData, null, 2));

    try {
        const response = await fetch('http://localhost:3000/api/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(eventData)
        });

        const responseText = await response.text();
        console.log('\nResponse status:', response.status);
        console.log('Response:', responseText);

        if (response.ok) {
            console.log('\n✅ Event created successfully!');
        } else {
            console.log('\n❌ Failed to create event');
        }
    } catch (error) {
        console.error('\n❌ Error:', error.message);
    }
}

testEventCreation();
