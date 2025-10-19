# Custom Product Feature

## Overview

The Custom Product feature allows cashiers to add products to the cart that don't exist in the product catalog. This is useful for ad-hoc items, special requests, or items that haven't been formally added to the inventory system yet.

## Features

- **Dynamic Product Entry**: Cashiers can input the product name, price, and quantity at the time of sale
- **Tax Calculation**: Custom products use a default tax rate of 0% (exclusive tax setting)
- **Configuration Control**: The feature can be enabled/disabled via the `enable_custom_product` configuration
- **Validation**: Backend validates that custom products have all required fields (name, price, quantity)

## Configuration

The custom product feature is controlled by the `enable_custom_product` configuration key:

- **Key**: `enable_custom_product`
- **Category**: `GENERAL`
- **Type**: `BOOLEAN`
- **Default Value**: `true`
- **Description**: "Enable adding custom products with custom pricing at POS"

To enable or disable this feature, update the configuration value in the database or through the Settings API.

## API Usage

### Creating an Order with Custom Products

Custom products are identified by having a `null` or missing `productId` in the order item request. The backend will automatically set the `isCustom` flag to `true` for these items.

**Endpoint**: `POST /api/pos/orders`

**Request Example**:

```json
{
  "outletId": 1,
  "cashierId": 1,
  "customerId": null,
  "orderType": "COUNTER",
  "items": [
    {
      "productId": null,
      "productName": "Custom Item",
      "quantity": 2,
      "unitPrice": 15.50,
      "discountAmount": 0,
      "notes": "Special request item"
    },
    {
      "productId": 123,
      "productName": "Regular Product",
      "quantity": 1,
      "unitPrice": 25.00,
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
      "amount": 56.00
    }
  ],
  "notes": "Order with custom product"
}
```

### Required Fields for Custom Products

When `productId` is `null` or missing, the following fields are **required**:

- `productName`: Must not be empty
- `unitPrice`: Must be greater than 0
- `quantity`: Must be greater than 0

### Validation Errors

If required fields are missing or invalid, the API will return a `400 Bad Request` error:

**Error Response Examples**:

```json
{
  "status": "error",
  "code": "error.custom-product.name-required",
  "message": "Product name is required for custom products",
  "timestamp": "2025-10-16T13:30:00Z",
  "path": "/api/pos/orders"
}
```

```json
{
  "status": "error",
  "code": "error.custom-product.price-required",
  "message": "Valid unit price is required for custom products",
  "timestamp": "2025-10-16T13:30:00Z",
  "path": "/api/pos/orders"
}
```

```json
{
  "status": "error",
  "code": "error.custom-product.quantity-required",
  "message": "Valid quantity is required for custom products",
  "timestamp": "2025-10-16T13:30:00Z",
  "path": "/api/pos/orders"
}
```

## Order Item Response

When retrieving order details, custom products will have the `isCustom` field set to `true`:

```json
{
  "id": 456,
  "productId": null,
  "productName": "Custom Item",
  "quantity": 2,
  "unitPrice": 15.50,
  "discountAmount": 0,
  "taxRate": 0,
  "taxAmount": 0,
  "totalAmount": 31.00,
  "notes": "Special request item",
  "isCustom": true
}
```

## Database Schema

Custom products are stored in the `order_items` table with the following relevant columns:

- `product_id`: `NULL` for custom products
- `product_name`: The name entered by the cashier
- `is_custom`: `true` for custom products, `false` for regular products
- `unit_price`: The price entered by the cashier
- `quantity`: The quantity entered by the cashier
- `tax_rate`: `0` for custom products (default)

## Use Cases

1. **One-time Services**: Delivery charges, setup fees, or consultation services
2. **Miscellaneous Items**: Items that don't warrant being added to the product catalog
3. **Special Requests**: Custom orders or modifications not in the standard product list
4. **Emergency Sales**: When the regular product needs to be sold but isn't in the system yet
5. **Gift Cards**: Selling gift cards with custom amounts

## Implementation Details

- **Service Layer**: The `PosService` class handles custom product validation and order creation
- **Validation**: Custom products are validated in both `createOrder()` and `createTableOrder()` methods
- **Tax Handling**: Custom products use a tax rate of 0% by default (exclusive tax)
- **Inventory**: Custom products don't affect inventory/stock levels

## Limitations

- Custom products don't have associated inventory tracking
- Tax rate is always 0% for custom products
- No product history or analytics for custom products
- Cannot use barcode scanning for custom products

## Related Configuration

This feature works alongside other POS configurations:

- `enable_order_note`: Allows notes to be added to custom products
- `enable_split_payment`: Works with orders containing custom products
- `default_order_status`: Applies to orders with custom products

## Testing

To test the custom product feature:

1. Ensure `enable_custom_product` configuration is set to `true`
2. Create an order with `productId` set to `null`
3. Provide required fields: `productName`, `unitPrice`, `quantity`
4. Verify the order is created successfully
5. Check that `isCustom` is `true` in the order item
6. Verify validation errors for missing required fields
