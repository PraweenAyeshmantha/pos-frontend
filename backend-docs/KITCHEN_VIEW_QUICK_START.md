# Kitchen View - Quick Start Guide

## Overview

Kitchen View is a feature designed for restaurant and cafe outlets to display orders being prepared in the kitchen. This guide provides a quick reference for using the Kitchen View APIs.

## Quick Reference

### Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin/kitchen/orders?outletId={id}` | Get orders in preparation |
| POST | `/api/admin/kitchen/orders/{id}/ready` | Mark order as ready |

### Order Status Flow

```
ON_HOLD → PREPARING → READY → COMPLETED
           ↑ Kitchen View shows orders here
                      ↑ Click "Ready" button transitions here
```

## Examples

### 1. Get Kitchen Orders

**Request:**
```bash
curl -X GET "http://localhost:8080/api/admin/kitchen/orders?outletId=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "status": "SUCCESS",
  "data": [
    {
      "id": 1,
      "orderNumber": "ORD-001",
      "orderType": "DINE_IN",
      "customerEmail": "john@example.com",
      "tableNumber": "Table 2",
      "items": [
        {
          "productName": "Margherita Pizza",
          "quantity": 1,
          "imageUrl": "https://example.com/pizza.jpg"
        }
      ]
    }
  ]
}
```

### 2. Mark Order as Ready

**Request:**
```bash
curl -X POST "http://localhost:8080/api/admin/kitchen/orders/1/ready" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "status": "SUCCESS",
  "message": "Order marked as ready",
  "data": {
    "id": 1,
    "orderNumber": "ORD-001",
    "status": "READY"
  }
}
```

## Key Features

✅ **Real-time Order Display**: Shows only orders in PREPARING status
✅ **Visual Identification**: Product images included for easy recognition
✅ **Table Management**: Displays table number for dine-in orders
✅ **Customer Info**: Shows customer email for identification
✅ **Simple Workflow**: One-click to mark orders as ready

## Business Rules

1. Only works for outlets with `RESTAURANT_CAFE` mode
2. Only shows orders with `PREPARING` status
3. Orders disappear from view when marked as ready
4. Can only mark orders as ready if they're currently `PREPARING`

## Integration Tips

### Frontend Implementation
- Poll every 5-10 seconds for new orders, or use WebSocket
- Display orders in chronological order (oldest first)
- Show product images in a grid/card layout
- Highlight table number prominently for dine-in orders
- Provide clear "Ready" button for each order

### Error Handling
```javascript
// Handle common errors
try {
  const response = await markOrderReady(orderId);
} catch (error) {
  if (error.status === 400) {
    // Order not in PREPARING status
    alert('This order cannot be marked as ready');
  } else if (error.status === 404) {
    // Order not found
    alert('Order not found');
  }
}
```

## Testing

```bash
# Run unit tests
mvn test -Dtest=OrderServiceKitchenViewTest,KitchenViewControllerTest

# Run manual API tests
./test-kitchen-view-api.sh
```

## Common Issues

### No orders showing in Kitchen View?
- ✅ Check outlet is in `RESTAURANT_CAFE` mode
- ✅ Verify orders are in `PREPARING` status
- ✅ Ensure correct `outletId` parameter
- ✅ Check authentication token is valid

### Can't mark order as ready?
- ✅ Order must be in `PREPARING` status
- ✅ Check order ID is correct
- ✅ Verify order exists in database

## Complete Documentation

For detailed information, see:
- **API Reference**: `KITCHEN_VIEW_API_DOCUMENTATION.md`
- **Implementation Details**: `KITCHEN_VIEW_IMPLEMENTATION_SUMMARY.md`
- **Test Script**: `test-kitchen-view-api.sh`

## Code Examples

### Service Layer Usage
```java
// Get kitchen orders
List<KitchenOrderDTO> orders = orderService.getKitchenOrders(outletId);

// Mark order as ready
Order order = orderService.markOrderAsReady(orderId);
```

### Controller Layer
```java
@RestController
@RequestMapping("/api/admin/kitchen")
public class KitchenViewController {
    
    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<List<KitchenOrderDTO>>> getKitchenOrders(
            @RequestParam Long outletId,
            HttpServletRequest request) {
        List<KitchenOrderDTO> orders = orderService.getKitchenOrders(outletId);
        return ResponseEntity.ok(ApiResponse.success("success", 
            "Kitchen orders retrieved successfully", request.getRequestURI(), orders));
    }
    
    @PostMapping("/orders/{id}/ready")
    public ResponseEntity<ApiResponse<Order>> markOrderAsReady(
            @PathVariable Long id,
            HttpServletRequest request) {
        Order order = orderService.markOrderAsReady(id);
        return ResponseEntity.ok(ApiResponse.success("success.order.ready", 
            "Order marked as ready", request.getRequestURI(), order));
    }
}
```

## Support

For questions or issues, please refer to the complete documentation or contact the development team.
