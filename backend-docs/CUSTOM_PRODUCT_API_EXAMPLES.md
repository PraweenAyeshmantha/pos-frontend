# Custom Product API Examples

This document provides practical examples for using the Custom Product feature.

## Table of Contents

- [Basic Custom Product](#basic-custom-product)
- [Mixed Order (Custom + Regular Products)](#mixed-order-custom--regular-products)
- [Multiple Custom Products](#multiple-custom-products)
- [Validation Examples](#validation-examples)
- [Table Order with Custom Products](#table-order-with-custom-products)

---

## Basic Custom Product

### Request

Create an order with a single custom product:

```bash
POST /api/pos/orders
Content-Type: application/json
X-Tenant-ID: PaPos
```

```json
{
  "outletId": 1,
  "cashierId": 1,
  "customerId": null,
  "orderType": "COUNTER",
  "items": [
    {
      "productId": null,
      "productName": "Delivery Fee",
      "quantity": 1,
      "unitPrice": 5.00,
      "discountAmount": 0,
      "notes": "Standard delivery charge"
    }
  ],
  "discountAmount": 0,
  "discountType": "FIXED",
  "couponCode": null,
  "payments": [
    {
      "paymentMethodId": 1,
      "amount": 5.00
    }
  ],
  "notes": "Delivery order"
}
```

### Response

```json
{
  "status": "SUCCESS",
  "code": "success.order.created",
  "message": "Order created successfully",
  "timestamp": "2025-10-16T13:30:00.000Z",
  "path": "/api/pos/orders",
  "data": {
    "id": 1001,
    "orderNumber": "ORD-1729086600000-A1B2C3D4",
    "status": "COMPLETED",
    "subtotal": 5.00,
    "taxAmount": 0.00,
    "discountAmount": 0.00,
    "totalAmount": 5.00,
    "paidAmount": 5.00,
    "changeAmount": 0.00,
    "items": [
      {
        "id": 1,
        "productId": null,
        "productName": "Delivery Fee",
        "quantity": 1,
        "unitPrice": 5.00,
        "discountAmount": 0.00,
        "taxRate": 0.00,
        "taxAmount": 0.00,
        "totalAmount": 5.00,
        "notes": "Standard delivery charge",
        "isCustom": true
      }
    ]
  }
}
```

---

## Mixed Order (Custom + Regular Products)

### Request

Create an order with both custom and regular products:

```bash
POST /api/pos/orders
Content-Type: application/json
X-Tenant-ID: PaPos
```

```json
{
  "outletId": 1,
  "cashierId": 1,
  "customerId": 5,
  "orderType": "COUNTER",
  "items": [
    {
      "productId": 101,
      "productName": "Coffee - Large",
      "quantity": 2,
      "unitPrice": 4.50,
      "discountAmount": 0,
      "notes": null
    },
    {
      "productId": 102,
      "productName": "Croissant",
      "quantity": 1,
      "unitPrice": 3.00,
      "discountAmount": 0,
      "notes": null
    },
    {
      "productId": null,
      "productName": "Extra Shot Espresso",
      "quantity": 2,
      "unitPrice": 0.75,
      "discountAmount": 0,
      "notes": "Add-on request"
    }
  ],
  "discountAmount": 0,
  "discountType": "FIXED",
  "couponCode": null,
  "payments": [
    {
      "paymentMethodId": 1,
      "amount": 13.50
    }
  ],
  "notes": "Customer requested extra shots"
}
```

### Response

```json
{
  "status": "SUCCESS",
  "code": "success.order.created",
  "message": "Order created successfully",
  "timestamp": "2025-10-16T13:35:00.000Z",
  "path": "/api/pos/orders",
  "data": {
    "id": 1002,
    "orderNumber": "ORD-1729086900000-B2C3D4E5",
    "status": "COMPLETED",
    "subtotal": 13.50,
    "taxAmount": 1.20,
    "discountAmount": 0.00,
    "totalAmount": 14.70,
    "paidAmount": 13.50,
    "changeAmount": 0.00,
    "items": [
      {
        "id": 2,
        "productId": 101,
        "productName": "Coffee - Large",
        "quantity": 2,
        "unitPrice": 4.50,
        "discountAmount": 0.00,
        "taxRate": 10.00,
        "taxAmount": 0.90,
        "totalAmount": 9.90,
        "notes": null,
        "isCustom": false
      },
      {
        "id": 3,
        "productId": 102,
        "productName": "Croissant",
        "quantity": 1,
        "unitPrice": 3.00,
        "discountAmount": 0.00,
        "taxRate": 10.00,
        "taxAmount": 0.30,
        "totalAmount": 3.30,
        "notes": null,
        "isCustom": false
      },
      {
        "id": 4,
        "productId": null,
        "productName": "Extra Shot Espresso",
        "quantity": 2,
        "unitPrice": 0.75,
        "discountAmount": 0.00,
        "taxRate": 0.00,
        "taxAmount": 0.00,
        "totalAmount": 1.50,
        "notes": "Add-on request",
        "isCustom": true
      }
    ]
  }
}
```

---

## Multiple Custom Products

### Request

Create an order with multiple custom products:

```bash
POST /api/pos/orders
Content-Type: application/json
X-Tenant-ID: PaPos
```

```json
{
  "outletId": 1,
  "cashierId": 1,
  "customerId": null,
  "orderType": "COUNTER",
  "items": [
    {
      "productId": null,
      "productName": "Gift Card",
      "quantity": 1,
      "unitPrice": 50.00,
      "discountAmount": 0,
      "notes": "Birthday gift"
    },
    {
      "productId": null,
      "productName": "Gift Wrapping",
      "quantity": 1,
      "unitPrice": 2.50,
      "discountAmount": 0,
      "notes": "Premium wrapping"
    },
    {
      "productId": null,
      "productName": "Greeting Card",
      "quantity": 1,
      "unitPrice": 1.50,
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
      "amount": 54.00
    }
  ],
  "notes": "Gift package"
}
```

### Response

```json
{
  "status": "SUCCESS",
  "code": "success.order.created",
  "message": "Order created successfully",
  "timestamp": "2025-10-16T13:40:00.000Z",
  "path": "/api/pos/orders",
  "data": {
    "id": 1003,
    "orderNumber": "ORD-1729087200000-C3D4E5F6",
    "status": "COMPLETED",
    "subtotal": 54.00,
    "taxAmount": 0.00,
    "discountAmount": 0.00,
    "totalAmount": 54.00,
    "paidAmount": 54.00,
    "changeAmount": 0.00,
    "items": [
      {
        "id": 5,
        "productId": null,
        "productName": "Gift Card",
        "quantity": 1,
        "unitPrice": 50.00,
        "discountAmount": 0.00,
        "taxRate": 0.00,
        "taxAmount": 0.00,
        "totalAmount": 50.00,
        "notes": "Birthday gift",
        "isCustom": true
      },
      {
        "id": 6,
        "productId": null,
        "productName": "Gift Wrapping",
        "quantity": 1,
        "unitPrice": 2.50,
        "discountAmount": 0.00,
        "taxRate": 0.00,
        "taxAmount": 0.00,
        "totalAmount": 2.50,
        "notes": "Premium wrapping",
        "isCustom": true
      },
      {
        "id": 7,
        "productId": null,
        "productName": "Greeting Card",
        "quantity": 1,
        "unitPrice": 1.50,
        "discountAmount": 0.00,
        "taxRate": 0.00,
        "taxAmount": 0.00,
        "totalAmount": 1.50,
        "notes": null,
        "isCustom": true
      }
    ]
  }
}
```

---

## Validation Examples

### Example 1: Missing Product Name

#### Request

```json
{
  "outletId": 1,
  "cashierId": 1,
  "items": [
    {
      "productId": null,
      "productName": "",
      "quantity": 1,
      "unitPrice": 10.00
    }
  ],
  "payments": [{"paymentMethodId": 1, "amount": 10.00}]
}
```

#### Response (400 Bad Request)

```json
{
  "status": "ERROR",
  "code": "error.custom-product.name-required",
  "message": "Product name is required for custom products",
  "timestamp": "2025-10-16T13:45:00.000Z",
  "path": "/api/pos/orders",
  "data": null
}
```

### Example 2: Invalid Price

#### Request

```json
{
  "outletId": 1,
  "cashierId": 1,
  "items": [
    {
      "productId": null,
      "productName": "Test Product",
      "quantity": 1,
      "unitPrice": 0
    }
  ],
  "payments": [{"paymentMethodId": 1, "amount": 0}]
}
```

#### Response (400 Bad Request)

```json
{
  "status": "ERROR",
  "code": "error.custom-product.price-required",
  "message": "Valid unit price is required for custom products",
  "timestamp": "2025-10-16T13:46:00.000Z",
  "path": "/api/pos/orders",
  "data": null
}
```

### Example 3: Invalid Quantity

#### Request

```json
{
  "outletId": 1,
  "cashierId": 1,
  "items": [
    {
      "productId": null,
      "productName": "Test Product",
      "quantity": -1,
      "unitPrice": 10.00
    }
  ],
  "payments": [{"paymentMethodId": 1, "amount": 10.00}]
}
```

#### Response (400 Bad Request)

```json
{
  "status": "ERROR",
  "code": "error.custom-product.quantity-required",
  "message": "Valid quantity is required for custom products",
  "timestamp": "2025-10-16T13:47:00.000Z",
  "path": "/api/pos/orders",
  "data": null
}
```

---

## Table Order with Custom Products

### Request

Create a table order with custom products:

```bash
POST /api/pos/tables/5/orders
Content-Type: application/json
X-Tenant-ID: PaPos
```

```json
{
  "outletId": 1,
  "tableId": 5,
  "cashierId": 1,
  "customerId": null,
  "orderType": "DINE_IN",
  "items": [
    {
      "productId": 201,
      "productName": "Grilled Salmon",
      "quantity": 1,
      "unitPrice": 22.00,
      "discountAmount": 0,
      "notes": "Medium well"
    },
    {
      "productId": null,
      "productName": "Extra Lemon Wedges",
      "quantity": 1,
      "unitPrice": 0.50,
      "discountAmount": 0,
      "notes": "Customer request"
    }
  ],
  "notes": "Table 5 - Window seat"
}
```

### Response

```json
{
  "status": "SUCCESS",
  "code": "success.order.created",
  "message": "Table order created and held successfully",
  "timestamp": "2025-10-16T13:50:00.000Z",
  "path": "/api/pos/tables/5/orders",
  "data": {
    "id": 1004,
    "orderNumber": "ORD-1729087800000-D4E5F6G7",
    "status": "ON_HOLD",
    "subtotal": 22.50,
    "taxAmount": 2.20,
    "discountAmount": 0.00,
    "totalAmount": 24.70,
    "table": {
      "id": 5,
      "tableNumber": "T5",
      "status": "OCCUPIED"
    },
    "items": [
      {
        "id": 8,
        "productId": 201,
        "productName": "Grilled Salmon",
        "quantity": 1,
        "unitPrice": 22.00,
        "discountAmount": 0.00,
        "taxRate": 10.00,
        "taxAmount": 2.20,
        "totalAmount": 24.20,
        "notes": "Medium well",
        "isCustom": false
      },
      {
        "id": 9,
        "productId": null,
        "productName": "Extra Lemon Wedges",
        "quantity": 1,
        "unitPrice": 0.50,
        "discountAmount": 0.00,
        "taxRate": 0.00,
        "taxAmount": 0.00,
        "totalAmount": 0.50,
        "notes": "Customer request",
        "isCustom": true
      }
    ]
  }
}
```

---

## cURL Examples

### Basic Custom Product

```bash
curl -X POST "http://localhost:8080/api/pos/orders" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: PaPos" \
  -d '{
    "outletId": 1,
    "cashierId": 1,
    "customerId": null,
    "orderType": "COUNTER",
    "items": [
      {
        "productId": null,
        "productName": "Custom Service",
        "quantity": 1,
        "unitPrice": 15.00,
        "discountAmount": 0,
        "notes": "One-time service"
      }
    ],
    "discountAmount": 0,
    "discountType": "FIXED",
    "payments": [
      {
        "paymentMethodId": 1,
        "amount": 15.00
      }
    ],
    "notes": "Custom product test"
  }'
```

### Mixed Order

```bash
curl -X POST "http://localhost:8080/api/pos/orders" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: PaPos" \
  -d '{
    "outletId": 1,
    "cashierId": 1,
    "items": [
      {
        "productId": 1,
        "productName": "Regular Product",
        "quantity": 2,
        "unitPrice": 10.00,
        "discountAmount": 0
      },
      {
        "productId": null,
        "productName": "Custom Addition",
        "quantity": 1,
        "unitPrice": 5.00,
        "discountAmount": 0
      }
    ],
    "payments": [{"paymentMethodId": 1, "amount": 25.00}]
  }'
```

---

## Notes

- Custom products always have `taxRate: 0` and `taxAmount: 0`
- Custom products don't affect inventory/stock levels
- The `isCustom` flag is automatically set by the backend
- Custom products can be mixed with regular products in the same order
- All validation is performed server-side
- Error responses include specific error codes for easy handling in frontend
