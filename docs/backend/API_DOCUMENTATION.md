# POS Backend API Documentation

## Base URL
```
http://localhost:8080/pos-codex
```

## Authentication & Headers

### Required Headers
- `X-Tenant-ID`: Tenant identifier (required for all requests)
- `Content-Type`: `application/json` (for POST/PUT requests)
- `Authorization`: Bearer <token> (required for protected endpoints)

### Authentication
All API endpoints (except `/api/auth/login` and `/api/auth/reset-password`) require JWT authentication.

**To authenticate:**
1. Login via `/api/auth/login` to get a JWT token
2. Include the token in all subsequent requests using the `Authorization: Bearer <token>` header

For detailed authentication documentation, see [AUTHENTICATION_API_DOCUMENTATION.md](AUTHENTICATION_API_DOCUMENTATION.md)

## API Response Format

All API endpoints return responses in the following format:

```json
{
  "code": "success",
  "message": "Operation completed successfully",
  "timestamp": "2025-10-11T07:00:00Z",
  "path": "/api/admin/outlets",
  "data": { ... }
}
```

## POS APIs

### POS Login Screen

#### Get Login Screen Configurations
```http
GET /api/pos
```

**Headers**:
- `X-Tenant-ID`: Your tenant identifier (required)

**Description**: 
This endpoint retrieves all login screen configurations to display the POS login screen. It returns configuration settings such as heading text, button text, colors, and feature toggles (remember me, forgot password).

**Response**:
```json
{
  "code": "success",
  "message": "POS login screen configurations retrieved successfully",
  "timestamp": "2025-10-15T13:20:00Z",
  "path": "/api/pos",
  "data": [
    {
      "id": 1,
      "configKey": "login_heading_text",
      "configValue": "Welcome to POS System",
      "category": "LOGIN",
      "description": "Heading text for the POS login screen",
      "dataType": "STRING"
    },
    {
      "id": 2,
      "configKey": "login_footer_text",
      "configValue": "© 2025 POS System. All rights reserved.",
      "category": "LOGIN",
      "description": "Footer text for the POS login screen",
      "dataType": "STRING"
    },
    {
      "id": 3,
      "configKey": "login_button_text",
      "configValue": "Sign In",
      "category": "LOGIN",
      "description": "Text displayed on the login button of the POS login screen",
      "dataType": "STRING"
    },
    {
      "id": 4,
      "configKey": "enable_remember_me",
      "configValue": "true",
      "category": "LOGIN",
      "description": "Enable or disable the remember me option on the POS login page",
      "dataType": "BOOLEAN"
    },
    {
      "id": 5,
      "configKey": "enable_forgot_password",
      "configValue": "true",
      "category": "LOGIN",
      "description": "Enable or disable the forgot password link visibility on the POS login screen",
      "dataType": "BOOLEAN"
    },
    {
      "id": 6,
      "configKey": "login_bg_primary_color",
      "configValue": "#4A90E2",
      "category": "LOGIN",
      "description": "Primary color of the background gradient on the POS login screen",
      "dataType": "STRING"
    },
    {
      "id": 7,
      "configKey": "login_bg_secondary_color",
      "configValue": "#357ABD",
      "category": "LOGIN",
      "description": "Secondary color of the background gradient on the POS login screen",
      "dataType": "STRING"
    },
    {
      "id": 8,
      "configKey": "login_font_color",
      "configValue": "#FFFFFF",
      "category": "LOGIN",
      "description": "Font color for the POS login screen",
      "dataType": "STRING"
    }
  ]
}
```

**Usage Example**:
```bash
curl -X GET "http://localhost:8080/pos-codex/api/pos" \
  -H "X-Tenant-ID: PaPos"
```

---

### POS Home Screen - Products

#### Get Products
```http
GET /api/pos/products?category={category}&search={search}
```

**Headers**:
- `X-Tenant-ID`: Your tenant identifier (required)

**Query Parameters**:
- `category` (optional): Filter products by category (e.g., "Clothing", "Electronics")
- `search` (optional): Search products by name (e.g., "shirt")

**Description**: 
Retrieves active products for the POS home screen. Supports filtering by category and searching by name.

**Response**:
```json
{
  "code": "success",
  "message": "Products retrieved successfully",
  "timestamp": "2025-10-15T14:30:00Z",
  "path": "/api/pos/products",
  "data": [
    {
      "id": 1,
      "name": "T-Shirt",
      "sku": "SKU001",
      "description": "Cotton T-Shirt",
      "price": 25.00,
      "taxRate": 10.00,
      "category": "Clothing",
      "unit": "piece",
      "isWeightBased": false,
      "imageUrl": "https://example.com/tshirt.jpg",
      "isActive": true
    }
  ]
}
```

**Usage Examples**:
```bash
# Get all active products
curl -X GET "http://localhost:8080/pos-codex/api/pos/products" \
  -H "X-Tenant-ID: PaPos"

# Get products by category
curl -X GET "http://localhost:8080/pos-codex/api/pos/products?category=Clothing" \
  -H "X-Tenant-ID: PaPos"

# Search products
curl -X GET "http://localhost:8080/pos-codex/api/pos/products?search=shirt" \
  -H "X-Tenant-ID: PaPos"
```

---

### POS Home Screen - Categories

#### Get Categories
```http
GET /api/pos/categories
```

**Headers**:
- `X-Tenant-ID`: Your tenant identifier (required)

**Description**: 
Retrieves all active product categories with product counts for the POS home screen.

**Response**:
```json
{
  "code": "success",
  "message": "Categories retrieved successfully",
  "timestamp": "2025-10-15T14:30:00Z",
  "path": "/api/pos/categories",
  "data": [
    {
      "name": "Clothing",
      "productCount": 10
    },
    {
      "name": "Electronics",
      "productCount": 5
    }
  ]
}
```

**Usage Example**:
```bash
curl -X GET "http://localhost:8080/pos-codex/api/pos/categories" \
  -H "X-Tenant-ID: PaPos"
```

---

### POS Home Screen - Customers

#### Get Customers
```http
GET /api/pos/customers
```

**Headers**:
- `X-Tenant-ID`: Your tenant identifier (required)

**Description**: 
Retrieves all active customers for selection in the POS system.

**Response**:
```json
{
  "code": "success",
  "message": "Customers retrieved successfully",
  "timestamp": "2025-10-15T14:30:00Z",
  "path": "/api/pos/customers",
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "address": "123 Main St",
      "taxNumber": "TAX123",
      "loyaltyPoints": 100,
      "isActive": true
    }
  ]
}
```

**Usage Example**:
```bash
curl -X GET "http://localhost:8080/pos-codex/api/pos/customers" \
  -H "X-Tenant-ID: PaPos"
```

---

### POS Home Screen - Payment Methods

#### Get Payment Methods
```http
GET /api/pos/payment-methods
```

