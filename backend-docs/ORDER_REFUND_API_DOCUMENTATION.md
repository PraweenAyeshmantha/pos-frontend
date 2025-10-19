# Order Refund/Return API Documentation

## Overview

This document describes the Order Refund/Return API that allows cashiers to process partial or full refunds for completed orders. The API supports selective item refunds, automatic restocking of returned products, and capturing the reason for refunds.

## Base Path

All order refund endpoints are under: `/api/admin/orders/{id}/refund`

## Response Format

All API responses follow the standardized format:

```json
{
  "code": "success.code",
  "message": "Human-readable message",
  "timestamp": "2025-10-17T14:00:00Z",
  "path": "/api/admin/orders/{id}/refund/partial",
  "data": {}
}
```

## Endpoints

### 1. Process Partial Refund

Process a partial refund for specific items in a completed order. This endpoint allows cashiers to select individual items and quantities to refund, optionally restock the returned items, and provide a reason for the refund.

**Endpoint:** `POST /api/admin/orders/{id}/refund/partial`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | Long | Yes | Order ID |

**Request Body:**

```json
{
  "items": [
    {
      "orderItemId": 1,
      "quantity": 1.0
    },
    {
      "orderItemId": 2,
      "quantity": 2.0
    }
  ],
  "restockItems": true,
  "reason": "Customer not satisfied with product quality"
}
```

**Request Body Schema:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `items` | Array | Yes | List of items to refund. Must contain at least one item. |
| `items[].orderItemId` | Long | Yes | The ID of the order item to refund |
| `items[].quantity` | Decimal | Yes | Quantity to refund. Must be positive and not exceed the original order quantity. |
| `restockItems` | Boolean | No | Whether to restock returned items. Defaults to `false`. Only applies to non-custom products. |
| `reason` | String | No | Optional reason for the refund |

**Response Status Codes:**

- `200 OK` - Refund processed successfully
- `400 Bad Request` - Invalid request (e.g., empty items list, invalid quantities, order not completed)
- `404 Not Found` - Order or order item not found
- `401 Unauthorized` - Missing or invalid authentication
- `500 Internal Server Error` - Server error

**Success Response:**

```json
{
  "code": "success.order.partially.refunded",
  "message": "Order partially refunded successfully",
  "timestamp": "2025-10-17T14:30:00Z",
  "path": "/api/admin/orders/362/refund/partial",
  "data": {
    "orderId": 362,
    "orderNumber": "ORD-362",
    "status": "REFUNDED",
    "refundedAmount": 46.20,
    "originalAmount": 187.00,
    "remainingAmount": 140.80,
    "restockedItems": true,
    "reason": "Customer not satisfied with product quality",
    "refundDate": "2025-10-17T14:30:00Z",
    "refundedItems": [
      {
        "orderItemId": 1,
        "productName": "Hoodie - Red, No",
        "quantity": 1.0,
        "unitPrice": 42.00,
        "totalAmount": 42.00
      },
      {
        "orderItemId": 5,
        "productName": "Album",
        "quantity": 1.0,
        "unitPrice": 15.00,
        "totalAmount": 15.00
      }
    ]
  }
}
```

**Response Data Schema:**

| Field | Type | Description |
|-------|------|-------------|
| `orderId` | Long | The ID of the refunded order |
| `orderNumber` | String | The order number |
| `status` | String | Updated order status (will be "REFUNDED") |
| `refundedAmount` | Decimal | Total amount refunded |
| `originalAmount` | Decimal | Original order total amount |
| `remainingAmount` | Decimal | Remaining amount after refund (originalAmount - refundedAmount) |
| `restockedItems` | Boolean | Whether items were restocked |
| `reason` | String | Reason for the refund (if provided) |
| `refundDate` | DateTime | Timestamp when the refund was processed |
| `refundedItems` | Array | Details of each refunded item |
| `refundedItems[].orderItemId` | Long | The ID of the refunded order item |
| `refundedItems[].productName` | String | Name of the refunded product |
| `refundedItems[].quantity` | Decimal | Quantity refunded |
| `refundedItems[].unitPrice` | Decimal | Unit price of the product |
| `refundedItems[].totalAmount` | Decimal | Total refund amount for this item |

**Error Response Examples:**

