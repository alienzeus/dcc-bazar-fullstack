// bulkCreateProducts.js
// A script to demonstrate bulk product creation via the API.
// Includes the required API key header: x-api-key = "Bangladesh_1971_:D"

// Configuration – change the URL to match your environment
const API_URL = 'https://dcc-bazar-fullstack.vercel.app/api/v1/products/bulk?mode=partial';

// API key – in production, store this securely (e.g., environment variable)
const API_KEY = 'Bangladesh_1971_:D';

// Example product data – two products with manually provided SKUs
const payload = {
  products: [
    {
      title: 'Product A',
      buyPrice: 10,
      sellPrice: 15,
      stock: 5,
      category: 'Toys',
      brand: 'Go Baby',
      sku: 'EXT-SKU-001' // from another database
    },
    {
      title: 'Product B',
      buyPrice: 20,
      sellPrice: 30,
      stock: 8,
      category: 'Clothes',
      brand: 'DCC Bazar',
      sku: 'EXT-SKU-002' // from another database
    }
  ]
};

async function createBulkProducts() {
  try {
    console.log('Sending request to:', API_URL);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY   // <-- required authentication header
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('✅ Bulk create succeeded (or partially succeeded).');
    } else {
      console.log('❌ Request failed.');
    }
  } catch (error) {
    console.error('❌ Network or unexpected error:', error.message);
  }
}

// Run the script
createBulkProducts();