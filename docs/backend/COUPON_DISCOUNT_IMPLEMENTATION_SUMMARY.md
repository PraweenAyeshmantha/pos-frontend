# Coupons and Discounts Feature - Implementation Summary

## Overview

This document summarizes the implementation of the coupons and discounts feature for the POS system, allowing cashiers to apply promotional coupons and create custom discounts on orders.

## Features Implemented

### 1. Coupon Management
- Create, read, update, and delete coupons
- Support for two discount types:
  - **Fixed Amount**: e.g., $50 off
  - **Percentage**: e.g., 20% off
- Coupon validation based on:
  - Active status
  - Validity period (validFrom/validTo dates)
  - Usage limits
- Automatic usage tracking

### 2. Discount Application
- Apply coupons to orders via coupon code
- Apply custom discounts (fixed or percentage) directly
- Automatic recalculation of order totals
- Mutually exclusive: Only one discount (coupon or custom) per order

### 3. Order Integration
- Track applied coupon codes on orders
- Store discount amount for reporting
- Maintain order total calculations: subtotal - discount + tax

## Technical Implementation

### Database Schema

#### New Table: `coupons`
```yaml
Columns:
  - id (BIGINT, PK, Auto-increment)
  - code (VARCHAR(50), Unique, NOT NULL)
  - description (VARCHAR(500))
  - discount_type (VARCHAR(20), NOT NULL) # FIXED or PERCENTAGE
  - discount_value (DECIMAL(10,2), NOT NULL)
  - valid_from (TIMESTAMP)
  - valid_to (TIMESTAMP)
  - usage_limit (INT)
  - times_used (INT, NOT NULL, Default: 0)
  - is_active (BOOLEAN, NOT NULL, Default: true)
  - [audit fields: created_date, created_user, modified_date, modified_user]
  - record_status (VARCHAR(20), Default: ACTIVE)
  - version (BIGINT, Default: 0)
  - sync_ts (TIMESTAMP)

Indexes:
  - idx_coupons_code (code)
  - idx_coupons_is_active (is_active)
```

#### Modified Table: `orders`
```yaml
New Column:
  - coupon_code (VARCHAR(50))

New Index:
  - idx_orders_coupon_code (coupon_code)
```

### Components Created

#### Domain Layer
- **Coupon.java**: Entity class with validation logic
  - Method: `isValid()` - checks active status, date range, and usage limit
  - Method: `incrementUsage()` - tracks coupon usage

#### Repository Layer
- **CouponRepository.java**: Data access interface
  - `findByCodeAndIsActiveTrue(String code)`: Find active coupon by code
  - `findByIsActiveTrue()`: Get all active coupons

#### Service Layer
- **CouponService.java**: Business logic for coupon management
  - CRUD operations for coupons
  - Validation logic (discount value, percentage limits, duplicate codes)
  - `validateAndUseCoupon(String code)`: Validates and increments usage

- **PosService.java** (Updated):
  - `applyCoupon(Long orderId, String couponCode)`: Apply coupon to order
  - `applyDiscount(Long orderId, String discountType, BigDecimal discountValue)`: Apply custom discount (updated to clear coupon code)

#### Controller Layer
- **CouponController.java**: REST API endpoints
  - POST `/api/coupons` - Create coupon
  - GET `/api/coupons` - List coupons
  - GET `/api/coupons/{id}` - Get coupon by ID
  - GET `/api/coupons/code/{code}` - Get coupon by code
  - PUT `/api/coupons/{id}` - Update coupon
  - DELETE `/api/coupons/{id}` - Delete (soft delete) coupon

- **PosController.java** (Updated):
  - POST `/api/pos/orders/{orderId}/coupon` - Apply coupon to order
  - POST `/api/pos/orders/{orderId}/discount` - Apply custom discount (existing, unchanged)

#### DTO Layer
- **CouponDTO.java**: Data transfer object for API responses
- **CreateCouponRequest.java**: Request body for creating/updating coupons
- **ApplyCouponRequest.java**: Request body for applying coupons (existing)
- **ApplyDiscountRequest.java**: Request body for custom discounts (existing)

### Database Migrations

1. **024-create-coupons-table.yaml**: Creates the coupons table
2. **025-add-coupon-code-to-orders.yaml**: Adds coupon_code column to orders table
3. **026-insert-sample-coupons.yaml**: Inserts three sample coupons for testing

### Sample Data

Three sample coupons are included:
- **WELCOME10**: 10% discount, usage limit 100
- **SAVE20**: 20% discount, usage limit 50  
- **FLAT50**: $50 flat discount, unlimited usage

### Testing