```json
{
  "code": "error.bad.request",
  "message": "Only completed orders can be refunded",
  "timestamp": "2025-10-17T14:30:00Z",
  "path": "/api/admin/orders/362/refund/partial",
  "data": null
}
```

```json
{
  "code": "error.bad.request",
  "message": "Refund quantity cannot exceed order quantity for item: Hoodie - Red, No",
  "timestamp": "2025-10-17T14:30:00Z",
  "path": "/api/admin/orders/362/refund/partial",
  "data": null
}
```

```json
{
  "code": "error.not.found",
  "message": "Order not found with id: 999",
  "timestamp": "2025-10-17T14:30:00Z",
  "path": "/api/admin/orders/999/refund/partial",
  "data": null
}
```

### 2. Process Full Refund (Existing)

Process a full refund for an order. This endpoint refunds the entire order without selectively choosing items.

**Endpoint:** `POST /api/admin/orders/{id}/refund`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | Long | Yes | Order ID |

**Response:**

```json
{
  "code": "success.order.refunded",
  "message": "Order refunded",
  "timestamp": "2025-10-17T14:30:00Z",
  "path": "/api/admin/orders/362/refund",
  "data": {
    "id": 362,
    "orderNumber": "ORD-362",
    "status": "REFUNDED",
    ...
  }
}
```

## Business Rules

1. **Order Status**: Only orders with `COMPLETED` status can be refunded.

2. **Quantity Validation**: 
   - Refund quantity must be positive
   - Refund quantity cannot exceed the original order quantity for each item
   - At least one item must be selected for refund

3. **Restocking**:
   - Restocking is optional and defaults to `false`
   - Only non-custom products are restocked
   - If a product is not found in stock for the outlet, the restock operation is skipped with a warning (refund still proceeds)
   - Stock quantity is increased by the refunded quantity

4. **Order Status Update**:
   - After a partial refund, the order status is updated to `REFUNDED`

5. **Refund Reason**:
   - The refund reason is optional
   - If provided, it is appended to the order notes with the prefix "Refund Reason: "

## Example Usage Scenarios

### Scenario 1: Partial Refund with Restocking

A customer returns one item from their order and wants it restocked:

```bash
POST /api/admin/orders/362/refund/partial
Content-Type: application/json

{
  "items": [
    {
      "orderItemId": 1,
      "quantity": 1.0
    }
  ],
  "restockItems": true,
  "reason": "Wrong size"
}
```

### Scenario 2: Multiple Items Refund without Restocking

A customer returns multiple items but the items are damaged (don't restock):

```bash
POST /api/admin/orders/362/refund/partial
Content-Type: application/json

{
  "items": [
    {
      "orderItemId": 1,
      "quantity": 1.0
    },
    {
      "orderItemId": 3,
      "quantity": 1.0
    },
    {
      "orderItemId": 5,
      "quantity": 1.0
    }
  ],
  "restockItems": false,
  "reason": "Products arrived damaged"
}
```

### Scenario 3: Partial Quantity Refund

A customer ordered 2 units but returns only 1:

```bash
POST /api/admin/orders/362/refund/partial
Content-Type: application/json

{
  "items": [
    {
      "orderItemId": 2,
      "quantity": 1.0
    }
  ],
  "restockItems": true,
  "reason": "Customer changed mind on one unit"
}
```

## Frontend Integration Notes

1. **Getting Available Items**: Use the `GET /api/admin/orders/{id}/details` endpoint to retrieve all items in the order with their quantities before allowing the user to select items for refund.

2. **Quantity Validation**: Implement client-side validation to ensure refund quantities don't exceed available quantities.

3. **UI Considerations**:
   - Display order items with +/- buttons to select refund quantities (as shown in the mockup)
   - Show a checkbox for "Restock Items" option
   - Provide a text field for optional refund reason
   - Calculate and display the refund amount in real-time as items are selected
   - Show the original order total, refund amount, and remaining amount

4. **Success Handling**: After a successful refund, refresh the order details to show the updated status.

## Testing

Example test cases are provided in:
- `OrderServicePartialRefundTest.java` - Service layer tests
- `OrderControllerPartialRefundTest.java` - Controller layer tests

These tests cover:
- Successful refund scenarios (single/multiple items, with/without restocking)
- Validation errors (invalid quantities, non-completed orders)
- Edge cases (custom products, partial quantities)
- Error handling (order not found, item not found)
