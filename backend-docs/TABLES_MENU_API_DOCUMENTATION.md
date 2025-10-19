# Tables Menu API Documentation

## Overview

This document describes the comprehensive set of APIs developed for the Tables Menu feature in Restaurant/Cafe outlets. These APIs enable cashiers to manage dining tables, create and hold orders for tables, and complete table orders with payment processing.

## Features

The Tables Menu APIs provide the following functionality:

### 1. Table Management
- **Get Tables**: Retrieve all active tables for a restaurant/cafe outlet
- **Filter by Status**: Get tables filtered by status (AVAILABLE, OCCUPIED, RESERVED, CLEANING)

### 2. Table Order Management
- **Create Table Order**: Create a new order for a table and automatically set it to ON_HOLD
- **Get Table Orders**: Retrieve all held orders for a specific table
- **Associate Order with Table**: Link an existing order to a table
- **Complete Table Order**: Process a held order with discount and payment to complete the transaction

## Workflow

The typical workflow for the Tables Menu feature:

1. **Cashier selects a table**: Use `GET /api/pos/tables` to show available tables
2. **Customer orders items**: Cashier adds items and creates order with `POST /api/pos/tables/{tableId}/orders`
3. **Order is held**: The order is automatically set to ON_HOLD status and table status becomes OCCUPIED
4. **Customer requests bill**: Cashier retrieves the held order with `GET /api/pos/tables/{tableId}/orders`
5. **Process payment**: Use `POST /api/pos/orders/{orderId}/complete` to apply discounts, process payments, and complete the order
6. **Table becomes available**: Table status is automatically set back to AVAILABLE

## API Endpoints

### 1. Get Tables

#### GET /api/pos/tables

Retrieves all active tables for a restaurant/cafe outlet with optional status filtering.

**Query Parameters:**
- `outletId` (required): ID of the outlet
- `status` (optional): Filter by table status (AVAILABLE, OCCUPIED, RESERVED, CLEANING)

**Request Example:**
```bash
curl -X GET "http://localhost:8080/pos-codex/api/pos/tables?outletId=1&status=AVAILABLE" \
  -H "X-Tenant-ID: PaPos"
```

**Response:**
```json
{
  "code": "success",
  "message": "Tables retrieved successfully",
  "timestamp": "2025-10-15T15:30:00Z",
  "path": "/api/pos/tables",
  "data": [
    {
      "id": 1,
      "tableNumber": "T-01",
      "capacity": 4,
      "outlet": {
        "id": 1,
        "name": "Main Restaurant",
        "mode": "RESTAURANT_CAFE"
      },
      "status": "AVAILABLE",
      "isActive": true,
      "createdDate": "2025-10-11T07:00:00Z",
      "createdUser": "admin"
    },
    {
      "id": 2,
      "tableNumber": "T-02",
      "capacity": 2,
      "outlet": {
        "id": 1,
        "name": "Main Restaurant",
        "mode": "RESTAURANT_CAFE"
      },
      "status": "AVAILABLE",
      "isActive": true,
      "createdDate": "2025-10-11T07:00:00Z",
      "createdUser": "admin"
    }
  ]
}
```

**Status Codes:**
- `200 OK`: Tables retrieved successfully
- `400 Bad Request`: Invalid outlet or outlet is not a restaurant/cafe
- `404 Not Found`: Outlet not found

---

### 2. Create Table Order

#### POST /api/pos/tables/{tableId}/orders

Creates a new order for a specific table and automatically sets it to ON_HOLD status. The table status is automatically updated to OCCUPIED.

**Path Parameters:**
- `tableId`: ID of the table

