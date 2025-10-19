# Printer Configuration Guide

This guide describes the Printer Configuration features implemented for the POS Backend system.

## Overview

The Printer Configuration module provides a comprehensive set of configuration options to customize barcode and invoice printing behavior. All configurations are stored in the database and can be managed through REST APIs.

This module supports:
- Barcode printing configuration (page size, margins, orientation)
- Invoice/receipt printing configuration (page size, margins)
- Real-time updates via REST API
- Per-tenant configuration isolation

## Configuration Keys

The following configuration keys are available in the PRINTER category:

### 1. Barcode Page Width (in mm)
- **Key**: `barcode_page_width`
- **Type**: NUMBER
- **Default**: `80`
- **Description**: Width of the printing page in millimeters for generating the barcode

### 2. Barcode Page Height (in mm)
- **Key**: `barcode_page_height`
- **Type**: NUMBER
- **Default**: `40`
- **Description**: Height of the printing page in millimeters for generating the barcode

### 3. Barcode Page Margin (in mm)
- **Key**: `barcode_page_margin`
- **Type**: NUMBER
- **Default**: `5`
- **Description**: Margin of the printing page in millimeters where the barcode will be created

### 4. Barcode Margin (in mm)
- **Key**: `barcode_margin`
- **Type**: NUMBER
- **Default**: `2`
- **Description**: Margin of the barcode in millimeters to separate numerous barcodes for printing

### 5. Barcode Orientation
- **Key**: `barcode_orientation`
- **Type**: STRING
- **Default**: `HORIZONTAL`
- **Values**: `HORIZONTAL` or `VERTICAL`
- **Description**: Orientation for the barcode when printing

### 6. Invoice Page Width (in mm)
- **Key**: `invoice_page_width`
- **Type**: NUMBER
- **Default**: `80`
- **Description**: Width of the printing page in millimeters for generating sales receipts/invoices

### 7. Invoice Page Height (in mm)
- **Key**: `invoice_page_height`
- **Type**: NUMBER
- **Default**: `297`
- **Description**: Height of the printing page in millimeters for generating sales receipts/invoices

### 8. Invoice Page Margin (in mm)
- **Key**: `invoice_page_margin`
- **Type**: NUMBER
- **Default**: `10`
- **Description**: Margin of the printed page in millimeters for generating sales receipts/invoices

## API Endpoints

### Get All Printer Configurations
```http
GET /api/admin/configurations/printer
```

**Headers**:
- `X-Tenant-ID`: Your tenant identifier (required)

**Response**:
```json
{
  "code": "success",
  "message": "Printer configurations retrieved successfully",
  "timestamp": "2025-10-11T08:00:00Z",
  "path": "/api/admin/configurations/printer",
  "data": [
    {
      "id": 1,
      "configKey": "barcode_page_width",
      "configValue": "80",
      "category": "PRINTER",
      "description": "Width of the printing page in millimeters for generating the barcode",
      "dataType": "NUMBER"
    },
    {
      "id": 2,
      "configKey": "barcode_page_height",
      "configValue": "40",
      "category": "PRINTER",
      "description": "Height of the printing page in millimeters for generating the barcode",
      "dataType": "NUMBER"
    }
  ]
}
```

**Example**:
```bash
curl -X GET http://localhost:8080/pos-codex/api/admin/configurations/printer \
  -H "X-Tenant-ID: PaPos"
```

### Get Configuration by Key
```http
GET /api/admin/configurations/by-key?key=barcode_page_width&category=PRINTER
```

**Headers**:
- `X-Tenant-ID`: Your tenant identifier (required)

**Response**:
```json
{
  "code": "success",
  "message": "Configuration retrieved successfully",
  "timestamp": "2025-10-11T08:00:00Z",
  "path": "/api/admin/configurations/by-key",
  "data": {
    "id": 1,
    "configKey": "barcode_page_width",
    "configValue": "80",
    "category": "PRINTER",
    "description": "Width of the printing page in millimeters for generating the barcode",
    "dataType": "NUMBER"
  }
}
```

**Example**:
```bash
curl -X GET 'http://localhost:8080/pos-codex/api/admin/configurations/by-key?key=barcode_page_width&category=PRINTER' \
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
  "configValue": "100",
  "description": "Updated barcode page width"
}
```

**Response**:
```json
{
  "code": "success.configuration.updated",
  "message": "Configuration updated successfully",
  "timestamp": "2025-10-11T08:00:00Z",
  "path": "/api/admin/configurations/1",
  "data": {
    "id": 1,
    "configKey": "barcode_page_width",
    "configValue": "100",
    "category": "PRINTER",
    "description": "Updated barcode page width",
    "dataType": "NUMBER"
  }
}
```

