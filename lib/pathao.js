class PathaoClient {
  constructor(brand) {
    this.brand = brand;
    this.baseURL = process.env.PATHAO_BASE_URL || 'https://api-hermes.pathao.com';
    this.config = {
      'DCC Bazar': {
        client_id: process.env.PATHAO_DCC_CLIENT_ID,
        client_secret: process.env.PATHAO_DCC_CLIENT_SECRET,
        username: process.env.PATHAO_DCC_USERNAME,
        password: process.env.PATHAO_DCC_PASSWORD,
        store_id: process.env.PATHAO_DCC_STORE_ID
      },
      'Go Baby': {
        client_id: process.env.PATHAO_GOBABY_CLIENT_ID,
        client_secret: process.env.PATHAO_GOBABY_CLIENT_SECRET,
        username: process.env.PATHAO_GOBABY_USERNAME,
        password: process.env.PATHAO_GOBABY_PASSWORD,
        store_id: process.env.PATHAO_GOBABY_STORE_ID
      }
    };
    
    this.brandConfig = this.config[brand];
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async getAccessToken() {
    // Check if token is still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const tokenData = {
        client_id: this.brandConfig.client_id,
        client_secret: this.brandConfig.client_secret,
        username: this.brandConfig.username,
        password: this.brandConfig.password,
        grant_type: 'password'
      };

      console.log('Attempting Pathao authentication for:', this.brand);

      const response = await fetch(`${this.baseURL}/aladdin/api/v1/issue-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tokenData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Auth failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.access_token) {
        throw new Error('No access token received from Pathao');
      }

      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;
      
      console.log('Pathao authentication successful');
      return this.accessToken;

    } catch (error) {
      console.error('Pathao token error:', error);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  async makeAuthenticatedRequest(url, options = {}) {
    const token = await this.getAccessToken();
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    };

    const response = await fetch(`${this.baseURL}${url}`, {
      ...defaultOptions,
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pathao API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  formatAddress(address) {
    if (typeof address === 'string') {
      return address;
    }
    
    if (typeof address === 'object' && address !== null) {
      // Build address from address object
      const parts = [];
      if (address.street) parts.push(address.street);
      if (address.city) parts.push(address.city);
      if (address.state) parts.push(address.state);
      if (address.zipCode) parts.push(address.zipCode);
      
      const formattedAddress = parts.join(', ');
      return formattedAddress || 'Address not provided';
    }
    
    return 'Address not provided';
  }

  async createOrder(orderData) {
    try {
      console.log('Creating Pathao order for:', orderData.orderNumber);

      if (!this.brandConfig.store_id) {
        throw new Error('Store ID not configured for this brand');
      }

      // Format the address properly
      const recipientAddress = this.formatAddress(orderData.customer.address);
      
      // Validate address length
      if (recipientAddress.length < 10) {
        throw new Error('Recipient address must be at least 10 characters long');
      }

      const pathaoOrder = {
        store_id: parseInt(this.brandConfig.store_id),
        merchant_order_id: orderData.orderNumber,
        recipient_name: orderData.customer.name,
        recipient_phone: orderData.customer.phone,
        recipient_address: recipientAddress, // Now a proper string
        delivery_type: 48, // Normal delivery
        item_type: 2, // Parcel
        item_quantity: Math.max(1, orderData.items.reduce((sum, item) => sum + item.quantity, 0)),
        item_weight: 0.5, // Default weight
        amount_to_collect: orderData.dueAmount > 0 ? Math.round(orderData.totalAmount) : 0,
        item_description: this.generateItemDescription(orderData.items),
        special_instruction: orderData.notes || ''
      };

      console.log('Sending to Pathao:', pathaoOrder);

      const result = await this.makeAuthenticatedRequest('/aladdin/api/v1/orders', {
        method: 'POST',
        body: JSON.stringify(pathaoOrder),
      });

      console.log('Pathao order creation successful:', result);
      return result;

    } catch (error) {
      console.error('Pathao order creation failed:', error);
      throw error;
    }
  }

  async getOrderStatus(consignmentId) {
    try {
      const result = await this.makeAuthenticatedRequest(`/aladdin/api/v1/orders/${consignmentId}/info`);
      return result;
    } catch (error) {
      console.error('Pathao status fetch error:', error);
      throw error;
    }
  }

  // Optional: Keep this for verification
  async getStores() {
    try {
      const result = await this.makeAuthenticatedRequest('/aladdin/api/v1/stores');
      return result;
    } catch (error) {
      console.error('Pathao stores fetch error:', error);
      throw error;
    }
  }

  generateItemDescription(items) {
    const description = items.map(item => 
      `${item.product?.title || 'Product'} x ${item.quantity}`
    ).join(', ');
    
    return description.substring(0, 200);
  }
}

export default PathaoClient;