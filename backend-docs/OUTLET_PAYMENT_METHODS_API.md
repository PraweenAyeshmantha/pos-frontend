# Outlet Payment Methods API

This document describes the API endpoints for managing payment methods linked to outlets.

## Overview

Outlets can have multiple payment methods assigned to them. These payment methods will be available as options for customers to use when paying for their orders at that specific outlet.

## Endpoints

### 1. Add Payment Method to Outlet

Adds a payment method to an outlet's list of available payment methods.

**URL:** `POST /api/admin/outlets/{id}/payment-methods/{paymentMethodId}`

**Path Parameters:**
- `id` (Long) - The outlet ID
- `paymentMethodId` (Long) - The payment method ID to add

**Success Response:**
- **Code:** 200 OK
- **Content:**
```json
{
  "status": "success.outlet.payment-method.added",
  "message": "Payment method added to outlet successfully",
  "path": "/api/admin/outlets/1/payment-methods/2",
  "data": {
    "id": 1,
    "name": "Main Store",
    "code": "MS001",
    "mode": "GROCERY_RETAIL",
    "paymentMethods": [
      {
        "id": 2,
        "slug": "card",
        "name": "Credit Card",
        "isActive": true
      }
    ]
  }
}
```

**Error Response:**
- **Code:** 404 NOT FOUND - If outlet or payment method not found

---

### 2. Remove Payment Method from Outlet

Removes a payment method from an outlet's list of available payment methods.

**URL:** `DELETE /api/admin/outlets/{id}/payment-methods/{paymentMethodId}`

**Path Parameters:**
- `id` (Long) - The outlet ID
- `paymentMethodId` (Long) - The payment method ID to remove

**Success Response:**
- **Code:** 200 OK
- **Content:**
```json
{
  "status": "success.outlet.payment-method.removed",
  "message": "Payment method removed from outlet successfully",
  "path": "/api/admin/outlets/1/payment-methods/2",
  "data": {
    "id": 1,
    "name": "Main Store",
    "code": "MS001",
    "mode": "GROCERY_RETAIL",
    "paymentMethods": []
  }
}
```

**Error Response:**
- **Code:** 404 NOT FOUND - If outlet or payment method not found

---

### 3. Get Outlet Payment Methods

Retrieves all payment methods available for a specific outlet.

**URL:** `GET /api/admin/outlets/{id}/payment-methods`

**Path Parameters:**
- `id` (Long) - The outlet ID

**Success Response:**
- **Code:** 200 OK
- **Content:**
```json
{
  "status": "success",
  "message": "Payment methods retrieved successfully",
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
      "name": "Credit Card",
      "description": "Card payment",
      "isActive": true,
      "isDefault": false
    }
  ]
}
```

**Error Response:**
- **Code:** 404 NOT FOUND - If outlet not found

---

## Usage Examples

### Example 1: Add Cash Payment to an Outlet

```bash
curl -X POST http://localhost:8080/api/admin/outlets/1/payment-methods/1
```

### Example 2: Get All Payment Methods for an Outlet

```bash
curl -X GET http://localhost:8080/api/admin/outlets/1/payment-methods
```

### Example 3: Remove a Payment Method from an Outlet

```bash
curl -X DELETE http://localhost:8080/api/admin/outlets/1/payment-methods/2
```

## Database Schema

The relationship between outlets and payment methods is stored in the `outlet_payment_methods` junction table:

```sql
CREATE TABLE outlet_payment_methods (
  outlet_id BIGINT NOT NULL,
  payment_method_id BIGINT NOT NULL,
  PRIMARY KEY (outlet_id, payment_method_id),
  FOREIGN KEY (outlet_id) REFERENCES outlets(id),
  FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
);
```

## Business Rules

1. An outlet can have zero or more payment methods
2. A payment method can be assigned to multiple outlets
3. The same payment method cannot be added to an outlet twice (enforced by primary key constraint)
4. When an outlet or payment method is deleted, the relationships are automatically removed

## Related Entities

- **Outlet**: Represents a physical store or location in the POS system
- **PaymentMethod**: Represents a method of payment (cash, credit card, mobile payment, etc.)
