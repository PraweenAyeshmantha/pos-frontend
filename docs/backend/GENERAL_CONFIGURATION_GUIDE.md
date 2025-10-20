# General Configuration Guide

This guide describes the General Configuration features implemented for the POS Backend system.

## Overview

The General Configuration module provides a comprehensive set of configuration options to customize the behavior of the Point of Sale system. All configurations are stored in the database and can be managed through REST APIs.

## Configuration Keys

The following configuration keys are available in the GENERAL category:

### 1. License Activation
- **Key**: `license_key`
- **Type**: STRING
- **Default**: "" (empty)
- **Description**: Payment code to activate your license and use the plugin

### 2. Module Enable/Disable
- **Key**: `module_enabled`
- **Type**: BOOLEAN
- **Default**: `true`
- **Description**: Activate/deactivate module features for customers

### 3. Inventory Type
- **Key**: `inventory_type`
- **Type**: STRING
- **Default**: `CUSTOM`
- **Values**: `CUSTOM` or `CENTRALIZED`
- **Description**: 
  - `CUSTOM`: Allows assigning unique stock numbers to items at various outlets
  - `CENTRALIZED`: Shared stock across POS and online store (WooCommerce integration)

### 4. Default Order Status
- **Key**: `default_order_status`
- **Type**: STRING
- **Default**: `PENDING`
- **Values**: `DRAFT`, `PENDING`, `PREPARING`, `READY`, `COMPLETED`, `CANCELLED`, `REFUNDED`, `ON_HOLD`
- **Description**: Default order status for orders generated at the POS

### 5. Default Product Barcode
- **Key**: `default_barcode_type`
- **Type**: STRING
- **Default**: `PRODUCT_ID`
- **Values**: `PRODUCT_ID` or `SKU`
- **Description**: Enables automated generation of barcodes for products

### 6. Enable Order Emails
- **Key**: `enable_order_emails`
- **Type**: BOOLEAN
- **Default**: `false`
- **Description**: Activate/deactivate email notifications for orders made at POS

### 7. Enable Split/Multiple Payment Methods
- **Key**: `enable_split_payment`
- **Type**: BOOLEAN
- **Default**: `true`
- **Description**: Allow customers to make payments using multiple payment methods

### 8. Enable Order Note
- **Key**: `enable_order_note`
- **Type**: BOOLEAN
- **Default**: `true`
- **Description**: Allow entering order notes for orders made at POS

### 9. Enable Offline Orders for Online Mode (Fast Orders)
- **Key**: `enable_offline_orders`
- **Type**: BOOLEAN
- **Default**: `false`
- **Description**: Allow generation of orders offline before automatically syncing online to expedite order creation

### 10. Enable Adding Custom Product
- **Key**: `enable_custom_product`
- **Type**: BOOLEAN
- **Default**: `true`
- **Description**: Allow adding custom products with custom pricing at POS

### 11. Enable Open Cash Drawer Popup
- **Key**: `enable_cash_drawer_popup`
- **Type**: BOOLEAN
- **Default**: `true`
- **Description**: Automated popup to enter open cash drawer amount daily at POS

### 12. Show Variations as Different Products
- **Key**: `show_variations_as_products`
- **Type**: BOOLEAN
- **Default**: `false`
- **Description**: Display product variants as separate products at POS

### 13. Enable Unit/Weight Based Pricing
- **Key**: `enable_weight_based_pricing`
- **Type**: BOOLEAN
- **Default**: `false`
- **Description**: Allow pricing adjustment based on weight entered at POS

### 14. Automatic Send Orders to Kitchen When Put to Hold
- **Key**: `auto_send_to_kitchen_on_hold`
- **Type**: BOOLEAN
- **Default**: `false`
- **Description**: Automatically send orders on hold to kitchen from POS terminal

### 15. Logo
- **Key**: `logo_url`
- **Type**: STRING
- **Default**: "" (empty)
- **Description**: Brand logo URL for POS screen and sales receipts/invoices

### 16. Select Default/Guest Customer
- **Key**: `default_customer_id`
- **Type**: NUMBER
- **Default**: "" (empty)
- **Description**: Default customer ID for all POS orders (can be updated within POS)

### 17. POS Endpoint
- **Key**: `pos_endpoint`
- **Type**: STRING
- **Default**: `/pos`
- **Description**: Endpoint URL for Point of Sale

### 18. Kitchen Endpoint
- **Key**: `kitchen_endpoint`
- **Type**: STRING
- **Default**: `/kitchen`
- **Description**: Endpoint URL for Kitchen View (exclusive to restaurant mode outlets)

## API Endpoints

### Get All General Configurations
```http
GET /api/admin/configurations/general
```

**Headers**:
- `X-Tenant-ID`: Your tenant identifier (required)

