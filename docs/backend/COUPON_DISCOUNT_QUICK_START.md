# Coupons and Discounts - Quick Start Guide

## Overview

This feature allows cashiers to apply promotional coupons or custom discounts to orders. The implementation supports both fixed amount and percentage-based discounts.

## Quick Start

### 1. Using Sample Coupons

Three sample coupons are automatically created when the application starts:

| Code | Type | Value | Usage Limit |
|------|------|-------|-------------|
| WELCOME10 | Percentage | 10% | 100 uses |
| SAVE20 | Percentage | 20% | 50 uses |
| FLAT50 | Fixed | $50 | Unlimited |

### 2. Apply a Coupon to an Order

```bash
POST /posai/api/pos/orders/{orderId}/coupon
Content-Type: application/json
X-TenantID: PaPos

{
  "couponCode": "WELCOME10"
}
```

### 3. Apply a Custom Discount

```bash
POST /posai/api/pos/orders/{orderId}/discount
Content-Type: application/json
X-TenantID: PaPos

{
  "discountType": "PERCENTAGE",
  "discountValue": 15.00
}
```

## Frontend Integration

### UI Elements Required

Based on the provided mockups, the frontend should implement:

#### 1. Apply Coupon Modal
- Input field for coupon code
- "Add" button to apply coupon
- "Cancel" button to dismiss modal
- Display validation errors

#### 2. Apply Discount Modal
- Radio buttons or dropdown for discount type (Fixed/Percentage)
- Numeric input field for discount value
- "Add" button to apply discount
- "Cancel" button to dismiss modal
- Display validation errors

### API Integration Steps

#### Applying a Coupon:
1. User clicks "Coupon" button in cart
2. Show modal with coupon code input
3. On "Add" click:
   ```javascript
   POST /posai/api/pos/orders/{orderId}/coupon
   Body: { "couponCode": userInput }
   ```
4. On success: Update order display with new discount
5. On error: Show validation message

#### Applying a Custom Discount:
1. User clicks "Discount" button in cart
2. Show modal with discount type and value inputs
3. On "Add" click:
   ```javascript
   POST /posai/api/pos/orders/{orderId}/discount
   Body: { 
     "discountType": "PERCENTAGE" | "FIXED",
     "discountValue": numericValue
   }
   ```
4. On success: Update order display with new discount
5. On error: Show validation message

### Order Display Updates

After applying a discount or coupon, the order should display:
- **Subtotal**: Original total before discount
- **Discount**: Amount deducted (show coupon code if applicable)
- **Tax**: Tax calculated on discounted amount
- **Total**: Final amount to pay

Example display:
```
Subtotal:        $100.00
Tax:             $10.00
Discount:        -$10.00
Applied Coupon:  WELCOME10
─────────────────────────
Total:           $100.00
```

## Management APIs

### Create a New Coupon

```bash
POST /posai/api/coupons
Content-Type: application/json
X-TenantID: PaPos

{
  "code": "PROMO2025",
  "description": "New Year Promotion",
  "discountType": "PERCENTAGE",
  "discountValue": 30.00,
  "validFrom": "2025-01-01T00:00:00Z",
  "validTo": "2025-01-31T23:59:59Z",
  "usageLimit": 200
}
```

### List All Active Coupons

```bash
GET /posai/api/coupons
X-TenantID: PaPos
```

### Get Coupon Details

```bash
GET /posai/api/coupons/code/{couponCode}
X-TenantID: PaPos
```

### Update a Coupon

```bash
PUT /posai/api/coupons/{id}
Content-Type: application/json
X-TenantID: PaPos

{
  "code": "PROMO2025",
  "description": "Updated Promotion",
  "discountType": "PERCENTAGE",
  "discountValue": 35.00,
  "validFrom": "2025-01-01T00:00:00Z",
  "validTo": "2025-02-28T23:59:59Z",
  "usageLimit": 300
}
```

### Delete a Coupon

```bash
DELETE /posai/api/coupons/{id}
X-TenantID: PaPos
```

## Validation Rules

### Coupon Validation
A coupon is valid only if:
- ✓ isActive = true
- ✓ Current date is after validFrom (if set)
- ✓ Current date is before validTo (if set)
- ✓ timesUsed < usageLimit (if set)

### Discount Type Validation
- **PERCENTAGE**: Value must be 0-100
- **FIXED**: Value must be greater than 0

## Error Handling

Common error responses:

### Invalid Coupon Code
```json
{
  "status": "error",
  "message": "Coupon not found with code: XYZ123"
}
```

### Expired Coupon
```json
{
  "status": "error",
  "code": "error.coupon.invalid",
  "message": "Coupon is not valid or has expired"
}
```

### Usage Limit Exceeded
```json
{
  "status": "error",
  "code": "error.coupon.invalid",
  "message": "Coupon is not valid or has expired"
}
```

### Invalid Discount Value
```json
{
  "status": "error",
  "code": "error.coupon.invalid-discount-value",
  "message": "Discount value must be greater than zero"
}
```

## Testing

### Manual Testing Script

Run the provided test script:
```bash
./test-coupon-api.sh
```

### Unit Tests

Run coupon service tests:
```bash
./mvnw test -Dtest=CouponServiceTest
```

All tests (excluding integration test):
```bash
./mvnw test -Dtest=\!PosBackendApplicationTests
```

## Documentation

- **[API Documentation](COUPON_DISCOUNT_API_DOCUMENTATION.md)**: Complete API reference
- **[Implementation Summary](COUPON_DISCOUNT_IMPLEMENTATION_SUMMARY.md)**: Technical implementation details
- **Test Script**: `test-coupon-api.sh` for manual testing

## Key Features

✅ **Coupon Management**: Full CRUD operations for coupons  
✅ **Discount Types**: Fixed amount and percentage discounts  
✅ **Validation**: Active status, date range, usage limits  
✅ **Usage Tracking**: Automatic usage counter increment  
✅ **Order Integration**: Track coupon codes on orders  
✅ **Mutual Exclusivity**: Only one discount type per order  
✅ **Comprehensive Testing**: 16 unit tests, all passing  
✅ **Sample Data**: 3 ready-to-use sample coupons  

## Next Steps

1. **Frontend Implementation**: Implement the modals as shown in UI mockups
2. **Admin Panel**: Create UI for managing coupons
3. **Reporting**: Add coupon usage analytics
4. **Notifications**: Show success/error messages to users
5. **Customer Portal**: Allow customers to view available coupons

## Support

For questions or issues related to this feature, refer to:
- API Documentation: `COUPON_DISCOUNT_API_DOCUMENTATION.md`
- Implementation Details: `COUPON_DISCOUNT_IMPLEMENTATION_SUMMARY.md`
- Test Script: `test-coupon-api.sh`
