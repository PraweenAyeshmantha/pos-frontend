# Orders API Documentation

## Overview

This document describes the Orders Menu APIs that allow cashiers to verify order information, save orders, create receipts/invoices, and manage orders (hold, restore, transfer to kitchen, refund, and delete).

## Base Path

All order endpoints are under: `/api/admin/orders`

## Response Format

All API responses follow a standardized format:

```json
{
  "status": "SUCCESS" | "ERROR",
  "code": "success" | "error_code",
  "message": "Human-readable message",
  "timestamp": "2025-10-15T17:00:00Z",
  "path": "/api/admin/orders",
  "data": {} | []
}
```

## Endpoints

### 1. Get All Orders

Retrieves all orders with comprehensive details including customer, outlet, and cashier information.

**Endpoint:** `GET /api/admin/orders`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `outletId` | Long | No | Filter orders by specific outlet |
| `status` | String | No | Filter by order status (DRAFT, PENDING, PREPARING, READY, COMPLETED, CANCELLED, REFUNDED, ON_HOLD) |
| `startDate` | ISO 8601 DateTime | No | Filter orders from this date |
| `endDate` | ISO 8601 DateTime | No | Filter orders until this date |

**Response Status Codes:**

- `200 OK` - Orders retrieved successfully
- `400 Bad Request` - Invalid query parameters
- `401 Unauthorized` - Missing or invalid authentication
- `500 Internal Server Error` - Server error

**Response Body:**

```json
{
  "status": "SUCCESS",
  "code": "success",
  "message": "Orders retrieved successfully",
  "timestamp": "2025-10-15T17:00:00Z",
  "path": "/api/admin/orders",
  "data": [
    {
      "id": 1,
      "orderNumber": "ORD-001",
      "orderType": "COUNTER",
      "status": "COMPLETED",
      "subtotal": 100.00,
      "discountAmount": 10.00,
      "taxAmount": 9.00,
      "totalAmount": 99.00,
      "paidAmount": 100.00,
      "changeAmount": 1.00,
      "notes": "Customer requested extra napkins",
      "createdDate": "2025-10-15T10:30:00Z",
      "completedDate": "2025-10-15T10:35:00Z",
      "isOnline": false,
      "customerId": 123,
      "customerName": "Jane Smith",
      "customerEmail": "jane@example.com",
      "customerPhone": "1234567890",
      "outletId": 1,
      "outletName": "Main Store",
      "outletCode": "MS001",
      "cashierId": 5,
      "cashierName": "John Doe",
      "cashierUsername": "johndoe"
    }
  ]
}
```

### 2. Get Order Details with Items

Retrieves detailed order information including all order items.

**Endpoint:** `GET /api/admin/orders/{id}/details`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | Long | Yes | Order ID |

**Response Status Codes:**

- `200 OK` - Order details retrieved successfully
- `404 Not Found` - Order not found
- `401 Unauthorized` - Missing or invalid authentication
- `500 Internal Server Error` - Server error

**Response Body:**

```json
{
  "status": "SUCCESS",
  "code": "success",
  "message": "Order details retrieved successfully",
  "timestamp": "2025-10-15T17:00:00Z",
  "path": "/api/admin/orders/1/details",
  "data": {
    "id": 1,
    "orderNumber": "ORD-001",
    "orderType": "COUNTER",
    "status": "COMPLETED",
    "subtotal": 100.00,
    "discountAmount": 10.00,
    "taxAmount": 9.00,
    "totalAmount": 99.00,
    "paidAmount": 100.00,
    "changeAmount": 1.00,
    "notes": "Customer notes",
    "createdDate": "2025-10-15T10:30:00Z",
    "completedDate": "2025-10-15T10:35:00Z",
    "isOnline": false,
    "customerId": 123,
    "customerName": "Jane Smith",
    "customerEmail": "jane@example.com",
    "customerPhone": "1234567890",
    "outletId": 1,
    "outletName": "Main Store",
    "outletCode": "MS001",
    "cashierId": 5,
    "cashierName": "John Doe",
    "cashierUsername": "johndoe",
    "tableId": 10,
    "tableNumber": "T-05",
    "items": [
      {
        "id": 1,
        "productId": 100,
        "productName": "Hoodie - Red, No",
        "quantity": 1.00,
        "unitPrice": 42.00,
        "discountAmount": 0.00,
        "taxRate": 10.00,
        "taxAmount": 4.20,
        "totalAmount": 42.00,
        "notes": null,
        "isCustom": false
      },
      {
        "id": 2,
        "productId": 101,
        "productName": "Hoodie with Pocket",
        "quantity": 2.00,
        "unitPrice": 35.00,
        "discountAmount": 0.00,
        "taxRate": 10.00,
        "taxAmount": 7.00,
        "totalAmount": 70.00,
        "notes": null,
        "isCustom": false
      }
    ]
  }
}
```

