# Weight-Based Pricing Feature - Examples and Use Cases

## Use Case Examples

### Use Case 1: Grocery Store - Fresh Produce
**Scenario:** Customer buying fresh fruits at a grocery store

**Product Configuration:**
```json
{
  "id": 101,
  "name": "Organic Apples",
  "sku": "FRT-APL-ORG",
  "description": "Fresh organic apples",
  "price": 5.99,
  "unit": "kg",
  "isWeightBased": true,
  "category": "Fresh Produce",
  "imageUrl": "/images/products/apples.jpg",
  "isActive": true
}
```

**Frontend Flow:**
1. User selects "Organic Apples" from product catalog
2. System detects `isWeightBased = true`
3. Popup appears: "Enter weight for the purchase"
4. User enters: 2.5 kg
5. System calculates: 2.5 kg × $5.99/kg = $14.98
6. Item added to cart with weight information

**API Request:**
```json
{
  "outletId": 1,
  "cashierId": 5,
  "orderType": "COUNTER",
  "items": [
    {
      "productId": 101,
      "productName": "Organic Apples",
      "quantity": 1,
      "unitPrice": 14.98,
      "weight": 2.5,
      "discountAmount": 0,
      "notes": null
    }
  ],
  "payments": [
    {
      "paymentMethodId": 1,
      "amount": 14.98
    }
  ]
}
```

### Use Case 2: Butcher Shop - Meat Products
**Scenario:** Customer ordering different types of meat

**Products:**
```json
[
  {
    "id": 201,
    "name": "Beef Tenderloin",
    "price": 29.99,
    "unit": "lb",
    "isWeightBased": true
  },
  {
    "id": 202,
    "name": "Chicken Breast",
    "price": 8.99,
    "unit": "lb",
    "isWeightBased": true
  },
  {
    "id": 203,
    "name": "Ground Beef",
    "price": 12.99,
    "unit": "lb",
    "isWeightBased": true
  }
]
```

**API Request (Multiple Weight-Based Items):**
```json
{
  "outletId": 2,
  "cashierId": 3,
  "orderType": "COUNTER",
  "items": [
    {
      "productId": 201,
      "productName": "Beef Tenderloin",
      "quantity": 1,
      "unitPrice": 44.99,
      "weight": 1.5,
      "notes": "Premium cut"
    },
    {
      "productId": 202,
      "productName": "Chicken Breast",
      "quantity": 1,
      "unitPrice": 26.97,
      "weight": 3.0,
      "notes": "Skinless"
    },
    {
      "productId": 203,
      "productName": "Ground Beef",
      "quantity": 1,
      "unitPrice": 25.98,
      "weight": 2.0,
      "notes": "80% lean"
    }
  ],
  "payments": [
    {
      "paymentMethodId": 1,
      "amount": 97.94
    }
  ]
}
```

### Use Case 3: Restaurant - Fresh Salad Bar
**Scenario:** Customer ordering salad by weight at a restaurant

**Product Configuration:**
```json
{
  "id": 301,
  "name": "Fresh Mixed Salad",
  "price": 15.00,
  "unit": "kg",
  "isWeightBased": true,
  "category": "Salad Bar",
  "description": "Build your own salad"
}
```

**Table Order Request:**
```json
{
  "outletId": 3,
  "tableId": 12,
  "cashierId": 7,
  "orderType": "DINE_IN",
  "items": [
    {
      "productId": 301,
      "productName": "Fresh Mixed Salad",
      "quantity": 1,
      "unitPrice": 9.75,
      "weight": 0.65,
      "notes": "Extra dressing on the side"
    },
    {
      "productId": 302,
      "productName": "Iced Tea",
      "quantity": 1,
      "unitPrice": 3.50,
      "weight": null,
      "notes": "No ice"
    }
  ],
  "notes": "Customer requested extra napkins"
}
```

### Use Case 4: Mixed Cart (Weight-Based + Regular Products)
**Scenario:** Customer shopping at a grocery store with both types of products