**Headers**:
- `X-Tenant-ID`: Your tenant identifier (required)

**Description**: 
Retrieves all active payment methods available for the POS system.

**Response**:
```json
{
  "code": "success",
  "message": "Payment methods retrieved successfully",
  "timestamp": "2025-10-15T14:30:00Z",
  "path": "/api/pos/payment-methods",
  "data": [
    {
      "id": 1,
      "slug": "cash",
      "name": "Cash",
      "description": "Cash payment",
      "isActive": true,
      "isDefault": true
    },
    {
      "id": 2,
      "slug": "card",
      "name": "Credit/Debit Card",
      "description": "Card payment",
      "isActive": true,
      "isDefault": false
    }
  ]
}
```

**Usage Example**:
```bash
curl -X GET "http://localhost:8080/pos-codex/api/pos/payment-methods" \
  -H "X-Tenant-ID: PaPos"
```

---

### POS Home Screen - Orders

#### Create Order
```http
POST /api/pos/orders
```

**Headers**:
- `X-Tenant-ID`: Your tenant identifier (required)
- `Content-Type`: application/json

**Description**: 
Creates a new order with items and processes payments. The order can be completed immediately if payment is provided, or left in pending status.

**Request Body**:
```json
{
  "outletId": 1,
  "cashierId": 1,
  "customerId": 1,
  "orderType": "COUNTER",
  "items": [
    {
      "productId": 1,
      "productName": "T-Shirt",
      "quantity": 2,
      "unitPrice": 25.00,
      "discountAmount": 0,
      "notes": null
    }
  ],
  "discountAmount": 5.00,
  "discountType": "FIXED",
  "couponCode": null,
  "payments": [
    {
      "paymentMethodId": 1,
      "amount": 50.00
    }
  ],
  "notes": "Customer paid in cash"
}
```

**Response**:
```json
{
  "code": "success.order.created",
  "message": "Order created successfully",
  "timestamp": "2025-10-15T14:30:00Z",
  "path": "/api/pos/orders",
  "data": {
    "id": 1,
    "orderNumber": "ORD-1234567890-ABCDEF",
    "orderType": "COUNTER",
    "status": "COMPLETED",
    "subtotal": 50.00,
    "discountAmount": 5.00,
    "taxAmount": 4.50,
    "totalAmount": 49.50,
    "paidAmount": 50.00,
    "changeAmount": 0.50
  }
}
```

**Usage Example**:
```bash
curl -X POST "http://localhost:8080/pos-codex/api/pos/orders" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "outletId": 1,
    "cashierId": 1,
    "customerId": 1,
    "orderType": "COUNTER",
    "items": [
      {
        "productId": 1,
        "productName": "T-Shirt",
        "quantity": 2,
        "unitPrice": 25.00,
        "discountAmount": 0,
        "notes": null
      }
    ],
    "discountAmount": 5.00,
    "discountType": "FIXED",
    "payments": [
      {
        "paymentMethodId": 1,
        "amount": 50.00
      }
    ],
    "notes": "Customer paid in cash"
  }'
```

---

#### Apply Discount to Order
```http
POST /api/pos/orders/{orderId}/discount
```

**Headers**:
- `X-Tenant-ID`: Your tenant identifier (required)
- `Content-Type`: application/json

**Path Parameters**:
- `orderId`: The ID of the order

**Description**: 
Applies a discount to an existing order. Supports both fixed amount and percentage discounts.

**Request Body**:
```json
{
  "discountType": "PERCENTAGE",
  "discountValue": 10
}
```

**Response**:
```json
{
  "code": "success",
  "message": "Discount applied successfully",
  "timestamp": "2025-10-15T14:30:00Z",
  "path": "/api/pos/orders/1/discount",
  "data": {
    "id": 1,
    "orderNumber": "ORD-1234567890-ABCDEF",
    "subtotal": 50.00,
    "discountAmount": 5.00,
    "totalAmount": 49.50
  }
}
```

**Usage Example**:
```bash
# Apply fixed discount
curl -X POST "http://localhost:8080/pos-codex/api/pos/orders/1/discount" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "discountType": "FIXED",
    "discountValue": 5.00
  }'

# Apply percentage discount
curl -X POST "http://localhost:8080/pos-codex/api/pos/orders/1/discount" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "discountType": "PERCENTAGE",
    "discountValue": 10
  }'
```

---

#### Hold Order
```http
POST /api/pos/orders/{orderId}/hold
```

**Headers**:
- `X-Tenant-ID`: Your tenant identifier (required)
- `Content-Type`: application/json

**Path Parameters**:
- `orderId`: The ID of the order

**Description**: 
Places an order on hold. Useful when a customer needs to temporarily pause their transaction.

**Request Body**:
```json
{
  "notes": "Customer needs to get more cash"
}
```

**Response**:
```json
{
  "code": "success",
  "message": "Order held successfully",
  "timestamp": "2025-10-15T14:30:00Z",
  "path": "/api/pos/orders/1/hold",
  "data": {
    "id": 1,
    "orderNumber": "ORD-1234567890-ABCDEF",
    "status": "ON_HOLD",
    "notes": "Customer needs to get more cash"
  }
}
```

**Usage Example**:
```bash
curl -X POST "http://localhost:8080/pos-codex/api/pos/orders/1/hold" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Customer needs to get more cash"
  }'
```

---

### POS Outlet Selection Screen

#### Get Cashier Outlets by Username
```http
GET /api/pos/cashier/{username}/outlets
```

**Headers**:
- `X-Tenant-ID`: Your tenant identifier (required)

**Path Parameters**:
- `username`: The cashier's username (required)

**Description**: 
This endpoint retrieves all outlets assigned to a specific cashier by their username. After successful login, the cashier can use this endpoint to fetch the list of outlets they are authorized to work in. The cashier must then select one outlet to proceed with their work.

**Response**:
```json
{
  "code": "success",
  "message": "Cashier outlets retrieved successfully",
  "timestamp": "2025-10-15T13:50:00Z",
  "path": "/api/pos/cashier/johndoe/outlets",
  "data": [
    {
      "id": 1,
      "name": "Main Store",
      "code": "MAIN001",
      "mode": "GROCERY_RETAIL",
      "address": "123 Main Street",
      "phone": "555-0100",
      "email": "main@store.com",
      "isActive": true,
      "createdAt": "2025-10-11T08:00:00Z",
      "updatedAt": "2025-10-11T08:00:00Z"
    },
    {
      "id": 2,
      "name": "Branch Store",
      "code": "BRANCH001",
      "mode": "RESTAURANT_CAFE",
      "address": "456 Oak Avenue",
      "phone": "555-0200",
      "email": "branch@store.com",
      "isActive": true,
      "createdAt": "2025-10-12T09:00:00Z",
      "updatedAt": "2025-10-12T09:00:00Z"
    }
  ]
}
```

