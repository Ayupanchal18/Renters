import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8080/api';

async function testRentFilters() {
    console.log('--- Testing Rent Filters (GET) ---');
    try {
        const url = `${BASE_URL}/properties/rent?bedrooms=1,2&furnishing=semi,fully`;
        console.log(`URL: ${url}`);
        const res = await fetch(url);
        const data = await res.json();

        if (data.success) {
            console.log(`✅ Rent GET Success: ${data.data.total} results found.`);
            if (data.data.items && data.data.items.length > 0) {
                data.data.items.slice(0, 2).forEach((item, i) => {
                    console.log(`   Sample ${i + 1}: ${item.title} | BHK: ${item.bedrooms} | Furnishing: ${item.furnishing}`);
                });
            }
        } else {
            console.log(`❌ Rent GET Failed: ${data.message || 'Unknown error'}`);
            console.log('Response:', JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error('❌ Rent GET test error:', e.message);
    }
}

async function testBuyFilters() {
    console.log('\n--- Testing Buy Filters (GET) ---');
    try {
        const url = `${BASE_URL}/properties/buy?bedrooms=3&loanAvailable=true`;
        console.log(`URL: ${url}`);
        const res = await fetch(url);
        const data = await res.json();

        if (data.success) {
            console.log(`✅ Buy GET Success: ${data.data.total} results found.`);
        } else {
            console.log(`❌ Buy GET Failed: ${data.message || 'Unknown error'}`);
            console.log('Response:', JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error('❌ Buy GET test error:', e.message);
    }
}

async function testRentSearch() {
    console.log('\n--- Testing Rent Search (POST) ---');
    try {
        const url = `${BASE_URL}/properties/rent/search`;
        console.log(`URL: ${url}`);
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filters: {
                    bedrooms: [1, 2],
                    furnishing: ['semi', 'fully']
                }
            })
        });
        const data = await res.json();
        const results = data.data?.searchResultData || data.data?.items || [];

        if (data.success) {
            console.log(`✅ Rent Search Success: ${results.length} results found.`);
        } else {
            console.log(`❌ Rent Search Failed: ${data.message || 'Unknown error'}`);
        }
    } catch (e) {
        console.error('❌ Rent Search test error:', e.message);
    }
}

async function runTests() {
    await testRentFilters();
    await testBuyFilters();
    await testRentSearch();
}

runTests();
