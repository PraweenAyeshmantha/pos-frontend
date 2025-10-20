# Payment Methods Management Feature

## Overview

This feature allows administrators to manage payment methods dynamically at the Point of Sale (POS) system. The system includes an unremovable default cash payment method, and payment method slugs are immutable once created.

## Key Features

### 1. Dynamic Payment Method Management
- Administrators can create, read, update, and delete payment methods
- Each payment method has a unique slug identifier that cannot be changed after creation
- Payment methods can be activated or deactivated
- Active payment methods can be filtered for display at the POS

### 2. Protected Default Cash Method
- A default "cash" payment method is automatically created during database initialization
- This default method has `isDefault: true` and cannot be deleted
- Attempting to delete the default payment method will result in an error

### 3. Immutable Slugs
- The `slug` field is marked as `updatable = false` in the entity
- When updating a payment method, any attempt to change the slug is ignored
- The service logs a warning if someone tries to update the slug
- This ensures consistency in integrations and external references

## Database Schema

### PaymentMethod Table
```sql
CREATE TABLE payment_methods (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    slug VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    is_default BOOLEAN DEFAULT FALSE NOT NULL,
    created_date TIMESTAMP NOT NULL,
    created_user VARCHAR(100),
    modified_date TIMESTAMP,
    modified_user VARCHAR(100),
    record_status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL,
    version BIGINT DEFAULT 0 NOT NULL,
    sync_ts TIMESTAMP
);
```

### Migration Strategy
The system migrates from the old enum-based payment method to entity-based:
1. Creates the `payment_methods` table
2. Inserts the default "cash" payment method
3. Adds `payment_method_id` column to the `payments` table
4. Migrates existing payment records to use the cash method
5. Adds foreign key constraint
6. Removes the old `payment_method` enum column

## API Endpoints

### Create Payment Method
```http
POST /api/admin/payment-methods
```

**Example Request:**
```json
{
  "slug": "card",
  "name": "Credit/Debit Card",
  "description": "Payment by credit or debit card",
  "isActive": true,
  "isDefault": false
}
```

### Get All Payment Methods
```http
GET /api/admin/payment-methods
GET /api/admin/payment-methods?active=true
```

### Get Payment Method by ID
```http
GET /api/admin/payment-methods/{id}
```

### Get Payment Method by Slug
```http
GET /api/admin/payment-methods/by-slug/{slug}
```

### Update Payment Method
```http
PUT /api/admin/payment-methods/{id}
```

**Example Request:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "isActive": true
}
```

**Note:** The slug field is ignored if provided in the update request.

### Delete Payment Method
```http
DELETE /api/admin/payment-methods/{id}
```

**Important:** Cannot delete payment methods with `isDefault: true`.

## Business Rules

### 1. Slug Immutability
- Once a payment method is created, its slug cannot be changed
- The slug is used as a stable identifier for integrations
- Update operations that attempt to change the slug will log a warning and ignore the change

### 2. Default Method Protection
- The default payment method (cash) cannot be deleted
- Attempting to delete it will result in an `IllegalStateException`
- The default method can be updated (name, description, active status) but not deleted

### 3. Slug Uniqueness
- Each slug must be unique across all payment methods
- Creating a payment method with a duplicate slug will result in an `IllegalArgumentException`

### 4. Payment Method Relationship
- The `Payment` entity now references `PaymentMethod` via a foreign key
- This provides better referential integrity than the previous enum approach
- All payments must reference a valid payment method

## Implementation Details

### Domain Model
- **PaymentMethod**: Entity with slug, name, description, isActive, isDefault
- **Payment**: Updated to reference PaymentMethod entity instead of enum

### Service Layer
- **PaymentMethodService**: Implements business logic including:
  - CRUD operations
  - Slug uniqueness validation
  - Default method deletion prevention
  - Slug immutability enforcement

### Controller Layer
- **PaymentMethodController**: REST API endpoints following the existing pattern
- Returns standardized `ApiResponse` format
- Supports filtering by active status

### Repository Layer
- **PaymentMethodRepository**: JPA repository with custom queries:
  - `findBySlug(String slug)`
  - `findByIsActiveTrue()`
  - `existsBySlug(String slug)`

### Testing
- Comprehensive unit tests for PaymentMethodService (11 tests)
- Tests cover:
  - CRUD operations
  - Slug immutability
  - Default method deletion prevention
  - Duplicate slug validation
  - Active filtering

## Usage Examples

### Setting Up Payment Methods

1. The default "cash" method is automatically created
2. Add additional payment methods:

```bash
# Add credit card payment
curl -X POST http://localhost:8080/pos-codex/api/admin/payment-methods \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "card",
    "name": "Credit/Debit Card",
    "description": "Payment by credit or debit card",
    "isActive": true,
    "isDefault": false
  }'

# Add mobile payment
curl -X POST http://localhost:8080/pos-codex/api/admin/payment-methods \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "mobile-payment",
    "name": "Mobile Payment",
    "description": "Payment via mobile wallet apps",
    "isActive": true,
    "isDefault": false
  }'
```

### Retrieving Payment Methods at POS

```bash
# Get only active payment methods for display
curl -X GET "http://localhost:8080/pos-codex/api/admin/payment-methods?active=true" \
  -H "X-Tenant-ID: PaPos"
```

### Managing Payment Methods

```bash
# Update a payment method
curl -X PUT http://localhost:8080/pos-codex/api/admin/payment-methods/2 \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Card Payment",
    "description": "Updated description",
    "isActive": true
  }'

# Deactivate a payment method (soft delete)
curl -X PUT http://localhost:8080/pos-codex/api/admin/payment-methods/2 \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Card Payment",
    "description": "Card payment method",
    "isActive": false
  }'

# Delete a payment method (not default)
curl -X DELETE http://localhost:8080/pos-codex/api/admin/payment-methods/2 \
  -H "X-Tenant-ID: PaPos"
```

## Integration with Existing Payment Flow

When creating a payment record, reference the payment method:

```java
PaymentMethod cashMethod = paymentMethodRepository.findBySlug("cash").orElseThrow();
Payment payment = new Payment(order, cashMethod, amount);
paymentRepository.save(payment);
```

## Migration Notes

For existing installations:
1. The migration automatically updates existing payment records to reference the "cash" payment method
2. The old `payment_method` enum column is dropped after migration
3. No manual data migration is required
4. The system maintains backward compatibility through database migrations

## Future Enhancements

Potential extensions to this feature:
1. Payment method icons/logos
2. Integration with payment gateways (API keys, credentials per method)
3. Per-outlet payment method availability
4. Payment method fees/charges configuration
5. Transaction limits per payment method
6. Multi-currency support per payment method
