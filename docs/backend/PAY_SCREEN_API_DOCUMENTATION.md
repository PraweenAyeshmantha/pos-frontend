# Pay Screen API Documentation

## Overview

This document provides comprehensive guidance for implementing the Pay Screen feature in the POS frontend. The backend already supports all required functionality including multiple payment methods, order notes, and automated payment calculations.

## Pay Screen Features Supported

The backend provides complete support for the following Pay Screen features:

### 1. Multiple Payment Methods
- Customers can use several payment methods for a single order
- Split payments are enabled by default via `enable_split_payment` configuration
- Each payment is tracked separately with its own payment method reference
- Automatic calculation of total paid and change amounts

### 2. Order Notes
- Order notes can be added if enabled in backend settings
- Controlled by `enable_order_note` configuration (enabled by default)
- Frontend should check configuration to show/hide the order note field
- Notes are stored in the `Order.notes` field

### 3. Payment Calculations
- **Total Due**: Calculated as `subtotal - discount + tax`
- **Total Paying**: Sum of all payment amounts entered
- **Pay Left**: `totalAmount - totalPaid`
- **Change**: `totalPaid - totalAmount` (if positive)
- All calculations are automatic on the backend

### 4. Quick Amount Buttons
- Frontend can implement quick amount buttons (e.g., $156.20, $157.00, $160.00, $165.00)
- Backend accepts any payment amounts via the payments array
- Suggested amounts should be calculated on frontend based on total amount

## Required API Endpoints

### 1. Get Payment Configuration

Check if order notes and split payments are enabled.

**Endpoint:** `GET /api/admin/configurations?category=GENERAL`

**Request:**
```bash
curl -X GET "http://localhost:8080/posai/api/admin/configurations?category=GENERAL" \
  -H "X-Tenant-ID: PaPos"
```

**Response:**
```json
{
  "status": "SUCCESS",
  "code": "success",
  "message": "Configurations retrieved successfully",
  "timestamp": "2025-10-17T15:00:00Z",
  "path": "/api/admin/configurations",
  "data": [
    {
      "id": 6,
      "configKey": "enable_split_payment",
      "configValue": "true",
      "category": "GENERAL",
      "description": "Enable split/multiple payment methods at POS",
      "dataType": "BOOLEAN"
    },
    {
      "id": 7,
      "configKey": "enable_order_note",
      "configValue": "true",
      "category": "GENERAL",
      "description": "Enable order notes for orders made at POS",
      "dataType": "BOOLEAN"
    }
  ]
}
```

### 2. Get Available Payment Methods

Retrieve all active payment methods for the pay screen.

**Endpoint:** `GET /api/pos/payment-methods`

**Request:**
```bash
curl -X GET "http://localhost:8080/posai/api/pos/payment-methods" \
  -H "X-Tenant-ID: PaPos"
```

**Response:**
```json
{
  "status": "SUCCESS",
  "code": "success",
  "message": "Payment methods retrieved successfully",
  "timestamp": "2025-10-17T15:00:00Z",
  "path": "/api/pos/payment-methods",
  "data": [
    {
      "id": 1,
      "slug": "cash",
      "name": "Cash",
      "description": "Cash payment",
      "isActive": true,
      "isDefault": true
    },
    {
      "id": 2,
      "slug": "card",
      "name": "Credit/Debit Card",
      "description": "Card payment",
      "isActive": true,
      "isDefault": false
    },
    {
      "id": 3,
      "slug": "mobile-payment",
      "name": "Mobile Payment",
      "description": "Mobile wallet payment",
      "isActive": true,
      "isDefault": false
    }
  ]
}
```

### 3. Get Outlet-Specific Payment Methods (Optional)

If you want to show only payment methods assigned to a specific outlet.

**Endpoint:** `GET /api/admin/outlets/{outletId}/payment-methods`

**Request:**
```bash
curl -X GET "http://localhost:8080/posai/api/admin/outlets/1/payment-methods" \
  -H "X-Tenant-ID: PaPos"
```