**Response**:
```json
{
  "code": "success",
  "message": "General configurations retrieved successfully",
  "timestamp": "2025-10-11T08:00:00Z",
  "path": "/api/admin/configurations/general",
  "data": [
    {
      "id": 1,
      "configKey": "module_enabled",
      "configValue": "true",
      "category": "GENERAL",
      "description": "Enable or disable module features for customers",
      "dataType": "BOOLEAN",
      "createdDate": "2025-10-11T08:00:00Z",
      "version": 0
    }
  ]
}
```

### Get Configuration by Key
```http
GET /api/admin/configurations/by-key?key={configKey}&category=GENERAL
```

**Headers**:
- `X-Tenant-ID`: Your tenant identifier (required)

**Query Parameters**:
- `key`: Configuration key (required)
- `category`: Configuration category (required, use "GENERAL")

**Example**:
```bash
curl -X GET "http://localhost:8080/pos-codex/api/admin/configurations/by-key?key=module_enabled&category=GENERAL" \
  -H "X-Tenant-ID: PaPos"
```

### Update Single Configuration
```http
PUT /api/admin/configurations/{id}
```

**Headers**:
- `X-Tenant-ID`: Your tenant identifier (required)
- `Content-Type`: application/json

**Request Body**:
```json
{
  "configValue": "true",
  "description": "Updated description"
}
```

**Example**:
```bash
curl -X PUT http://localhost:8080/pos-codex/api/admin/configurations/1 \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "configValue": "false",
    "description": "Disable module features"
  }'
```

### Bulk Update Configurations
```http
POST /api/admin/configurations/bulk-update?category=GENERAL
```

**Headers**:
- `X-Tenant-ID`: Your tenant identifier (required)
- `Content-Type`: application/json

**Request Body**:
```json
{
  "configurations": {
    "module_enabled": "true",
    "enable_order_emails": "true",
    "enable_split_payment": "false",
    "default_order_status": "COMPLETED"
  }
}
```

**Response**:
```json
{
  "code": "success.configurations.bulk.updated",
  "message": "Configurations updated successfully",
  "timestamp": "2025-10-11T08:00:00Z",
  "path": "/api/admin/configurations/bulk-update",
  "data": [
    {
      "id": 1,
      "configKey": "module_enabled",
      "configValue": "true",
      "category": "GENERAL",
      "description": "Enable or disable module features for customers",
      "dataType": "BOOLEAN"
    }
  ]
}
```

**Example**:
```bash
curl -X POST "http://localhost:8080/pos-codex/api/admin/configurations/bulk-update?category=GENERAL" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "configurations": {
      "enable_order_emails": "true",
      "enable_split_payment": "true",
      "logo_url": "/images/company-logo.png"
    }
  }'
```

## Usage Examples

### Check if Module is Enabled

```java
@Service
public class SomeService {
    @Autowired
    private ConfigurationService configurationService;
    
    public void someMethod() {
        Boolean isEnabled = configurationService.getConfigValueAsBoolean(
            "module_enabled", 
            Configuration.ConfigCategory.GENERAL, 
            true
        );
        
        if (isEnabled) {
            // Proceed with module functionality
        }
    }
}
```

### Get Default Order Status

```java
String orderStatus = configurationService.getConfigValue(
    "default_order_status",
    Configuration.ConfigCategory.GENERAL,
    "PENDING"
);
```

### Check if Split Payment is Enabled

```java
Boolean splitPaymentEnabled = configurationService.getConfigValueAsBoolean(
    "enable_split_payment",
    Configuration.ConfigCategory.GENERAL,
    false
);
```

## Database Migration

The configurations are automatically initialized when the application starts through Liquibase migrations. The migration file `014-insert-default-general-configurations.yaml` creates all 18 configuration entries with their default values.

## Best Practices

1. **Always use the service methods** to retrieve configuration values instead of directly querying the database
2. **Provide sensible defaults** when calling `getConfigValue()` methods
3. **Use bulk update** when updating multiple configurations at once to reduce database operations
4. **Cache frequently accessed configurations** in your service layer if needed for performance
5. **Validate configuration values** before saving them to ensure they meet business rules

## Configuration Types

- **BOOLEAN**: Use "true" or "false" as string values, retrieve using `getConfigValueAsBoolean()`
- **STRING**: Regular text values, retrieve using `getConfigValue()`
- **NUMBER**: Numeric values stored as strings, retrieve using `getConfigValueAsInteger()`

## Multi-Tenant Support

All configurations are tenant-specific. Each tenant has their own set of configurations, isolated from other tenants. Always include the `X-Tenant-ID` header in API requests.

## Security Considerations

- Only admin users should have access to modify configurations
- Sensitive configurations (like license keys) should be handled securely
- Consider implementing additional validation for critical configuration changes
- Audit trail is automatically maintained through the `AbstractAuditableEntity` base class
