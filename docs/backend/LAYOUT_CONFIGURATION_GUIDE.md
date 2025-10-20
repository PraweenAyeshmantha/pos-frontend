# Layout Configuration Guide

## Overview

The Layout Configuration module allows administrators to customize the visual appearance of the Point of Sale system. These configurations control the gradient colors and font size used throughout the POS interface to match your brand identity and ensure optimal readability.

## Configuration Keys

### 1. Gradient Primary Color
- **Key**: `layout_gradient_primary_color`
- **Type**: STRING
- **Default**: `#4A90E2`
- **Description**: The primary color of the gradient to be utilized in the Point of Sale. Accepts hex color values (e.g., #4A90E2 for blue). This color is typically the starting point of gradient backgrounds used throughout the POS interface.

### 2. Gradient Secondary Color
- **Key**: `layout_gradient_secondary_color`
- **Type**: STRING
- **Default**: `#357ABD`
- **Description**: The secondary color of the gradient to be utilized at the Point of Sale. Accepts hex color values. This color is typically the ending point of the gradient, creating a smooth visual transition with the primary color.

### 3. Font Size
- **Key**: `layout_font_size`
- **Type**: NUMBER
- **Default**: `14`
- **Description**: Text size (in pixels) for the Point of Sale. Controls the base font size used throughout the POS interface. Choose a size that ensures readability for your users (typically 12-18 pixels).

## API Endpoints

### Get All Layout Configurations
```http
GET /api/admin/configurations/layout
Headers: X-Tenant-ID: {tenantId}
```

**Response:**
```json
{
  "status": "SUCCESS",
  "messageCode": "success",
  "message": "Layout configurations retrieved successfully",
  "path": "/api/admin/configurations/layout",
  "data": [
    {
      "id": 1,
      "configKey": "layout_gradient_primary_color",
      "configValue": "#4A90E2",
      "category": "LAYOUT",
      "description": "Primary color of the gradient to be utilized in the Point of Sale",
      "dataType": "STRING"
    },
    {
      "id": 2,
      "configKey": "layout_gradient_secondary_color",
      "configValue": "#357ABD",
      "category": "LAYOUT",
      "description": "Secondary color of the gradient to be utilized at the Point of Sale",
      "dataType": "STRING"
    },
    {
      "id": 3,
      "configKey": "layout_font_size",
      "configValue": "14",
      "category": "LAYOUT",
      "description": "Text size (in pixels) for the Point of Sale",
      "dataType": "NUMBER"
    }
  ]
}
```

### Get Configuration by Key
```http
GET /api/admin/configurations/by-key?key=layout_gradient_primary_color&category=LAYOUT
Headers: X-Tenant-ID: {tenantId}
```

### Update Single Configuration
```http
PUT /api/admin/configurations/{id}
Headers: X-Tenant-ID: {tenantId}, Content-Type: application/json

{
  "configValue": "#FF5733",
  "description": "Updated primary gradient color"
}
```

### Bulk Update Configurations
```http
POST /api/admin/configurations/bulk-update?category=LAYOUT
Headers: X-Tenant-ID: {tenantId}, Content-Type: application/json

{
  "configurations": {
    "layout_gradient_primary_color": "#FF5733",
    "layout_gradient_secondary_color": "#C70039",
    "layout_font_size": "16"
  }
}
```

## Usage Examples

### Java Service Layer

```java
@Service
public class PosLayoutService {
    
    @Autowired
    private ConfigurationService configurationService;
    
    public String getGradientPrimaryColor() {
        return configurationService.getConfigValue(
            "layout_gradient_primary_color", 
            Configuration.ConfigCategory.LAYOUT, 
            "#4A90E2"
        );
    }
    
    public String getGradientSecondaryColor() {
        return configurationService.getConfigValue(
            "layout_gradient_secondary_color", 
            Configuration.ConfigCategory.LAYOUT, 
            "#357ABD"
        );
    }
    
    public Integer getFontSize() {
        return configurationService.getConfigValueAsInteger(
            "layout_font_size", 
            Configuration.ConfigCategory.LAYOUT, 
            14
        );
    }
    
    public String getGradientCss() {
        String primaryColor = getGradientPrimaryColor();
        String secondaryColor = getGradientSecondaryColor();
        return String.format(
            "background: linear-gradient(135deg, %s 0%%, %s 100%%);",
            primaryColor, 
            secondaryColor
        );
    }
}
```

### REST API (cURL)

#### Get all layout configurations
```bash
curl -X GET http://localhost:8080/api/admin/configurations/layout \
  -H "X-Tenant-ID: tenant1"
```

#### Get specific configuration
```bash
curl -X GET "http://localhost:8080/api/admin/configurations/by-key?key=layout_font_size&category=LAYOUT" \
  -H "X-Tenant-ID: tenant1"
```

#### Update a single configuration
```bash
curl -X PUT http://localhost:8080/api/admin/configurations/1 \
  -H "X-Tenant-ID: tenant1" \
  -H "Content-Type: application/json" \
  -d '{
    "configValue": "16",
    "description": "Increased font size for better readability"
  }'
```

#### Bulk update configurations
```bash
curl -X POST "http://localhost:8080/api/admin/configurations/bulk-update?category=LAYOUT" \
  -H "X-Tenant-ID: tenant1" \
  -H "Content-Type: application/json" \
  -d '{
    "configurations": {
      "layout_gradient_primary_color": "#2C3E50",
      "layout_gradient_secondary_color": "#34495E",
      "layout_font_size": "15"
    }
  }'
```

## Database Migration

The layout configurations are automatically initialized during database migration. The migration file creates three configuration entries with default values.

### Migration SQL (for reference)
```sql
INSERT INTO configurations (config_key, config_value, category, description, data_type, created_date, created_user, record_status, version) VALUES
  ('layout_gradient_primary_color', '#4A90E2', 'LAYOUT', 'Primary color of the gradient to be utilized in the Point of Sale', 'STRING', NOW(), 'SYSTEM', 'ACTIVE', 0),
  ('layout_gradient_secondary_color', '#357ABD', 'LAYOUT', 'Secondary color of the gradient to be utilized at the Point of Sale', 'STRING', NOW(), 'SYSTEM', 'ACTIVE', 0),
  ('layout_font_size', '14', 'LAYOUT', 'Text size (in pixels) for the Point of Sale', 'NUMBER', NOW(), 'SYSTEM', 'ACTIVE', 0);
```

## Best Practices

1. **Use Service Methods**: Always use `ConfigurationService` methods instead of direct repository access
2. **Provide Defaults**: Always provide sensible default values when retrieving configurations
3. **Bulk Updates**: Use bulk update endpoint when updating multiple related configurations
4. **Type Safety**: Use `getConfigValueAsInteger()` for the font size to ensure type safety
5. **Validation**: Validate configuration values before saving:
   - Ensure color values are valid hex codes (e.g., #RRGGBB format)
   - Verify font size is within reasonable range (e.g., 10-24 pixels)
   - Test color combinations for sufficient contrast and readability
6. **Caching**: Consider caching frequently accessed configurations in your service layer

## Color Guidelines

### Choosing Gradient Colors
- **Contrast**: Ensure sufficient contrast between gradient colors for visual appeal
- **Brand Alignment**: Choose colors that match your brand identity
- **Accessibility**: Consider color-blind friendly combinations
- **Professional Appearance**: Blues and grays tend to provide professional appearances
- **Testing**: Test gradients on actual devices/screens before deployment

### Recommended Color Combinations
- **Professional Blue**: #4A90E2 to #357ABD (default)
- **Dark Theme**: #2C3E50 to #34495E
- **Warm Theme**: #E74C3C to #C0392B
- **Green Theme**: #27AE60 to #229954
- **Purple Theme**: #8E44AD to #6C3483

### Font Size Guidelines
- **Small**: 12px - For dense information displays
- **Medium**: 14px - Default, balanced readability (default)
- **Large**: 16px - Enhanced readability for accessibility
- **Extra Large**: 18px - For users with vision impairments

## Multi-Tenant Support

All layout configurations are tenant-specific:
- Each tenant can have their own customized layout settings
- Configuration values are isolated by tenant
- Always include the `X-Tenant-ID` header in API requests
- Configurations are automatically created for each tenant during initialization

## Security Considerations

- Only admin users should have access to modify configurations
- Configuration changes are immediately effective for all users in the tenant
- Consider implementing additional validation for color formats
- Audit trail is automatically maintained through `AbstractAuditableEntity`

## Troubleshooting

### Configuration Not Found
If you receive a "Configuration not found" error:
1. Verify the configuration key is correct
2. Ensure you're using the correct category (`LAYOUT`)
3. Check that database migrations have been applied
4. Verify the tenant ID is correct

### Invalid Color Values
- Ensure color values are in hex format starting with #
- Use 6-character hex codes (e.g., #4A90E2, not #4AE)
- Verify colors provide sufficient contrast for readability

### Invalid Font Size
- Ensure font size is a positive integer
- Verify font size is within reasonable range (10-24 pixels recommended)
- Test font size on actual devices before applying to production

### Bulk Update Issues
- Ensure the request body structure matches the expected format
- Verify all configuration keys exist in the database
- Check that the category parameter is `LAYOUT`

## Future Enhancements

Potential improvements for future versions:
1. Real-time preview of layout with selected colors and font size
2. Predefined layout themes (dark mode, light mode, high contrast)
3. Support for custom fonts in addition to font size
4. Advanced gradient options (angle, multiple color stops)
5. Layout presets for different business types
6. Accessibility checker for color contrast ratios
7. Mobile-specific layout customization options

## Related Documentation

- [Configuration Implementation Summary](CONFIGURATION_IMPLEMENTATION_SUMMARY.md)
- [API Documentation](API_DOCUMENTATION.md)
- [Login Configuration Guide](LOGIN_CONFIGURATION_GUIDE.md)
- [Printer Configuration Guide](PRINTER_CONFIGURATION_GUIDE.md)

## Support

For additional support or questions about layout configurations:
1. Check the troubleshooting section above
2. Review the usage examples
3. Consult the API documentation
4. Contact your system administrator