**Response:**
```json
{
  "status": "SUCCESS",
  "code": "success",
  "message": "Payment methods retrieved successfully",
  "timestamp": "2025-10-17T15:00:00Z",
  "path": "/api/admin/outlets/1/payment-methods",
  "data": [
    {
      "id": 1,
      "slug": "cash",
      "name": "Cash",
      "description": "Cash payment",
      "isActive": true,
      "isDefault": true
    },
    {
      "id": 2,
      "slug": "card",
      "name": "Credit/Debit Card",
      "description": "Card payment",
      "isActive": true,
      "isDefault": false
    }
  ]
}
```

### 4. Create Order with Multiple Payments

Create a new order with multiple payment methods.

**Endpoint:** `POST /api/pos/orders`

**Request Body:**
```json
{
  "outletId": 1,
  "cashierId": 1,
  "customerId": 1,
  "orderType": "COUNTER",
  "items": [
    {
      "productId": 1,
      "productName": "Beanie",
      "quantity": 1,
      "unitPrice": 18.00,
      "discountAmount": 0,
      "notes": null
    },
    {
      "productId": 2,
      "productName": "T-Shirt",
      "quantity": 1,
      "unitPrice": 18.00,
      "discountAmount": 0,
      "notes": null
    },
    {
      "productId": 3,
      "productName": "Sunglasses",
      "quantity": 1,
      "unitPrice": 90.00,
      "discountAmount": 0,
      "notes": null
    },
    {
      "productId": 4,
      "productName": "Cap",
      "quantity": 1,
      "unitPrice": 16.00,
      "discountAmount": 0,
      "notes": null
    }
  ],
  "discountAmount": 0,
  "discountType": "FIXED",
  "couponCode": null,
  "payments": [
    {
      "paymentMethodId": 1,
      "amount": 100.00
    },
    {
      "paymentMethodId": 2,
      "amount": 65.00
    }
  ],
  "notes": "Customer requested fast service"
}
```

**Request:**
```bash
curl -X POST "http://localhost:8080/posai/api/pos/orders" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "outletId": 1,
    "cashierId": 1,
    "customerId": 1,
    "orderType": "COUNTER",
    "items": [
      {
        "productId": 1,
        "productName": "Beanie",
        "quantity": 1,
        "unitPrice": 18.00,
        "discountAmount": 0
      }
    ],
    "payments": [
      {
        "paymentMethodId": 1,
        "amount": 100.00
      },
      {
        "paymentMethodId": 2,
        "amount": 65.00
      }
    ],
    "notes": "Customer note here"
  }'
```

**Response:**
```json
{
  "status": "SUCCESS",
  "code": "success.order.created",
  "message": "Order created successfully",
  "timestamp": "2025-10-17T15:00:00Z",
  "path": "/api/pos/orders",
  "data": {
    "id": 123,
    "orderNumber": "ORD-1697551200-ABCDEF",
    "orderType": "COUNTER",
    "status": "COMPLETED",
    "subtotal": 142.00,
    "discountAmount": 0.00,
    "taxAmount": 14.20,
    "totalAmount": 156.20,
    "paidAmount": 165.00,
    "changeAmount": 8.80,
    "notes": "Customer requested fast service",
    "items": [...],
    "payments": [
      {
        "id": 1,
        "paymentMethod": {
          "id": 1,
          "slug": "cash",
          "name": "Cash"
        },
        "amount": 100.00,
        "paymentDate": "2025-10-17T15:00:00Z"
      },
      {
        "id": 2,
        "paymentMethod": {
          "id": 2,
          "slug": "card",
          "name": "Credit/Debit Card"
        },
        "amount": 65.00,
        "paymentDate": "2025-10-17T15:00:00Z"
      }
    ]
  }
}
```

### 5. Complete Table Order with Payments

Complete an on-hold order (e.g., from a dining table) with payment processing.

**Endpoint:** `POST /api/pos/orders/{orderId}/complete`

**Request Body:**
```json
{
  "discountAmount": 0,
  "discountType": "FIXED",
  "payments": [
    {
      "paymentMethodId": 1,
      "amount": 100.00
    },
    {
      "paymentMethodId": 2,
      "amount": 56.20
    }
  ]
}
```

**Request:**
```bash
curl -X POST "http://localhost:8080/posai/api/pos/orders/123/complete" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "discountAmount": 0,
    "discountType": "FIXED",
    "payments": [
      {
        "paymentMethodId": 1,
        "amount": 100.00
      },
      {
        "paymentMethodId": 2,
        "amount": 56.20
      }
    ]
  }'
```

