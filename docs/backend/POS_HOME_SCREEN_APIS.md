# POS Home Screen APIs

## Overview

This document describes the comprehensive set of APIs developed for the POS home screen, enabling cashiers to manage orders, apply discounts, and process payments efficiently.

## Features Implemented

The POS home screen APIs provide the following functionality:

### 1. Product Management
- **Get Products**: Retrieve all active products
- **Filter by Category**: Get products filtered by category
- **Search Products**: Search products by name, SKU, ID, or barcode
- **Get Product by Barcode**: Retrieve product details using barcode code

### 2. Category Management
- **Get Categories**: Retrieve all active categories with product counts

### 3. Customer Management
- **Get Customers**: Retrieve all active customers for order assignment

### 4. Payment Methods
- **Get Payment Methods**: Retrieve all active payment methods for processing payments

### 5. Order Management
- **Create Order**: Create and complete orders with items and payments
- **Apply Discount**: Apply fixed or percentage discounts to orders
- **Hold Order**: Put orders on hold for later processing

## API Endpoints

### Products

#### GET /api/pos/products
Retrieves active products with optional filtering.

**Query Parameters:**
- `category` (optional): Filter by category name
- `search` (optional): Search by product name, SKU, ID, or barcode number

**Response:**
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

#### GET /api/pos/products/barcode/{code}
Retrieves a specific product by its barcode code.

**Path Parameters:**
- `code` (required): Barcode code (e.g., "BC-APPLE-001", "PROD-00000001")

**Response:**
```json
{
  "code": "success",
  "message": "Product retrieved successfully",
  "timestamp": "2025-10-16T09:45:00Z",
  "path": "/api/pos/products/barcode/BC-APPLE-001",
  "data": {
    "id": 1,
    "name": "Apple",
    "sku": "APPLE-SKU",
    "description": "Fresh Apple",
    "price": 1.50,
    "taxRate": 5.00,
    "category": "Fruits",
    "unit": "kg",
    "isWeightBased": true,
    "imageUrl": "https://example.com/apple.jpg",
    "isActive": true
  }
}
```

**Error Responses:**
- `404 Not Found`: Barcode not found

**Example (cURL):**
```bash
curl -X GET "http://localhost:8080/posai/api/pos/products/barcode/BC-APPLE-001" \
  -H "X-Tenant-ID: PaPos"
```

### Categories

#### GET /api/pos/categories
Retrieves all active categories with product counts.

**Response:**
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

### Customers

#### GET /api/pos/customers
Retrieves all active customers.

**Response:**
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

### Payment Methods

#### GET /api/pos/payment-methods
Retrieves all active payment methods.

**Response:**
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
    }
  ]
}
```

### Orders

#### POST /api/pos/orders
Creates a new order with items and processes payments.

**Request Body:**
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

**Order Types:**
- `COUNTER`: Counter service
- `DINE_IN`: Dine-in service
- `TAKEAWAY`: Takeaway service
- `DELIVERY`: Delivery service

**Discount Types:**
- `FIXED`: Fixed amount discount
- `PERCENTAGE`: Percentage discount

**Response:**
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

#### POST /api/pos/orders/{orderId}/discount
Applies a discount to an existing order.

**Request Body:**
```json
{
  "discountType": "PERCENTAGE",
  "discountValue": 10
}
```

**Response:**
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

#### POST /api/pos/orders/{orderId}/hold
Places an order on hold.

**Request Body:**
```json
{
  "notes": "Customer needs to get more cash"
}
```

**Response:**
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

## Technical Implementation

### New Services

#### PosService
A dedicated service for POS-specific operations:
- Product retrieval and filtering
- Category aggregation
- Customer management
- Payment method retrieval
- Order creation with automatic calculations
- Discount application
- Order holding

### New DTOs

#### ProductDTO
Represents product information for the POS screen:
- id, name, sku, description
- price, taxRate
- category, unit
- isWeightBased, imageUrl, isActive

#### CategoryDTO
Represents category information with counts:
- name
- productCount

#### CreateOrderRequest
Complex request for order creation:
- outletId, cashierId, customerId
- orderType
- items (list of OrderItemRequest)
- discountAmount, discountType
- couponCode (reserved for future use)
- payments (list of PaymentRequest)
- notes

#### ApplyDiscountRequest
Request for applying discounts:
- discountType (FIXED or PERCENTAGE)
- discountValue

#### HoldOrderRequest
Request for holding orders:
- notes

### Database Schema

The implementation uses existing entities:
- `Product`: Product information
- `Customer`: Customer information
- `PaymentMethod`: Payment method information
- `Order`: Order header
- `OrderItem`: Order line items
- `Payment`: Payment records

### Business Logic

#### Order Creation Flow
1. Validate outlet, cashier, and customer (if provided)
2. Create order with generated order number
3. Add order items with automatic tax calculation
4. Apply discount (fixed or percentage)
5. Calculate totals (subtotal, discount, tax, total)
6. Process payments if provided
7. Calculate change amount
8. Set order status to COMPLETED if fully paid

#### Discount Calculation
- **Fixed Discount**: Direct amount subtracted from subtotal
- **Percentage Discount**: Calculated as (subtotal × percentage) / 100

#### Tax Calculation
- Applied per item based on product tax rate
- Calculated on discounted amount: (quantity × unitPrice - itemDiscount) × taxRate / 100

## Testing

### Unit Tests
Comprehensive unit tests cover all endpoints:
- Product retrieval (with/without filters)
- Category retrieval
- Customer retrieval
- Payment method retrieval
- Order creation
- Discount application
- Order holding

**Test Results:**
- 12 tests for PosController
- All tests passing ✅

### Manual Testing
Use the provided test script:
```bash
./test-pos-home-screen-apis.sh
```

This script tests:
- All product endpoints
- Category endpoint
- Customer endpoint
- Payment method endpoint
- Order creation
- Discount application
- Order holding

## Usage Examples

### Complete POS Workflow

1. **Load Categories**
```bash
curl -X GET "http://localhost:8080/posai/api/pos/categories" \
  -H "X-Tenant-ID: PaPos"
