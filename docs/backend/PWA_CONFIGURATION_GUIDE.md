# PWA Configuration Guide

## Overview

The PWA (Progressive Web App) Configuration module allows administrators to customize the appearance and behavior of the Point of Sale application as a Progressive Web App. These configurations control the app's name, colors, and icons that appear when the application is installed on mobile devices or accessed through modern web browsers.

## Configuration Keys

### 1. PWA Name
- **Key**: `pwa_name`
- **Type**: STRING
- **Default**: `POS System`
- **Description**: The full name of the Point of Sale application displayed when the app is installed as a PWA. This name appears on the device's home screen and in the app switcher.

### 2. PWA Short Name
- **Key**: `pwa_short_name`
- **Type**: STRING
- **Default**: `POS`
- **Description**: A shortened version of the application name, used when space is limited (e.g., on mobile home screens). Should be 12 characters or less.

### 3. PWA Theme Color
- **Key**: `pwa_theme_color`
- **Type**: STRING
- **Default**: `#ffffff`
- **Description**: The theme color for the Point of Sale application's splash screen and browser UI. Accepts hex color values (e.g., #ffffff for white, #000000 for black).

### 4. PWA Background Color
- **Key**: `pwa_background_color`
- **Type**: STRING
- **Default**: `#ffffff`
- **Description**: The background color for the Point of Sale application's splash screen displayed during app launch. Accepts hex color values.

### 5. PWA Icon 192x192
- **Key**: `pwa_icon_192`
- **Type**: STRING
- **Default**: `""` (empty)
- **Description**: URL to the PWA app icon with 192x192 pixel dimensions. This icon is used for the app launcher and other contexts where a medium-sized icon is needed.

### 6. PWA Icon 512x512
- **Key**: `pwa_icon_512`
- **Type**: STRING
- **Default**: `""` (empty)
- **Description**: URL to the PWA app icon with 512x512 pixel dimensions. This is the high-resolution icon used for splash screens and app store listings.

## API Endpoints

### Get All PWA Configurations
```http
GET /api/admin/configurations/pwa
```

**Headers**:
- `X-Tenant-ID`: Your tenant identifier (required)

**Response**:
```json
{
  "code": "success",
  "message": "PWA configurations retrieved successfully",
  "timestamp": "2025-10-11T08:00:00Z",
  "path": "/api/admin/configurations/pwa",
  "data": [
    {
      "id": 1,
      "configKey": "pwa_name",
      "configValue": "POS System",
      "category": "PWA",
      "description": "Name of the Point of Sale application for PWA",
      "dataType": "STRING"
    },
    {
      "id": 2,
      "configKey": "pwa_short_name",
      "configValue": "POS",
      "category": "PWA",
      "description": "Shortened name of the Point of Sale application for PWA",
      "dataType": "STRING"
    },
    {
      "id": 3,
      "configKey": "pwa_theme_color",
      "configValue": "#ffffff",
      "category": "PWA",
      "description": "Theme color for the Point of Sale application's splash screen",
      "dataType": "STRING"
    },
    {
      "id": 4,
      "configKey": "pwa_background_color",
      "configValue": "#ffffff",
      "category": "PWA",
      "description": "Background color for the Point of Sale application's splash screen",
      "dataType": "STRING"
    },
    {
      "id": 5,
      "configKey": "pwa_icon_192",
      "configValue": "",
      "category": "PWA",
      "description": "PWA app icon URL for 192x192 size",
      "dataType": "STRING"
    },
    {
      "id": 6,
      "configKey": "pwa_icon_512",
      "configValue": "",
      "category": "PWA",
      "description": "PWA app icon URL for 512x512 size",
      "dataType": "STRING"
    }
  ]
}
```

**Example**:
```bash
curl -X GET http://localhost:8080/posai/api/admin/configurations/pwa \
  -H "X-Tenant-ID: PaPos"
```

### Get Configuration by Key
```http
GET /api/admin/configurations/by-key?key=pwa_name&category=PWA
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
    "configKey": "pwa_name",
    "configValue": "POS System",
    "category": "PWA",
    "description": "Name of the Point of Sale application for PWA",
    "dataType": "STRING"
  }
}
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
  "configValue": "My Store POS",
  "description": "Updated app name"
}
```

**Example**:
```bash
curl -X PUT http://localhost:8080/posai/api/admin/configurations/1 \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "configValue": "My Store POS",
    "description": "Custom store name"
  }'
```

### Bulk Update Configurations
```http
POST /api/admin/configurations/bulk-update?category=PWA
```

**Headers**:
- `X-Tenant-ID`: Your tenant identifier (required)
- `Content-Type`: application/json

**Request Body**:
```json
{
  "configurations": {
    "pwa_name": "My Store POS",
    "pwa_short_name": "MyPOS",
    "pwa_theme_color": "#2563eb",
    "pwa_background_color": "#1e40af",
    "pwa_icon_192": "/images/icon-192.png",
    "pwa_icon_512": "/images/icon-512.png"
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
      "configKey": "pwa_name",
      "configValue": "My Store POS",
      "category": "PWA",
      "description": "Name of the Point of Sale application for PWA",
      "dataType": "STRING"
    },
    {
      "id": 2,
      "configKey": "pwa_short_name",
      "configValue": "MyPOS",
      "category": "PWA",
      "description": "Shortened name of the Point of Sale application for PWA",
      "dataType": "STRING"
    }
  ]
}
```