**Response:**
```json
{
  "status": "SUCCESS",
  "code": "success.order.completed",
  "message": "Order completed successfully",
  "timestamp": "2025-10-17T15:00:00Z",
  "path": "/api/pos/orders/123/complete",
  "data": {
    "id": 123,
    "orderNumber": "ORD-1697551200-ABCDEF",
    "orderType": "DINE_IN",
    "status": "COMPLETED",
    "subtotal": 142.00,
    "discountAmount": 0.00,
    "taxAmount": 14.20,
    "totalAmount": 156.20,
    "paidAmount": 156.20,
    "changeAmount": 0.00,
    "completedDate": "2025-10-17T15:00:00Z"
  }
}
```

## Frontend Implementation Guide

### Pay Screen Workflow

1. **Initialize Pay Screen**
   - Get order total from cart/order
   - Fetch available payment methods from `/api/pos/payment-methods`
   - Check if order notes are enabled from configuration
   - Initialize payment array as empty `[]`

2. **Display Payment Information**
   ```javascript
   const totalDue = order.totalAmount; // e.g., 156.20
   const totalPaying = payments.reduce((sum, p) => sum + p.amount, 0); // e.g., 165.00
   const payLeft = Math.max(0, totalDue - totalPaying); // e.g., 0.00
   const change = Math.max(0, totalPaying - totalDue); // e.g., 8.80
   ```

3. **Add Payment Method**
   - User selects a payment method from dropdown
   - User enters amount
   - Add to payments array:
     ```javascript
     payments.push({
       paymentMethodId: selectedMethodId,
       amount: enteredAmount
     });
     ```
   - Update display calculations

4. **Generate Quick Amount Buttons**
   ```javascript
   const quickAmounts = [
     Math.ceil(totalDue), // Rounds up to next dollar
     Math.ceil(totalDue) + 1,
     Math.ceil(totalDue) + 4,
     Math.ceil(totalDue) + 9
   ];
   // For $156.20: [157, 158, 161, 166]
   ```

5. **Submit Payment**
   - Validate: `totalPaying >= totalDue`
   - Include order notes if enabled and entered
   - Submit to appropriate endpoint:
     - New order: `POST /api/pos/orders`
     - Complete existing order: `POST /api/pos/orders/{orderId}/complete`

### Sample Frontend Code

```javascript
// Fetch payment methods
async function fetchPaymentMethods() {
  const response = await fetch('/api/pos/payment-methods', {
    headers: { 'X-Tenant-ID': 'PaPos' }
  });
  const data = await response.json();
  return data.data; // Array of payment methods
}

// Check if order notes enabled
async function checkOrderNotesEnabled() {
  const response = await fetch('/api/admin/configurations?category=GENERAL', {
    headers: { 'X-Tenant-ID': 'PaPos' }
  });
  const data = await response.json();
  const config = data.data.find(c => c.configKey === 'enable_order_note');
  return config?.configValue === 'true';
}

// Create order with multiple payments
async function createOrderWithPayments(orderData, payments, notes) {
  const requestBody = {
    ...orderData,
    payments: payments,
    notes: notes || null
  };
  
  const response = await fetch('/api/pos/orders', {
    method: 'POST',
    headers: {
      'X-Tenant-ID': 'PaPos',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });
  
  const result = await response.json();
  return result.data;
}

// Calculate payment totals
function calculatePaymentTotals(orderTotal, payments) {
  const totalPaying = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const payLeft = Math.max(0, orderTotal - totalPaying);
  const change = Math.max(0, totalPaying - orderTotal);
  
  return {
    totalDue: orderTotal,
    totalPaying: totalPaying,
    payLeft: payLeft,
    change: change
  };
}
```

## Payment Method Configuration

### Adding New Payment Methods

Administrators can add new payment methods via the admin API:

```bash
curl -X POST "http://localhost:8080/posai/api/admin/payment-methods" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "digital-wallet",
    "name": "Digital Wallet",
    "description": "Apple Pay, Google Pay, etc.",
    "isActive": true,
    "isDefault": false
  }'
```

### Assigning Payment Methods to Outlets