**Error Response (Cashier Not Found)**:
```json
{
  "code": "error.resource.not.found",
  "message": "Cashier not found with username: johndoe",
  "timestamp": "2025-10-15T13:50:00Z",
  "path": "/api/pos/cashier/johndoe/outlets",
  "data": null
}
```

**Usage Example**:
```bash
curl -X GET "http://localhost:8080/pos-codex/api/pos/cashier/johndoe/outlets" \
  -H "X-Tenant-ID: PaPos"
```

**Notes**:
- This endpoint returns only the outlets that have been explicitly assigned to the cashier
- If the cashier has no assigned outlets, an empty array will be returned
- The cashier must select one of these outlets before proceeding to use the POS system
- Once an outlet is selected, all subsequent operations (products, orders, transactions) will be scoped to that outlet

---

## Admin APIs

### Outlet Management

#### Create Outlet
```http
POST /api/admin/outlets
```

**Request Body:**
```json
{
  "name": "Main Store",
  "code": "MAIN001",
  "mode": "GROCERY_RETAIL",
  "address": "123 Main Street",
  "phone": "555-0100",
  "email": "main@store.com",
  "isActive": true
}
```

**Outlet Modes:**
- `GROCERY_RETAIL` - For grocery and retail stores
- `RESTAURANT_CAFE` - For restaurants and cafes (enables table management)

#### Get All Outlets
```http
GET /api/admin/outlets
GET /api/admin/outlets?active=true
GET /api/admin/outlets?mode=GROCERY_RETAIL
```

#### Get Outlet by ID
```http
GET /api/admin/outlets/{id}
```

#### Update Outlet
```http
PUT /api/admin/outlets/{id}
```

#### Delete Outlet (Soft Delete)
```http
DELETE /api/admin/outlets/{id}
```

---

### Dining Table Management

#### Create Dining Table
```http
POST /api/admin/dining-tables
```

**Request Body:**
```json
{
  "outlet": { "id": 1 },
  "tableNumber": "T-01",
  "capacity": 4,
  "status": "AVAILABLE",
  "isActive": true
}
```

**Table Status Options:**
- `AVAILABLE` - Table is available for seating
- `OCCUPIED` - Table is currently occupied
- `RESERVED` - Table is reserved
- `CLEANING` - Table is being cleaned

**Notes:**
- Dining tables can only be created for outlets with mode `RESTAURANT_CAFE`
- Table number must be unique within the outlet
- Table number serves as both the name and slug for the table

#### Get All Dining Tables
```http
GET /api/admin/dining-tables
GET /api/admin/dining-tables?outletId=1
GET /api/admin/dining-tables?outletId=1&status=AVAILABLE
```

**Query Parameters:**
- `outletId` (optional): Filter tables by outlet
- `status` (optional): Filter tables by status (AVAILABLE, OCCUPIED, RESERVED, CLEANING)

#### Get Dining Table by ID
```http
GET /api/admin/dining-tables/{id}
```

#### Update Dining Table
```http
PUT /api/admin/dining-tables/{id}
```

**Request Body:**
```json
{
  "tableNumber": "T-01",
  "capacity": 6,
  "status": "OCCUPIED",
  "isActive": true
}
```

#### Update Table Status
```http
POST /api/admin/dining-tables/{id}/status?status=OCCUPIED
```

**Query Parameters:**
- `status` (required): New status (AVAILABLE, OCCUPIED, RESERVED, CLEANING)

#### Delete Dining Table (Soft Delete)
```http
DELETE /api/admin/dining-tables/{id}
```

---

### Product Management

#### Create Product
```http
POST /api/admin/products
```

**Request Body:**
```json
{
  "name": "Coffee Beans 1kg",
  "sku": "COFFEE-001",
  "description": "Premium Arabica Coffee Beans",
  "price": 25.99,
  "cost": 15.00,
  "taxRate": 10.0,
  "category": "Beverages",
  "unit": "kg",
  "isWeightBased": false,
  "imageUrl": "https://example.com/image.jpg",
  "isActive": true
}
```

#### Get All Products
```http
GET /api/admin/products
GET /api/admin/products?active=true
GET /api/admin/products?category=Beverages
```

#### Search Products
```http
GET /api/admin/products/search?term=coffee
```

#### Get Product by ID
```http
GET /api/admin/products/{id}
```

#### Update Product
```http
PUT /api/admin/products/{id}
```

#### Delete Product (Soft Delete)
```http
DELETE /api/admin/products/{id}
```

---

### Barcode Management

The Barcode Management API provides comprehensive functionality for assigning, managing, and printing barcodes for products. See [BARCODE_API_DOCUMENTATION.md](BARCODE_API_DOCUMENTATION.md) for complete details.

#### Quick Reference

**Assign Custom Barcode:**
```http
POST /api/admin/barcodes/assign
```

**Bulk Assign Barcodes:**
```http
POST /api/admin/barcodes/assign/bulk
```

**Get Barcodes for Product:**
```http
GET /api/admin/barcodes/product/{productId}
```

**Get Barcode by Code:**
```http
GET /api/admin/barcodes/{code}
```

**Prepare Barcodes for Printing:**
```http
POST /api/admin/barcodes/print
```

**Key Features:**
- Assign custom barcodes to products
- Bulk barcode assignment via CSV import
- Primary barcode management
- Print barcodes in configurable quantities
- Default ID-based barcodes for all products
- WooCommerce CSV import integration

For detailed examples and usage, see [BARCODE_API_DOCUMENTATION.md](BARCODE_API_DOCUMENTATION.md).

---

### Order Management

#### Create Order
```http
POST /api/admin/orders
```

**Request Body:**
```json
{
  "orderNumber": "ORD-2025-001",
  "outlet": { "id": 1 },
  "cashier": { "id": 1 },
  "customer": { "id": 1 },
  "orderType": "COUNTER",
  "status": "PENDING",
  "subtotal": 100.00,
  "discountAmount": 10.00,
  "taxAmount": 9.00,
  "totalAmount": 99.00,
  "notes": "Rush order"
}
```

**Order Types:**
- `DINE_IN` - For restaurant dine-in orders
- `TAKEAWAY` - For takeaway orders
- `DELIVERY` - For delivery orders
- `COUNTER` - For counter sales

**Order Status:**
- `DRAFT` - Order being created
- `PENDING` - Order confirmed, awaiting processing
- `PREPARING` - Order being prepared (restaurant mode)
- `READY` - Order ready for pickup/delivery
- `COMPLETED` - Order completed
- `CANCELLED` - Order cancelled
- `REFUNDED` - Order refunded
- `ON_HOLD` - Order on hold

#### Get All Orders
```http
GET /api/admin/orders
GET /api/admin/orders?outletId=1
GET /api/admin/orders?outletId=1&status=COMPLETED
GET /api/admin/orders?outletId=1&startDate=2025-10-01T00:00:00Z&endDate=2025-10-31T23:59:59Z
```

