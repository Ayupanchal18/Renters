import fetch from 'node-fetch';
const BASE_URL = 'http://localhost:8080/api';

async function run() {
    console.log('--- Testing Rent Filters (GET) ---');
    const rentUrl = `${BASE_URL}/properties/rent?bedrooms=1,2&furnishing=semi,fully`;
    const rentRes = await fetch(rentUrl);
    const rentData = await rentRes.json();
    console.log('RENT_GET:', JSON.stringify(rentData, null, 2));

    console.log('\n--- Testing Buy Filters (GET) ---');
    const buyUrl = `${BASE_URL}/properties/buy?bedrooms=3&loanAvailable=true`;
    const buyRes = await fetch(buyUrl);
    const buyData = await buyRes.json();
    console.log('BUY_GET:', JSON.stringify(buyData, null, 2));
}
run();