```bash
# Add payment method to outlet
curl -X POST "http://localhost:8080/posai/api/admin/outlets/1/payment-methods/3" \
  -H "X-Tenant-ID: PaPos"

# Remove payment method from outlet
curl -X DELETE "http://localhost:8080/posai/api/admin/outlets/1/payment-methods/3" \
  -H "X-Tenant-ID: PaPos"
```

## Business Rules

### Payment Validation

1. **Minimum Payment**: At least one payment method must be provided
2. **Sufficient Payment**: Total payment amount must be >= order total
3. **Valid Payment Methods**: All payment method IDs must exist and be active
4. **Order Status**: Orders are marked as `COMPLETED` when fully paid

### Order Notes

1. **Configuration Check**: Frontend should check `enable_order_note` configuration
2. **Optional Field**: Notes are optional even when enabled
3. **Character Limit**: Notes field has a 1000 character limit in database
4. **Display**: Show notes textarea only when configuration is enabled

### Payment Calculations

All calculations are performed automatically on the backend:
- **Subtotal**: Sum of all order items (quantity × unit price)
- **Discount**: Applied based on discount type (FIXED or PERCENTAGE)
- **Tax**: Calculated per item based on product tax rate
- **Total Amount**: `subtotal - discount + tax`
- **Paid Amount**: Sum of all payment amounts
- **Change Amount**: `paidAmount - totalAmount` (if positive, otherwise 0)

## Error Handling

### Common Error Responses

**Payment Method Not Found (404):**
```json
{
  "status": "ERROR",
  "code": "error.resource.not-found",
  "message": "Payment method not found with id: 999",
  "timestamp": "2025-10-17T15:00:00Z",
  "path": "/api/pos/orders"
}
```

**Insufficient Payment (400):**
This is not enforced on the backend. The order will be created but status may remain as PENDING or DRAFT if not fully paid.

**Invalid Payment Amount (400):**
```json
{
  "status": "ERROR",
  "code": "error.validation",
  "message": "Please review the information you provided",
  "timestamp": "2025-10-17T15:00:00Z",
  "path": "/api/pos/orders",
  "errors": [
    {
      "field": "payments[0].amount",
      "message": "Payment amount must be positive"
    }
  ]
}
```

## Testing the Pay Screen

### Test Scenario 1: Single Payment Method

```bash
curl -X POST "http://localhost:8080/posai/api/pos/orders" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "outletId": 1,
    "cashierId": 1,
    "orderType": "COUNTER",
    "items": [{"productId": 1, "quantity": 1, "unitPrice": 20.00}],
    "payments": [{"paymentMethodId": 1, "amount": 25.00}],
    "notes": "Test order"
  }'
```

### Test Scenario 2: Multiple Payment Methods (Split Payment)

```bash
curl -X POST "http://localhost:8080/posai/api/pos/orders" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "outletId": 1,
    "cashierId": 1,
    "orderType": "COUNTER",
    "items": [{"productId": 1, "quantity": 1, "unitPrice": 100.00}],
    "payments": [
      {"paymentMethodId": 1, "amount": 50.00},
      {"paymentMethodId": 2, "amount": 50.00}
    ],
    "notes": "Split payment test"
  }'
```

### Test Scenario 3: Order with Notes (if enabled)

First check if notes are enabled:
```bash
curl -X GET "http://localhost:8080/posai/api/admin/configurations?category=GENERAL" \
  -H "X-Tenant-ID: PaPos" | jq '.data[] | select(.configKey=="enable_order_note")'
```

Then create order with notes:
```bash
curl -X POST "http://localhost:8080/posai/api/pos/orders" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "outletId": 1,
    "cashierId": 1,
    "orderType": "COUNTER",
    "items": [{"productId": 1, "quantity": 1, "unitPrice": 20.00}],
    "payments": [{"paymentMethodId": 1, "amount": 22.00}],
    "notes": "Customer requested gift wrapping"
  }'
```

## Summary

The backend provides complete support for the Pay Screen feature with:

- ✅ Multiple payment methods per order
- ✅ Configurable order notes
- ✅ Automatic payment calculations
- ✅ Outlet-specific payment method management
- ✅ Payment method CRUD operations
- ✅ Split payment support

No backend changes are required. The frontend can implement the Pay Screen UI using the existing APIs documented above.