**Request Body:**
```json
{
  "outletId": 1,
  "tableId": 1,
  "cashierId": 1,
  "customerId": 1,
  "orderType": "DINE_IN",
  "items": [
    {
      "productId": 1,
      "productName": "Burger",
      "quantity": 2,
      "unitPrice": 15.00,
      "discountAmount": 0,
      "notes": "No onions"
    },
    {
      "productId": 2,
      "productName": "Fries",
      "quantity": 2,
      "unitPrice": 5.00,
      "discountAmount": 0,
      "notes": null
    }
  ],
  "notes": "Customer seated at window table"
}
```

**Request Example:**
```bash
curl -X POST "http://localhost:8080/pos-codex/api/pos/tables/1/orders" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "outletId": 1,
    "tableId": 1,
    "cashierId": 1,
    "customerId": 1,
    "orderType": "DINE_IN",
    "items": [
      {
        "productId": 1,
        "productName": "Burger",
        "quantity": 2,
        "unitPrice": 15.00,
        "discountAmount": 0,
        "notes": "No onions"
      }
    ],
    "notes": "Customer seated at window table"
  }'
```

**Response:**
```json
{
  "code": "success.order.created",
  "message": "Table order created and held successfully",
  "timestamp": "2025-10-15T15:30:00Z",
  "path": "/api/pos/tables/1/orders",
  "data": {
    "id": 1,
    "orderNumber": "ORD-1729008600000-ABC12345",
    "outlet": {
      "id": 1,
      "name": "Main Restaurant"
    },
    "cashier": {
      "id": 1,
      "username": "cashier1"
    },
    "customer": {
      "id": 1,
      "name": "John Doe"
    },
    "table": {
      "id": 1,
      "tableNumber": "T-01"
    },
    "orderType": "DINE_IN",
    "status": "ON_HOLD",
    "subtotal": 40.00,
    "discountAmount": 0.00,
    "taxAmount": 4.00,
    "totalAmount": 44.00,
    "paidAmount": 0.00,
    "notes": "Customer seated at window table",
    "items": [
      {
        "id": 1,
        "productName": "Burger",
        "quantity": 2,
        "unitPrice": 15.00,
        "discountAmount": 0.00,
        "taxAmount": 3.00,
        "totalAmount": 33.00,
        "notes": "No onions"
      },
      {
        "id": 2,
        "productName": "Fries",
        "quantity": 2,
        "unitPrice": 5.00,
        "discountAmount": 0.00,
        "taxAmount": 1.00,
        "totalAmount": 11.00
      }
    ],
    "createdDate": "2025-10-15T15:30:00Z",
    "createdUser": "cashier1"
  }
}
```

**Status Codes:**
- `201 Created`: Order created and held successfully
- `400 Bad Request`: Invalid table, outlet mismatch, or outlet is not a restaurant/cafe
- `404 Not Found`: Table, outlet, cashier, or customer not found

---

### 3. Get Table Orders

#### GET /api/pos/tables/{tableId}/orders

Retrieves all ON_HOLD orders for a specific table.

**Path Parameters:**
- `tableId`: ID of the table

**Request Example:**
```bash
curl -X GET "http://localhost:8080/pos-codex/api/pos/tables/1/orders" \
  -H "X-Tenant-ID: PaPos"
```

**Response:**
```json
{
  "code": "success",
  "message": "Table orders retrieved successfully",
  "timestamp": "2025-10-15T15:35:00Z",
  "path": "/api/pos/tables/1/orders",
  "data": [
    {
      "id": 1,
      "orderNumber": "ORD-1729008600000-ABC12345",
      "orderType": "DINE_IN",
      "status": "ON_HOLD",
      "subtotal": 40.00,
      "taxAmount": 4.00,
      "totalAmount": 44.00,
      "table": {
        "id": 1,
        "tableNumber": "T-01"
      },
      "items": [
        {
          "productName": "Burger",
          "quantity": 2,
          "unitPrice": 15.00,
          "totalAmount": 33.00
        },
        {
          "productName": "Fries",
          "quantity": 2,
          "unitPrice": 5.00,
          "totalAmount": 11.00
        }
      ]
    }
  ]
}
```

