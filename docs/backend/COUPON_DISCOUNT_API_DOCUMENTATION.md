# Coupons and Discounts API Documentation

This document describes the API endpoints for managing coupons and applying discounts in the POS system.

## Table of Contents

1. [Coupon Management APIs](#coupon-management-apis)
2. [Applying Coupons and Discounts to Orders](#applying-coupons-and-discounts-to-orders)
3. [Data Models](#data-models)

---

## Coupon Management APIs

### 1. Create Coupon

**Endpoint:** `POST /api/coupons`

**Description:** Create a new coupon with specified discount type and value.

**Request Body:**
```json
{
  "code": "WELCOME10",
  "description": "10% discount for new customers",
  "discountType": "PERCENTAGE",
  "discountValue": 10.00,
  "validFrom": "2025-01-01T00:00:00Z",
  "validTo": "2025-12-31T23:59:59Z",
  "usageLimit": 100
}
```

**Response:**
```json
{
  "status": "success",
  "code": "success.coupon.created",
  "message": "Coupon created successfully",
  "data": {
    "id": 1,
    "code": "WELCOME10",
    "description": "10% discount for new customers",
    "discountType": "PERCENTAGE",
    "discountValue": 10.00,
    "validFrom": "2025-01-01T00:00:00Z",
    "validTo": "2025-12-31T23:59:59Z",
    "usageLimit": 100,
    "timesUsed": 0,
    "isActive": true
  }
}
```

### 2. Get Coupon by ID

**Endpoint:** `GET /api/coupons/{id}`

**Description:** Retrieve a coupon by its ID.

**Response:**
```json
{
  "status": "success",
  "message": "Coupon retrieved successfully",
  "data": {
    "id": 1,
    "code": "WELCOME10",
    "description": "10% discount for new customers",
    "discountType": "PERCENTAGE",
    "discountValue": 10.00,
    "validFrom": "2025-01-01T00:00:00Z",
    "validTo": "2025-12-31T23:59:59Z",
    "usageLimit": 100,
    "timesUsed": 5,
    "isActive": true
  }
}
```

### 3. Get Coupon by Code

**Endpoint:** `GET /api/coupons/code/{code}`

**Description:** Retrieve a coupon by its code.

**Example:** `GET /api/coupons/code/WELCOME10`

**Response:** Same as Get Coupon by ID

### 4. Get All Coupons

**Endpoint:** `GET /api/coupons`

**Query Parameters:**
- `includeInactive` (optional, default: false) - Include inactive coupons in the response

**Description:** Retrieve all active coupons (or all coupons if includeInactive=true).

**Example:** `GET /api/coupons?includeInactive=true`

**Response:**
```json
{
  "status": "success",
  "message": "Coupons retrieved successfully",
  "data": [
    {
      "id": 1,
      "code": "WELCOME10",
      "description": "10% discount for new customers",
      "discountType": "PERCENTAGE",
      "discountValue": 10.00,
      "validFrom": "2025-01-01T00:00:00Z",
      "validTo": "2025-12-31T23:59:59Z",
      "usageLimit": 100,
      "timesUsed": 5,
      "isActive": true
    },
    {
      "id": 2,
      "code": "FLAT50",
      "description": "Flat $50 off",
      "discountType": "FIXED",
      "discountValue": 50.00,
      "validFrom": null,
      "validTo": null,
      "usageLimit": null,
      "timesUsed": 0,
      "isActive": true
    }
  ]
}
```

### 5. Update Coupon

**Endpoint:** `PUT /api/coupons/{id}`

**Description:** Update an existing coupon.

**Request Body:**
```json
{
  "code": "WELCOME15",
  "description": "15% discount for new customers (updated)",
  "discountType": "PERCENTAGE",
  "discountValue": 15.00,
  "validFrom": "2025-01-01T00:00:00Z",
  "validTo": "2025-12-31T23:59:59Z",
  "usageLimit": 150
}
```

**Response:**
```json
{
  "status": "success",
  "code": "success.coupon.updated",
  "message": "Coupon updated successfully",
  "data": {
    "id": 1,
    "code": "WELCOME15",
    "description": "15% discount for new customers (updated)",
    "discountType": "PERCENTAGE",
    "discountValue": 15.00,
    "validFrom": "2025-01-01T00:00:00Z",
    "validTo": "2025-12-31T23:59:59Z",
    "usageLimit": 150,
    "timesUsed": 5,
    "isActive": true
  }
}
```

### 6. Delete Coupon

**Endpoint:** `DELETE /api/coupons/{id}`

**Description:** Soft delete a coupon (sets isActive to false).

**Response:**
```json
{
  "status": "success",
  "code": "success.coupon.deleted",
  "message": "Coupon deleted successfully",
  "data": null
}
```

---

## Applying Coupons and Discounts to Orders

### 1. Apply Coupon to Order

**Endpoint:** `POST /api/pos/orders/{orderId}/coupon`

**Description:** Apply a coupon code to an existing order. The coupon is validated (active, not expired, within usage limit) before being applied.

**Request Body:**
```json
{
  "couponCode": "WELCOME10"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Coupon applied successfully",
  "data": {
    "id": 123,
    "orderNumber": "ORD-1234567890-ABC123",
    "subtotal": 100.00,
    "discountAmount": 10.00,
    "couponCode": "WELCOME10",
    "taxAmount": 9.00,
    "totalAmount": 99.00,
    "status": "PENDING",
    ...
  }
}
```

**Error Responses:**

- **Coupon Not Found:**
```json
{
  "status": "error",
  "message": "Coupon not found with code: INVALID123"
}
```

- **Coupon Invalid/Expired:**
```json
{
  "status": "error",
  "code": "error.coupon.invalid",
  "message": "Coupon is not valid or has expired"
}
```

- **Usage Limit Exceeded:**
```json
{
  "status": "error",
  "code": "error.coupon.invalid",
  "message": "Coupon is not valid or has expired"
}
```

### 2. Apply Custom Discount to Order

**Endpoint:** `POST /api/pos/orders/{orderId}/discount`

**Description:** Apply a custom discount (fixed amount or percentage) to an existing order. When a custom discount is applied, any previously applied coupon is removed.

**Request Body (Fixed Amount):**
```json
{
  "discountType": "FIXED",
  "discountValue": 25.00
}
```

**Request Body (Percentage):**
```json
{
  "discountType": "PERCENTAGE",
  "discountValue": 15.00
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Discount applied successfully",
  "data": {
    "id": 123,
    "orderNumber": "ORD-1234567890-ABC123",
    "subtotal": 100.00,
    "discountAmount": 25.00,
    "couponCode": null,
    "taxAmount": 7.50,
    "totalAmount": 82.50,
    "status": "PENDING",
    ...
  }
}
```

---

## Data Models

### Coupon

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | Long | - | Auto-generated ID |
| code | String(50) | Yes | Unique coupon code |
| description | String(500) | No | Description of the coupon |
| discountType | Enum | Yes | "FIXED" or "PERCENTAGE" |
| discountValue | BigDecimal | Yes | Discount amount or percentage |
| validFrom | OffsetDateTime | No | Start date of validity |
| validTo | OffsetDateTime | No | End date of validity |
| usageLimit | Integer | No | Maximum number of times coupon can be used |
| timesUsed | Integer | - | Number of times coupon has been used |
| isActive | Boolean | - | Whether coupon is active (default: true) |

### Coupon Validation Rules

A coupon is considered valid if ALL of the following conditions are met:
1. `isActive` is `true`
2. If `validFrom` is set, current time is after `validFrom`
3. If `validTo` is set, current time is before `validTo`
4. If `usageLimit` is set, `timesUsed` is less than `usageLimit`

### Discount Types

- **FIXED**: A fixed dollar amount discount (e.g., $10 off)
- **PERCENTAGE**: A percentage-based discount (e.g., 15% off)

### Order Fields Related to Discounts

| Field | Type | Description |
|-------|------|-------------|
| subtotal | BigDecimal | Sum of all order items before discount and tax |
| discountAmount | BigDecimal | Total discount applied (from coupon or custom discount) |
| couponCode | String(50) | Code of the applied coupon (null if custom discount) |
| taxAmount | BigDecimal | Total tax amount |
| totalAmount | BigDecimal | Final amount: subtotal - discountAmount + taxAmount |

---

## Usage Examples

### Example 1: Create and Apply a Percentage Coupon

```bash
# 1. Create a 20% discount coupon
curl -X POST http://localhost:8080/api/coupons \
  -H "Content-Type: application/json" \
  -H "X-TenantID: tenant1" \
  -d '{
    "code": "SAVE20",
    "description": "20% off on all items",
    "discountType": "PERCENTAGE",
    "discountValue": 20.00,
    "usageLimit": 50
  }'

# 2. Apply the coupon to an order
curl -X POST http://localhost:8080/api/pos/orders/123/coupon \
  -H "Content-Type: application/json" \
  -H "X-TenantID: tenant1" \
  -d '{
    "couponCode": "SAVE20"
  }'
```

### Example 2: Create and Apply a Fixed Amount Coupon

```bash
# 1. Create a $50 fixed discount coupon
curl -X POST http://localhost:8080/api/coupons \
  -H "Content-Type: application/json" \
  -H "X-TenantID: tenant1" \
  -d '{
    "code": "FLAT50",
    "description": "Flat $50 off",
    "discountType": "FIXED",
    "discountValue": 50.00
  }'

# 2. Apply the coupon to an order
curl -X POST http://localhost:8080/api/pos/orders/124/coupon \
  -H "Content-Type: application/json" \
  -H "X-TenantID: tenant1" \
  -d '{
    "couponCode": "FLAT50"
  }'
```

### Example 3: Apply Custom Discount

```bash
# Apply a custom 15% discount to an order (removes any coupon)
curl -X POST http://localhost:8080/api/pos/orders/125/discount \
  -H "Content-Type: application/json" \
  -H "X-TenantID: tenant1" \
  -d '{
    "discountType": "PERCENTAGE",
    "discountValue": 15.00
  }'
```

---

## Notes

1. **Coupon vs Custom Discount**: 
   - When a coupon is applied, the `couponCode` field is set on the order
   - When a custom discount is applied, the `couponCode` field is cleared
   - Only one type of discount can be active on an order at a time

2. **Coupon Usage Tracking**:
   - When a coupon is successfully applied to an order, its `timesUsed` counter is incremented
   - This happens immediately when the coupon is applied, not when the order is completed

3. **Multi-tenancy**:
   - All coupon and order APIs require the `X-TenantID` header for multi-tenant support

4. **Discount Calculation**:
   - For percentage discounts: `discountAmount = subtotal × (discountValue ÷ 100)`
   - For fixed discounts: `discountAmount = discountValue`
   - Final total: `totalAmount = subtotal - discountAmount + taxAmount`

5. **Sample Coupons**:
   - Three sample coupons are automatically created on system initialization:
     - `WELCOME10`: 10% off, usage limit 100
     - `SAVE20`: 20% off, usage limit 50
     - `FLAT50`: $50 flat discount, no usage limit