### Bulk Update Configurations
```http
POST /api/admin/configurations/bulk-update?category=PRINTER
```

**Headers**:
- `X-Tenant-ID`: Your tenant identifier (required)
- `Content-Type`: application/json

**Request Body**:
```json
{
  "configurations": {
    "barcode_page_width": "100",
    "barcode_page_height": "50",
    "barcode_page_margin": "8",
    "barcode_margin": "3",
    "barcode_orientation": "VERTICAL",
    "invoice_page_width": "210",
    "invoice_page_height": "297",
    "invoice_page_margin": "15"
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
      "configKey": "barcode_page_width",
      "configValue": "100",
      "category": "PRINTER",
      "description": "Width of the printing page in millimeters for generating the barcode",
      "dataType": "NUMBER"
    },
    {
      "id": 2,
      "configKey": "barcode_page_height",
      "configValue": "50",
      "category": "PRINTER",
      "description": "Height of the printing page in millimeters for generating the barcode",
      "dataType": "NUMBER"
    }
  ]
}
```

**Example**:
```bash
curl -X POST "http://localhost:8080/pos-codex/api/admin/configurations/bulk-update?category=PRINTER" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "configurations": {
      "barcode_page_width": "100",
      "barcode_page_height": "50",
      "barcode_page_margin": "8",
      "barcode_margin": "3",
      "barcode_orientation": "VERTICAL"
    }
  }'
```

## Usage Examples

### Java Service Layer

```java
@Service
public class PrinterService {
    @Autowired
    private ConfigurationService configurationService;
    
    public Integer getBarcodePageWidth() {
        return configurationService.getConfigValueAsInteger(
            "barcode_page_width", 
            Configuration.ConfigCategory.PRINTER, 
            80
        );
    }
    
    public Integer getBarcodePageHeight() {
        return configurationService.getConfigValueAsInteger(
            "barcode_page_height",
            Configuration.ConfigCategory.PRINTER,
            40
        );
    }
    
    public String getBarcodeOrientation() {
        return configurationService.getConfigValue(
            "barcode_orientation",
            Configuration.ConfigCategory.PRINTER,
            "HORIZONTAL"
        );
    }
    
    public Map<String, Object> getAllPrinterSettings() {
        List<Configuration> configs = configurationService.getConfigurationsByCategory(
            Configuration.ConfigCategory.PRINTER
        );
        
        Map<String, Object> settings = new HashMap<>();
        for (Configuration config : configs) {
            if ("NUMBER".equals(config.getDataType())) {
                settings.put(config.getConfigKey(), Integer.parseInt(config.getConfigValue()));
            } else {
                settings.put(config.getConfigKey(), config.getConfigValue());
            }
        }
        return settings;
    }
    
    public void updateBarcodeSettings(int width, int height, int pageMargin, 
                                      int barcodeMargin, String orientation) {
        Map<String, String> updates = new HashMap<>();
        updates.put("barcode_page_width", String.valueOf(width));
        updates.put("barcode_page_height", String.valueOf(height));
        updates.put("barcode_page_margin", String.valueOf(pageMargin));
        updates.put("barcode_margin", String.valueOf(barcodeMargin));
        updates.put("barcode_orientation", orientation);
        
        configurationService.bulkUpdateConfigurations(
            updates, 
            Configuration.ConfigCategory.PRINTER
        );
    }
}
```

### REST API (cURL)

**Get all printer configurations:**
```bash
curl -X GET http://localhost:8080/pos-codex/api/admin/configurations/printer \
  -H "X-Tenant-ID: PaPos"
```

**Update barcode settings:**
```bash
curl -X POST "http://localhost:8080/pos-codex/api/admin/configurations/bulk-update?category=PRINTER" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "configurations": {
      "barcode_page_width": "100",
      "barcode_page_height": "50",
      "barcode_orientation": "VERTICAL"
    }
  }'
```

**Update invoice settings:**
```bash
curl -X POST "http://localhost:8080/pos-codex/api/admin/configurations/bulk-update?category=PRINTER" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "configurations": {
      "invoice_page_width": "210",
      "invoice_page_height": "297",
      "invoice_page_margin": "15"
    }
  }'
```

## Common Use Cases

### Configuring Thermal Receipt Printer (80mm)
```bash
curl -X POST "http://localhost:8080/pos-codex/api/admin/configurations/bulk-update?category=PRINTER" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "configurations": {
      "invoice_page_width": "80",
      "invoice_page_height": "297",
      "invoice_page_margin": "5"
    }
  }'
```

### Configuring A4 Paper Invoice Printing
```bash
curl -X POST "http://localhost:8080/pos-codex/api/admin/configurations/bulk-update?category=PRINTER" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "configurations": {
      "invoice_page_width": "210",
      "invoice_page_height": "297",
      "invoice_page_margin": "10"
    }
  }'
```