**Status Codes:**
- `200 OK`: Orders retrieved successfully
- `404 Not Found`: Table not found

---

### 4. Associate Order with Table

#### POST /api/pos/orders/{orderId}/table

Associates an existing order with a table and sets the order status to ON_HOLD. The table status is updated to OCCUPIED.

**Path Parameters:**
- `orderId`: ID of the order

**Request Body:**
```json
{
  "tableId": 1
}
```

**Request Example:**
```bash
curl -X POST "http://localhost:8080/pos-codex/api/pos/orders/1/table" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{"tableId": 1}'
```

**Response:**
```json
{
  "code": "success",
  "message": "Order associated with table successfully",
  "timestamp": "2025-10-15T15:30:00Z",
  "path": "/api/pos/orders/1/table",
  "data": {
    "id": 1,
    "orderNumber": "ORD-1729008600000-ABC12345",
    "status": "ON_HOLD",
    "table": {
      "id": 1,
      "tableNumber": "T-01",
      "status": "OCCUPIED"
    }
  }
}
```

**Status Codes:**
- `200 OK`: Order associated with table successfully
- `400 Bad Request`: Table and order outlet mismatch
- `404 Not Found`: Order or table not found

---

### 5. Complete Table Order

#### POST /api/pos/orders/{orderId}/complete

Completes a held order by applying discounts, processing payments, and updating the order status to COMPLETED. The table status is automatically set back to AVAILABLE.

**Path Parameters:**
- `orderId`: ID of the order

**Request Body:**
```json
{
  "discountAmount": 5.00,
  "discountType": "FIXED",
  "payments": [
    {
      "paymentMethodId": 1,
      "amount": 50.00
    }
  ]
}
```

**Discount Types:**
- `FIXED`: Fixed amount discount
- `PERCENTAGE`: Percentage discount

**Request Example:**
```bash
curl -X POST "http://localhost:8080/pos-codex/api/pos/orders/1/complete" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "discountAmount": 5.00,
    "discountType": "FIXED",
    "payments": [
      {
        "paymentMethodId": 1,
        "amount": 50.00
      }
    ]
  }'
```

**Response:**
```json
{
  "code": "success.order.completed",
  "message": "Order completed successfully",
  "timestamp": "2025-10-15T15:40:00Z",
  "path": "/api/pos/orders/1/complete",
  "data": {
    "id": 1,
    "orderNumber": "ORD-1729008600000-ABC12345",
    "orderType": "DINE_IN",
    "status": "COMPLETED",
    "subtotal": 40.00,
    "discountAmount": 5.00,
    "taxAmount": 4.00,
    "totalAmount": 39.00,
    "paidAmount": 50.00,
    "changeAmount": 11.00,
    "table": {
      "id": 1,
      "tableNumber": "T-01",
      "status": "AVAILABLE"
    },
    "payments": [
      {
        "id": 1,
        "paymentMethod": {
          "id": 1,
          "name": "Cash"
        },
        "amount": 50.00
      }
    ],
    "completedDate": "2025-10-15T15:40:00Z"
  }
}
```

**Status Codes:**
- `200 OK`: Order completed successfully
- `400 Bad Request`: Order is not on hold
- `404 Not Found`: Order or payment method not found

---

## Business Logic

### Table Status Management

The system automatically manages table statuses:

1. **Creating Table Order**: When a table order is created, the table status is automatically set to `OCCUPIED`
2. **Completing Table Order**: When an order is completed with payment, the table status is automatically set back to `AVAILABLE`
3. **Associating Order**: When an order is associated with a table, the table status is set to `OCCUPIED`

### Order Status Flow

For table orders:

1. **Order Created**: Status is set to `ON_HOLD`
2. **Payment Processed**: Status changes to `COMPLETED`
3. **Table Released**: Table status returns to `AVAILABLE`

### Validation Rules

