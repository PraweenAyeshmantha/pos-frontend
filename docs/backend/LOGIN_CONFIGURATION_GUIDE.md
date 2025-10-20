# Login Configuration Guide

## Overview

The Login Configuration module allows administrators to customize the appearance and behavior of the Point of Sale login screen. These configurations control the text, colors, and available features on the login page to match your brand identity and business requirements.

## Configuration Keys

### 1. Heading Text
- **Key**: `login_heading_text`
- **Type**: STRING
- **Default**: `Welcome to POS System`
- **Description**: The main heading text displayed at the top of the POS login screen. This can be customized to show your business name, welcome message, or any other text.

### 2. Footer Text
- **Key**: `login_footer_text`
- **Type**: STRING
- **Default**: `© 2025 POS System. All rights reserved.`
- **Description**: The footer text displayed at the bottom of the POS login screen. Typically used for copyright notices, version information, or support contact details.

### 3. Login Button Text
- **Key**: `login_button_text`
- **Type**: STRING
- **Default**: `Sign In`
- **Description**: The text displayed on the login button. Can be customized to match your preferred language or terminology (e.g., "Log In", "Enter", "Access System").

### 4. Enable Remember Me Option
- **Key**: `enable_remember_me`
- **Type**: BOOLEAN
- **Default**: `true`
- **Description**: Controls whether the "Remember Me" checkbox is visible on the POS login page. When enabled, users can choose to stay logged in across sessions.

### 5. Enable Forgot Password Option
- **Key**: `enable_forgot_password`
- **Type**: BOOLEAN
- **Default**: `true`
- **Description**: Controls whether the "Forgot Password" link is visible on the POS login screen. When enabled, users can access password recovery functionality.