#### Get Order by ID
```http
GET /api/admin/orders/{id}
```

#### Get Order by Number
```http
GET /api/admin/orders/by-number/{orderNumber}
```

#### Update Order
```http
PUT /api/admin/orders/{id}
```

#### Hold Order
```http
POST /api/admin/orders/{id}/hold
```

#### Cancel Order
```http
POST /api/admin/orders/{id}/cancel
```

#### Refund Order
```http
POST /api/admin/orders/{id}/refund
```

---

### Payment Methods Management

#### Create Payment Method
```http
POST /api/admin/payment-methods
```

**Request Body:**
```json
{
  "slug": "mobile-payment",
  "name": "Mobile Payment",
  "description": "Payment via mobile wallet apps",
  "isActive": true,
  "isDefault": false
}
```

**Response:**
```json
{
  "code": "success.payment.method.created",
  "message": "Payment method created successfully",
  "timestamp": "2025-10-11T08:00:00Z",
  "path": "/api/admin/payment-methods",
  "data": {
    "id": 2,
    "slug": "mobile-payment",
    "name": "Mobile Payment",
    "description": "Payment via mobile wallet apps",
    "isActive": true,
    "isDefault": false
  }
}
```

**Notes:**
- The `slug` field is immutable once created - it cannot be changed via updates
- You cannot delete payment methods with `isDefault: true` (e.g., the default "cash" method)
- The slug must be unique across all payment methods

#### Get All Payment Methods
```http
GET /api/admin/payment-methods
GET /api/admin/payment-methods?active=true
```

**Query Parameters:**
- `active` (optional): Filter by active status (`true` to return only active methods)

**Response:**
```json
{
  "code": "success",
  "message": "Payment methods retrieved successfully",
  "timestamp": "2025-10-11T08:00:00Z",
  "path": "/api/admin/payment-methods",
  "data": [
    {
      "id": 1,
      "slug": "cash",
      "name": "Cash",
      "description": "Cash payment - Default payment method",
      "isActive": true,
      "isDefault": true
    },
    {
      "id": 2,
      "slug": "card",
      "name": "Credit/Debit Card",
      "description": "Payment by credit or debit card",
      "isActive": true,
      "isDefault": false
    }
  ]
}
```

#### Get Payment Method by ID
```http
GET /api/admin/payment-methods/{id}
```

**Response:**
```json
{
  "code": "success",
  "message": "Payment method retrieved successfully",
  "timestamp": "2025-10-11T08:00:00Z",
  "path": "/api/admin/payment-methods/1",
  "data": {
    "id": 1,
    "slug": "cash",
    "name": "Cash",
    "description": "Cash payment - Default payment method",
    "isActive": true,
    "isDefault": true
  }
}
```

#### Get Payment Method by Slug
```http
GET /api/admin/payment-methods/by-slug/{slug}
```

**Example:**
```http
GET /api/admin/payment-methods/by-slug/cash
```

#### Update Payment Method
```http
PUT /api/admin/payment-methods/{id}
```

**Request Body:**
```json
{
  "name": "Cash Payment",
  "description": "Updated description for cash payment",
  "isActive": true
}
```

**Response:**
```json
{
  "code": "success.payment.method.updated",
  "message": "Payment method updated successfully",
  "timestamp": "2025-10-11T08:00:00Z",
  "path": "/api/admin/payment-methods/1",
  "data": {
    "id": 1,
    "slug": "cash",
    "name": "Cash Payment",
    "description": "Updated description for cash payment",
    "isActive": true,
    "isDefault": true
  }
}
```

**Notes:**
- The `slug` field cannot be changed - it is immutable
- If you include a `slug` in the update request, it will be ignored and the original slug will be retained

#### Delete Payment Method
```http
DELETE /api/admin/payment-methods/{id}
```

**Response:**
```json
{
  "code": "success.payment.method.deleted",
  "message": "Payment method deleted successfully",
  "timestamp": "2025-10-11T08:00:00Z",
  "path": "/api/admin/payment-methods/2",
  "data": null
}
```

**Error Response (when trying to delete default method):**
```json
{
  "code": "error",
  "message": "Cannot delete default payment method",
  "timestamp": "2025-10-11T08:00:00Z",
  "path": "/api/admin/payment-methods/1",
  "data": null
}
```

**Notes:**
- Cannot delete payment methods with `isDefault: true`
- The default "cash" payment method is protected and cannot be removed

---

### Invoice Template Management

#### Create Invoice Template
```http
POST /api/admin/invoice-templates
```

**Request Body:**
```json
{
  "name": "Standard Invoice",
  "headerText": "Company Name\nAddress Line 1\nAddress Line 2",
  "footerText": "Thank you for your business!",
  "logoUrl": "https://example.com/logo.png",
  "showCompanyInfo": true,
  "showTaxDetails": true,
  "paperSize": "A4",
  "isDefault": false,
  "isActive": true
}
```

**Response:**
```json
{
  "code": "success.invoice.template.created",
  "message": "Invoice template created successfully",
  "timestamp": "2025-10-15T08:00:00Z",
  "path": "/api/admin/invoice-templates",
  "data": {
    "id": 1,
    "name": "Standard Invoice",
    "headerText": "Company Name\nAddress Line 1\nAddress Line 2",
    "footerText": "Thank you for your business!",
    "logoUrl": "https://example.com/logo.png",
    "showCompanyInfo": true,
    "showTaxDetails": true,
    "paperSize": "A4",
    "isDefault": false,
    "isActive": true,
    "assignedOutlets": [],
    "createdDate": "2025-10-15T08:00:00Z",
    "modifiedDate": null
  }
}
```

#### Get All Invoice Templates
```http
GET /api/admin/invoice-templates
GET /api/admin/invoice-templates?active=true
GET /api/admin/invoice-templates?outletId=1
```

**Query Parameters:**
- `active` (optional): Filter by active status (`true` to return only active templates)
- `outletId` (optional): Filter by outlet ID (returns templates assigned to the outlet)

**Response:**
```json
{
  "code": "success",
  "message": "Invoice templates retrieved successfully",
  "timestamp": "2025-10-15T08:00:00Z",
  "path": "/api/admin/invoice-templates",
  "data": [
    {
      "id": 1,
      "name": "Standard Invoice",
      "headerText": "Company Name\nAddress Line 1\nAddress Line 2",
      "footerText": "Thank you for your business!",
      "logoUrl": "https://example.com/logo.png",
      "showCompanyInfo": true,
      "showTaxDetails": true,
      "paperSize": "A4",
      "isDefault": true,
      "isActive": true,
      "assignedOutlets": []
    }
  ]
}
```

#### Get Invoice Template by ID
```http
GET /api/admin/invoice-templates/{id}
```