**Cart Contents:**
- 1.8 kg of Bananas ($2.99/kg) - Weight-based
- 2 Bottles of Water ($1.99 each) - Regular
- 0.5 kg of Cheese ($12.99/kg) - Weight-based
- 1 Loaf of Bread ($3.49) - Regular

**API Request:**
```json
{
  "outletId": 1,
  "cashierId": 4,
  "orderType": "COUNTER",
  "items": [
    {
      "productId": 401,
      "productName": "Fresh Bananas",
      "quantity": 1,
      "unitPrice": 5.38,
      "weight": 1.8,
      "discountAmount": 0,
      "notes": null
    },
    {
      "productId": 402,
      "productName": "Bottled Water",
      "quantity": 2,
      "unitPrice": 1.99,
      "weight": null,
      "discountAmount": 0,
      "notes": null
    },
    {
      "productId": 403,
      "productName": "Cheddar Cheese",
      "quantity": 1,
      "unitPrice": 6.50,
      "weight": 0.5,
      "discountAmount": 0,
      "notes": null
    },
    {
      "productId": 404,
      "productName": "Whole Wheat Bread",
      "quantity": 1,
      "unitPrice": 3.49,
      "weight": null,
      "discountAmount": 0,
      "notes": null
    }
  ],
  "discountAmount": 0,
  "payments": [
    {
      "paymentMethodId": 1,
      "amount": 19.35
    }
  ]
}
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Order created successfully",
  "data": {
    "id": 12345,
    "orderNumber": "ORD-1634567890123",
    "status": "COMPLETED",
    "subtotal": 19.35,
    "taxAmount": 0.00,
    "discountAmount": 0.00,
    "totalAmount": 19.35,
    "items": [
      {
        "id": 100001,
        "productId": 401,
        "productName": "Fresh Bananas",
        "quantity": 1,
        "unitPrice": 5.38,
        "weight": 1.8,
        "totalAmount": 5.38
      },
      {
        "id": 100002,
        "productId": 402,
        "productName": "Bottled Water",
        "quantity": 2,
        "unitPrice": 1.99,
        "weight": null,
        "totalAmount": 3.98
      },
      {
        "id": 100003,
        "productId": 403,
        "productName": "Cheddar Cheese",
        "quantity": 1,
        "unitPrice": 6.50,
        "weight": 0.5,
        "totalAmount": 6.50
      },
      {
        "id": 100004,
        "productId": 404,
        "productName": "Whole Wheat Bread",
        "quantity": 1,
        "unitPrice": 3.49,
        "weight": null,
        "totalAmount": 3.49
      }
    ]
  }
}
```

## Frontend UI Examples

### Weight Entry Dialog

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│           Enter weight for the purchase.                │
│                                                         │
│                                                         │
│   Organic Apples (1 kg) = $5.99                        │
│                                                         │
│   ┌─────────────────────────────────────────────────┐  │
│   │  Weight (kg): [    2.5    ]                     │  │
│   └─────────────────────────────────────────────────┘  │
│                                                         │
│   Total Price: $14.98                                  │
│                                                         │
│                                                         │
│   ╔══════════╗                    ┌──────────┐         │
│   ║   Add    ║                    │  Cancel  │         │
│   ╚══════════╝                    └──────────┘         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Cart Display with Weight

