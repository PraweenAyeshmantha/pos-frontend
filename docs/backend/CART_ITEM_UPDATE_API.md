# Cart Item Update API Documentation

## Overview
The Cart Item Update API allows cashiers to modify the quantity and price of items directly in the cart (order). This is useful when adjustments need to be made to items before completing a transaction.

## Endpoint

### Update Order Item
```http
PUT /api/pos/orders/{orderId}/items/{itemId}
```

Updates the quantity and unit price of a specific item in an order.

#### Path Parameters
- `orderId` (Long, required): The ID of the order containing the item
- `itemId` (Long, required): The ID of the order item to update

#### Request Headers
- `X-Tenant-ID`: Tenant identifier (required)
- `Content-Type`: `application/json` (required)

#### Request Body
```json
{
  "quantity": 3.00,
  "unitPrice": 15.00
}
```

**Fields:**
- `quantity` (BigDecimal, required): New quantity for the item. Must be greater than 0.
- `unitPrice` (BigDecimal, required): New unit price for the item. Must be greater than or equal to 0.

#### Response
Returns the updated order item with recalculated totals.

**Success Response (200 OK):**
```json
{
  "code": "success",
  "message": "Order item updated successfully",
  "timestamp": "2025-10-17T12:30:00Z",
  "path": "/api/pos/orders/1/items/1",
  "data": {
    "id": 1,
    "productId": 10,
    "productName": "Cheese Burger",
    "quantity": 3.00,
    "unitPrice": 15.00,
    "discountAmount": 0.00,
    "taxRate": 5.00,
    "taxAmount": 2.14,
    "totalAmount": 47.14,
    "notes": null,
    "isCustom": false,
    "weight": null
  }
}
```

#### Business Rules

1. **Order Status Validation**: Items can only be updated for orders with the following statuses:
   - `PENDING`
   - `DRAFT`
   - `ON_HOLD`

2. **Automatic Recalculation**: When an item is updated:
   - Item total is recalculated based on new quantity and price
   - Tax amount is recalculated based on the item's tax rate
   - Order subtotal is recalculated
   - Order total is recalculated (including discount and tax)

3. **Item Ownership**: The item must belong to the specified order. Cross-order updates are not allowed.

#### Error Responses

**Order Not Found (404 Not Found):**
```json
{
  "code": "error",
  "message": "Order not found with id: 999",
  "timestamp": "2025-10-17T12:30:00Z",
  "path": "/api/pos/orders/999/items/1"
}
```

**Order Item Not Found (404 Not Found):**
```json
{
  "code": "error",
  "message": "Order item not found with id: 999",
  "timestamp": "2025-10-17T12:30:00Z",
  "path": "/api/pos/orders/1/items/999"
}
```

**Invalid Order Status (400 Bad Request):**
```json
{
  "code": "error.order.cannot-update-items",
  "message": "Cannot update items for orders with status: COMPLETED",
  "timestamp": "2025-10-17T12:30:00Z",
  "path": "/api/pos/orders/1/items/1"
}
```

**Item Belongs to Another Order (400 Bad Request):**
```json
{
  "code": "error.order-item.order-mismatch",
  "message": "Order item does not belong to the specified order",
  "timestamp": "2025-10-17T12:30:00Z",
  "path": "/api/pos/orders/1/items/1"
}
```

**Validation Error (400 Bad Request):**
```json
{
  "code": "error.validation",
  "message": "Validation failed",
  "timestamp": "2025-10-17T12:30:00Z",
  "path": "/api/pos/orders/1/items/1",
  "errors": {
    "quantity": "Quantity must be greater than 0"
  }
}
```

## Usage Example

### Using cURL
```bash
# Update an order item quantity and price
curl -X PUT "http://localhost:8080/pos-codex/api/pos/orders/1/items/1" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 3.00,
    "unitPrice": 15.00
  }'
```

### Using JavaScript (Fetch API)
```javascript
async function updateCartItem(orderId, itemId, quantity, unitPrice) {
  const response = await fetch(
    `http://localhost:8080/pos-codex/api/pos/orders/${orderId}/items/${itemId}`,
    {
      method: 'PUT',
      headers: {
        'X-Tenant-ID': 'PaPos',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        quantity: quantity,
        unitPrice: unitPrice
      })
    }
  );
  
  const result = await response.json();
  
  if (response.ok) {
    console.log('Item updated successfully:', result.data);
    return result.data;
  } else {
    console.error('Error updating item:', result.message);
    throw new Error(result.message);
  }
}

// Example usage
updateCartItem(1, 1, 3.00, 15.00)
  .then(updatedItem => {
    console.log('Updated quantity:', updatedItem.quantity);
    console.log('Updated price:', updatedItem.unitPrice);
    console.log('New total:', updatedItem.totalAmount);
  })
  .catch(error => {
    console.error('Failed to update item:', error);
  });
```

## Frontend Integration Tips

1. **Update UI Immediately**: Update the cart display optimistically when the user clicks "Update", then confirm with the API response.

2. **Show Recalculated Totals**: After updating an item, display the new item total, subtotal, and order total from the API response.

3. **Handle Errors Gracefully**: If the update fails (e.g., order already completed), show a user-friendly error message and revert the UI changes.

4. **Disable Updates for Completed Orders**: Check the order status before allowing item updates in the UI.

5. **Validation**: Validate quantity and price on the client side before sending the request to provide immediate feedback.

## Testing

The implementation includes comprehensive unit tests:
- `PosControllerTest.testUpdateOrderItem_ReturnsUpdatedItem()`: Tests the controller endpoint
- `PosServiceUpdateOrderItemTest`: Tests various scenarios including:
  - Successful item update
  - Order not found
  - Order item not found
  - Invalid order status (completed orders)
  - Item belonging to another order

Run tests with:
```bash
mvn test -Dtest=PosControllerTest#testUpdateOrderItem_ReturnsUpdatedItem
mvn test -Dtest=PosServiceUpdateOrderItemTest
```
