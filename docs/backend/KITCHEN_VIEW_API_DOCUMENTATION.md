# Kitchen View API Documentation

## Overview

This document describes the Kitchen View APIs for restaurant/cafe outlets. The Kitchen View allows kitchen staff to see orders that are being prepared and mark them as ready when complete.

## Base Path

All kitchen view endpoints are under: `/api/admin/kitchen`

## Response Format

All API responses follow a standardized format:

```json
{
  "status": "SUCCESS" | "ERROR",
  "code": "success" | "error_code",
  "message": "Human-readable message",
  "timestamp": "2025-10-17T10:00:00Z",
  "path": "/api/admin/kitchen/orders",
  "data": {} | []
}
```

## Endpoints

### 1. Get Kitchen Orders

Retrieves all orders currently being prepared in the kitchen for a specific outlet. Only returns orders with `PREPARING` status.

**Endpoint:** `GET /api/admin/kitchen/orders`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `outletId` | Long | Yes | The ID of the outlet (must be RESTAURANT_CAFE mode) |

**Response Status Codes:**

- `200 OK` - Kitchen orders retrieved successfully
- `400 Bad Request` - Missing or invalid query parameters
- `401 Unauthorized` - Missing or invalid authentication
- `500 Internal Server Error` - Server error

**Response Body:**

```json
{
  "status": "SUCCESS",
  "code": "success",
  "message": "Kitchen orders retrieved successfully",
  "timestamp": "2025-10-17T10:00:00Z",
  "path": "/api/admin/kitchen/orders?outletId=1",
  "data": [
    {
      "id": 1,
      "orderNumber": "ORD-001",
      "orderType": "DINE_IN",
      "createdDate": "2025-10-17T09:30:00Z",
      "customerEmail": "john@example.com",
      "tableId": 2,
      "tableNumber": "Table 2",
      "items": [
        {
          "id": 1,
          "productName": "Margherita Pizza",
          "quantity": 1,
          "imageUrl": "https://example.com/images/pizza.jpg"
        },
        {
          "id": 2,
          "productName": "Chicken Burger",
          "quantity": 1,
          "imageUrl": "https://example.com/images/burger.jpg"
        }
      ]
    },
    {
      "id": 2,
      "orderNumber": "ORD-002",
      "orderType": "DINE_IN",
      "createdDate": "2025-10-17T09:45:00Z",
      "customerEmail": "jane@example.com",
      "tableId": null,
      "tableNumber": null,
      "items": [
        {
          "id": 3,
          "productName": "Chicken Pizza",
          "quantity": 1,
          "imageUrl": "https://example.com/images/chicken-pizza.jpg"
        },
        {
          "id": 4,
          "productName": "Truffled Mushroom Pizza",
          "quantity": 1,
          "imageUrl": "https://example.com/images/mushroom-pizza.jpg"
        }
      ]
    }
  ]
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | Long | Order ID |
| `orderNumber` | String | Unique order number |
| `orderType` | String | Type of order (DINE_IN, TAKEAWAY, DELIVERY, COUNTER) |
| `createdDate` | ISO 8601 DateTime | When the order was created |
| `customerEmail` | String | Customer's email address (if available) |
| `tableId` | Long | Table ID (if applicable) |
| `tableNumber` | String | Table number/name (if applicable) |
| `items` | Array | List of order items |
| `items[].id` | Long | Order item ID |
| `items[].productName` | String | Product name |
| `items[].quantity` | Decimal | Quantity ordered |
| `items[].imageUrl` | String | URL to product image (if available) |

**Example Request:**

```bash
curl -X GET "http://localhost:8080/api/admin/kitchen/orders?outletId=1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 2. Mark Order as Ready

Marks an order as ready/complete in the kitchen. This changes the order status from `PREPARING` to `READY`.

**Endpoint:** `POST /api/admin/kitchen/orders/{id}/ready`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | Long | Yes | Order ID |

**Response Status Codes:**

- `200 OK` - Order marked as ready successfully
- `400 Bad Request` - Order is not in PREPARING status
- `404 Not Found` - Order not found
- `401 Unauthorized` - Missing or invalid authentication
- `500 Internal Server Error` - Server error

**Response Body:**

```json
{
  "status": "SUCCESS",
  "code": "success.order.ready",
  "message": "Order marked as ready",
  "timestamp": "2025-10-17T10:00:00Z",
  "path": "/api/admin/kitchen/orders/1/ready",
  "data": {
    "id": 1,
    "orderNumber": "ORD-001",
    "outlet": {
      "id": 1,
      "name": "Main Restaurant",
      "code": "REST001",
      "mode": "RESTAURANT_CAFE"
    },
    "orderType": "DINE_IN",
    "status": "READY",
    "subtotal": 27.00,
    "taxAmount": 2.70,
    "totalAmount": 29.70,
    "createdDate": "2025-10-17T09:30:00Z",
    "items": [
      {
        "id": 1,
        "productName": "Margherita Pizza",
        "quantity": 1,
        "unitPrice": 15.00,
        "totalAmount": 15.00
      },
      {
        "id": 2,
        "productName": "Chicken Burger",
        "quantity": 1,
        "unitPrice": 12.00,
        "totalAmount": 12.00
      }
    ]
  }
}
```

**Example Request:**

```bash
curl -X POST "http://localhost:8080/api/admin/kitchen/orders/1/ready" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Order Status Flow for Kitchen

The kitchen view is specifically designed for orders in the `PREPARING` status. Here's the typical flow:

1. **ON_HOLD** - Order is held at POS terminal
2. **PREPARING** - Order is transferred to kitchen (shows in Kitchen View)
3. **READY** - Order is marked as ready by kitchen staff (removed from Kitchen View)
4. **COMPLETED** - Order is completed and paid for

## Business Rules

1. Only orders with status `PREPARING` appear in the Kitchen View
2. Only orders from outlets with mode `RESTAURANT_CAFE` should use Kitchen View
3. Orders can only be marked as ready if they are currently in `PREPARING` status
4. When an order is marked as ready, it disappears from the Kitchen View
5. Kitchen View shows the customer email (if available) and table information to help identify orders

## Error Handling

### Common Error Responses

**400 Bad Request - Invalid Status**
```json
{
  "status": "ERROR",
  "code": "error.invalid.status",
  "message": "Only orders with PREPARING status can be marked as ready",
  "timestamp": "2025-10-17T10:00:00Z",
  "path": "/api/admin/kitchen/orders/1/ready"
}
```

**404 Not Found - Order Not Found**
```json
{
  "status": "ERROR",
  "code": "error.not.found",
  "message": "Order not found with id: 999",
  "timestamp": "2025-10-17T10:00:00Z",
  "path": "/api/admin/kitchen/orders/999/ready"
}
```

## Integration Notes

- The Kitchen View should auto-refresh to show new orders as they are transferred from POS
- Consider implementing real-time updates using WebSocket or polling
- Product images should be optimized for display in the kitchen view
- Table information helps kitchen staff prioritize and identify orders
- Customer email can be used for order pickup notifications
