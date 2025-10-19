# Settings Menu API Quick Reference

## Endpoints Summary

### Outlet Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pos/settings/outlet` | Get outlet settings |
| PUT | `/api/pos/settings/outlet` | Update outlet settings |
| POST | `/api/pos/settings/outlet/reset` | Reset to defaults |
| POST | `/api/pos/settings/outlet/switch/{cashierId}` | Switch outlet |

### Account Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pos/settings/account/{cashierId}` | Get account info |
| PUT | `/api/pos/settings/account/{cashierId}` | Update account |
| PUT | `/api/pos/settings/account/{cashierId}/password` | Change password |

## Request Examples

### Get Outlet Settings
```bash
curl http://localhost:8080/api/pos/settings/outlet
```

### Update Outlet Settings
```bash
curl -X PUT http://localhost:8080/api/pos/settings/outlet \
  -H "Content-Type: application/json" \
  -d '{
    "displayCategoryCards": false,
    "enableSounds": true,
    "pageWidthMm": 150,
    "pageHeightMm": 300,
    "pageMarginMm": 15
  }'
```

### Reset Outlet Data
```bash
curl -X POST http://localhost:8080/api/pos/settings/outlet/reset
```

### Switch Outlet
```bash
curl -X POST http://localhost:8080/api/pos/settings/outlet/switch/1 \
  -H "Content-Type: application/json" \
  -d '{"outletId": 2}'
```

### Get Account Settings
```bash
curl http://localhost:8080/api/pos/settings/account/1
```

### Update Account
```bash
curl -X PUT http://localhost:8080/api/pos/settings/account/1 \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Change Password
```bash
curl -X PUT http://localhost:8080/api/pos/settings/account/1/password \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "old",
    "newPassword": "new",
    "confirmPassword": "new"
  }'
```

## Response Format

### Success Response
```json
{
  "status": "success",
  "code": "success.code",
  "message": "Success message",
  "path": "/api/endpoint",
  "timestamp": "2025-10-16T05:30:00Z",
  "data": { ... }
}
```

### Error Response
```json
{
  "status": "error",
  "code": "error.code",
  "message": "Error message",
  "path": "/api/endpoint",
  "timestamp": "2025-10-16T05:30:00Z"
}
```

## Default Settings

| Setting | Default Value |
|---------|--------------|
| Display Category Cards | true |
| Enable Sounds | true |
| Page Width | 80mm |
| Page Height | 297mm |
| Page Margin | 10mm |

## Common Error Codes

| Code | Description |
|------|-------------|
| `error.resource.not-found` | Resource not found |
| `error.outlet.not-assigned` | No access to outlet |
| `error.outlet.not-active` | Outlet is inactive |
| `error.password.invalid` | Wrong password |
| `error.password.mismatch` | Passwords don't match |
| `error.validation` | Validation failed |

## Testing

### Run Unit Tests
```bash
mvn test -Dtest=SettingsControllerTest
```

### Run Automated Test Script
```bash
./test-settings-api.sh
```

### Custom Test Script Parameters
```bash
BASE_URL=http://localhost:8080 \
CASHIER_ID=1 \
OUTLET_ID=2 \
./test-settings-api.sh
```

## Implementation Files

| File | Description |
|------|-------------|
| `SettingsController.java` | REST controller |
| `SettingsService.java` | Business logic |
| `OutletSettingsDTO.java` | Outlet settings response |
| `UpdateOutletSettingsRequest.java` | Outlet settings request |
| `AccountSettingsDTO.java` | Account settings response |
| `UpdateAccountSettingsRequest.java` | Account update request |
| `ChangePasswordRequest.java` | Password change request |
| `SwitchOutletRequest.java` | Switch outlet request |
| `SettingsControllerTest.java` | Unit tests |

## Configuration Keys

| Key | Category | Type |
|-----|----------|------|
| `display_category_cards` | LAYOUT | Boolean |
| `enable_sounds` | GENERAL | Boolean |
| `page_width` | PRINTER | Integer |
| `page_height` | PRINTER | Integer |
| `page_margin` | PRINTER | Integer |

## Validation Rules

### Update Account Settings
- First name: required, not blank
- Last name: required, not blank

### Change Password
- Current password: required, not blank
- New password: required, min 4 chars
- Confirm password: required, must match new password

### Switch Outlet
- Outlet ID: required
- Cashier must be assigned to outlet
- Outlet must be active

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request |
| 404 | Not Found |
| 500 | Server Error |

## Quick Start

1. **Start server**: `mvn spring-boot:run`
2. **Get settings**: `curl localhost:8080/api/pos/settings/outlet`
3. **Update settings**: Use PUT with JSON body
4. **Run tests**: `./test-settings-api.sh`

## Documentation

- **Full API Docs**: [SETTINGS_API_DOCUMENTATION.md](SETTINGS_API_DOCUMENTATION.md)
- **Implementation Details**: [SETTINGS_IMPLEMENTATION_SUMMARY.md](SETTINGS_IMPLEMENTATION_SUMMARY.md)
- **Testing Guide**: [SETTINGS_TESTING_GUIDE.md](SETTINGS_TESTING_GUIDE.md)

## Tips

- All fields in update requests are optional (partial updates)
- Settings persist to database configuration table
- Reset operation restores all defaults
- Password validation is basic (enhance for production)
- Email and username are read-only in account settings
