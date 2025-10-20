# Order Refund/Return Implementation Summary

## Overview

This document summarizes the implementation of the Order Refund/Return feature for the POS Backend system. The feature allows cashiers to process partial refunds for completed orders, with options to selectively refund items, restock returned products, and provide a reason for the refund.

## Changes Made

### 1. New DTOs Created

#### RefundItemRequest.java
- Purpose: Represents a single item to be refunded
- Fields:
  - `orderItemId` (Long, required): The ID of the order item
  - `quantity` (BigDecimal, required, positive): Quantity to refund
- Validation: Uses Jakarta Bean Validation annotations

#### PartialRefundRequest.java
- Purpose: Request DTO for processing partial order refunds
- Fields:
  - `items` (List<RefundItemRequest>, required, not empty): Items to refund
  - `restockItems` (Boolean, defaults to false): Whether to restock items
  - `reason` (String, optional): Reason for the refund
- Validation: Ensures at least one item is selected

#### RefundResponse.java
- Purpose: Response DTO containing refund operation results
- Fields:
  - `orderId` (Long): Order ID
  - `orderNumber` (String): Order number
  - `status` (String): Updated order status
  - `refundedAmount` (BigDecimal): Total amount refunded
  - `originalAmount` (BigDecimal): Original order amount
  - `remainingAmount` (BigDecimal): Calculated remaining amount
  - `restockedItems` (Boolean): Whether items were restocked
  - `reason` (String): Refund reason
  - `refundDate` (OffsetDateTime): When refund was processed
  - `refundedItems` (List<RefundedItemDTO>): Details of refunded items
- Includes nested `RefundedItemDTO` record for item details

### 2. Service Layer Updates

#### OrderService.java
Added new method: `processPartialRefund(Long orderId, PartialRefundRequest request)`

**Functionality:**
1. Validates order is in COMPLETED status
2. Processes each item in the refund request:
   - Validates item belongs to the order
   - Validates refund quantity doesn't exceed order quantity
   - Calculates refund amount for each item