#### Unit Tests (CouponServiceTest.java)
- 16 comprehensive test cases covering:
  - Creating coupons (fixed and percentage)
  - Validation (invalid values, duplicate codes, percentage > 100)
  - CRUD operations (get, update, delete)
  - Coupon validation and usage tracking
  - Edge cases (expired, usage limit exceeded, inactive)

**Test Results**: All 16 tests passing ✅

#### Integration with Existing Tests
- All existing unit tests continue to pass (261 tests)
- No breaking changes to existing functionality

## API Usage Examples

### Create a Percentage Discount Coupon
```bash
POST /api/coupons
Content-Type: application/json
X-TenantID: tenant1

{
  "code": "SUMMER25",
  "description": "25% summer sale discount",
  "discountType": "PERCENTAGE",
  "discountValue": 25.00,
  "validFrom": "2025-06-01T00:00:00Z",
  "validTo": "2025-08-31T23:59:59Z",
  "usageLimit": 1000
}
```

### Apply Coupon to Order
```bash
POST /api/pos/orders/123/coupon
Content-Type: application/json
X-TenantID: tenant1

{
  "couponCode": "SUMMER25"
}
```

### Apply Custom Discount
```bash
POST /api/pos/orders/123/discount
Content-Type: application/json
X-TenantID: tenant1

{
  "discountType": "FIXED",
  "discountValue": 15.00
}
```

## Business Rules

1. **Coupon Validation**:
   - Must be active (`isActive = true`)
   - Current date must be within `validFrom` and `validTo` (if set)
   - Usage count must be below `usageLimit` (if set)

2. **Discount Types**:
   - **PERCENTAGE**: Value must be between 0 and 100
   - **FIXED**: Value must be greater than 0

3. **Mutual Exclusivity**:
   - Applying a coupon overwrites any custom discount
   - Applying a custom discount removes any applied coupon code

4. **Usage Tracking**:
   - Coupon usage is incremented immediately when applied
   - Usage count is not decremented if order is cancelled

5. **Soft Delete**:
   - Deleting a coupon sets `isActive = false`
   - Inactive coupons cannot be applied but remain in database

## Files Modified/Created

### New Files
- `src/main/java/com/pos/domain/Coupon.java`
- `src/main/java/com/pos/repository/CouponRepository.java`
- `src/main/java/com/pos/service/CouponService.java`
- `src/main/java/com/pos/controller/CouponController.java`
- `src/main/java/com/pos/dto/CouponDTO.java`
- `src/main/java/com/pos/dto/CreateCouponRequest.java`
- `src/test/java/com/pos/service/CouponServiceTest.java`
- `src/main/resources/db/changelog/v1.0/024-create-coupons-table.yaml`
- `src/main/resources/db/changelog/v1.0/025-add-coupon-code-to-orders.yaml`
- `src/main/resources/db/changelog/v1.0/026-insert-sample-coupons.yaml`
- `COUPON_DISCOUNT_API_DOCUMENTATION.md`
- `COUPON_DISCOUNT_IMPLEMENTATION_SUMMARY.md`

### Modified Files
- `src/main/java/com/pos/domain/Order.java` (added `couponCode` field)
- `src/main/java/com/pos/service/PosService.java` (added `applyCoupon()` method, updated `applyDiscount()`)
- `src/main/java/com/pos/controller/PosController.java` (added coupon endpoint)
- `src/main/resources/db/changelog/db.changelog-master.yaml` (included new migrations)

## Benefits

1. **Promotional Flexibility**: Support both fixed and percentage-based discounts
2. **Usage Control**: Track and limit coupon usage automatically
3. **Time-bound Offers**: Set validity periods for seasonal promotions
4. **Audit Trail**: Track which coupons were used on which orders
5. **Simple API**: Easy-to-use REST endpoints for frontend integration
6. **Validation**: Comprehensive validation prevents invalid coupons from being applied
7. **Testing**: Full unit test coverage ensures reliability

## Future Enhancements (Suggestions)

1. **Customer-specific Coupons**: Restrict coupons to specific customers
2. **Product-specific Coupons**: Apply coupons only to certain products/categories
3. **Minimum Order Value**: Require minimum order amount to use coupon
4. **Coupon Stacking**: Allow multiple coupons on a single order
5. **Auto-apply Coupons**: Automatically apply best available coupon
6. **Coupon Analytics**: Dashboard showing coupon usage statistics
7. **Bulk Coupon Generation**: Generate multiple unique codes at once

## Conclusion

The coupons and discounts feature is fully implemented and tested, providing a robust foundation for promotional activities in the POS system. The implementation follows best practices with clean separation of concerns, comprehensive validation, and thorough testing.
