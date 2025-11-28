const { supabase } = require('./server/src/db');
const { getDashboardStats, getTop10Participants, getUpcomingBirthdays } = require('./server/src/controllers/dashboardController');

// Mock de Request e Response
const mockReq = {};
const mockRes = {
    json: (data) => console.log('📦 RESPONSE JSON:', JSON.stringify(data, null, 2)),
    status: (code) => {
        console.log('📦 RESPONSE STATUS:', code);
        return mockRes;
    }
};

async function runTests() {
    console.log('🚀 INICIANDO TESTES ISOLADOS DO DASHBOARD CONTROLLER\n');

    try {
        console.log('--- TESTE 1: getDashboardStats ---');
        await getDashboardStats(mockReq, mockRes);
        console.log('✅ Teste 1 concluído\n');

        console.log('--- TESTE 2: getTop10Participants ---');
        await getTop10Participants(mockReq, mockRes);
        console.log('✅ Teste 2 concluído\n');

        console.log('--- TESTE 3: getUpcomingBirthdays ---');
        await getUpcomingBirthdays(mockReq, mockRes);
        console.log('✅ Teste 3 concluído\n');

    } catch (error) {
        console.error('❌ ERRO FATAL NOS TESTES:', error);
    }
}

runTests();
