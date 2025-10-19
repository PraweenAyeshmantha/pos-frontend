# Authentication Quick Start Guide

## 🚀 Quick Overview

All POS Backend APIs now require JWT authentication! Here's what you need to know:

## 📋 Required Headers

### For All API Calls (Except Login/Reset Password)
```http
X-Tenant-ID: your-tenant-id
Authorization: Bearer <your-jwt-token>
```

## 🔐 Authentication Endpoints

### 1. Login
```bash
POST /api/auth/login

Headers:
  X-Tenant-ID: default
  Content-Type: application/json

Body:
{
  "username": "john",
  "password": "password123"
}

Response (200 OK):
{
  "code": "success.login",
  "data": {
    "cashierId": 1,
    "username": "john",
    "requirePasswordReset": false,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  // ⭐ Save this token!
  }
}
```

### 2. Reset Password (First Time Login)
```bash
POST /api/auth/reset-password

Headers:
  X-Tenant-ID: default
  Content-Type: application/json

Body:
{
  "username": "admin",
  "currentPassword": "admin123",
  "newPassword": "newSecurePass123",
  "confirmPassword": "newSecurePass123"
}

Response (200 OK):
{
  "code": "success.password-reset",
  "data": {
    "requirePasswordReset": false,
    "message": "Password reset successful. Please login with your new password.",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  // ⭐ New token!
  }
}
```

## 🎯 First-Time Login Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Initial Login                                       │
├─────────────────────────────────────────────────────────────┤
│ POST /api/auth/login                                        │
│ { "username": "admin", "password": "admin123" }             │
│                                                             │
│ Response: {                                                 │
│   "requirePasswordReset": true,                            │
│   "token": "eyJ..."  ⚠️ Save this token                     │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Reset Password                                      │
├─────────────────────────────────────────────────────────────┤
│ POST /api/auth/reset-password                               │
│ {                                                           │
│   "username": "admin",                                      │
│   "currentPassword": "admin123",                            │
│   "newPassword": "newSecurePass123",                        │
│   "confirmPassword": "newSecurePass123"                     │
│ }                                                           │
│                                                             │
│ Response: {                                                 │
│   "requirePasswordReset": false,                           │
│   "token": "eyJ..."  ⭐ New token - use this               │
│ } ✅                                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Access Protected APIs                               │
├─────────────────────────────────────────────────────────────┤
│ GET /api/admin/outlets                                      │
│ Headers:                                                    │
│   X-Tenant-ID: default                                      │
│   Authorization: Bearer eyJ...                              │
│                                                             │
│ Response: { "data": [...outlets...] } ✅                    │
└─────────────────────────────────────────────────────────────┘
```

## 🔓 Regular Login Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Login                                               │
├─────────────────────────────────────────────────────────────┤
│ POST /api/auth/login                                        │
│ { "username": "john", "password": "password123" }           │
│                                                             │
│ Response: {                                                 │
│   "requirePasswordReset": false,                           │
│   "token": "eyJ..."  ⭐ Save this token                     │
│ } ✅                                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Access Protected APIs                               │
├─────────────────────────────────────────────────────────────┤
│ Any API endpoint with headers:                              │
│   X-Tenant-ID: default                                      │
│   Authorization: Bearer eyJ...                              │
│                                                             │
│ ✅ Authenticated and authorized                             │
└─────────────────────────────────────────────────────────────┘
```

## ⚠️ Error Responses

### Missing Authentication Token (401)
```json
{
  "code": "error.unauthorized",
  "message": "Authentication required. Provide 'Authorization: Bearer <token>' header",
  "path": "/api/admin/outlets"
}
```

### Invalid or Expired Token (401)
```json
{
  "code": "error.unauthorized",
  "message": "Invalid or expired token",
  "path": "/api/admin/outlets"
}
```

### Password Reset Required (423)
```json
{
  "code": "error.password-reset-required",
  "message": "Password reset is required. Please reset your password before proceeding.",
  "path": "/api/admin/outlets"
}
```

### Inactive Account (400)
```json
{
  "code": "error.bad-request",
  "message": "Account is inactive",
  "path": "/api/auth/login"
}
```

## 📝 Example API Calls

### Get Outlets (Protected)
```bash
curl -X GET http://localhost:8080/pos-codex/api/admin/outlets \
  -H "X-Tenant-ID: default" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Create Product (Protected)
```bash
curl -X POST http://localhost:8080/pos-codex/api/admin/products \
  -H "X-Tenant-ID: default" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"name": "Product Name", "price": 19.99}'
```

## 🧪 Testing

Run the provided test script:
```bash
./test-authentication-api.sh
```

## 🔮 Coming Soon: OTP Authentication

The system is ready for SMS OTP! Fields are in place:
- `otpPhoneNumber`: Store phone number for OTP
- `otpEnabled`: Enable/disable OTP per user

To enable OTP in the future:
1. Implement OTP generation service
2. Update login flow to send OTP
3. Add OTP verification endpoint
4. Set `otpEnabled = true` for users

## 📚 More Information

- **Complete API Documentation**: See `AUTHENTICATION_API_DOCUMENTATION.md`
- **Implementation Details**: See `AUTHENTICATION_IMPLEMENTATION_SUMMARY.md`
- **Test Script**: Run `./test-authentication-api.sh`

## 💡 Tips

1. **Store JWT tokens securely** in your client application (use secure storage, not localStorage for sensitive apps)
2. **Handle 423 response** by redirecting to password reset
3. **Handle 401 response** by redirecting to login (token expired or invalid)
4. **Include Authorization header** in every API call with your JWT token
5. **Reset password** immediately on first login
6. **Token expiration**: Tokens expire after 24 hours by default - re-login to get a new token

## ❓ Common Issues

**Q: My API call returns 401 Unauthorized**
- A: Make sure you include `Authorization: Bearer <token>` header with a valid, non-expired token

**Q: I get 423 Locked response**
- A: Your user requires password reset. Call `/api/auth/reset-password`

**Q: Token expired - what should I do?**
- A: Login again to get a new token. Tokens expire after 24 hours by default.

**Q: Password reset fails**
- A: Check that new password is different from current password and confirmPassword matches

**Q: Can I bypass authentication for testing?**
- A: No, all APIs except `/api/auth/login` and `/api/auth/reset-password` require JWT authentication