**Example**:
```bash
curl -X POST "http://localhost:8080/posai/api/admin/configurations/bulk-update?category=PWA" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "configurations": {
      "pwa_name": "My Store POS",
      "pwa_short_name": "MyPOS",
      "pwa_theme_color": "#2563eb",
      "pwa_background_color": "#1e40af"
    }
  }'
```

## Usage Examples

### Java Service Layer

```java
@Service
public class PwaService {
    @Autowired
    private ConfigurationService configurationService;
    
    public String getPwaName() {
        return configurationService.getConfigValue(
            "pwa_name", 
            Configuration.ConfigCategory.PWA, 
            "POS System"
        );
    }
    
    public String getPwaThemeColor() {
        return configurationService.getConfigValue(
            "pwa_theme_color",
            Configuration.ConfigCategory.PWA,
            "#ffffff"
        );
    }
    
    public Map<String, String> getAllPwaSettings() {
        List<Configuration> configs = configurationService.getConfigurationsByCategory(
            Configuration.ConfigCategory.PWA
        );
        
        Map<String, String> settings = new HashMap<>();
        for (Configuration config : configs) {
            settings.put(config.getConfigKey(), config.getConfigValue());
        }
        return settings;
    }
}
```

### REST API (cURL)

**Get all PWA configurations:**
```bash
curl -X GET http://localhost:8080/posai/api/admin/configurations/pwa \
  -H "X-Tenant-ID: PaPos"
```

**Update PWA name:**
```bash
curl -X PUT http://localhost:8080/posai/api/admin/configurations/1 \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "configValue": "Custom POS Name"
  }'
```

**Bulk update PWA settings:**
```bash
curl -X POST "http://localhost:8080/posai/api/admin/configurations/bulk-update?category=PWA" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "configurations": {
      "pwa_name": "Restaurant POS",
      "pwa_short_name": "R-POS",
      "pwa_theme_color": "#ef4444",
      "pwa_background_color": "#dc2626",
      "pwa_icon_192": "https://example.com/icon-192.png",
      "pwa_icon_512": "https://example.com/icon-512.png"
    }
  }'
```

## Database Migration

The PWA configurations are automatically initialized when the application starts through Liquibase migrations. The migration file `018-insert-default-pwa-configurations.yaml` creates all 6 configuration entries with their default values.

## Best Practices

1. **Color Values**: Always use valid hex color codes with the # prefix (e.g., #ffffff, #000000)
2. **Short Names**: Keep the short name to 12 characters or less for optimal display
3. **Icon URLs**: Use absolute URLs or relative paths from your web root
4. **Icon Sizes**: Provide both 192x192 and 512x512 icons for best compatibility
5. **Icon Format**: Use PNG format with transparent backgrounds for icons
6. **Testing**: After updating PWA configurations, test on actual mobile devices to ensure proper display

## Common Use Cases

### Branding Your POS Application

Update the PWA name and short name to match your business:
```bash
curl -X POST "http://localhost:8080/posai/api/admin/configurations/bulk-update?category=PWA" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "configurations": {
      "pwa_name": "Acme Restaurant POS",
      "pwa_short_name": "Acme POS"
    }
  }'
```

### Customizing Theme Colors

Set brand colors for your PWA:
```bash
curl -X POST "http://localhost:8080/posai/api/admin/configurations/bulk-update?category=PWA" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "configurations": {
      "pwa_theme_color": "#2563eb",
      "pwa_background_color": "#1e40af"
    }
  }'
```

### Setting Up App Icons

Configure custom icons for your PWA:
```bash
curl -X POST "http://localhost:8080/posai/api/admin/configurations/bulk-update?category=PWA" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "configurations": {
      "pwa_icon_192": "/assets/icons/pos-icon-192.png",
      "pwa_icon_512": "/assets/icons/pos-icon-512.png"
    }
  }'
```

## Multi-Tenant Support

All PWA configurations are tenant-specific:
- Each tenant has their own set of PWA configurations
- Configurations are isolated per tenant database
- Always include `X-Tenant-ID` header in API requests

## Security Considerations

- Only admin users should have access to modify PWA configurations
- Validate icon URLs to prevent XSS attacks
- Validate color values to ensure they are valid hex codes
- Audit trail is automatically maintained through `AbstractAuditableEntity`

## Troubleshooting

### PWA Not Using Updated Icon
- Clear browser cache and service worker cache
- Ensure icon URLs are accessible
- Verify icon dimensions match the specified sizes (192x192 or 512x512)

### Colors Not Appearing Correctly
- Verify hex color format includes # prefix
- Check that colors are valid 6-digit hex codes
- Test on different devices and browsers

### Configuration Not Saving
- Verify X-Tenant-ID header is included
- Check that the configuration key exists
- Ensure the user has admin permissions

## See Also

- [API Documentation](API_DOCUMENTATION.md) - Complete API reference
- [General Configuration Guide](GENERAL_CONFIGURATION_GUIDE.md) - General configuration options
- [Configuration Implementation Summary](CONFIGURATION_IMPLEMENTATION_SUMMARY.md) - Technical implementation details