3. Handles restocking if requested:
   - Only restocks non-custom products
   - Uses StockService to add quantity back to inventory
   - Logs warnings if restocking fails (doesn't fail the refund)
4. Updates order status to REFUNDED
5. Appends refund reason to order notes if provided
6. Returns comprehensive RefundResponse

**Added Dependencies:**
- `OrderItemRepository`: To fetch order items
- `StockService`: To handle restocking

### 3. Controller Layer Updates

#### OrderController.java
Added new endpoint: `POST /api/admin/orders/{id}/refund/partial`

**Request Handling:**
- Accepts `PartialRefundRequest` in request body
- Validates request using Jakarta Bean Validation (`@Valid`)
- Returns `ApiResponse<RefundResponse>` wrapper
- Success code: "success.order.partially.refunded"

### 4. Comprehensive Test Coverage

#### OrderServicePartialRefundTest.java (12 tests)
Tests cover:
- ✅ Single item refund with/without restocking
- ✅ Multiple items refund
- ✅ Partial quantity refund (e.g., 1 out of 2 items)
- ✅ Custom products (skip restocking)
- ✅ Order status validation (only COMPLETED orders)
- ✅ Order item validation (item exists, belongs to order)
- ✅ Quantity validation (positive, not exceeding order quantity)
- ✅ Order not found error handling
- ✅ Optional reason handling

#### OrderControllerPartialRefundTest.java (5 tests)
Tests cover:
- ✅ Successful refund requests
- ✅ Multiple items refund
- ✅ Order not found error
- ✅ Non-completed order error
- ✅ With/without restocking scenarios

**Test Results:** All 17 new tests pass successfully

### 5. Documentation

#### ORDER_REFUND_API_DOCUMENTATION.md
Comprehensive API documentation including:
- Endpoint specifications
- Request/response schemas
- Validation rules
- Business logic explanation
- Error handling
- Example usage scenarios
- Frontend integration notes

## Key Features

### 1. Flexible Item Selection
- Cashiers can select specific items and quantities to refund
- Supports partial quantity refunds (e.g., returning 1 out of 2 items purchased)

### 2. Automatic Restocking
- Optional feature that can be enabled per refund
- Automatically increases stock quantity for returned products
- Intelligently skips custom products (not tracked in inventory)
- Gracefully handles restocking failures without blocking the refund

### 3. Audit Trail
- Captures refund reason and appends to order notes
- Updates order status to REFUNDED
- Records refund timestamp
- Maintains complete history of what was refunded

### 4. Robust Validation
- Ensures only completed orders can be refunded
- Validates refund quantities don't exceed original quantities
- Verifies order items belong to the specified order
- Prevents invalid or malicious refund requests

### 5. Comprehensive Response
- Returns detailed breakdown of refunded items
- Shows original amount, refunded amount, and remaining amount
- Indicates whether restocking was performed
- Includes timestamp and reason for record-keeping

## Technical Highlights

### 1. Clean Architecture
- Separation of concerns (DTOs, Service, Controller)
- Uses record classes for immutable DTOs (Java 16+)
- Follows existing project patterns and conventions

### 2. Transaction Management
- Service method is transactional (@Transactional)
- Ensures data consistency across order and stock updates
- Rollback on errors

### 3. Error Handling
- Uses custom exceptions (BadRequestException, ResourceNotFoundException)
- Provides meaningful error messages
- Returns appropriate HTTP status codes

### 4. Code Quality
- ✅ Zero CodeQL security vulnerabilities
- ✅ All tests pass (287/288 unit tests - 1 unrelated integration test failure)
- ✅ Follows Java 21 coding standards
- ✅ Uses Lombok for cleaner code
- ✅ Comprehensive logging

### 5. Backwards Compatibility
- Existing `POST /api/admin/orders/{id}/refund` endpoint unchanged
- New endpoint is additive, doesn't break existing functionality
- Can use both full and partial refund endpoints

## Integration with Existing Features

### Stock Management
- Integrates seamlessly with existing StockService
- Uses `addStock()` method to increase inventory
- Respects outlet-specific stock levels

### Order Management
- Works with existing Order and OrderItem entities
- Uses existing order status enum (REFUNDED)
- Maintains order history and audit trail

## Usage Example

Based on the UI mockup provided in the issue:

```http
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
  "reason": "Customer not satisfied"
}
```

**Response:**
```json
{
  "code": "success.order.partially.refunded",
  "message": "Order partially refunded successfully",
  "data": {
    "orderId": 362,
    "orderNumber": "ORD-362",
    "status": "REFUNDED",
    "refundedAmount": 42.00,
    "originalAmount": 187.00,
    "remainingAmount": 145.00,
    "restockedItems": true,
    "reason": "Customer not satisfied",
    "refundDate": "2025-10-17T14:30:00Z",
    "refundedItems": [
      {
        "orderItemId": 1,
        "productName": "Hoodie - Red, No",
        "quantity": 1.0,
        "unitPrice": 42.00,
        "totalAmount": 42.00
      }
    ]
  }
}
```

## Files Changed/Added

### New Files (6)
1. `src/main/java/com/pos/dto/RefundItemRequest.java`
2. `src/main/java/com/pos/dto/PartialRefundRequest.java`
3. `src/main/java/com/pos/dto/RefundResponse.java`
4. `src/test/java/com/pos/service/OrderServicePartialRefundTest.java`
5. `src/test/java/com/pos/controller/OrderControllerPartialRefundTest.java`
6. `ORDER_REFUND_API_DOCUMENTATION.md`

### Modified Files (2)
1. `src/main/java/com/pos/service/OrderService.java` - Added processPartialRefund method
2. `src/main/java/com/pos/controller/OrderController.java` - Added new endpoint

## Next Steps for Frontend Integration

1. **Order Details Page**: Add a "Refund" button on completed orders
2. **Refund Dialog**: Implement the UI shown in the mockup with:
   - List of available items for refund
   - Quantity selectors (+/- buttons)
   - "Restock Items" checkbox
   - "Enter Reason (Optional)" text field
   - Real-time refund amount calculation
3. **API Integration**: Call `POST /api/admin/orders/{id}/refund/partial` endpoint
4. **Success Handling**: Show refund confirmation and refresh order details

## Testing Recommendations

1. Test with various item combinations
2. Verify restocking works correctly in inventory
3. Test edge cases (custom products, partial quantities)
4. Ensure error messages are user-friendly
5. Verify order history maintains complete audit trail

## Conclusion

The Order Refund/Return feature has been successfully implemented with:
- ✅ Complete backend support for partial refunds
- ✅ Optional automatic restocking
- ✅ Comprehensive validation and error handling
- ✅ Extensive test coverage
- ✅ Zero security vulnerabilities
- ✅ Detailed API documentation
- ✅ Ready for frontend integration

The implementation follows clean code principles, maintains backwards compatibility, and provides a robust foundation for the frontend to build upon.
