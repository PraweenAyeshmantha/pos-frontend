# Weight-Based Pricing Feature - API Documentation

## Overview
The weight-based pricing feature allows products to be priced dynamically based on their weight. This is particularly useful for grocery retail outlets selling items like fruits, vegetables, meat, and other products that are priced by weight (e.g., per kg, per lb).

## Database Changes

### New Column: `order_items.weight`
A new column `weight` has been added to the `order_items` table to store the weight of weight-based products.

```sql
ALTER TABLE order_items ADD COLUMN weight DECIMAL(10,3);
```

**Column Details:**
- **Name:** `weight`
- **Type:** `DECIMAL(10,3)`
- **Nullable:** Yes (only required for weight-based products)
- **Purpose:** Stores the weight entered by the user for weight-based products

## Product Configuration

Products can be configured as weight-based by setting the `isWeightBased` field to `true` in the `products` table. This field already exists in the database schema.

**Example Product:**
```json
{
  "id": 1,
  "name": "Fruits (Weight Based)",
  "price": 10.00,
  "unit": "kg",
  "isWeightBased": true,
  "category": "Grocery"
}
```

## API Changes

### 1. Create Order Endpoint
**Endpoint:** `POST /api/pos/orders`

**Request Body Changes:**
The `items` array in the request now includes an optional `weight` field:

```json
{
  "outletId": 1,
  "cashierId": 1,
  "customerId": null,
  "orderType": "COUNTER",
  "items": [
    {
      "productId": 1,
      "productName": "Fruits (Weight Based)",
      "quantity": 1,
      "unitPrice": 10.00,
      "discountAmount": 0,
      "notes": null,
      "weight": 2.5
    }
  ],
  "discountAmount": 0,
  "discountType": null,
  "couponCode": null,
  "payments": [
    {
      "paymentMethodId": 1,
      "amount": 25.00
    }
  ],
  "notes": null
}
```

**Field Details:**
- **weight** (BigDecimal, optional): Required only for weight-based products. Represents the weight of the product in the unit specified in the product configuration (e.g., kg, lb).

**Validation:**
- If a product is marked as `isWeightBased: true`, the `weight` field is **required** and must be greater than 0.
- If a product is not weight-based, the `weight` field can be `null` or omitted.

**Error Response (Missing Weight):**
```json
{
  "code": "error.weight-based-product.weight-required",
  "message": "Weight is required for weight-based products",
  "status": "BAD_REQUEST",
  "timestamp": "2025-10-16T17:45:00Z",
  "path": "/api/pos/orders"
}
```

### 2. Create Table Order Endpoint
**Endpoint:** `POST /api/pos/tables/{tableId}/orders`

**Request Body Changes:**
Similar to the Create Order endpoint, the `items` array now includes the optional `weight` field:

```json
{
  "outletId": 1,
  "tableId": 5,
  "cashierId": 1,
  "customerId": null,
  "orderType": "DINE_IN",
  "items": [
    {
      "productId": 1,
      "productName": "Fruits (Weight Based)",
      "quantity": 1,
      "unitPrice": 10.00,
      "discountAmount": 0,
      "notes": null,
      "weight": 1.75
    }
  ],
  "notes": "Table order with weight-based item"
}
```

### 3. Response Changes

**OrderItemDTO Response:**
The `OrderItemDTO` now includes the `weight` field in responses:

```json
{
  "id": 1,
  "productId": 1,
  "productName": "Fruits (Weight Based)",
  "quantity": 1,
  "unitPrice": 10.00,
  "discountAmount": 0,
  "taxRate": 0,
  "taxAmount": 0,
  "totalAmount": 10.00,
  "notes": null,
  "isCustom": false,
  "weight": 2.5
}
```

## Frontend Implementation Guidelines

### User Flow
1. **Product Selection:** When a user selects a weight-based product (identified by `isWeightBased: true`), display a popup/modal to enter the weight.
2. **Weight Entry:** The popup should:
   - Display the product name
   - Show the unit price and unit (e.g., "$10.00 per kg")
   - Provide an input field for the weight
   - Calculate and display the total price dynamically as the user enters the weight
3. **Validation:** Ensure the weight is a positive number before adding the item to the cart.
4. **Cart Display:** Show the weight and calculated price in the cart view.

### Example Weight Entry Dialog
```
┌─────────────────────────────────────────┐
│  Enter weight for the purchase.         │
│                                          │
│  Fruits (Weight Based) [1 kg] = $10.00  │
│                                          │
│  Weight: [____] kg                       │
│                                          │
│  Total: $0.00                            │
│                                          │
│  [Cancel]                [Add to Cart]  │
└─────────────────────────────────────────┘
```

## Pricing Calculation

For weight-based products:
- **Base Price:** Product's `price` field represents the price per unit (e.g., $10 per kg)
- **Quantity:** Typically set to 1 for weight-based items
- **Weight:** User-entered weight (e.g., 2.5 kg)
- **Total Price:** `unitPrice × weight` (but quantity is used in calculation: `quantity × unitPrice`)

**Note:** The frontend should calculate the `unitPrice` based on weight before sending to the backend:
- If weight = 2.5 kg and price per kg = $10.00
- Then unitPrice should be sent as: 2.5 × $10.00 = $25.00
- Quantity remains 1

## Feature Toggle

The weight-based pricing feature can be activated/deactivated at the product level by setting the `isWeightBased` flag:
- **Activated:** Set `isWeightBased` to `true` for specific products
- **Deactivated:** Set `isWeightBased` to `false` or leave it as default (false)

No global configuration is needed; the feature is controlled per product.

## Testing

### Test Scenarios
1. **Creating an order with a weight-based product and valid weight**
   - Expected: Order created successfully with weight stored in order item
2. **Creating an order with a weight-based product but missing weight**
   - Expected: Error response with message "Weight is required for weight-based products"
3. **Creating an order with a non-weight-based product without weight**
   - Expected: Order created successfully, weight field is null
4. **Creating a table order with weight-based products**
   - Expected: Same behavior as regular orders

### Sample Test Data
```json
// Weight-based product
{
  "id": 1,
  "name": "Fresh Apples",
  "price": 5.00,
  "unit": "kg",
  "isWeightBased": true
}

// Non-weight-based product
{
  "id": 2,
  "name": "Burger",
  "price": 8.00,
  "unit": "piece",
  "isWeightBased": false
}
```

## Migration

The database migration (changeset `023-add-weight-to-order-items`) will be applied automatically when the application starts using Liquibase.

**Migration File:** `src/main/resources/db/changelog/v1.0/023-add-weight-to-order-items.yaml`

No data migration is needed as this is a new optional field.

## Backward Compatibility

This feature is fully backward compatible:
- Existing products without `isWeightBased` set will default to `false`
- Existing orders and order items are not affected
- The `weight` field is optional and can be `null` for non-weight-based products
- Frontend applications that don't implement weight entry will continue to work normally for non-weight-based products

## Future Enhancements

Potential improvements for future versions:
1. Add weight unit conversion support (kg ↔ lb)
2. Add configuration for minimum/maximum weight limits per product
3. Support for tare weight deduction
4. Integration with digital scales via hardware APIs
5. Weight-based pricing reports and analytics