**Response:**
```json
{
  "code": "success",
  "message": "Invoice template retrieved successfully",
  "timestamp": "2025-10-15T08:00:00Z",
  "path": "/api/admin/invoice-templates/1",
  "data": {
    "id": 1,
    "name": "Standard Invoice",
    "headerText": "Company Name\nAddress Line 1\nAddress Line 2",
    "footerText": "Thank you for your business!",
    "logoUrl": "https://example.com/logo.png",
    "showCompanyInfo": true,
    "showTaxDetails": true,
    "paperSize": "A4",
    "isDefault": true,
    "isActive": true,
    "assignedOutlets": []
  }
}
```

#### Get Default Invoice Template
```http
GET /api/admin/invoice-templates/default
```

**Response:**
```json
{
  "code": "success",
  "message": "Default invoice template retrieved successfully",
  "timestamp": "2025-10-15T08:00:00Z",
  "path": "/api/admin/invoice-templates/default",
  "data": {
    "id": 1,
    "name": "Standard Invoice",
    "isDefault": true,
    "isActive": true
  }
}
```

#### Update Invoice Template
```http
PUT /api/admin/invoice-templates/{id}
```

**Request Body:**
```json
{
  "name": "Updated Invoice",
  "headerText": "New Header Text",
  "footerText": "New Footer Text",
  "logoUrl": "https://example.com/new-logo.png",
  "showCompanyInfo": true,
  "showTaxDetails": false,
  "paperSize": "LETTER",
  "isDefault": false,
  "isActive": true
}
```

**Response:**
```json
{
  "code": "success.invoice.template.updated",
  "message": "Invoice template updated successfully",
  "timestamp": "2025-10-15T08:00:00Z",
  "path": "/api/admin/invoice-templates/1",
  "data": {
    "id": 1,
    "name": "Updated Invoice",
    "headerText": "New Header Text",
    "footerText": "New Footer Text",
    "logoUrl": "https://example.com/new-logo.png",
    "showCompanyInfo": true,
    "showTaxDetails": false,
    "paperSize": "LETTER",
    "isDefault": false,
    "isActive": true
  }
}
```

**Notes:**
- Only one template can be set as default at a time
- Setting a template as default will automatically unset the previous default

#### Delete Invoice Template (Soft Delete)
```http
DELETE /api/admin/invoice-templates/{id}
```

**Response:**
```json
{
  "code": "success.invoice.template.deleted",
  "message": "Invoice template deleted successfully",
  "timestamp": "2025-10-15T08:00:00Z",
  "path": "/api/admin/invoice-templates/2",
  "data": null
}
```

**Error Response (when trying to delete default template):**
```json
{
  "code": "error",
  "message": "Cannot delete default invoice template",
  "timestamp": "2025-10-15T08:00:00Z",
  "path": "/api/admin/invoice-templates/1",
  "data": null
}
```

**Notes:**
- Cannot delete invoice templates with `isDefault: true`
- Deletion is a soft delete (sets `isActive` to false)

#### Assign Outlet to Invoice Template
```http
POST /api/admin/invoice-templates/{id}/outlets/{outletId}
```

**Response:**
```json
{
  "code": "success.invoice.template.outlet.assigned",
  "message": "Outlet assigned to invoice template successfully",
  "timestamp": "2025-10-15T08:00:00Z",
  "path": "/api/admin/invoice-templates/1/outlets/1",
  "data": {
    "id": 1,
    "name": "Standard Invoice",
    "assignedOutlets": [
      {
        "id": 1,
        "name": "Main Store",
        "code": "MAIN001"
      }
    ]
  }
}
```

#### Remove Outlet from Invoice Template
```http
DELETE /api/admin/invoice-templates/{id}/outlets/{outletId}
```

**Response:**
```json
{
  "code": "success.invoice.template.outlet.removed",
  "message": "Outlet removed from invoice template successfully",
  "timestamp": "2025-10-15T08:00:00Z",
  "path": "/api/admin/invoice-templates/1/outlets/1",
  "data": {
    "id": 1,
    "name": "Standard Invoice",
    "assignedOutlets": []
  }
}
```

#### Get Invoice Template Outlets
```http
GET /api/admin/invoice-templates/{id}/outlets
```

**Response:**
```json
{
  "code": "success",
  "message": "Invoice template outlets retrieved successfully",
  "timestamp": "2025-10-15T08:00:00Z",
  "path": "/api/admin/invoice-templates/1/outlets",
  "data": [
    {
      "id": 1,
      "name": "Main Store",
      "code": "MAIN001",
      "mode": "GROCERY_RETAIL",
      "isActive": true
    }
  ]
}
```

---

### Cashiers Management

#### Create Cashier
```http
POST /api/admin/cashiers
```

**Request Body:**
```json
{
  "name": "John Doe",
  "username": "johndoe",
  "password": "securePassword123",
  "email": "john.doe@example.com",
  "phone": "555-0123",
  "isActive": true,
  "requirePasswordReset": false
}
```

**Response:**
```json
{
  "code": "success.cashier.created",
  "message": "Cashier created successfully",
  "timestamp": "2025-10-11T08:00:00Z",
  "path": "/api/admin/cashiers",
  "data": {
    "id": 1,
    "name": "John Doe",
    "username": "johndoe",
    "email": "john.doe@example.com",
    "phone": "555-0123",
    "isActive": true,
    "requirePasswordReset": false,
    "assignedOutlets": [],
    "createdAt": "2025-10-11T08:00:00Z",
    "updatedAt": "2025-10-11T08:00:00Z"
  }
}
```

**Notes:**
- Username must be unique
- Password is required for creating a new cashier
- Email and phone are optional

#### Get All Cashiers
```http
GET /api/admin/cashiers
GET /api/admin/cashiers?active=true
GET /api/admin/cashiers?outletId=1
```

**Query Parameters:**
- `active` (optional): Filter by active status (true/false)
- `outletId` (optional): Filter cashiers assigned to a specific outlet

**Response:**
```json
{
  "code": "success",
  "message": "Cashiers retrieved successfully",
  "timestamp": "2025-10-11T08:00:00Z",
  "path": "/api/admin/cashiers",
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "username": "johndoe",
      "email": "john.doe@example.com",
      "phone": "555-0123",
      "isActive": true,
      "requirePasswordReset": false,
      "assignedOutlets": [...],
      "createdAt": "2025-10-11T08:00:00Z",
      "updatedAt": "2025-10-11T08:00:00Z"
    }
  ]
}
```

#### Get Cashier by ID
```http
GET /api/admin/cashiers/{id}
```

**Response:**
```json
{
  "code": "success",
  "message": "Cashier retrieved successfully",
  "timestamp": "2025-10-11T08:00:00Z",
  "path": "/api/admin/cashiers/1",
  "data": {
    "id": 1,
    "name": "John Doe",
    "username": "johndoe",
    "email": "john.doe@example.com",
    "phone": "555-0123",
    "isActive": true,
    "requirePasswordReset": false,
    "assignedOutlets": [...],
    "createdAt": "2025-10-11T08:00:00Z",
    "updatedAt": "2025-10-11T08:00:00Z"
  }
}
```

