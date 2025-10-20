# Schema Validation Fix

## Issue
The application was failing to start with the following error:
```
Schema-validation: wrong column type encountered in column [is_active] in table [cashiers]; 
found [tinyint (Types#TINYINT)], but expecting [bit (Types#BOOLEAN)]
```

## Root Cause
- Liquibase changelog files defined boolean columns using `BOOLEAN` type
- MySQL automatically converts `BOOLEAN` to `TINYINT(1)` in the actual database schema
- Hibernate's schema validation (with `ddl-auto: validate`) expects `BIT` type for Java Boolean fields
- This caused a mismatch between what Hibernate expected and what was in the database

## Solution
Changed all boolean column definitions in Liquibase changelog files from:
```yaml
type: BOOLEAN
defaultValueBoolean: true
```

To:
```yaml
type: TINYINT(1)
defaultValueNumeric: 1
```

This ensures the Liquibase definition matches what MySQL actually creates, allowing Hibernate's schema validation to pass.

## Files Modified
- `001-create-outlets-table.yaml` - is_active
- `002-create-cashiers-table.yaml` - is_active, require_password_reset
- `003-create-dining-tables-table.yaml` - is_active
- `004-create-customers-table.yaml` - is_active
- `005-create-products-table.yaml` - is_weight_based, is_active
- `006-create-barcodes-table.yaml` - is_primary
- `008-create-orders-table.yaml` - is_online
- `009-create-order-items-table.yaml` - is_custom
- `012-create-invoice-templates-table.yaml` - show_company_info, show_tax_details, is_default, is_active
- `015-create-payment-methods-table.yaml` - is_active, is_default
- `024-create-coupons-table.yaml` - is_active

## Impact
- **No data migration needed**: TINYINT(1) is what MySQL already uses for BOOLEAN columns
- **Backward compatible**: Existing databases will continue to work
- **Forward compatible**: New databases will be created with the correct type
- **No code changes needed**: Java entities remain unchanged (still use Boolean type)

## Testing
To verify the fix works:
1. Start MySQL server
2. Configure database connection in `application.yml`
3. Run the application - it should start without schema validation errors
4. Verify all boolean fields work correctly in the application
