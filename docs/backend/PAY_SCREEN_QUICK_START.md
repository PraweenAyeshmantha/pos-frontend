# Pay Screen Quick Start Guide

## Quick Implementation Checklist

### Backend Setup ✅ (Already Complete)
- [x] Multiple payment methods support enabled
- [x] Order notes configuration available
- [x] Payment processing APIs ready
- [x] Automatic calculations implemented

### Frontend Implementation Required

- [ ] Fetch payment methods from API
- [ ] Check order notes configuration
- [ ] Implement payment entry interface
- [ ] Add quick amount buttons
- [ ] Calculate and display totals
- [ ] Submit order with payments

## Essential APIs

### 1. Get Payment Methods
```
GET /api/pos/payment-methods
```

### 2. Create Order with Payments
```
POST /api/pos/orders
```

### 3. Check Configuration (Optional)
```
GET /api/admin/configurations?category=GENERAL
```

## Minimal Working Example

### Step 1: Fetch Payment Methods

```javascript
const paymentMethods = await fetch('/api/pos/payment-methods', {
  headers: { 'X-Tenant-ID': 'PaPos' }
}).then(r => r.json());

// Result: [{ id: 1, name: "Cash", slug: "cash" }, ...]
```

### Step 2: Build Payment Array

```javascript
const payments = [];

// Add first payment
payments.push({
  paymentMethodId: 1, // Cash
  amount: 100.00
});

// Add second payment (if split payment)
payments.push({
  paymentMethodId: 2, // Card
  amount: 65.00
});
```

### Step 3: Calculate Totals

```javascript
const totalDue = 156.20; // From order
const totalPaying = payments.reduce((sum, p) => sum + p.amount, 0);
const change = Math.max(0, totalPaying - totalDue);
const payLeft = Math.max(0, totalDue - totalPaying);
```

### Step 4: Submit Order

```javascript
const order = await fetch('/api/pos/orders', {
  method: 'POST',
  headers: {
    'X-Tenant-ID': 'PaPos',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    outletId: 1,
    cashierId: 1,
    orderType: 'COUNTER',
    items: [...], // Your cart items
    payments: payments,
    notes: 'Optional order note'
  })
}).then(r => r.json());

// Order created with change calculated
console.log(order.data.changeAmount); // 8.80
```

## Quick Amount Buttons

```javascript
function generateQuickAmounts(totalDue) {
  return [
    totalDue,                    // Exact amount
    Math.ceil(totalDue),         // Round up
    Math.ceil(totalDue) + 5,     // +$5
    Math.ceil(totalDue) + 10     // +$10
  ];
}

// Example for $156.20
const amounts = generateQuickAmounts(156.20);
// Returns: [156.20, 157.00, 162.00, 167.00]
```

## Payment Entry Component (Pseudo-code)

```javascript
class PayScreen {
  state = {
    orderTotal: 156.20,
    payments: [],
    paymentMethods: [],
    selectedMethodId: null,
    enteredAmount: 0,
    orderNote: ''
  }

  async componentDidMount() {
    // Fetch payment methods
    const methods = await this.fetchPaymentMethods();
    this.setState({ paymentMethods: methods });
  }

  addPayment() {
    this.setState({
      payments: [...this.state.payments, {
        paymentMethodId: this.state.selectedMethodId,
        amount: this.state.enteredAmount
      }],
      selectedMethodId: null,
      enteredAmount: 0
    });
  }

  get totals() {
    const totalPaying = this.state.payments.reduce(
      (sum, p) => sum + p.amount, 0
    );
    return {
      totalDue: this.state.orderTotal,
      totalPaying: totalPaying,
      payLeft: Math.max(0, this.state.orderTotal - totalPaying),
      change: Math.max(0, totalPaying - this.state.orderTotal)
    };
  }

  async submitOrder() {
    if (this.totals.payLeft > 0) {
      alert('Insufficient payment!');
      return;
    }

    const order = await this.createOrder({
      outletId: this.props.outletId,
      cashierId: this.props.cashierId,
      orderType: 'COUNTER',
      items: this.props.cartItems,
      payments: this.state.payments,
      notes: this.state.orderNote
    });

    // Show success and change amount
    alert(`Order complete! Change: $${order.changeAmount}`);
  }
}
```