#### Get Cashier by Username
```http
GET /api/admin/cashiers/by-username/{username}
```

**Response:**
```json
{
  "code": "success",
  "message": "Cashier retrieved successfully",
  "timestamp": "2025-10-11T08:00:00Z",
  "path": "/api/admin/cashiers/by-username/johndoe",
  "data": {
    "id": 1,
    "name": "John Doe",
    "username": "johndoe",
    "email": "john.doe@example.com",
    "phone": "555-0123",
    "isActive": true,
    "requirePasswordReset": false,
    "assignedOutlets": [...],
    "createdAt": "2025-10-11T08:00:00Z",
    "updatedAt": "2025-10-11T08:00:00Z"
  }
}
```

#### Update Cashier
```http
PUT /api/admin/cashiers/{id}
```

**Request Body:**
```json
{
  "name": "John Updated",
  "username": "johndoe",
  "email": "john.updated@example.com",
  "phone": "555-9999",
  "isActive": true,
  "requirePasswordReset": true,
  "password": "newPassword123"
}
```

**Response:**
```json
{
  "code": "success.cashier.updated",
  "message": "Cashier updated successfully",
  "timestamp": "2025-10-11T08:00:00Z",
  "path": "/api/admin/cashiers/1",
  "data": {
    "id": 1,
    "name": "John Updated",
    "username": "johndoe",
    "email": "john.updated@example.com",
    "phone": "555-9999",
    "isActive": true,
    "requirePasswordReset": true,
    "assignedOutlets": [...],
    "createdAt": "2025-10-11T08:00:00Z",
    "updatedAt": "2025-10-11T08:10:00Z"
  }
}
```

**Notes:**
- Password is optional in updates - only provide it when changing the password
- Username can be changed but must remain unique

#### Delete Cashier (Soft Delete)
```http
DELETE /api/admin/cashiers/{id}
```

**Response:**
```json
{
  "code": "success.cashier.deleted",
  "message": "Cashier deleted successfully",
  "timestamp": "2025-10-11T08:00:00Z",
  "path": "/api/admin/cashiers/1",
  "data": null
}
```

**Notes:**
- This is a soft delete - sets `isActive` to false
- The cashier record is not removed from the database

#### Assign Outlet to Cashier
```http
POST /api/admin/cashiers/{id}/outlets/{outletId}
```

**Response:**
```json
{
  "code": "success.cashier.outlet.assigned",
  "message": "Outlet assigned to cashier successfully",
  "timestamp": "2025-10-11T08:00:00Z",
  "path": "/api/admin/cashiers/1/outlets/1",
  "data": {
    "id": 1,
    "name": "John Doe",
    "username": "johndoe",
    "assignedOutlets": [
      {
        "id": 1,
        "name": "Main Store",
        "code": "MAIN001",
        "mode": "GROCERY_RETAIL"
      }
    ],
    ...
  }
}
```

**Notes:**
- Cashiers can be assigned to multiple outlets
- Assigning an already assigned outlet has no effect

#### Remove Outlet from Cashier
```http
DELETE /api/admin/cashiers/{id}/outlets/{outletId}
```

**Response:**
```json
{
  "code": "success.cashier.outlet.removed",
  "message": "Outlet removed from cashier successfully",
  "timestamp": "2025-10-11T08:00:00Z",
  "path": "/api/admin/cashiers/1/outlets/1",
  "data": {
    "id": 1,
    "name": "John Doe",
    "username": "johndoe",
    "assignedOutlets": [],
    ...
  }
}
```

#### Get Cashier's Assigned Outlets
```http
GET /api/admin/cashiers/{id}/outlets
```

**Response:**
```json
{
  "code": "success",
  "message": "Cashier outlets retrieved successfully",
  "timestamp": "2025-10-11T08:00:00Z",
  "path": "/api/admin/cashiers/1/outlets",
  "data": [
    {
      "id": 1,
      "name": "Main Store",
      "code": "MAIN001",
      "mode": "GROCERY_RETAIL",
      "address": "123 Main Street",
      "phone": "555-0100",
      "email": "main@store.com",
      "isActive": true
    }
  ]
}
```

---

### Configuration Management

#### Create Configuration
```http
POST /api/admin/configurations
```

**Request Body:**
```json
{
  "configKey": "app_name",
  "configValue": "My POS System",
  "category": "GENERAL",
  "description": "Application name displayed in UI",
  "dataType": "STRING"
}
```

**Configuration Categories:**
- `GENERAL` - General application settings
- `PAYMENTS` - Payment gateway settings
- `PWA` - Progressive Web App settings
- `LOGIN` - Login and authentication settings
- `PRINTER` - Printer configuration
- `LAYOUT` - UI layout settings

#### Get All Configurations
```http
GET /api/admin/configurations
GET /api/admin/configurations?category=GENERAL
```

#### Get Configuration by Key
```http
GET /api/admin/configurations/by-key?key=app_name&category=GENERAL
```

#### Get Configuration by ID
```http
GET /api/admin/configurations/{id}
```

#### Update Configuration
```http
PUT /api/admin/configurations/{id}
```

#### Delete Configuration
```http
DELETE /api/admin/configurations/{id}
```

#### Get General Configurations
```http
GET /api/admin/configurations/general
```

**Description:** Quickly retrieve all configurations in the GENERAL category.

**Response:**
```json
{
  "code": "success",
  "message": "General configurations retrieved successfully",
  "timestamp": "2025-10-11T08:00:00Z",
  "path": "/api/admin/configurations/general",
  "data": [
    {
      "id": 1,
      "configKey": "module_enabled",
      "configValue": "true",
      "category": "GENERAL",
      "description": "Enable or disable module features",
      "dataType": "BOOLEAN"
    }
  ]
}
```

#### Bulk Update Configurations
```http
POST /api/admin/configurations/bulk-update?category=GENERAL
```

**Description:** Update multiple configurations in a single request for improved performance.

**Request Body:**
```json
{
  "configurations": {
    "enable_order_emails": "true",
    "enable_split_payment": "true",
    "default_order_status": "COMPLETED",
    "logo_url": "/images/logo.png"
  }
}
```

**Response:**
```json
{
  "code": "success.configurations.bulk.updated",
  "message": "Configurations updated successfully",
  "timestamp": "2025-10-11T08:00:00Z",
  "path": "/api/admin/configurations/bulk-update",
  "data": [
    {
      "id": 6,
      "configKey": "enable_order_emails",
      "configValue": "true",
      "category": "GENERAL",
      "description": "Enable email notifications for orders",
      "dataType": "BOOLEAN"
    }
  ]
}
```