### 3. Hold Order

Put an order on hold for later processing.

**Endpoint:** `POST /api/admin/orders/{id}/hold`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | Long | Yes | Order ID |

**Request Body:**

```json
{
  "notes": "Waiting for friends"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `notes` | String | No | Optional notes explaining why the order is being held |

**Response Status Codes:**

- `200 OK` - Order put on hold successfully
- `404 Not Found` - Order not found
- `400 Bad Request` - Invalid order status for hold operation
- `401 Unauthorized` - Missing or invalid authentication
- `500 Internal Server Error` - Server error

**Response Body:**

```json
{
  "status": "SUCCESS",
  "code": "success.order.held",
  "message": "Order put on hold",
  "timestamp": "2025-10-15T17:00:00Z",
  "path": "/api/admin/orders/1/hold",
  "data": {
    "id": 1,
    "orderNumber": "ORD-001",
    "status": "ON_HOLD",
    "notes": "Waiting for friends",
    ...
  }
}
```

### 4. Restore Order to Cart

Restore a held order back to the cart for modifications.

**Endpoint:** `POST /api/admin/orders/{id}/restore`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | Long | Yes | Order ID |

**Response Status Codes:**

- `200 OK` - Order restored to cart successfully
- `404 Not Found` - Order not found
- `400 Bad Request` - Only orders with ON_HOLD status can be restored
- `401 Unauthorized` - Missing or invalid authentication
- `500 Internal Server Error` - Server error

**Response Body:**

```json
{
  "status": "SUCCESS",
  "code": "success.order.restored",
  "message": "Order restored to cart",
  "timestamp": "2025-10-15T17:00:00Z",
  "path": "/api/admin/orders/1/restore",
  "data": {
    "id": 1,
    "orderNumber": "ORD-001",
    "status": "DRAFT",
    ...
  }
}
```

### 5. Transfer Order to Kitchen

Transfer an order to the kitchen for preparation (restaurant/cafe outlets only).

**Endpoint:** `POST /api/admin/orders/{id}/transfer-to-kitchen`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | Long | Yes | Order ID |

**Response Status Codes:**

- `200 OK` - Order transferred to kitchen successfully
- `404 Not Found` - Order not found
- `400 Bad Request` - Only orders with ON_HOLD or DRAFT status can be transferred
- `401 Unauthorized` - Missing or invalid authentication
- `500 Internal Server Error` - Server error

**Response Body:**

```json
{
  "status": "SUCCESS",
  "code": "success.order.transferred",
  "message": "Order transferred to kitchen",
  "timestamp": "2025-10-15T17:00:00Z",
  "path": "/api/admin/orders/1/transfer-to-kitchen",
  "data": {
    "id": 1,
    "orderNumber": "ORD-001",
    "status": "PREPARING",
    ...
  }
}
```

### 6. Cancel Order

Cancel an existing order.

**Endpoint:** `POST /api/admin/orders/{id}/cancel`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | Long | Yes | Order ID |

**Response Status Codes:**

- `200 OK` - Order cancelled successfully
- `404 Not Found` - Order not found
- `401 Unauthorized` - Missing or invalid authentication
- `500 Internal Server Error` - Server error

**Response Body:**

```json
{
  "status": "SUCCESS",
  "code": "success.order.cancelled",
  "message": "Order cancelled",
  "timestamp": "2025-10-15T17:00:00Z",
  "path": "/api/admin/orders/1/cancel",
  "data": {
    "id": 1,
    "orderNumber": "ORD-001",
    "status": "CANCELLED",
    ...
  }
}
```

### 7. Refund Order

Refund a completed order.

**Endpoint:** `POST /api/admin/orders/{id}/refund`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | Long | Yes | Order ID |

**Response Status Codes:**

- `200 OK` - Order refunded successfully
- `404 Not Found` - Order not found
- `401 Unauthorized` - Missing or invalid authentication
- `500 Internal Server Error` - Server error

**Response Body:**

```json
{
  "status": "SUCCESS",
  "code": "success.order.refunded",
  "message": "Order refunded",
  "timestamp": "2025-10-15T17:00:00Z",
  "path": "/api/admin/orders/1/refund",
  "data": {
    "id": 1,
    "orderNumber": "ORD-001",
    "status": "REFUNDED",
    ...
  }
}
```

### 8. Delete Order

Delete an order (not available for completed orders).

**Endpoint:** `DELETE /api/admin/orders/{id}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | Long | Yes | Order ID |

