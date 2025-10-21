# JWT-Only Authentication Migration

## ⚠️ IMPORTANT: Breaking Changes

As of this update, the POS Backend system **only supports JWT token authentication**. Legacy header-based authentication (X-User and X-Password headers) has been **removed**.

## What Changed

### Removed
- ❌ X-User header authentication
- ❌ X-Password header authentication
- ❌ Legacy AuthenticationFilter
- ❌ Backward compatibility with header-based auth

### Current Authentication Method
- ✅ JWT token authentication via `Authorization: Bearer <token>` header
- ✅ Stateless authentication
- ✅ Secure token-based sessions

## Migration Guide

### For API Clients

**Before (No longer works):**
```bash
# This will now return 401 Unauthorized
curl -X GET http://localhost:8080/posai/api/admin/outlets \
  -H "X-Tenant-ID: default" \
  -H "X-User: john" \
  -H "X-Password: password123"
```

**After (Required):**
```bash
# Step 1: Login to get JWT token
curl -X POST http://localhost:8080/posai/api/auth/login \
  -H "X-Tenant-ID: default" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john",
    "password": "password123"
  }'

# Response will contain token:
# {"data": {"token": "eyJhbGci...", ...}}

# Step 2: Use token for API requests
curl -X GET http://localhost:8080/posai/api/admin/outlets \
  -H "X-Tenant-ID: default" \
  -H "Authorization: Bearer eyJhbGci..."
```

### For Frontend Applications

```javascript
// Step 1: Login and store token
async function login(username, password) {
  const response = await fetch('/posai/api/auth/login', {
    method: 'POST',
    headers: {
      'X-Tenant-ID': 'default',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  const token = data.data.token;
  
  // Store token securely (e.g., sessionStorage)
  sessionStorage.setItem('authToken', token);
  
  return token;
}

// Step 2: Use token for all API calls
async function fetchData(endpoint) {
  const token = sessionStorage.getItem('authToken');
  
  const response = await fetch(`/posai${endpoint}`, {
    headers: {
      'X-Tenant-ID': 'default',
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.json();
}
```

## What You Need to Do

1. **Update all API clients** to use JWT token authentication
2. **Implement token storage** in your frontend application
3. **Add token refresh logic** if needed (tokens expire after 24 hours by default)
4. **Remove X-User and X-Password headers** from your API calls
5. **Test your integration** with the updated authentication

## Benefits of JWT-Only Authentication

- ✅ **Better Security**: Credentials not sent with every request
- ✅ **Stateless**: No server-side session storage required
- ✅ **Scalability**: Easy to scale horizontally
- ✅ **Standards-based**: Industry standard JWT tokens
- ✅ **Flexible**: Can include custom claims and permissions

## Token Details

- **Expiration**: 24 hours (configurable via `jwt.expiration`)
- **Claims**: username, cashierId, name, issuer, issuedAt, expiration
- **Algorithm**: HMAC SHA-256
- **Header**: `Authorization: Bearer <token>`

## Error Responses

### 401 Unauthorized - Missing Token
```json
{
  "code": "error.unauthorized",
  "message": "Authentication required. Provide 'Authorization: Bearer <token>' header",
  "path": "/api/...",
  "statusCode": 401
}
```

### 401 Unauthorized - Invalid Token
```json
{
  "code": "error.unauthorized",
  "message": "Invalid or expired token",
  "path": "/api/...",
  "statusCode": 401
}
```

### 423 Locked - Password Reset Required
```json
{
  "code": "error.password-reset-required",
  "message": "Password reset is required. Please reset your password before proceeding.",
  "path": "/api/...",
  "statusCode": 423
}
```

## Testing

Use the updated test script to verify JWT authentication:
```bash
./test-jwt-authentication.sh
```

## Documentation

For complete JWT authentication documentation, see:
- [JWT_AUTHENTICATION_GUIDE.md](JWT_AUTHENTICATION_GUIDE.md) - Complete implementation guide
- [JWT_QUICK_START.md](JWT_QUICK_START.md) - Quick start guide
- [JWT_IMPLEMENTATION_SUMMARY.md](JWT_IMPLEMENTATION_SUMMARY.md) - Technical summary

## Support

If you encounter issues during migration:
1. Verify your JWT token is included in the `Authorization` header
2. Check that the token hasn't expired
3. Ensure you're using the correct `Bearer` prefix
4. Review the error response for specific details

## Backward Compatibility Note

⚠️ **There is NO backward compatibility** with the old header-based authentication. All clients must be updated to use JWT tokens.