**General Configuration Keys:**

The following configuration keys are available in the GENERAL category (initialized by default):

1. `license_key` - License activation code
2. `module_enabled` - Enable/disable module features
3. `inventory_type` - Inventory type (CUSTOM or CENTRALIZED)
4. `default_order_status` - Default order status for POS orders
5. `default_barcode_type` - Default barcode type (PRODUCT_ID or SKU)
6. `enable_order_emails` - Enable order email notifications
7. `enable_split_payment` - Enable split/multiple payment methods
8. `enable_order_note` - Enable order notes
9. `enable_offline_orders` - Enable offline order mode
10. `enable_custom_product` - Enable custom product addition
11. `enable_cash_drawer_popup` - Enable cash drawer popup
12. `show_variations_as_products` - Show variations as separate products
13. `enable_weight_based_pricing` - Enable weight-based pricing
14. `auto_send_to_kitchen_on_hold` - Auto-send orders to kitchen on hold
15. `logo_url` - Brand logo URL
16. `default_customer_id` - Default customer ID
17. `pos_endpoint` - POS endpoint URL
18. `kitchen_endpoint` - Kitchen endpoint URL

For detailed documentation, see [GENERAL_CONFIGURATION_GUIDE.md](GENERAL_CONFIGURATION_GUIDE.md)

#### Get PWA Configurations
```http
GET /api/admin/configurations/pwa
```

**Description:** Quickly retrieve all configurations in the PWA category.

**Response:**
```json
{
  "code": "success",
  "message": "PWA configurations retrieved successfully",
  "timestamp": "2025-10-11T08:00:00Z",
  "path": "/api/admin/configurations/pwa",
  "data": [
    {
      "id": 19,
      "configKey": "pwa_name",
      "configValue": "POS System",
      "category": "PWA",
      "description": "Name of the Point of Sale application for PWA",
      "dataType": "STRING"
    },
    {
      "id": 20,
      "configKey": "pwa_short_name",
      "configValue": "POS",
      "category": "PWA",
      "description": "Shortened name of the Point of Sale application for PWA",
      "dataType": "STRING"
    },
    {
      "id": 21,
      "configKey": "pwa_theme_color",
      "configValue": "#ffffff",
      "category": "PWA",
      "description": "Theme color for the Point of Sale application's splash screen",
      "dataType": "STRING"
    },
    {
      "id": 22,
      "configKey": "pwa_background_color",
      "configValue": "#ffffff",
      "category": "PWA",
      "description": "Background color for the Point of Sale application's splash screen",
      "dataType": "STRING"
    },
    {
      "id": 23,
      "configKey": "pwa_icon_192",
      "configValue": "",
      "category": "PWA",
      "description": "PWA app icon URL for 192x192 size",
      "dataType": "STRING"
    },
    {
      "id": 24,
      "configKey": "pwa_icon_512",
      "configValue": "",
      "category": "PWA",
      "description": "PWA app icon URL for 512x512 size",
      "dataType": "STRING"
    }
  ]
}
```

**PWA Configuration Keys:**

The following configuration keys are available in the PWA category (initialized by default):

1. `pwa_name` - Name of the Point of Sale application
2. `pwa_short_name` - Shortened name of the Point of Sale application
3. `pwa_theme_color` - Theme color for splash screen
4. `pwa_background_color` - Background color for splash screen
5. `pwa_icon_192` - App icon URL for 192x192 size
6. `pwa_icon_512` - App icon URL for 512x512 size

For detailed documentation, see [PWA_CONFIGURATION_GUIDE.md](PWA_CONFIGURATION_GUIDE.md)

#### Get Login Configurations
```http
GET /api/admin/configurations/login
```

**Headers:**
- `X-Tenant-ID`: Your tenant identifier (required)

**Response:**
```json
{
  "code": "success",
  "message": "Login configurations retrieved successfully",
  "timestamp": "2025-10-11T16:00:00Z",
  "path": "/api/admin/configurations/login",
  "data": [
    {
      "id": 1,
      "configKey": "login_heading_text",
      "configValue": "Welcome to POS System",
      "category": "LOGIN",
      "description": "Heading text for the POS login screen",
      "dataType": "STRING"
    },
    {
      "id": 2,
      "configKey": "login_footer_text",
      "configValue": "© 2025 POS System. All rights reserved.",
      "category": "LOGIN",
      "description": "Footer text for the POS login screen",
      "dataType": "STRING"
    }
  ]
}
```

**Login Configuration Keys:**

The following configuration keys are available in the LOGIN category (initialized by default):

1. `login_heading_text` - Heading text for the POS login screen
2. `login_footer_text` - Footer text for the POS login screen
3. `login_button_text` - Text displayed on the login button
4. `enable_remember_me` - Enable or disable the remember me option (BOOLEAN)
5. `enable_forgot_password` - Enable or disable the forgot password link (BOOLEAN)
6. `login_bg_primary_color` - Primary color of the background gradient
7. `login_bg_secondary_color` - Secondary color of the background gradient
8. `login_font_color` - Font color for the login screen

For detailed documentation, see [LOGIN_CONFIGURATION_GUIDE.md](LOGIN_CONFIGURATION_GUIDE.md)

#### Get Printer Configurations
```http
GET /api/admin/configurations/printer
```

**Headers:**
- `X-Tenant-ID`: Your tenant identifier (required)

**Response:**
```json
{
  "code": "success",
  "message": "Printer configurations retrieved successfully",
  "timestamp": "2025-10-11T16:00:00Z",
  "path": "/api/admin/configurations/printer",
  "data": [
    {
      "id": 1,
      "configKey": "barcode_page_width",
      "configValue": "80",
      "category": "PRINTER",
      "description": "Width of the printing page in millimeters for generating the barcode",
      "dataType": "NUMBER"
    },
    {
      "id": 2,
      "configKey": "barcode_page_height",
      "configValue": "40",
      "category": "PRINTER",
      "description": "Height of the printing page in millimeters for generating the barcode",
      "dataType": "NUMBER"
    }
  ]
}
```

**Printer Configuration Keys:**

The following configuration keys are available in the PRINTER category (initialized by default):

1. `barcode_page_width` - Width of the printing page in millimeters for generating the barcode (NUMBER)
2. `barcode_page_height` - Height of the printing page in millimeters for generating the barcode (NUMBER)
3. `barcode_page_margin` - Margin of the printing page in millimeters where the barcode will be created (NUMBER)
4. `barcode_margin` - Margin of the barcode in millimeters to separate numerous barcodes for printing (NUMBER)
5. `barcode_orientation` - Orientation for the barcode when printing (HORIZONTAL or VERTICAL) (STRING)
6. `invoice_page_width` - Width of the printing page in millimeters for generating sales receipts/invoices (NUMBER)
7. `invoice_page_height` - Height of the printing page in millimeters for generating sales receipts/invoices (NUMBER)
8. `invoice_page_margin` - Margin of the printed page in millimeters for generating sales receipts/invoices (NUMBER)

