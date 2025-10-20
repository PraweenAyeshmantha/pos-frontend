# Authentication API Documentation

## Overview
This document describes the JWT authentication mechanism for the POS Backend system. All APIs (except authentication endpoints) require JWT authentication tokens to be present.

## Required Headers for All APIs (Except Public Endpoints)

### Authentication Headers
- `X-Tenant-ID`: Your tenant identifier (required)
- `Authorization`: Bearer token for authenticated requests (required for protected endpoints)

## Public Endpoints
These endpoints do NOT require authentication headers:
- `/api/auth/login`
- `/api/auth/reset-password`

## Authentication Endpoints

### 1. Login

Authenticate a user and check if password reset is required.

**Endpoint:** `POST /api/auth/login`

**Headers:**
```
X-Tenant-ID: your-tenant-id
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "john",
  "password": "password123"
}
```

**Success Response (200 OK):**
```json
{
  "code": "success.login",
  "message": "Login successful",
  "timestamp": "2025-10-18T14:00:00Z",
  "path": "/api/auth/login",
  "data": {
    "cashierId": 1,
    "username": "john",
    "name": "John Doe",
    "email": "john@example.com",
    "requirePasswordReset": false,
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjYXNoaWVySWQiOjEsIm5hbWUiOiJKb2huIERvZSIsInN1YiI6ImpvaG4iLCJpc3MiOiJwb3MtYmFja2VuZCIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDg2NDAwfQ.xxxxx"
  }
}
```

**Success Response with Password Reset Required (200 OK):**
```json
{
  "code": "success.login.password-reset-required",
  "message": "Login successful. Password reset required.",
  "timestamp": "2025-10-18T14:00:00Z",
  "path": "/api/auth/login",
  "data": {
    "cashierId": 1,
    "username": "admin",
    "name": "Admin User",
    "email": "admin@example.com",
    "requirePasswordReset": true,
    "message": "Password reset required",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjYXNoaWVySWQiOjEsIm5hbWUiOiJBZG1pbiBVc2VyIiwic3ViIjoiYWRtaW4iLCJpc3MiOiJwb3MtYmFja2VuZCIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDg2NDAwfQ.xxxxx"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "code": "error.unauthorized",
  "message": "Invalid username or password",
  "timestamp": "2025-10-18T14:00:00Z",
  "path": "/api/auth/login",
  "data": null
}
```

**Error Response (400 Bad Request - Inactive Account):**
```json
{
  "code": "error.bad-request",
  "message": "Account is inactive",
  "timestamp": "2025-10-18T14:00:00Z",
  "path": "/api/auth/login",
  "data": null
}
```

### 2. Reset Password

Reset password for a user who is required to change their password. This is typically used for first-time login or forced password resets.

**Endpoint:** `POST /api/auth/reset-password`

**Headers:**
```
X-Tenant-ID: your-tenant-id
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "admin",
  "currentPassword": "default123",
  "newPassword": "newSecurePass123",
  "confirmPassword": "newSecurePass123"
}
```

**Success Response (200 OK):**
```json
{
  "code": "success.password-reset",
  "message": "Password reset successful. Please login with your new password.",
  "timestamp": "2025-10-18T14:00:00Z",
  "path": "/api/auth/reset-password",
  "data": {
    "cashierId": 1,
    "username": "admin",
    "name": "Admin User",
    "email": "admin@example.com",
    "requirePasswordReset": false,
    "message": "Password reset successful. Please login with your new password.",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjYXNoaWVySWQiOjEsIm5hbWUiOiJBZG1pbiBVc2VyIiwic3ViIjoiYWRtaW4iLCJpc3MiOiJwb3MtYmFja2VuZCIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDg2NDAwfQ.xxxxx"
  }
}
```

**Error Response (400 Bad Request - Wrong Current Password):**
```json
{
  "code": "error.bad-request",
  "message": "Current password is incorrect",
  "timestamp": "2025-10-18T14:00:00Z",
  "path": "/api/auth/reset-password",
  "data": null
}
```

**Error Response (400 Bad Request - Password Mismatch):**
```json
{
  "code": "error.bad-request",
  "message": "New password and confirm password do not match",
  "timestamp": "2025-10-18T14:00:00Z",
  "path": "/api/auth/reset-password",
  "data": null
}
```

**Error Response (400 Bad Request - Same Password):**
```json
{
  "code": "error.bad-request",
  "message": "New password must be different from current password",
  "timestamp": "2025-10-18T14:00:00Z",
  "path": "/api/auth/reset-password",
  "data": null
}
```

## Using JWT Authentication

Once logged in successfully, you'll receive a JWT token in the response. Include this token in all subsequent API requests using the `Authorization: Bearer <token>` header.

**Token Expiration**: Tokens expire after 24 hours by default. After expiration, you'll need to login again to get a new token.

```
X-Tenant-ID: your-tenant-id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example - Get All Outlets (Protected Endpoint):**
```bash
curl -X GET http://localhost:8080/pos-codex/api/admin/outlets \
  -H "X-Tenant-ID: your-tenant-id" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Error Responses for Protected Endpoints

### Missing Authentication Token (401 Unauthorized):
```json
{
  "code": "error.unauthorized",
  "message": "Authentication required. Provide 'Authorization: Bearer <token>' header",
  "timestamp": "2025-10-18T14:00:00Z",
  "path": "/api/admin/outlets",
  "data": null
}
```

### Invalid or Expired Token (401 Unauthorized):
```json
{
  "code": "error.unauthorized",
  "message": "Invalid or expired token",
  "timestamp": "2025-10-18T14:00:00Z",
  "path": "/api/admin/outlets",
  "data": null
}
```

### Password Reset Required (423 Locked):
```json
{
  "code": "error.password-reset-required",
  "message": "Password reset is required. Please reset your password before proceeding.",
  "timestamp": "2025-10-18T14:00:00Z",
  "path": "/api/admin/outlets",
  "data": null
}
```

## Password Requirements

- Minimum length: 4 characters
- New password must be different from current password
- Password confirmation must match new password

## First-Time Login Flow

1. **Initial Login Attempt:**
   - User logs in with default credentials
   - System returns `requirePasswordReset: true` and a JWT token
   
2. **Password Reset:**
   - User calls `/api/auth/reset-password` with current and new passwords
   - System updates password and sets `requirePasswordReset: false`, returns new JWT token
   
3. **Access Protected Endpoints:**
   - User can now access all protected endpoints using the JWT token
   - No need to login again until token expires (24 hours by default)

## OTP Support (Coming Soon)

The system has been prepared to support SMS OTP authentication in the future. The following fields are available but not yet active:
- `otpPhoneNumber`: Phone number for OTP verification
- `otpEnabled`: Flag to enable/disable OTP for the user

OTP functionality will be implemented in a future release.

## Security Notes

- JWT tokens are signed using HMAC SHA-256 algorithm with a configurable secret key
- Tokens expire after 24 hours by default (configurable via `jwt.expiration` property)
- Always use HTTPS in production to prevent token interception
- Store tokens securely on the client side (avoid localStorage for sensitive applications)
- Clear tokens on logout
- Inactive accounts cannot authenticate
- Users with `requirePasswordReset: true` must reset their password, but they can still use their JWT token for other operations