```
┌─────────────────────────────────────────────────────────┐
│  🛒 Cart Items                                      (4) │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Organic Apples                                $14.98  │
│  2.5 kg × $5.99/kg                                     │
│  [−] 1 [+]                                      ✕      │
│                                                         │
│  ────────────────────────────────────────────────────  │
│                                                         │
│  Bottled Water                                  $3.98  │
│  2 × $1.99                                             │
│  [−] 2 [+]                                      ✕      │
│                                                         │
│  ────────────────────────────────────────────────────  │
│                                                         │
│  Cheddar Cheese                                 $6.50  │
│  0.5 kg × $12.99/kg                                    │
│  [−] 1 [+]                                      ✕      │
│                                                         │
│  ────────────────────────────────────────────────────  │
│                                                         │
│  Whole Wheat Bread                              $3.49  │
│  1 × $3.49                                             │
│  [−] 1 [+]                                      ✕      │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Subtotal:                                     $28.95  │
│  Tax:                                           $0.00  │
│  Discount:                                      $0.00  │
│                                                         │
│  ╔═════════════════════════════════════════════════╗  │
│  ║  Proceed to Pay                      $28.95     ║  │
│  ╚═════════════════════════════════════════════════╝  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Product Card with Weight Indicator

```
┌───────────────────────────┐
│                           │
│      [Product Image]      │
│                           │
├───────────────────────────┤
│  Organic Apples           │
│  $5.99 / kg              │
│                           │
│  ⚖️ Weight-based product │
│                           │
│  ┌─────────────────────┐ │
│  │   Add to Cart       │ │
│  └─────────────────────┘ │
│                           │
│  In Stock (489)           │
│                           │
└───────────────────────────┘
```

## Error Handling Examples

### Error 1: Missing Weight for Weight-Based Product

**Request:**
```json
{
  "items": [
    {
      "productId": 101,
      "productName": "Organic Apples",
      "quantity": 1,
      "unitPrice": 5.99,
      "weight": null  // ❌ Missing
    }
  ]
}
```

**Response:**
```json
{
  "status": "error",
  "code": "error.weight-based-product.weight-required",
  "message": "Weight is required for weight-based products. Please enter the weight before adding to cart.",
  "timestamp": "2025-10-16T17:45:00Z",
  "path": "/api/pos/orders"
}
```

### Error 2: Invalid Weight (Zero or Negative)

**Request:**
```json
{
  "items": [
    {
      "productId": 101,
      "productName": "Organic Apples",
      "quantity": 1,
      "unitPrice": 5.99,
      "weight": 0  // ❌ Invalid
    }
  ]
}
```

**Response:**
```json
{
  "status": "error",
  "code": "error.weight-based-product.weight-required",
  "message": "Weight is required for weight-based products. Please enter the weight before adding to cart.",
  "timestamp": "2025-10-16T17:45:00Z",
  "path": "/api/pos/orders"
}
```

## Testing Checklist

### Basic Functionality
- [ ] Create order with single weight-based product
- [ ] Create order with multiple weight-based products
- [ ] Create order with mix of weight-based and regular products
- [ ] Create table order with weight-based product
- [ ] Complete table order with weight-based product

### Weight Entry
- [ ] Enter whole number weight (1, 2, 3)
- [ ] Enter decimal weight (1.5, 2.75, 0.65)
- [ ] Enter very small weight (0.001)
- [ ] Enter very large weight (999.999)

### Validation
- [ ] Attempt to create order without weight for weight-based product (should fail)
- [ ] Attempt to create order with zero weight (should fail)
- [ ] Attempt to create order with negative weight (should fail)
- [ ] Create order with null weight for regular product (should succeed)

### Display & UI
- [ ] Weight displayed correctly in cart
- [ ] Weight displayed correctly in order history
- [ ] Weight displayed correctly in order details
- [ ] Weight popup appears for weight-based products
- [ ] Weight popup does not appear for regular products

### Calculation
- [ ] Price calculated correctly (weight × unit price)
- [ ] Total calculated correctly with multiple items
- [ ] Tax calculated correctly with weight-based products
- [ ] Discount applied correctly to weight-based products

### Edge Cases
- [ ] Maximum weight limit (if any)
- [ ] Decimal precision (3 decimal places)
- [ ] Very small weights (grams vs kg)
- [ ] Currency formatting with weight-based prices
- [ ] Multiple items of same weight-based product with different weights

## Performance Considerations

### Database
- Weight column uses `DECIMAL(10,3)` - efficient storage
- No additional indexes required
- Minimal impact on query performance

### API
- No additional API calls required
- Weight validation adds negligible overhead
- Response size increased by ~20 bytes per item (acceptable)

### Frontend
- Weight dialog adds one user interaction step
- Calculation happens client-side (no server calls)
- Cart updates remain performant with weight display

## Conclusion

This feature provides a flexible and intuitive way to handle weight-based pricing for products, enhancing the POS system's capability to serve grocery stores, butcher shops, restaurants with salad bars, and any retail outlet that needs to price items by weight.
