# Cart Item Update Feature - Implementation Summary

## Overview
This implementation adds the ability for cashiers to modify the price and quantity of cart items (order items) directly from the POS interface, as requested in the issue.

## Changes Made

### 1. New DTO - UpdateOrderItemRequest
**File**: `src/main/java/com/pos/dto/UpdateOrderItemRequest.java`

A request DTO with validation for updating order items:
- `quantity` (BigDecimal): Must be greater than 0
- `unitPrice` (BigDecimal): Must be >= 0

### 2. Service Layer - PosService
**File**: `src/main/java/com/pos/service/PosService.java`

Added two methods:
- `updateOrderItem(Long orderId, Long itemId, BigDecimal quantity, BigDecimal unitPrice)`: Main method to update an order item
- `recalculateOrderTotals(Order order)`: Helper method to recalculate order totals after item updates

**Business Rules Implemented**:
- Only allows updates for orders with status: PENDING, DRAFT, or ON_HOLD
- Validates that the item belongs to the specified order
- Automatically recalculates:
  - Item total (quantity × unit price)
  - Item tax amount (based on tax rate)
  - Order subtotal
  - Order total (subtotal - discount + tax)

### 3. Controller Layer - PosController
**File**: `src/main/java/com/pos/controller/PosController.java`

Added new endpoint:
```
PUT /api/pos/orders/{orderId}/items/{itemId}
```

### 4. Tests
**Files**:
- `src/test/java/com/pos/controller/PosControllerTest.java`: Controller test
- `src/test/java/com/pos/service/PosServiceUpdateOrderItemTest.java`: Service layer tests (5 test cases)

**Test Coverage**:
- ✅ Successful item update
- ✅ Order not found
- ✅ Order item not found
- ✅ Invalid order status (completed orders)
- ✅ Item belonging to another order
- ✅ Validation errors (invalid quantity/price)

### 5. Documentation
**Files**:
- `CART_ITEM_UPDATE_API.md`: Complete API documentation with examples
- `test-cart-item-update.sh`: Test script for manual verification

## API Usage Example

### Request
```bash
curl -X PUT "http://localhost:8080/pos-codex/api/pos/orders/1/items/1" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 3.00,
    "unitPrice": 15.00
  }'
```

### Response
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

## Security Considerations

1. **Input Validation**: Using Jakarta validation annotations to ensure valid inputs
2. **Authorization**: Only allows updates on orders in specific statuses (PENDING, DRAFT, ON_HOLD)
3. **Resource Ownership**: Validates that the item belongs to the specified order
4. **SQL Injection Prevention**: Using JPA repositories with parameterized queries
5. **Proper Error Handling**: Custom exceptions for different error scenarios

## Testing Results

- ✅ **Unit Tests**: All 6 new tests pass (1 controller + 5 service tests)
- ✅ **Integration**: 246 total tests pass (1 unrelated DB test fails as before)
- ✅ **Build**: Application packages successfully
- ✅ **Compilation**: No compilation errors

## Integration Notes for Frontend

When integrating this endpoint in the frontend:

1. **Validate Input**: Check quantity > 0 and price >= 0 before sending request
2. **Update UI Optimistically**: Update the cart display immediately, then confirm with API response
3. **Show Recalculated Totals**: Display the new item total, subtotal, and order total from the response
4. **Handle Errors**: Show user-friendly messages for validation or status errors
5. **Disable for Completed Orders**: Check order status before allowing modifications

## Files Modified

```
modified:   src/main/java/com/pos/controller/PosController.java
modified:   src/main/java/com/pos/service/PosService.java
modified:   src/test/java/com/pos/controller/PosControllerTest.java
created:    src/main/java/com/pos/dto/UpdateOrderItemRequest.java
created:    src/test/java/com/pos/service/PosServiceUpdateOrderItemTest.java
created:    CART_ITEM_UPDATE_API.md
created:    test-cart-item-update.sh
```

## Backward Compatibility

This implementation is **fully backward compatible**:
- No existing APIs were modified
- No database schema changes required
- Adds new functionality without affecting existing features
- All existing tests continue to pass

## Next Steps

1. Frontend team can integrate the new endpoint using the API documentation
2. Test the endpoint in a staging environment with real data
3. Consider adding logging/monitoring for cart item updates
4. May want to add audit trail for price/quantity changes in the future