For detailed documentation, see [PRINTER_CONFIGURATION_GUIDE.md](PRINTER_CONFIGURATION_GUIDE.md)

---

## POS/Cashier APIs

### Customer Management

#### Create Customer
```http
POST /api/pos/customers
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "555-0123",
  "address": "456 Customer Street",
  "taxNumber": "TAX-12345",
  "loyaltyPoints": 0,
  "isActive": true
}
```

#### Get All Customers
```http
GET /api/pos/customers
GET /api/pos/customers?active=true
```

#### Search Customers
```http
GET /api/pos/customers/search?term=john
```
Searches by name, email, or phone number.

#### Get Customer by ID
```http
GET /api/pos/customers/{id}
```

#### Update Customer
```http
PUT /api/pos/customers/{id}
```

#### Delete Customer (Soft Delete)
```http
DELETE /api/pos/customers/{id}
```

---

## Domain Models

### Outlet
```json
{
  "id": 1,
  "name": "Main Store",
  "code": "MAIN001",
  "address": "123 Main Street",
  "phone": "555-0100",
  "email": "main@store.com",
  "mode": "GROCERY_RETAIL",
  "isActive": true,
  "createdDate": "2025-10-11T07:00:00Z",
  "createdUser": "admin",
  "modifiedDate": null,
  "modifiedUser": null,
  "recordStatus": "ACTIVE",
  "version": 0
}
```

### DiningTable
```json
{
  "id": 1,
  "tableNumber": "T-01",
  "capacity": 4,
  "outlet": { "id": 1, "name": "Restaurant", "mode": "RESTAURANT_CAFE" },
  "status": "AVAILABLE",
  "isActive": true,
  "createdDate": "2025-10-11T07:00:00Z",
  "createdUser": "admin",
  "modifiedDate": null,
  "modifiedUser": null,
  "recordStatus": "ACTIVE",
  "version": 0
}
```

**Status Values:**
- `AVAILABLE` - Table is available for seating
- `OCCUPIED` - Table is currently occupied
- `RESERVED` - Table is reserved
- `CLEANING` - Table is being cleaned

### Product
```json
{
  "id": 1,
  "name": "Coffee Beans 1kg",
  "sku": "COFFEE-001",
  "description": "Premium Arabica Coffee Beans",
  "price": 25.99,
  "cost": 15.00,
  "taxRate": 10.0,
  "category": "Beverages",
  "unit": "kg",
  "isWeightBased": false,
  "imageUrl": "https://example.com/image.jpg",
  "isActive": true,
  "createdDate": "2025-10-11T07:00:00Z",
  "version": 0
}
```

### Order
```json
{
  "id": 1,
  "orderNumber": "ORD-2025-001",
  "outlet": { "id": 1, "name": "Main Store" },
  "cashier": { "id": 1, "name": "Jane Smith" },
  "customer": { "id": 1, "name": "John Doe" },
  "table": null,
  "orderType": "COUNTER",
  "status": "COMPLETED",
  "subtotal": 100.00,
  "discountAmount": 10.00,
  "taxAmount": 9.00,
  "totalAmount": 99.00,
  "paidAmount": 100.00,
  "changeAmount": 1.00,
  "notes": "Rush order",
  "completedDate": "2025-10-11T08:00:00Z",
  "isOnline": false,
  "items": [...],
  "payments": [...],
  "createdDate": "2025-10-11T07:00:00Z"
}
```

### Customer
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "555-0123",
  "address": "456 Customer Street",
  "taxNumber": "TAX-12345",
  "loyaltyPoints": 150,
  "isActive": true,
  "createdDate": "2025-10-11T07:00:00Z",
  "version": 0
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "code": "error.validation",
  "message": "Please review the highlighted fields and try again.",
  "timestamp": "2025-10-11T07:00:00Z",
  "path": "/api/admin/products",
  "detail": "price: must be greater than 0"
}
```

### 404 Not Found
```json
{
  "code": "error.not-found",
  "message": "We could not find what you were looking for.",
  "timestamp": "2025-10-11T07:00:00Z",
  "path": "/api/admin/products/999",
  "detail": null
}
```

### 409 Conflict
```json
{
  "code": "error.data-integrity",
  "message": "This action cannot be completed because related information exists.",
  "timestamp": "2025-10-11T07:00:00Z",
  "path": "/api/admin/outlets/1",
  "detail": null
}
```

### 500 Internal Server Error
```json
{
  "code": "error.generic",
  "message": "We hit a snag while processing your request. Please try again later.",
  "timestamp": "2025-10-11T07:00:00Z",
  "path": "/api/admin/products",
  "detail": null
}
```

---

## Example Usage with cURL

### Create an Outlet
```bash
curl -X POST http://localhost:8080/pos-codex/api/admin/outlets \
  -H "X-Tenant-ID: PaPos" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Store",
    "code": "MAIN001",
    "mode": "GROCERY_RETAIL",
    "address": "123 Main St",
    "phone": "555-0100",
    "email": "main@store.com"
  }'
```

### Search for Products
```bash
curl -X GET "http://localhost:8080/pos-codex/api/admin/products/search?term=coffee" \
  -H "X-Tenant-ID: PaPos" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Orders by Date Range
```bash
curl -X GET "http://localhost:8080/pos-codex/api/admin/orders?outletId=1&startDate=2025-10-01T00:00:00Z&endDate=2025-10-31T23:59:59Z" \
  -H "X-Tenant-ID: PaPos" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create a Customer
```bash
curl -X POST http://localhost:8080/pos-codex/api/pos/customers \
  -H "X-Tenant-ID: PaPos" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "555-0123"
  }'
```

### Update Configuration
```bash
curl -X PUT http://localhost:8080/pos-codex/api/admin/configurations/1 \
  -H "X-Tenant-ID: PaPos" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "configValue": "Updated Value",
    "description": "Updated description"
  }'
```

---

## Notes

1. **Multi-tenancy**: All API requests must include the `X-Tenant-ID` header to identify which tenant's data to access.

2. **JWT Authentication**: All API requests (except `/api/auth/login` and `/api/auth/reset-password`) require JWT authentication via the `Authorization: Bearer <token>` header. Login to get your token.

3. **Soft Deletes**: DELETE operations perform soft deletes by setting `isActive=false` instead of removing records from the database.

4. **Versioning**: All entities include optimistic locking via the `version` field to prevent concurrent modification conflicts.

5. **Date/Time Format**: All dates and times use ISO 8601 format with timezone (e.g., `2025-10-11T07:00:00Z`).

6. **Pagination**: Not yet implemented but will be added in future versions for list endpoints.

7. **Authentication**: Currently, all endpoints are open. Authentication will be added in a future release.