### 6. Background Primary Color
- **Key**: `login_bg_primary_color`
- **Type**: STRING
- **Default**: `#4A90E2`
- **Description**: The primary color of the background gradient on the POS login screen. Accepts hex color values (e.g., #4A90E2 for blue). This color is typically the starting point of the gradient.

### 7. Background Secondary Color
- **Key**: `login_bg_secondary_color`
- **Type**: STRING
- **Default**: `#357ABD`
- **Description**: The secondary color of the background gradient on the POS login screen. Accepts hex color values. This color is typically the ending point of the gradient, creating a smooth visual transition with the primary color.

### 8. Font Color
- **Key**: `login_font_color`
- **Type**: STRING
- **Default**: `#FFFFFF`
- **Description**: The color of the text displayed on the POS login screen. Accepts hex color values (e.g., #FFFFFF for white, #000000 for black). Choose a color that provides good contrast with your background colors for readability.

## API Endpoints

### Get All Login Configurations
```http
GET /api/admin/configurations/login
```

**Headers**:
- `X-Tenant-ID`: Your tenant identifier (required)

**Response**:
```json
{
  "code": "success",
  "message": "Login configurations retrieved successfully",
  "timestamp": "2025-10-11T16:00:00Z",
  "path": "/api/admin/configurations/login",
  "data": [
    {
      "id": 1,
      "configKey": "login_heading_text",
      "configValue": "Welcome to POS System",
      "category": "LOGIN",
      "description": "Heading text for the POS login screen",
      "dataType": "STRING"
    },
    {
      "id": 2,
      "configKey": "login_footer_text",
      "configValue": "© 2025 POS System. All rights reserved.",
      "category": "LOGIN",
      "description": "Footer text for the POS login screen",
      "dataType": "STRING"
    },
    {
      "id": 3,
      "configKey": "login_button_text",
      "configValue": "Sign In",
      "category": "LOGIN",
      "description": "Text displayed on the login button of the POS login screen",
      "dataType": "STRING"
    },
    {
      "id": 4,
      "configKey": "enable_remember_me",
      "configValue": "true",
      "category": "LOGIN",
      "description": "Enable or disable the remember me option on the POS login page",
      "dataType": "BOOLEAN"
    },
    {
      "id": 5,
      "configKey": "enable_forgot_password",
      "configValue": "true",
      "category": "LOGIN",
      "description": "Enable or disable the forgot password link visibility on the POS login screen",
      "dataType": "BOOLEAN"
    },
    {
      "id": 6,
      "configKey": "login_bg_primary_color",
      "configValue": "#4A90E2",
      "category": "LOGIN",
      "description": "Primary color of the background gradient on the POS login screen",
      "dataType": "STRING"
    },
    {
      "id": 7,
      "configKey": "login_bg_secondary_color",
      "configValue": "#357ABD",
      "category": "LOGIN",
      "description": "Secondary color of the background gradient on the POS login screen",
      "dataType": "STRING"
    },
    {
      "id": 8,
      "configKey": "login_font_color",
      "configValue": "#FFFFFF",
      "category": "LOGIN",
      "description": "Font color for the POS login screen",
      "dataType": "STRING"
    }
  ]
}
```

### Update a Single Login Configuration
```http
PUT /api/admin/configurations/{id}
```

**Headers**:
- `X-Tenant-ID`: Your tenant identifier (required)
- `Content-Type`: application/json

**Request Body**:
```json
{
  "configValue": "Welcome to My Store POS",
  "description": "Customized heading text for store login screen",
  "dataType": "STRING"
}
```

**Response**:
```json
{
  "code": "success.configuration.updated",
  "message": "Configuration updated successfully",
  "timestamp": "2025-10-11T16:05:00Z",
  "path": "/api/admin/configurations/1",
  "data": {
    "id": 1,
    "configKey": "login_heading_text",
    "configValue": "Welcome to My Store POS",
    "category": "LOGIN",
    "description": "Customized heading text for store login screen",
    "dataType": "STRING"
  }
}
```

### Bulk Update Login Configurations
```http
POST /api/admin/configurations/bulk-update?category=LOGIN
```

**Headers**:
- `X-Tenant-ID`: Your tenant identifier (required)
- `Content-Type`: application/json

**Request Body**:
```json
{
  "configurations": {
    "login_heading_text": "Welcome to My Store",
    "login_footer_text": "© 2025 My Store. Contact: support@mystore.com",
    "login_button_text": "Login",
    "enable_remember_me": "false",
    "login_bg_primary_color": "#FF5733",
    "login_bg_secondary_color": "#C70039",
    "login_font_color": "#FFFFFF"
  }
}
```

**Response**:
```json
{
  "code": "success.configurations.bulk.updated",
  "message": "Configurations updated successfully",
  "timestamp": "2025-10-11T16:10:00Z",
  "path": "/api/admin/configurations/bulk-update",
  "data": [
    {
      "id": 1,
      "configKey": "login_heading_text",
      "configValue": "Welcome to My Store",
      "category": "LOGIN",
      "description": "Heading text for the POS login screen",
      "dataType": "STRING"
    }
    // ... other updated configurations
  ]
}
```

## Usage Examples

### Example 1: Get All Login Configurations

```bash
curl -X GET "http://localhost:8080/pos-codex/api/admin/configurations/login" \
  -H "X-Tenant-ID: PaPos"
```

### Example 2: Update Login Heading Text

```bash
curl -X PUT "http://localhost:8080/pos-codex/api/admin/configurations/1" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "configValue": "Welcome to Coffee Shop POS",
    "description": "Coffee shop branded login heading",
    "dataType": "STRING"
  }'
```

### Example 3: Customize Login Colors (Bulk Update)

```bash
curl -X POST "http://localhost:8080/pos-codex/api/admin/configurations/bulk-update?category=LOGIN" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "configurations": {
      "login_bg_primary_color": "#2E7D32",
      "login_bg_secondary_color": "#1B5E20",
      "login_font_color": "#FFFFFF"
    }
  }'
```

### Example 4: Disable Remember Me and Forgot Password Features

```bash
curl -X POST "http://localhost:8080/pos-codex/api/admin/configurations/bulk-update?category=LOGIN" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "configurations": {
      "enable_remember_me": "false",
      "enable_forgot_password": "false"
    }
  }'
```

## Service Layer Usage

If you need to retrieve login configuration values in your Java code:

```java
@Autowired
private ConfigurationService configurationService;

// Get login heading text
String headingText = configurationService.getConfigValue(
    "login_heading_text", 
    Configuration.ConfigCategory.LOGIN, 
    "Welcome to POS System"
);

// Check if remember me is enabled
Boolean rememberMeEnabled = configurationService.getConfigValueAsBoolean(
    "enable_remember_me", 
    Configuration.ConfigCategory.LOGIN, 
    true
);

// Get background colors
String primaryColor = configurationService.getConfigValue(
    "login_bg_primary_color", 
    Configuration.ConfigCategory.LOGIN, 
    "#4A90E2"
);

String secondaryColor = configurationService.getConfigValue(
    "login_bg_secondary_color", 
    Configuration.ConfigCategory.LOGIN, 
    "#357ABD"
);
```

## Database Migration

The login configurations are automatically inserted when the application starts through Liquibase migrations. The migration file is located at:
- `src/main/resources/db/changelog/v1.0/019-insert-default-login-configurations.yaml`

If you need to manually insert the configurations, you can use the following SQL:

```sql
INSERT INTO configurations (config_key, config_value, category, description, data_type, created_date, created_user, record_status, version)
VALUES 
  ('login_heading_text', 'Welcome to POS System', 'LOGIN', 'Heading text for the POS login screen', 'STRING', NOW(), 'SYSTEM', 'ACTIVE', 0),
  ('login_footer_text', '© 2025 POS System. All rights reserved.', 'LOGIN', 'Footer text for the POS login screen', 'STRING', NOW(), 'SYSTEM', 'ACTIVE', 0),
  ('login_button_text', 'Sign In', 'LOGIN', 'Text displayed on the login button of the POS login screen', 'STRING', NOW(), 'SYSTEM', 'ACTIVE', 0),
  ('enable_remember_me', 'true', 'LOGIN', 'Enable or disable the remember me option on the POS login page', 'BOOLEAN', NOW(), 'SYSTEM', 'ACTIVE', 0),
  ('enable_forgot_password', 'true', 'LOGIN', 'Enable or disable the forgot password link visibility on the POS login screen', 'BOOLEAN', NOW(), 'SYSTEM', 'ACTIVE', 0),
  ('login_bg_primary_color', '#4A90E2', 'LOGIN', 'Primary color of the background gradient on the POS login screen', 'STRING', NOW(), 'SYSTEM', 'ACTIVE', 0),
  ('login_bg_secondary_color', '#357ABD', 'LOGIN', 'Secondary color of the background gradient on the POS login screen', 'STRING', NOW(), 'SYSTEM', 'ACTIVE', 0),
  ('login_font_color', '#FFFFFF', 'LOGIN', 'Font color for the POS login screen', 'STRING', NOW(), 'SYSTEM', 'ACTIVE', 0);
```

## Best Practices

1. **Color Contrast**: Ensure the font color provides sufficient contrast against your background colors for accessibility and readability.

2. **Brand Consistency**: Use colors and text that align with your brand guidelines to maintain consistency across your application.

3. **Testing**: Always test your color combinations on actual devices to ensure they look good in different lighting conditions and screen types.

4. **Default Values**: Provide sensible defaults when retrieving configuration values to ensure the application works even if configurations are missing.

5. **Text Length**: Keep heading and button text concise to ensure they display properly on smaller screens.

6. **Security Features**: Consider carefully before disabling the "Forgot Password" feature, as it may impact user experience if users lose access to their accounts.

## Multi-Tenant Support

All login configurations are tenant-specific. Each tenant has their own set of login configurations, isolated from other tenants. Always include the `X-Tenant-ID` header in API requests to ensure you're working with the correct tenant's configurations.

## Color Format

All color configurations accept standard hex color codes:
- **Format**: `#RRGGBB` where RR (red), GG (green), and BB (blue) are hexadecimal values (00-FF)
- **Examples**: 
  - White: `#FFFFFF`
  - Black: `#000000`
  - Blue: `#4A90E2`
  - Red: `#FF0000`
  - Green: `#00FF00`

## Troubleshooting

### Issue: Login screen doesn't reflect new colors
**Solution**: Clear your browser cache and refresh the page. The frontend application needs to fetch the updated configuration values.

### Issue: Configuration not found
**Solution**: Ensure the database migration has run. Check the Liquibase changelog lock table and verify that changeset 019 has been executed.

### Issue: Bulk update fails
**Solution**: Verify the configuration keys exist and are spelled correctly. Use `GET /api/admin/configurations/login` to see all available keys.

### Issue: Boolean value not working
**Solution**: Boolean values should be strings "true" or "false" in the API requests. The service layer will parse them correctly.

## Security Considerations

- Only admin users should have access to modify login configurations
- Changes to login configurations can affect user experience, so implement appropriate approval workflows if needed
- Audit trail is automatically maintained through the `AbstractAuditableEntity` base class
- Consider the security implications before disabling "Forgot Password" functionality

## Future Enhancements

Potential improvements for future versions:
1. Real-time preview of login screen with selected colors
2. Predefined color themes (dark mode, light mode, high contrast)
3. Support for custom logo on login screen
4. Multi-language support for login text
5. Custom CSS styling options
6. Background image support in addition to gradients