1. **Outlet Validation**: Tables are only available for outlets with mode `RESTAURANT_CAFE`
2. **Table-Outlet Match**: Orders and tables must belong to the same outlet
3. **Order Status**: Only orders with status `ON_HOLD` can be completed through the table workflow
4. **Payment Validation**: Total payment amount must be greater than or equal to the order total

## Error Handling

The API follows standard HTTP status codes and provides detailed error messages:

### 400 Bad Request
- Outlet is not a restaurant/cafe
- Table and order outlet mismatch
- Order is not on hold

### 404 Not Found
- Table not found
- Order not found
- Outlet not found
- Cashier not found
- Customer not found
- Payment method not found

### Example Error Response
```json
{
  "code": "error.dining-table.outlet-not-restaurant",
  "message": "Tables are only available for RESTAURANT_CAFE outlets",
  "timestamp": "2025-10-15T15:30:00Z",
  "path": "/api/pos/tables"
}
```

## Testing

### Unit Tests

Comprehensive unit tests cover all table endpoints:
- Get tables (with and without status filter)
- Create table order
- Get table orders
- Associate order with table
- Complete table order

**Test Results:**
- 18 tests for PosController (including 6 new table-related tests)
- All tests passing ✅

### Manual Testing

A test script is available for manual testing:
```bash
./test-tables-menu-apis.sh
```

## Integration with Existing Features

The Tables Menu APIs integrate seamlessly with existing POS features:

1. **Product Management**: Uses existing product catalog
2. **Customer Management**: Links orders to customers
3. **Payment Processing**: Uses existing payment methods
4. **Order Management**: Extends existing order functionality
5. **Dining Table Management**: Built on top of existing table infrastructure

## Usage Examples

### Complete Table Order Workflow

```bash
# 1. Get available tables
curl -X GET "http://localhost:8080/pos-codex/api/pos/tables?outletId=1&status=AVAILABLE" \
  -H "X-Tenant-ID: PaPos"

# 2. Create order for table
curl -X POST "http://localhost:8080/pos-codex/api/pos/tables/1/orders" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "outletId": 1,
    "tableId": 1,
    "cashierId": 1,
    "orderType": "DINE_IN",
    "items": [
      {
        "productId": 1,
        "productName": "Burger",
        "quantity": 2,
        "unitPrice": 15.00
      }
    ]
  }'

# 3. Get orders for table (when customer requests bill)
curl -X GET "http://localhost:8080/pos-codex/api/pos/tables/1/orders" \
  -H "X-Tenant-ID: PaPos"

# 4. Complete order with payment
curl -X POST "http://localhost:8080/pos-codex/api/pos/orders/1/complete" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "discountAmount": 5.00,
    "discountType": "FIXED",
    "payments": [
      {
        "paymentMethodId": 1,
        "amount": 50.00
      }
    ]
  }'

# 5. Verify table is available again
curl -X GET "http://localhost:8080/pos-codex/api/pos/tables?outletId=1&status=AVAILABLE" \
  -H "X-Tenant-ID: PaPos"
```

## Future Enhancements

### Potential Features
- Table reservation system
- Split bill functionality (multiple payments per table)
- Table transfer (move order from one table to another)
- Table merging (combine multiple tables for large groups)
- Kitchen order display integration
- Real-time table status updates via WebSocket
- Table service time tracking
- Waiter/server assignment to tables

## Related Documentation

- [API Documentation](API_DOCUMENTATION.md) - Complete API reference
- [POS Home Screen APIs](POS_HOME_SCREEN_APIS.md) - POS home screen functionality
- [Dining Table Management](API_DOCUMENTATION.md#dining-table-management) - Admin dining table management

## Conclusion

The Tables Menu APIs provide a comprehensive solution for managing restaurant/cafe table operations. The implementation follows best practices with proper validation, error handling, and transaction management, ensuring data integrity and system reliability.
