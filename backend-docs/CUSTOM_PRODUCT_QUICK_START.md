# Custom Product Feature - Quick Start Guide

## What is it?

The Custom Product feature allows cashiers to add products to orders on-the-fly without pre-existing catalog entries. Perfect for one-time items, services, or special requests.

## How to Use

### Simple Example

Just send `productId: null` and provide the custom product details:

```json
POST /api/pos/orders

{
  "outletId": 1,
  "cashierId": 1,
  "items": [
    {
      "productId": null,           // ← Key: Set to null for custom products
      "productName": "Gift Card",  // ← Required: Product name
      "quantity": 1,               // ← Required: Must be > 0
      "unitPrice": 50.00          // ← Required: Must be > 0
    }
  ],
  "payments": [
    {
      "paymentMethodId": 1,
      "amount": 50.00
    }
  ]
}
```

### What You'll Get Back

```json
{
  "status": "SUCCESS",
  "data": {
    "items": [
      {
        "productId": null,
        "productName": "Gift Card",
        "quantity": 1,
        "unitPrice": 50.00,
        "taxRate": 0,           // ← Always 0% for custom products
        "taxAmount": 0,
        "isCustom": true,       // ← Automatically set by backend
        "totalAmount": 50.00
      }
    ]
  }
}
```

## Key Points

✅ **Required Fields**:
- `productName`: Non-empty string
- `quantity`: Number > 0
- `unitPrice`: Number > 0

✅ **Automatic**:
- Tax rate is always 0%
- `isCustom` flag set to true
- No inventory tracking

✅ **Works With**:
- Counter orders (`POST /api/pos/orders`)
- Table orders (`POST /api/pos/tables/{id}/orders`)
- Mixed with regular products in same order

## Common Use Cases

1. **Services**: "Delivery Fee", "Setup Charge", "Consultation"
2. **Gift Cards**: Variable amount gift cards
3. **Special Requests**: Custom modifications or add-ons
4. **Miscellaneous**: One-time items not in catalog

## Configuration

Feature is controlled by `enable_custom_product` configuration:
- **Default**: Enabled (true)
- **Location**: GENERAL configuration category
- **Change via**: Settings API or database

## Validation Errors

### Missing Name
```json
{
  "status": "ERROR",
  "code": "error.custom-product.name-required",
  "message": "Product name is required for custom products"
}
```

### Invalid Price
```json
{
  "status": "ERROR",
  "code": "error.custom-product.price-required",
  "message": "Valid unit price is required for custom products"
}
```

### Invalid Quantity
```json
{
  "status": "ERROR",
  "code": "error.custom-product.quantity-required",
  "message": "Valid quantity is required for custom products"
}
```

## Testing

Use the included test script:

```bash
./test-custom-product.sh
```

Or use cURL:

```bash
curl -X POST "http://localhost:8080/api/pos/orders" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: PaPos" \
  -d '{
    "outletId": 1,
    "cashierId": 1,
    "items": [{
      "productId": null,
      "productName": "Test Item",
      "quantity": 1,
      "unitPrice": 10.00
    }],
    "payments": [{"paymentMethodId": 1, "amount": 10.00}]
  }'
```

## More Information

- **Full Documentation**: [CUSTOM_PRODUCT_FEATURE.md](CUSTOM_PRODUCT_FEATURE.md)
- **API Examples**: [CUSTOM_PRODUCT_API_EXAMPLES.md](CUSTOM_PRODUCT_API_EXAMPLES.md)
- **Implementation Details**: [CUSTOM_PRODUCT_IMPLEMENTATION_SUMMARY.md](CUSTOM_PRODUCT_IMPLEMENTATION_SUMMARY.md)

## Need Help?

Check the comprehensive documentation files or open an issue in the repository.
