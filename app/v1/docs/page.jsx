'use client';
import { useState, useEffect } from 'react';
import { Copy, Check, Book, Key, Shield, Zap, Code, FileText } from 'lucide-react';

export default function APIDocsPage() {
  const [copiedSection, setCopiedSection] = useState('');

  const copyToClipboard = (text, section) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(''), 2000);
  };

 const codeExamples = {
  javascript: `// Using fetch API
const API_BASE = 'https://dcc-bazar-fullstack.vercel.app/api/v1';
const API_KEY = 'your-api-key-here';

async function getProducts() {
  try {
    const response = await fetch(\`\${API_BASE}/products?brand=Go%20Baby\`, {
      headers: {
        'x-api-key': API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

// Create a new product
async function createProduct(productData) {
  try {
    const response = await fetch(\`\${API_BASE}/products\`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });
    
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

// Usage example
getProducts().then(products => {
  console.log('Products:', products);
});`,

  python: `import requests

API_BASE = 'https://dcc-bazar-fullstack.vercel.app/api/v1'
API_KEY = 'your-api-key-here'

def get_products():
    try:
        response = requests.get(
            f"{API_BASE}/products?brand=Go%20Baby",
            headers={'x-api-key': API_KEY}
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Error fetching products: {e}')
        raise

def create_product(product_data):
    try:
        response = requests.post(
            f"{API_BASE}/products",
            headers={
                'x-api-key': API_KEY,
                'Content-Type': 'application/json'
            },
            json=product_data
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Error creating product: {e}')
        raise

# Usage example
products = get_products()
print('Products:', products)`,

  curl: `# Get products by brand
curl -X GET "https://dcc-bazar-fullstack.vercel.app/api/v1/products?brand=Go%20Baby" \\
  -H "x-api-key: your-api-key-here"

# Create a new product
curl -X POST "https://dcc-bazar-fullstack.vercel.app/api/v1/products" \\
  -H "x-api-key: your-api-key-here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "New Product",
    "brand": "Go Baby", 
    "price": 29.99,
    "category": "Baby Gear"
  }'`
};

  // Python example as a string (not executable in JSX)
  const pythonExample = `import requests\n\nAPI_BASE = "https://dcc-bazar-fullstack.vercel.app/api/v1"\nAPI_KEY = "your-api-key-here"\n\nheaders = {\n    "x-api-key": API_KEY,\n    "Content-Type": "application/json"\n}\n\n# Get products\nresponse = requests.get(f"{API_BASE}/products", \n                       headers=headers,\n                       params={"brand": "Go Baby", "limit": 10})\nproducts = response.json()\n\n# Create a new product\nproduct_data = {\n    "title": "Baby Diapers Size M",\n    "buyPrice": 120,\n    "sellPrice": 180,\n    "stock": 100,\n    "category": "Diapers",\n    "brand": "Go Baby"\n}\n\nresponse = requests.post(f"{API_BASE}/products", \n                        json=product_data, \n                        headers=headers)\nnew_product = response.json()`;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Book className="h-8 w-8 text-green-600" />
            <h1 className="text-4xl font-bold text-gray-900">API Documentation</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Complete REST API documentation for DCC Bazar & Go Baby integration
          </p>
        </div>

        {/* Quick Start */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-500" />
            Quick Start
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-green-100 text-green-800 rounded-full p-2 mt-1">
                <Key className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">1. Get Your API Key</h3>
                <p className="text-gray-600">Contact us to obtain your unique API key for authentication.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-800 rounded-full p-2 mt-1">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">2. Include API Key in Headers</h3>
                <p className="text-gray-600">Add <code className="bg-gray-100 px-2 py-1 rounded text-sm">x-api-key: your-key</code> to all requests.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-purple-100 text-purple-800 rounded-full p-2 mt-1">
                <Code className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">3. Start Integrating</h3>
                <p className="text-gray-600">Use the endpoints below to manage products and orders.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Authentication */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <code className="text-sm">Header: x-api-key</code>
              <button
                onClick={() => copyToClipboard('x-api-key: your-api-key', 'auth')}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
              >
                {copiedSection === 'auth' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              All API requests must include your API key in the request headers.
            </p>
          </div>
        </div>

        {/* Base URL */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Base URL</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <code className="text-lg font-mono">https://dcc-bazar-fullstack.vercel.app/api/v1</code>
              <button
                onClick={() => copyToClipboard('https://dcc-bazar-fullstack.vercel.app/api/v1', 'baseurl')}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
              >
                {copiedSection === 'baseurl' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy
              </button>
            </div>
          </div>
        </div>

        {/* Code Examples */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Code Examples</h2>
          
          <div className="space-y-6">
            {/* cURL */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">cURL Examples</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Get Products</span>
                    <button
                      onClick={() => copyToClipboard(codeExamples.getProducts, 'curl-products')}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                    >
                      {copiedSection === 'curl-products' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      Copy
                    </button>
                  </div>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                    {codeExamples.getProducts}
                  </pre>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Create Product</span>
                    <button
                      onClick={() => copyToClipboard(codeExamples.createProduct, 'curl-create-product')}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                    >
                      {copiedSection === 'curl-create-product' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      Copy
                    </button>
                  </div>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                    {codeExamples.createProduct}
                  </pre>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Create Order</span>
                    <button
                      onClick={() => copyToClipboard(codeExamples.createOrder, 'curl-create-order')}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                    >
                      {copiedSection === 'curl-create-order' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      Copy
                    </button>
                  </div>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                    {codeExamples.createOrder}
                  </pre>
                </div>
              </div>
            </div>

            {/* JavaScript */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">JavaScript (Browser)</h3>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Using Fetch API</span>
                <button
                  onClick={() => copyToClipboard(codeExamples.javascript, 'js-example')}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                >
                  {copiedSection === 'js-example' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  Copy
                </button>
              </div>
              <pre className="bg-gray-900 text-yellow-400 p-4 rounded-lg text-sm overflow-x-auto">
                {codeExamples.javascript}
              </pre>
            </div>

            {/* Node.js */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Node.js</h3>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Using Axios</span>
                <button
                  onClick={() => copyToClipboard(codeExamples.nodejs, 'nodejs-example')}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                >
                  {copiedSection === 'nodejs-example' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  Copy
                </button>
              </div>
              <pre className="bg-gray-900 text-blue-400 p-4 rounded-lg text-sm overflow-x-auto">
                {codeExamples.nodejs}
              </pre>
            </div>

            {/* Python */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Python</h3>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Using Requests Library</span>
                <button
                  onClick={() => copyToClipboard(pythonExample, 'python-example')}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                >
                  {copiedSection === 'python-example' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  Copy
                </button>
              </div>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                {pythonExample}
              </pre>
            </div>
          </div>
        </div>

        {/* Endpoints Summary */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-500" />
            API Endpoints
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Endpoint</th>
                  <th className="px-4 py-3">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-3 font-mono text-green-600">GET</td>
                  <td className="px-4 py-3 font-mono">/products</td>
                  <td className="px-4 py-3">Get all products with filtering</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-3 font-mono text-green-600">GET</td>
                  <td className="px-4 py-3 font-mono">/products/[id]</td>
                  <td className="px-4 py-3">Get single product</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-3 font-mono text-blue-600">POST</td>
                  <td className="px-4 py-3 font-mono">/products</td>
                  <td className="px-4 py-3">Create new product</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-3 font-mono text-yellow-600">PUT</td>
                  <td className="px-4 py-3 font-mono">/products/[id]</td>
                  <td className="px-4 py-3">Update product</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-3 font-mono text-red-600">DELETE</td>
                  <td className="px-4 py-3 font-mono">/products/[id]</td>
                  <td className="px-4 py-3">Delete product (soft delete)</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-3 font-mono text-green-600">GET</td>
                  <td className="px-4 py-3 font-mono">/orders</td>
                  <td className="px-4 py-3">Get all orders with filtering</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-3 font-mono text-green-600">GET</td>
                  <td className="px-4 py-3 font-mono">/orders/[id]</td>
                  <td className="px-4 py-3">Get single order</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-3 font-mono text-blue-600">POST</td>
                  <td className="px-4 py-3 font-mono">/orders</td>
                  <td className="px-4 py-3">Create new order</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-3 font-mono text-yellow-600">PUT</td>
                  <td className="px-4 py-3 font-mono">/orders/[id]</td>
                  <td className="px-4 py-3">Update order</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-3 font-mono text-red-600">DELETE</td>
                  <td className="px-4 py-3 font-mono">/orders/[id]</td>
                  <td className="px-4 py-3">Delete order (restores stock)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Support */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Need Help?</h3>
          <p className="text-blue-800">
            For API key requests, technical support, or questions, please contact us at{' '}
            <a href="mailto:support@dcc-bazar.com" className="underline font-medium">
              support@dcc-bazar.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}