### Configuring Barcode Label Printer
```bash
curl -X POST "http://localhost:8080/pos-codex/api/admin/configurations/bulk-update?category=PRINTER" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "configurations": {
      "barcode_page_width": "100",
      "barcode_page_height": "50",
      "barcode_page_margin": "5",
      "barcode_margin": "2",
      "barcode_orientation": "HORIZONTAL"
    }
  }'
```

### Switching Barcode Orientation
```bash
curl -X POST "http://localhost:8080/pos-codex/api/admin/configurations/bulk-update?category=PRINTER" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "configurations": {
      "barcode_orientation": "VERTICAL"
    }
  }'
```

## Database Migration

The printer configurations are automatically initialized during database migration with the following defaults:

| Configuration Key | Default Value | Data Type | Description |
|-------------------|---------------|-----------|-------------|
| barcode_page_width | 80 | NUMBER | Barcode page width in mm |
| barcode_page_height | 40 | NUMBER | Barcode page height in mm |
| barcode_page_margin | 5 | NUMBER | Barcode page margin in mm |
| barcode_margin | 2 | NUMBER | Barcode margin in mm |
| barcode_orientation | HORIZONTAL | STRING | Barcode orientation |
| invoice_page_width | 80 | NUMBER | Invoice page width in mm |
| invoice_page_height | 297 | NUMBER | Invoice page height in mm |
| invoice_page_margin | 10 | NUMBER | Invoice page margin in mm |

## Multi-Tenant Support

All configurations are tenant-specific:
- Each tenant has their own set of configurations
- Configurations are isolated per tenant database
- Always include `X-Tenant-ID` header in API requests

## Best Practices

1. **Use Service Methods**: Always use `ConfigurationService` methods instead of direct repository access
2. **Provide Defaults**: Always provide sensible default values when retrieving configurations
3. **Bulk Updates**: Use bulk update endpoint when updating multiple configurations
4. **Type Safety**: Use typed methods (`getConfigValueAsInteger`) for numeric values
5. **Validation**: Validate configuration values before saving (especially for orientation: HORIZONTAL or VERTICAL)
6. **Caching**: Consider caching frequently accessed configurations in your service layer

## Configuration Types

### Barcode Orientation Values
- `HORIZONTAL` - Print barcodes horizontally
- `VERTICAL` - Print barcodes vertically

### Common Paper Sizes (in mm)
- **Thermal Receipt (Small)**: 58mm width
- **Thermal Receipt (Standard)**: 80mm width
- **A4 Paper**: 210mm x 297mm
- **Letter Paper**: 216mm x 279mm
- **Barcode Labels**: Various sizes (e.g., 100mm x 50mm)

## Security Considerations

- Only admin users should have access to modify configurations
- Configuration changes are immediately effective for all users
- Consider implementing additional validation for critical configuration changes
- Audit trail is automatically maintained through `AbstractAuditableEntity`

## Troubleshooting

### Configuration Not Found
If you receive a "Configuration not found" error:
1. Verify the configuration key is correct
2. Ensure you're using the correct category (`PRINTER`)
3. Check that database migrations have been applied
4. Verify the tenant ID is correct

### Invalid Configuration Values
- Ensure numeric values are valid integers
- Verify orientation is either `HORIZONTAL` or `VERTICAL`
- Check that page dimensions are reasonable (e.g., 40-300mm range)

### Bulk Update Issues
- Ensure the request body structure matches the expected format
- Verify all configuration keys exist in the database
- Check that the category parameter is `PRINTER`

## Testing

Use the provided test script to verify the API endpoints:

```bash
./test-printer-config-api.sh
```

Or run the unit tests:

```bash
./mvnw test -Dtest=ConfigurationServiceTest
```

## Related Documentation

- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Complete API documentation
- [CONFIGURATION_IMPLEMENTATION_SUMMARY.md](CONFIGURATION_IMPLEMENTATION_SUMMARY.md) - Implementation summary
- [GENERAL_CONFIGURATION_GUIDE.md](GENERAL_CONFIGURATION_GUIDE.md) - General configurations
- [PWA_CONFIGURATION_GUIDE.md](PWA_CONFIGURATION_GUIDE.md) - PWA configurations
- [LOGIN_CONFIGURATION_GUIDE.md](LOGIN_CONFIGURATION_GUIDE.md) - Login configurations

## Future Enhancements

Potential improvements for future releases:
1. Support for custom paper sizes
2. Print quality settings (DPI)
3. Barcode format selection (CODE128, QR, etc.)
4. Color/grayscale options for barcode printing
5. Template-based invoice layouts
6. Print preview functionality
7. Multiple printer profiles per outlet