```

2. **Load Products for Selected Category**
```bash
curl -X GET "http://localhost:8080/posai/api/pos/products?category=Clothing" \
  -H "X-Tenant-ID: PaPos"
```

3. **Search Products (by name, SKU, ID, or barcode)**
```bash
curl -X GET "http://localhost:8080/posai/api/pos/products?search=shirt" \
  -H "X-Tenant-ID: PaPos"

# Search by barcode in general search
curl -X GET "http://localhost:8080/posai/api/pos/products?search=BC-APPLE-001" \
  -H "X-Tenant-ID: PaPos"
```

4. **Get Product by Barcode**
```bash
curl -X GET "http://localhost:8080/posai/api/pos/products/barcode/BC-APPLE-001" \
  -H "X-Tenant-ID: PaPos"
```

5. **Load Customers**
```bash
curl -X GET "http://localhost:8080/posai/api/pos/customers" \
  -H "X-Tenant-ID: PaPos"
```

6. **Load Payment Methods**
```bash
curl -X GET "http://localhost:8080/posai/api/pos/payment-methods" \
  -H "X-Tenant-ID: PaPos"
```

7. **Create Order with Payment**
```bash
curl -X POST "http://localhost:8080/posai/api/pos/orders" \
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

## UI Integration Guide

The POS home screen UI should follow this flow:

### 1. Category Selection
- Display categories from `GET /api/pos/categories`
- Show product counts for each category
- "All" button to show all products

### 2. Product Display
- Load products using `GET /api/pos/products`
- Filter by category when category is selected
- Implement search using `GET /api/pos/products?search={term}`
- Display product images, names, and prices

### 3. Cart Management
- Add products to cart (client-side state)
- Show cart items on the right side
- Display subtotal, tax, discount, and total

### 4. Customer Selection
- Load customers from `GET /api/pos/customers`
- Display customer selector at top
- Show "Mark Doe" or selected customer name

### 5. Discount Application
- "Discount" button opens discount modal
- Support fixed and percentage discounts
- Apply discount using `POST /api/pos/orders/{orderId}/discount`

### 6. Coupon Application
- "Coupon" button opens coupon modal
- Input coupon code
- (Future implementation: validate and apply coupon)

### 7. Hold Order
- "Hold Order" button opens hold modal
- Enter notes for why order is being held
- Call `POST /api/pos/orders/{orderId}/hold`

### 8. Payment Processing
- "Proceed to Pay" button opens payment screen
- Show total due and payment methods
- Support multiple payment methods
- Calculate change automatically
- Create order with payments using `POST /api/pos/orders`

## Future Enhancements

### Coupon System
- Create Coupon entity with validation rules
- Implement coupon validation endpoint
- Support various coupon types (percentage, fixed, buy-X-get-Y)
- Track coupon usage

### Advanced Features
- ✅ Barcode scanning integration (implemented)
- Real-time stock checking
- Multiple payment methods per transaction
- Split payments
- Loyalty points integration
- Receipt printing
- Order history and reorder
- Kitchen display integration

## Related Documentation

- [API Documentation](API_DOCUMENTATION.md) - Complete API reference
- [POS Endpoint Guide](POS_ENDPOINT_GUIDE.md) - Login screen endpoint
- [Outlet Selection Feature](OUTLET_SELECTION_FEATURE.md) - Outlet selection
- [Payment Methods Feature](PAYMENT_METHODS_FEATURE.md) - Payment method management
- [Orders Submenu Feature](ORDERS_SUBMENU_FEATURE.md) - Order management

## Conclusion

The POS home screen APIs provide a comprehensive foundation for building a modern, efficient point-of-sale system. The implementation follows best practices with proper error handling, validation, and transaction management, ensuring data integrity and system reliability.
