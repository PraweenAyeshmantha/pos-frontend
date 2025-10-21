# POS Endpoint Guide

## Overview

The POS endpoint provides a public API for accessing Point of Sale login screen configurations. When cashiers or administrators access the POS system, they are presented with a login screen that can be customized through configuration settings.

## Endpoint

```http
GET /api/pos
```

This endpoint returns all login screen configurations that control the appearance and behavior of the POS login interface.

## Purpose

The POS endpoint serves as the entry point for the Point of Sale application. It:

1. **Displays Login Screen**: Returns configuration data needed to render a customized login screen
2. **Tenant-Specific Customization**: Each tenant can have their own branded login experience
3. **Feature Toggles**: Enables/disables optional features like "Remember Me" and "Forgot Password"
4. **Branding**: Allows customization of colors, text, and styling

## Headers

**Required**:
- `X-Tenant-ID`: Your tenant identifier

**Example**:
```bash
curl -X GET "http://localhost:8080/posai/api/pos" \
  -H "X-Tenant-ID: PaPos"
```

## Response Format

The endpoint returns a standard API response containing an array of login configurations:

```json
{
  "code": "success",
  "message": "POS login screen configurations retrieved successfully",
  "timestamp": "2025-10-15T13:20:00Z",
  "path": "/api/pos",
  "data": [...]
}
```

## Configuration Keys Returned

The endpoint returns the following 8 configuration keys:

### 1. login_heading_text
- **Type**: STRING
- **Default**: "Welcome to POS System"
- **Usage**: Main heading text at the top of the login screen

### 2. login_footer_text
- **Type**: STRING
- **Default**: "© 2025 POS System. All rights reserved."
- **Usage**: Footer text at the bottom of the login screen

### 3. login_button_text
- **Type**: STRING
- **Default**: "Sign In"
- **Usage**: Text displayed on the login submit button

### 4. enable_remember_me
- **Type**: BOOLEAN
- **Default**: true
- **Usage**: Shows/hides the "Remember Me" checkbox

### 5. enable_forgot_password
- **Type**: BOOLEAN
- **Default**: true
- **Usage**: Shows/hides the "Forgot Password" link

### 6. login_bg_primary_color
- **Type**: STRING (hex color)
- **Default**: #4A90E2
- **Usage**: Primary color for background gradient

### 7. login_bg_secondary_color
- **Type**: STRING (hex color)
- **Default**: #357ABD
- **Usage**: Secondary color for background gradient

### 8. login_font_color
- **Type**: STRING (hex color)
- **Default**: #FFFFFF
- **Usage**: Font color for login screen text

## Frontend Integration

When building a frontend application that uses this endpoint:

1. **On Initial Load**: Call `GET /api/pos` to fetch login configurations
2. **Apply Configurations**: Use the returned values to customize the login screen
3. **Feature Toggles**: Check boolean values to show/hide optional features
4. **Styling**: Apply color values to achieve branded appearance

### Example Frontend Usage (JavaScript)

```javascript
// Fetch POS login configurations
async function initializePOSLogin() {
  const response = await fetch('http://localhost:8080/posai/api/pos', {
    headers: {
      'X-Tenant-ID': 'PaPos'
    }
  });
  
  const result = await response.json();
  const configs = result.data;
  
  // Convert array to key-value map
  const configMap = configs.reduce((map, config) => {
    map[config.configKey] = config.configValue;
    return map;
  }, {});
  
  // Apply configurations
  document.querySelector('.login-heading').textContent = configMap.login_heading_text;
  document.querySelector('.login-footer').textContent = configMap.login_footer_text;
  document.querySelector('.login-button').textContent = configMap.login_button_text;
  
  // Apply colors
  document.body.style.background = `linear-gradient(135deg, ${configMap.login_bg_primary_color}, ${configMap.login_bg_secondary_color})`;
  document.body.style.color = configMap.login_font_color;
  
  // Feature toggles
  if (configMap.enable_remember_me === 'false') {
    document.querySelector('.remember-me').style.display = 'none';
  }
  
  if (configMap.enable_forgot_password === 'false') {
    document.querySelector('.forgot-password').style.display = 'none';
  }
}
```

## Customizing Login Configurations

Administrators can customize these configurations through the admin API:

```bash
# Update a single configuration
curl -X PUT "http://localhost:8080/posai/api/admin/configurations/{id}" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "configValue": "Welcome to My Store POS"
  }'

# Bulk update multiple configurations
curl -X POST "http://localhost:8080/posai/api/admin/configurations/bulk-update?category=LOGIN" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "configurations": {
      "login_heading_text": "Welcome to My Store",
      "login_bg_primary_color": "#2E7D32",
      "login_button_text": "Log In"
    }
  }'
```

## Security Considerations

- The `/api/pos` endpoint is public and does not require authentication
- It only returns configuration data, not sensitive information
- Actual authentication happens after the login form is submitted
- All configuration changes require admin privileges through `/api/admin/configurations/login`

## Related Documentation

- [Login Configuration Guide](LOGIN_CONFIGURATION_GUIDE.md) - Detailed guide for all login configuration options
- [API Documentation](API_DOCUMENTATION.md) - Complete API reference
- [General Configuration Guide](GENERAL_CONFIGURATION_GUIDE.md) - Other system configurations

## Testing

Use the provided test script to verify the endpoint:

```bash
./test-pos-endpoint.sh
```

This script demonstrates how to call the endpoint and displays the returned configuration data.
