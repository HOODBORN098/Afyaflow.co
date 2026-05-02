
async function testApi() {
    try {
        const response = await fetch('http://localhost:8080/api/appointments');
        const data = await response.json();
        console.log('Appointments:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testApi();