**Response Status Codes:**

- `200 OK` - Order deleted successfully
- `404 Not Found` - Order not found
- `400 Bad Request` - Cannot delete completed orders
- `401 Unauthorized` - Missing or invalid authentication
- `500 Internal Server Error` - Server error

**Response Body:**

```json
{
  "status": "SUCCESS",
  "code": "success.order.deleted",
  "message": "Order deleted successfully",
  "timestamp": "2025-10-15T17:00:00Z",
  "path": "/api/admin/orders/1",
  "data": null
}
```

## Data Models

### OrderDTO

Basic order information without items:

| Field | Type | Description |
|-------|------|-------------|
| `id` | Long | Order unique identifier |
| `orderNumber` | String | Human-readable order number |
| `orderType` | String | Type of order (DINE_IN, TAKEAWAY, DELIVERY, COUNTER) |
| `status` | String | Current order status |
| `subtotal` | BigDecimal | Subtotal amount before taxes and discounts |
| `discountAmount` | BigDecimal | Discount applied to the order |
| `taxAmount` | BigDecimal | Tax amount |
| `totalAmount` | BigDecimal | Final total amount |
| `paidAmount` | BigDecimal | Amount paid by customer |
| `changeAmount` | BigDecimal | Change given to customer |
| `notes` | String | Any additional notes for the order |
| `createdDate` | ISO 8601 DateTime | When the order was created |
| `completedDate` | ISO 8601 DateTime | When the order was completed (if applicable) |
| `isOnline` | Boolean | Whether this is an online order |
| `customerId` | Long | Customer unique identifier |
| `customerName` | String | Customer full name |
| `customerEmail` | String | Customer email address |
| `customerPhone` | String | Customer phone number |
| `outletId` | Long | Outlet unique identifier |
| `outletName` | String | Name of the outlet where order was placed |
| `outletCode` | String | Outlet code |
| `cashierId` | Long | Cashier unique identifier |
| `cashierName` | String | Name of the cashier who processed the order |
| `cashierUsername` | String | Cashier username |

### OrderDetailDTO

Extended order information including items (extends OrderDTO):

Includes all fields from OrderDTO plus:

| Field | Type | Description |
|-------|------|-------------|
| `tableId` | Long | Table unique identifier (if applicable) |
| `tableNumber` | String | Table number (if applicable) |
| `items` | List<OrderItemDTO> | List of order items |

### OrderItemDTO

Individual order item information:

| Field | Type | Description |
|-------|------|-------------|
| `id` | Long | Order item unique identifier |
| `productId` | Long | Product unique identifier |
| `productName` | String | Product name |
| `quantity` | BigDecimal | Quantity ordered |
| `unitPrice` | BigDecimal | Unit price of the product |
| `discountAmount` | BigDecimal | Discount applied to this item |
| `taxRate` | BigDecimal | Tax rate percentage |
| `taxAmount` | BigDecimal | Tax amount for this item |
| `totalAmount` | BigDecimal | Total amount for this item |
| `notes` | String | Additional notes for this item |
| `isCustom` | Boolean | Whether this is a custom item |

## Order Status Values

| Status | Description |
|--------|-------------|
| `DRAFT` | Order is being created/edited |
| `PENDING` | Order is pending processing |
| `PREPARING` | Order is being prepared (kitchen) |
| `READY` | Order is ready for pickup/delivery |
| `COMPLETED` | Order has been completed |
| `CANCELLED` | Order has been cancelled |
| `REFUNDED` | Order has been refunded |
| `ON_HOLD` | Order is on hold |

## Order Type Values

| Type | Description |
|------|-------------|
| `DINE_IN` | Customer dining in at the restaurant |
| `TAKEAWAY` | Customer taking order to go |
| `DELIVERY` | Order will be delivered |
| `COUNTER` | Quick counter service |

## Usage Examples

### Get All Orders

```bash
curl -X GET "http://localhost:8080/api/admin/orders" \
  -H "Content-Type: application/json"
```

### Get Orders by Outlet and Status

```bash
curl -X GET "http://localhost:8080/api/admin/orders?outletId=1&status=ON_HOLD" \
  -H "Content-Type: application/json"
```

### Get Order Details with Items

```bash
curl -X GET "http://localhost:8080/api/admin/orders/1/details" \
  -H "Content-Type: application/json"
```

### Hold Order

```bash
curl -X POST "http://localhost:8080/api/admin/orders/1/hold" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Waiting for friends"}'
```

### Restore Held Order to Cart

```bash
curl -X POST "http://localhost:8080/api/admin/orders/1/restore" \
  -H "Content-Type: application/json"
```

### Transfer Order to Kitchen

```bash
curl -X POST "http://localhost:8080/api/admin/orders/1/transfer-to-kitchen" \
  -H "Content-Type: application/json"
```

### Delete Order

```bash
curl -X DELETE "http://localhost:8080/api/admin/orders/1" \
  -H "Content-Type: application/json"
```

## Frontend Integration

The frontend can use these APIs to:

1. **Display Orders List**: Use `GET /api/admin/orders` with filtering by online/offline/hold status
2. **Show Order Details**: Use `GET /api/admin/orders/{id}/details` to display order with all items
3. **Print Invoice**: Use order details to generate and print invoices/receipts
4. **Manage Held Orders**: 
   - Restore to cart: `POST /api/admin/orders/{id}/restore`
   - Transfer to kitchen: `POST /api/admin/orders/{id}/transfer-to-kitchen`
   - Delete: `DELETE /api/admin/orders/{id}`
5. **Process Refunds**: Use `POST /api/admin/orders/{id}/refund` to refund orders

## Error Handling

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "status": "ERROR",
  "code": "error.bad_request",
  "message": "Invalid request parameters or order state",
  "timestamp": "2025-10-15T17:00:00Z",
  "path": "/api/admin/orders/1/restore"
}
```

### 404 Not Found

```json
{
  "status": "ERROR",
  "code": "error.not_found",
  "message": "Order not found with id: 1",
  "timestamp": "2025-10-15T17:00:00Z",
  "path": "/api/admin/orders/1"
}
```

### 500 Internal Server Error

```json
{
  "status": "ERROR",
  "code": "error.internal",
  "message": "An unexpected error occurred",
  "timestamp": "2025-10-15T17:00:00Z",
  "path": "/api/admin/orders"
}
```

## Best Practices

1. **Always check order status** before attempting state transitions
2. **Handle errors gracefully** on the frontend with appropriate user feedback
3. **Use order details endpoint** when you need item information to avoid multiple API calls
4. **Filter orders efficiently** using query parameters to reduce data transfer
5. **Implement proper authentication** to secure order management operations
6. **Consider caching** for frequently accessed order data to improve performance
