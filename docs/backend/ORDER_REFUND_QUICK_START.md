# Order Refund/Return - Quick Start Guide

## For Backend Developers

### What Was Implemented

A new API endpoint for processing partial refunds on completed orders with optional restocking.

### New Endpoint

```
POST /api/admin/orders/{id}/refund/partial
```

### Minimal Example

```bash
curl -X POST "http://localhost:8080/api/admin/orders/362/refund/partial" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "orderItemId": 1,
        "quantity": 1.0
      }
    ],
    "restockItems": true,
    "reason": "Customer not satisfied"
  }'
```

### Request Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `items` | Array | Yes | - | List of items to refund (at least 1) |
| `items[].orderItemId` | Long | Yes | - | Order item ID |
| `items[].quantity` | Number | Yes | - | Quantity to refund (positive) |
| `restockItems` | Boolean | No | false | Restock returned items |
| `reason` | String | No | null | Refund reason |

### Response

```json
{
  "code": "success.order.partially.refunded",
  "message": "Order partially refunded successfully",
  "data": {
    "orderId": 362,
    "refundedAmount": 42.00,
    "originalAmount": 187.00,
    "remainingAmount": 145.00,
    "restockedItems": true,
    "reason": "Customer not satisfied",
    "refundedItems": [...]
  }
}
```

## For Frontend Developers

### Step 1: Get Order Details

First, fetch the order to display available items:

```javascript
const order = await fetch(`/api/admin/orders/362/details`).then(r => r.json());
```

### Step 2: Show Refund Dialog

Display a dialog with:
- List of order items with quantity selectors
- Checkbox for "Restock Items"
- Text field for refund reason

### Step 3: Calculate Refund Amount

```javascript
const refundAmount = selectedItems.reduce((sum, item) => {
  return sum + (item.unitPrice * item.quantity);
}, 0);
```

### Step 4: Submit Refund

```javascript
const response = await fetch(`/api/admin/orders/${orderId}/refund/partial`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    items: selectedItems.map(item => ({
      orderItemId: item.id,
      quantity: item.refundQuantity
    })),
    restockItems: restockChecked,
    reason: refundReason || null
  })
});

const result = await response.json();
if (result.code === 'success.order.partially.refunded') {
  // Show success message with refund details
  console.log(`Refunded: $${result.data.refundedAmount}`);
}
```

### Sample UI Component (React)

```jsx
function RefundDialog({ order, onClose }) {
  const [selectedItems, setSelectedItems] = useState([]);
  const [restockItems, setRestockItems] = useState(false);
  const [reason, setReason] = useState('');

  const refundAmount = selectedItems.reduce(
    (sum, item) => sum + (item.unitPrice * item.quantity), 0
  );

  const handleRefund = async () => {
    try {
      const response = await fetch(
        `/api/admin/orders/${order.id}/refund/partial`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: selectedItems.map(item => ({
              orderItemId: item.id,
              quantity: item.quantity
            })),
            restockItems,
            reason: reason || undefined
          })
        }
      );
      
      const result = await response.json();
      if (result.code === 'success.order.partially.refunded') {
        alert(`Refunded: $${result.data.refundedAmount}`);
        onClose();
      }
    } catch (error) {
      console.error('Refund failed:', error);
    }
  };

  return (
    <div className="refund-dialog">
      <h2>Refund Order #{order.orderNumber}</h2>
      
      {order.items.map(item => (
        <div key={item.id} className="refund-item">
          <span>{item.productName}</span>
          <span>${item.unitPrice}</span>
          <input
            type="number"
            min="0"
            max={item.quantity}
            value={selectedItems.find(i => i.id === item.id)?.quantity || 0}
            onChange={e => {
              const qty = parseInt(e.target.value);
              if (qty > 0) {
                setSelectedItems([
                  ...selectedItems.filter(i => i.id !== item.id),
                  { id: item.id, quantity: qty, unitPrice: item.unitPrice }
                ]);
              } else {
                setSelectedItems(selectedItems.filter(i => i.id !== item.id));
              }
            }}
          />
        </div>
      ))}
      
      <label>
        <input
          type="checkbox"
          checked={restockItems}
          onChange={e => setRestockItems(e.target.checked)}
        />
        Restock Items
      </label>
      
      <input
        type="text"
        placeholder="Enter Reason (Optional)"
        value={reason}
        onChange={e => setReason(e.target.value)}
      />
      
      <div className="refund-summary">
        <strong>Refund Amount: ${refundAmount.toFixed(2)}</strong>
      </div>
      
      <button onClick={handleRefund} disabled={selectedItems.length === 0}>
        Refund
      </button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
}
```

## Common Scenarios

### Scenario 1: Single Item Return
Customer returns one item, restock it:
```json
{
  "items": [{"orderItemId": 1, "quantity": 1}],
  "restockItems": true,
  "reason": "Wrong size"
}
```

### Scenario 2: Multiple Items Damaged
Customer returns multiple damaged items (don't restock):
```json
{
  "items": [
    {"orderItemId": 1, "quantity": 1},
    {"orderItemId": 3, "quantity": 1}
  ],
  "restockItems": false,
  "reason": "Damaged during shipping"
}
```

### Scenario 3: Partial Quantity
Customer ordered 5, returns 2:
```json
{
  "items": [{"orderItemId": 2, "quantity": 2}],
  "restockItems": true,
  "reason": "Changed mind"
}
```

## Error Handling

### Common Errors

**400 Bad Request**: Order not completed
```json
{
  "code": "error.bad.request",
  "message": "Only completed orders can be refunded"
}
```

**400 Bad Request**: Invalid quantity
```json
{
  "code": "error.bad.request",
  "message": "Refund quantity cannot exceed order quantity for item: Product Name"
}
```

**404 Not Found**: Order doesn't exist
```json
{
  "code": "error.not.found",
  "message": "Order not found with id: 999"
}
```

### Frontend Error Handling

```javascript
try {
  const response = await fetch(...);
  const result = await response.json();
  
  if (!response.ok) {
    // Show error message to user
    alert(result.message);
    return;
  }
  
  // Success handling
  showSuccessMessage(result.data);
} catch (error) {
  console.error('Network error:', error);
  alert('Failed to process refund. Please try again.');
}
```

## Testing

### Run Tests
```bash
./mvnw test -Dtest=OrderServicePartialRefundTest,OrderControllerPartialRefundTest
```

### Test Coverage
- ✅ 12 service layer tests
- ✅ 5 controller layer tests
- ✅ All scenarios covered (success, validation errors, edge cases)

## Business Rules

1. ✅ Only COMPLETED orders can be refunded
2. ✅ Refund quantity must be positive and ≤ order quantity
3. ✅ At least one item must be selected
4. ✅ Custom products are not restocked
5. ✅ Order status changes to REFUNDED after refund
6. ✅ Refund reason is optional and added to order notes

## More Information

- **Full API Documentation**: See `ORDER_REFUND_API_DOCUMENTATION.md`
- **Implementation Details**: See `ORDER_REFUND_IMPLEMENTATION_SUMMARY.md`
- **Source Code**:
  - DTOs: `src/main/java/com/pos/dto/RefundItemRequest.java`, etc.
  - Service: `src/main/java/com/pos/service/OrderService.java`
  - Controller: `src/main/java/com/pos/controller/OrderController.java`
  - Tests: `src/test/java/com/pos/service/OrderServicePartialRefundTest.java`

## Support

For questions or issues, refer to the comprehensive documentation or create an issue in the repository.
