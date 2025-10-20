# Settings Menu API Documentation

This document describes the Settings Menu APIs for the POS system. The settings menu has three main categories: **Outlet Settings**, **Account Settings**, and **Logout**.

## Table of Contents
- [Overview](#overview)
- [Outlet Settings APIs](#outlet-settings-apis)
- [Account Settings APIs](#account-settings-apis)
- [Logout API](#logout-api)
- [Error Handling](#error-handling)

## Overview

The Settings Menu allows cashiers to:
1. **Outlet Settings**: Configure display options, sounds, and printer settings for the current outlet
2. **Account Settings**: Manage personal account information and change passwords
3. **Logout**: Securely log out with optional browser data clearing

All endpoints return responses in the standardized `ApiResponse` format.

---

## Outlet Settings APIs

### 1. Get Outlet Settings

Retrieves the current outlet settings configuration.

**Endpoint:** `GET /api/pos/settings/outlet`

**Response:**
```json
{
  "status": "success",
  "code": "success",
  "message": "Outlet settings retrieved successfully",
  "path": "/api/pos/settings/outlet",
  "timestamp": "2025-10-16T05:30:00Z",
  "data": {
    "displayCategoryCards": true,
    "enableSounds": true,
    "pageWidthMm": 80,
    "pageHeightMm": 297,
    "pageMarginMm": 10
  }
}
```

**Fields:**
- `displayCategoryCards` (Boolean): Whether to display category cards in the main menu
- `enableSounds` (Boolean): Whether to enable sound effects when adding items to cart
- `pageWidthMm` (Integer): Printer page width in millimeters
- `pageHeightMm` (Integer): Printer page height in millimeters
- `pageMarginMm` (Integer): Printer page margin in millimeters

---

### 2. Update Outlet Settings

Updates one or more outlet settings. Only provided fields will be updated.

**Endpoint:** `PUT /api/pos/settings/outlet`

**Request Body:**
```json
{
  "displayCategoryCards": false,
  "enableSounds": true,
  "pageWidthMm": 150,
  "pageHeightMm": 300,
  "pageMarginMm": 10
}
```

**Response:**
```json
{
  "status": "success",
  "code": "success.outlet.settings.updated",
  "message": "Outlet settings updated successfully",
  "path": "/api/pos/settings/outlet",
  "timestamp": "2025-10-16T05:30:00Z",
  "data": {
    "displayCategoryCards": false,
    "enableSounds": true,
    "pageWidthMm": 150,
    "pageHeightMm": 300,
    "pageMarginMm": 10
  }
}
```

**Notes:**
- All fields are optional in the request
- Unchanged fields will retain their current values
- Settings are persisted to the configuration database

---

### 3. Reset Outlet Data

Resets all outlet settings to their default values.

**Endpoint:** `POST /api/pos/settings/outlet/reset`

**Request Body:** (None required)

**Response:**
```json
{
  "status": "success",
  "code": "success.outlet.reset",
  "message": "Outlet data has been reset successfully",
  "path": "/api/pos/settings/outlet/reset",
  "timestamp": "2025-10-16T05:30:00Z",
  "data": {
    "message": "Outlet data has been reset to default values"
  }
}
```

**Default Values:**
- `displayCategoryCards`: true
- `enableSounds`: true
- `pageWidthMm`: 80
- `pageHeightMm`: 297
- `pageMarginMm`: 10

---

### 4. Switch Outlet

Switches the current cashier to a different outlet. The cashier must have access to the specified outlet.

**Endpoint:** `POST /api/pos/settings/outlet/switch/{cashierId}`

**Path Parameters:**
- `cashierId` (Long, required): The ID of the cashier switching outlets

**Request Body:**
```json
{
  "outletId": 2
}
```

**Response:**
```json
{
  "status": "success",
  "code": "success.outlet.switched",
  "message": "Outlet switched successfully",
  "path": "/api/pos/settings/outlet/switch/1",
  "timestamp": "2025-10-16T05:30:00Z",
  "data": {
    "id": 2,
    "name": "Downtown Branch",
    "code": "OUT002",
    "address": "123 Main St",
    "phone": "+1234567890",
    "email": "downtown@example.com",
    "mode": "RESTAURANT_CAFE",
    "isActive": true,
    "paymentMethods": []
  }
}
```

**Validation:**
- Cashier must exist
- Outlet must exist
- Cashier must be assigned to the specified outlet
- Outlet must be active

**Error Responses:**

*Cashier not found:*
```json
{
  "status": "error",
  "code": "error.resource.not-found",
  "message": "Cashier not found with id: 1",
  "path": "/api/pos/settings/outlet/switch/1",
  "timestamp": "2025-10-16T05:30:00Z"
}
```

*Outlet not assigned to cashier:*
```json
{
  "status": "error",
  "code": "error.outlet.not-assigned",
  "message": "Cashier does not have access to the specified outlet",
  "path": "/api/pos/settings/outlet/switch/1",
  "timestamp": "2025-10-16T05:30:00Z"
}
```

*Outlet not active:*
```json
{
  "status": "error",
  "code": "error.outlet.not-active",
  "message": "Cannot switch to an inactive outlet",
  "path": "/api/pos/settings/outlet/switch/1",
  "timestamp": "2025-10-16T05:30:00Z"
}
```

---

## Account Settings APIs

### 5. Get Account Settings

Retrieves the account settings for a specific cashier.

**Endpoint:** `GET /api/pos/settings/account/{cashierId}`

**Path Parameters:**
- `cashierId` (Long, required): The ID of the cashier

**Response:**
```json
{
  "status": "success",
  "code": "success",
  "message": "Account settings retrieved successfully",
  "path": "/api/pos/settings/account/1",
  "timestamp": "2025-10-16T05:30:00Z",
  "data": {
    "id": 1,
    "firstName": "Jack",
    "lastName": "Shepard",
    "email": "cashier@email.com",
    "username": "jack.shepard"
  }
}
```

**Notes:**
- The `firstName` and `lastName` are parsed from the cashier's full name
- Email is displayed but cannot be modified through this endpoint
- Username is displayed but cannot be modified through this endpoint

---

### 6. Update Account Settings

Updates the cashier's personal information (name only).

**Endpoint:** `PUT /api/pos/settings/account/{cashierId}`

**Path Parameters:**
- `cashierId` (Long, required): The ID of the cashier

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe"
}
```

**Validation:**
- `firstName` is required (not blank)
- `lastName` is required (not blank)

**Response:**
```json
{
  "status": "success",
  "code": "success.account.updated",
  "message": "Account settings updated successfully",
  "path": "/api/pos/settings/account/1",
  "timestamp": "2025-10-16T05:30:00Z",
  "data": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "cashier@email.com",
    "username": "john.doe"
  }
}
```

---

### 7. Change Password

Changes the password for a specific cashier.

**Endpoint:** `PUT /api/pos/settings/account/{cashierId}/password`

**Path Parameters:**
- `cashierId` (Long, required): The ID of the cashier

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456",
  "confirmPassword": "newPassword456"
}
```

**Validation:**
- `currentPassword` is required (not blank)
- `newPassword` is required (not blank, minimum 4 characters)
- `confirmPassword` is required (not blank)
- `newPassword` and `confirmPassword` must match
- `currentPassword` must match the cashier's current password

**Response:**
```json
{
  "status": "success",
  "code": "success.password.changed",
  "message": "Password changed successfully",
  "path": "/api/pos/settings/account/1/password",
  "timestamp": "2025-10-16T05:30:00Z",
  "data": null
}
```

**Error Responses:**

*Current password incorrect:*
```json
{
  "status": "error",
  "code": "error.password.invalid",
  "message": "Current password is incorrect",
  "path": "/api/pos/settings/account/1/password",
  "timestamp": "2025-10-16T05:30:00Z"
}
```

*Password mismatch:*
```json
{
  "status": "error",
  "code": "error.password.mismatch",
  "message": "New password and confirm password do not match",
  "path": "/api/pos/settings/account/1/password",
  "timestamp": "2025-10-16T05:30:00Z"
}
```

*Password too short:*
```json
{
  "status": "error",
  "code": "error.validation",
  "message": "New password must be at least 4 characters long",
  "path": "/api/pos/settings/account/1/password",
  "timestamp": "2025-10-16T05:30:00Z"
}
```

---

## Logout API

### 8. Logout

Logs out a cashier with an optional browser data clearing feature. This endpoint supports a confirmation-based logout where the cashier can choose to clear all browser data or retain it for faster subsequent logins.

**Endpoint:** `POST /api/pos/settings/logout`

**Request Body:**
```json
{
  "cashierId": 1,
  "clearBrowserData": true
}
```

**Request Fields:**
- `cashierId` (Long, required): The ID of the cashier logging out
- `clearBrowserData` (Boolean, optional): Whether to clear browser data. Defaults to `false` if not provided.

**Response (with data clearing):**
```json
{
  "status": "success",
  "code": "success.logout",
  "message": "Logout completed successfully",
  "path": "/api/pos/settings/logout",
  "timestamp": "2025-10-16T06:30:00Z",
  "data": {
    "message": "Logout successful. All browser data has been cleared. The system will load the most recent information upon your next login.",
    "dataClearedFromBrowser": true,
    "cashierUsername": "jack.shepard"
  }
}
```

**Response (without data clearing):**
```json
{
  "status": "success",
  "code": "success.logout",
  "message": "Logout completed successfully",
  "path": "/api/pos/settings/logout",
  "timestamp": "2025-10-16T06:30:00Z",
  "data": {
    "message": "Logout successful. Browser data has been retained for faster loading upon next login. You can update data from POS settings if needed.",
    "dataClearedFromBrowser": false,
    "cashierUsername": "jack.shepard"
  }
}
```

**Validation:**
- Cashier must exist

**Frontend Implementation:**
When the logout button is clicked, display a confirmation popup with two options:
- **Clear Data and Logout**: Sets `clearBrowserData: true` - Recommended for shared devices
- **Keep Data and Logout**: Sets `clearBrowserData: false` - For faster subsequent logins

See [LOGOUT_API_DOCUMENTATION.md](LOGOUT_API_DOCUMENTATION.md) for detailed documentation and implementation guide.

---

## Error Handling

All endpoints follow the standard error response format:

```json
{
  "status": "error",
  "code": "error.code",
  "message": "Error message",
  "path": "/api/endpoint",
  "timestamp": "2025-10-16T05:30:00Z"
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `error.resource.not-found` | The requested resource (cashier, outlet, etc.) was not found |
| `error.outlet.not-assigned` | Cashier does not have access to the specified outlet |
| `error.outlet.not-active` | Outlet is not active |
| `error.password.invalid` | Current password is incorrect |
| `error.password.mismatch` | New password and confirm password do not match |
| `error.validation` | Validation error (e.g., required field missing, invalid format) |

### HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request (validation errors) |
| 404 | Not Found (resource not found) |
| 500 | Internal Server Error |

---

## Configuration Storage

Settings are stored in the `configurations` table with the following categories:

| Setting | Category | Default Value |
|---------|----------|---------------|
| `display_category_cards` | LAYOUT | "true" |
| `enable_sounds` | GENERAL | "true" |
| `page_width` | PRINTER | "80" |
| `page_height` | PRINTER | "297" |
| `page_margin` | PRINTER | "10" |

---

## Usage Example

### Complete Settings Update Flow

1. **Get current settings:**
```bash
GET /api/pos/settings/outlet
```

2. **Update specific settings:**
```bash
PUT /api/pos/settings/outlet
Content-Type: application/json

{
  "displayCategoryCards": false,
  "pageWidthMm": 150
}
```

3. **Reset if needed:**
```bash
POST /api/pos/settings/outlet/reset
```

### Account Management Flow

1. **Get account info:**
```bash
GET /api/pos/settings/account/1
```

2. **Update name:**
```bash
PUT /api/pos/settings/account/1
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe"
}
```

3. **Change password:**
```bash
PUT /api/pos/settings/account/1/password
Content-Type: application/json

{
  "currentPassword": "oldPassword",
  "newPassword": "newPassword",
  "confirmPassword": "newPassword"
}
```

---

## Security Considerations

- **Authentication**: All endpoints should be protected with proper authentication
- **Authorization**: Cashiers should only be able to access their own account settings
- **Password Storage**: Passwords should be hashed before storage (not implemented in current version)
- **HTTPS**: All API calls should be made over HTTPS in production
- **Rate Limiting**: Consider implementing rate limiting for password change attempts

---

## Future Enhancements

Potential improvements for future versions:

1. **Password Hashing**: Implement bcrypt or similar for secure password storage
2. **Session Management**: Track which outlet a cashier is currently using
3. **Audit Logging**: Log all settings changes for security and troubleshooting
4. **Multi-tenancy**: Support for multiple tenants with isolated settings
5. **Role-based Access**: Different permission levels for different user roles
6. **Additional Settings**: More customization options (theme, language, etc.)
