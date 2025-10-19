# Logout API Documentation

This document describes the Logout API for the POS system, which provides a confirmation-based logout mechanism with optional browser data clearing.

## Table of Contents
- [Overview](#overview)
- [Logout API](#logout-api)
- [Request/Response Format](#requestresponse-format)
- [Error Handling](#error-handling)
- [Usage Examples](#usage-examples)

## Overview

The Logout API allows cashiers to securely log out of the POS system with an option to clear browser data. Upon selecting the logout button, a confirmation popup should prompt the cashier to authorize deleting all data from the browser.

### Key Features:
- **Confirmation-based logout**: Requires explicit confirmation before logout
- **Optional data deletion**: Cashiers can choose whether to clear browser data
- **Smart data management**: 
  - If data is deleted, the system will load the most recent information upon the next login
  - If data is retained, existing information persists in the POS for quicker loading
  - Updates can be loaded from POS settings if needed

---

## Logout API

### Endpoint: `POST /api/pos/settings/logout`

Logs out a cashier with an option to clear browser data.

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

**Response:**
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

**Response Fields:**
- `message` (String): A descriptive message about the logout action taken
- `dataClearedFromBrowser` (Boolean): Indicates whether browser data was cleared
- `cashierUsername` (String): The username of the cashier who logged out

---

## Request/Response Format

### Request with Data Clearing (clearBrowserData: true)

```json
{
  "cashierId": 1,
  "clearBrowserData": true
}
```

**Response:**
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

### Request without Data Clearing (clearBrowserData: false)

```json
{
  "cashierId": 1,
  "clearBrowserData": false
}
```

**Response:**
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

### Request with Default Behavior (no clearBrowserData specified)

```json
{
  "cashierId": 1
}
```

**Response:**
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

---

## Error Handling

### Cashier Not Found

**Request:**
```json
{
  "cashierId": 999,
  "clearBrowserData": true
}
```

**Response:**
```json
{
  "status": "error",
  "code": "error.resource.not-found",
  "message": "Cashier not found with id: 999",
  "path": "/api/pos/settings/logout",
  "timestamp": "2025-10-16T06:30:00Z"
}
```

**HTTP Status Code:** 404 NOT FOUND

### Missing Required Field

**Request:**
```json
{
  "clearBrowserData": true
}
```

**Response:**
```json
{
  "status": "error",
  "code": "error.validation",
  "message": "Cashier ID is required",
  "path": "/api/pos/settings/logout",
  "timestamp": "2025-10-16T06:30:00Z"
}
```

**HTTP Status Code:** 400 BAD REQUEST

---

## Usage Examples

### Example 1: Logout with Data Clearing

This is the recommended approach when the cashier wants to ensure fresh data on next login.

```bash
curl -X POST http://localhost:8080/pos-codex/api/pos/settings/logout \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant123" \
  -d '{
    "cashierId": 1,
    "clearBrowserData": true
  }'
```

### Example 2: Logout without Data Clearing

This approach is useful for faster subsequent logins when the cashier expects to return soon.

```bash
curl -X POST http://localhost:8080/pos-codex/api/pos/settings/logout \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant123" \
  -d '{
    "cashierId": 1,
    "clearBrowserData": false
  }'
```

### Example 3: Logout with Default Behavior

When `clearBrowserData` is not specified, it defaults to `false`.

```bash
curl -X POST http://localhost:8080/pos-codex/api/pos/settings/logout \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant123" \
  -d '{
    "cashierId": 1
  }'
```

---

## Frontend Implementation Guide

### Logout Flow

1. **User Action**: Cashier clicks the "Logout" button
2. **Confirmation Popup**: Display a confirmation dialog with two options:
   - "Clear Data and Logout" (sets `clearBrowserData: true`)
   - "Keep Data and Logout" (sets `clearBrowserData: false`)
3. **API Call**: Based on user selection, call the logout API with appropriate parameters
4. **Data Management**:
   - If `clearBrowserData: true`: Clear all cached/local storage data
   - If `clearBrowserData: false`: Retain local data for faster next login
5. **Redirect**: Navigate to login screen

### Sample Confirmation Dialog

```
┌─────────────────────────────────────────────┐
│  Logout Confirmation                        │
├─────────────────────────────────────────────┤
│                                             │
│  Do you want to clear all data from your    │
│  browser?                                   │
│                                             │
│  • Clear Data: Load fresh data on next      │
│    login (recommended for shared devices)   │
│                                             │
│  • Keep Data: Faster loading on next login  │
│    (you can update data from Settings)      │
│                                             │
├─────────────────────────────────────────────┤
│  [Clear Data & Logout]  [Keep Data & Logout]│
└─────────────────────────────────────────────┘
```

### JavaScript Example

```javascript
async function logout(cashierId, clearData) {
  try {
    const response = await fetch('/api/pos/settings/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': getCurrentTenantId()
      },
      body: JSON.stringify({
        cashierId: cashierId,
        clearBrowserData: clearData
      })
    });

    const result = await response.json();

    if (result.status === 'success') {
      // Handle data clearing based on user choice
      if (result.data.dataClearedFromBrowser) {
        // Clear local storage, session storage, and IndexedDB
        localStorage.clear();
        sessionStorage.clear();
        // Clear any other cached data
      }
      
      // Show success message
      showMessage(result.data.message);
      
      // Redirect to login page
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Logout failed:', error);
    showError('Logout failed. Please try again.');
  }
}

// Show confirmation dialog
function showLogoutConfirmation(cashierId) {
  // Display modal with two buttons:
  // 1. Clear Data & Logout -> logout(cashierId, true)
  // 2. Keep Data & Logout -> logout(cashierId, false)
}
```

---

## Security Considerations

- **Authentication**: Ensure the logout endpoint is protected and validates the cashier's session
- **Authorization**: Verify that the cashier can only logout their own session
- **Session Management**: Invalidate server-side session/token upon logout
- **Audit Logging**: Log logout events for security monitoring
- **HTTPS**: Always use HTTPS in production to protect logout requests

---

## Integration with Settings Menu

As mentioned in the logout response, users who choose to keep their data can update it from the POS settings menu:

1. Navigate to Settings > Outlet Settings
2. Use the "Reset Outlet Data" option to refresh data without logging out
3. Or use "Switch Outlet" to load data for a different outlet

See [SETTINGS_API_DOCUMENTATION.md](SETTINGS_API_DOCUMENTATION.md) for more details.

---

## HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success - Logout completed |
| 400 | Bad Request - Invalid request data |
| 404 | Not Found - Cashier not found |
| 500 | Internal Server Error |

---

## Testing

### Test Scenarios

1. ✅ Logout with `clearBrowserData: true`
2. ✅ Logout with `clearBrowserData: false`
3. ✅ Logout with `clearBrowserData` not specified (defaults to false)
4. ✅ Logout with non-existent cashier ID (should return 404)
5. ✅ Logout with missing cashier ID (should return 400)

### Sample Test Script

```bash
#!/bin/bash

BASE_URL="http://localhost:8080/pos-codex"
TENANT_ID="tenant123"

echo "Test 1: Logout with clear data"
curl -X POST "$BASE_URL/api/pos/settings/logout" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{"cashierId": 1, "clearBrowserData": true}'

echo -e "\n\nTest 2: Logout without clear data"
curl -X POST "$BASE_URL/api/pos/settings/logout" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{"cashierId": 1, "clearBrowserData": false}'

echo -e "\n\nTest 3: Logout with default behavior"
curl -X POST "$BASE_URL/api/pos/settings/logout" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{"cashierId": 1}'
```

---

## Related Documentation

- [SETTINGS_API_DOCUMENTATION.md](SETTINGS_API_DOCUMENTATION.md) - Settings Menu APIs
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - General API Documentation
- [SETTINGS_MENU_README.md](SETTINGS_MENU_README.md) - Settings Menu Overview
