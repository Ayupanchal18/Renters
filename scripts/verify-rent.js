import fetch from 'node-fetch';
const BASE_URL = 'http://localhost:8080/api';

async function run() {
    const rentUrl = `${BASE_URL}/properties/rent?bedrooms=1,2&furnishing=semi,fully`;
    const res = await fetch(rentUrl);
    const data = await res.json();
    console.log('RENT_GET_SUCCESS:', data.success);
    if (!data.success) {
        console.log('ERROR_MESSAGE:', data.message);
        console.log('ERROR_DETAIL:', data.error);
    }
    console.log('FULL_RESPONSE:', JSON.stringify(data, null, 2));
}
run();