## Testing with cURL

### Test 1: Single Payment
```bash
curl -X POST "http://localhost:8080/posai/api/pos/orders" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "outletId": 1,
    "cashierId": 1,
    "orderType": "COUNTER",
    "items": [
      {"productId": 1, "quantity": 1, "unitPrice": 18.00},
      {"productId": 2, "quantity": 1, "unitPrice": 18.00},
      {"productId": 3, "quantity": 1, "unitPrice": 90.00},
      {"productId": 4, "quantity": 1, "unitPrice": 16.00}
    ],
    "payments": [
      {"paymentMethodId": 1, "amount": 165.00}
    ]
  }'
```

### Test 2: Split Payment
```bash
curl -X POST "http://localhost:8080/posai/api/pos/orders" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "outletId": 1,
    "cashierId": 1,
    "orderType": "COUNTER",
    "items": [
      {"productId": 1, "quantity": 1, "unitPrice": 18.00},
      {"productId": 2, "quantity": 1, "unitPrice": 18.00},
      {"productId": 3, "quantity": 1, "unitPrice": 90.00},
      {"productId": 4, "quantity": 1, "unitPrice": 16.00}
    ],
    "payments": [
      {"paymentMethodId": 1, "amount": 100.00},
      {"paymentMethodId": 2, "amount": 65.00}
    ],
    "notes": "Split between cash and card"
  }'
```

## Configuration Check

```bash
# Check if order notes enabled
curl -X GET "http://localhost:8080/posai/api/admin/configurations?category=GENERAL" \
  -H "X-Tenant-ID: PaPos" | \
  jq '.data[] | select(.configKey=="enable_order_note") | .configValue'

# Check if split payment enabled
curl -X GET "http://localhost:8080/posai/api/admin/configurations?category=GENERAL" \
  -H "X-Tenant-ID: PaPos" | \
  jq '.data[] | select(.configKey=="enable_split_payment") | .configValue'
```

## Common Pitfalls

### ❌ Don't: Calculate change on frontend only
```javascript
// Wrong - frontend calculation only
const change = totalPaying - totalDue;
```

### ✅ Do: Use backend-calculated change
```javascript
// Correct - use backend response
const order = await createOrder(...);
const change = order.changeAmount; // From backend
```

### ❌ Don't: Allow submission without checking
```javascript
// Wrong - no validation
submitOrder(payments);
```

### ✅ Do: Validate before submission
```javascript
// Correct - validate first
if (totalPaying < totalDue) {
  alert('Insufficient payment');
  return;
}
submitOrder(payments);
```

## Payment Display Template

```
┌─────────────────────────────────┐
│ Total Due        $156.20        │
│ Total Paying     $165.00        │
│ Pay Left         $0.00          │
│ Change           $8.80          │
├─────────────────────────────────┤
│ Amount: [______]  Method: [▼]  │
│ [Add Payment Method]            │
├─────────────────────────────────┤
│ Payments:                       │
│ • Cash: $100.00     [Remove]    │
│ • Card: $65.00      [Remove]    │
├─────────────────────────────────┤
│ Order Note (optional):          │
│ [____________________________]  │
├─────────────────────────────────┤
│ Quick Amounts:                  │
│ [$156.20] [$157] [$160] [$165]  │
├─────────────────────────────────┤
│        [Pay] [Cancel]           │
└─────────────────────────────────┘
```

## Summary

The Pay Screen can be implemented by:

1. **Fetching** payment methods from `/api/pos/payment-methods`
2. **Building** a payments array with `{ paymentMethodId, amount }` objects
3. **Calculating** totals in real-time as payments are added
4. **Submitting** via `POST /api/pos/orders` with payments and optional notes
5. **Displaying** the backend-calculated change amount

No backend changes required - all functionality exists and is tested!

For complete API details, see [PAY_SCREEN_API_DOCUMENTATION.md](PAY_SCREEN_API_DOCUMENTATION.md)
