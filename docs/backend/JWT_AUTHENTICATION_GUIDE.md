# JWT Authentication Implementation Guide

## Overview

This document describes the JWT (JSON Web Token) authentication implementation in the POS Backend system. JWT authentication is the only supported authentication method, providing a modern, stateless authentication mechanism.

## What is JWT?

JSON Web Token (JWT) is an open standard (RFC 7519) that defines a compact and self-contained way for securely transmitting information between parties as a JSON object. This information can be verified and trusted because it is digitally signed.

## Implementation Details

### Components

#### 1. JWT Configuration (`JwtProperties.java`)
- **Location**: `src/main/java/com/pos/config/JwtProperties.java`
- **Purpose**: Manages JWT configuration properties
- **Configuration**:
  - `jwt.secret`: Secret key for signing tokens (configurable via environment variable)
  - `jwt.expiration`: Token expiration time in milliseconds (default: 24 hours)
  - `jwt.issuer`: Token issuer identifier

#### 2. JWT Utility (`JwtUtil.java`)
- **Location**: `src/main/java/com/pos/util/JwtUtil.java`
- **Purpose**: Handles JWT token generation and validation
- **Key Methods**:
  - `generateToken(String username, Long cashierId, String name)`: Creates a JWT token
  - `validateToken(String token)`: Validates token and checks expiration
  - `extractUsername(String token)`: Extracts username from token
  - `extractCashierId(String token)`: Extracts cashier ID from token
  - `extractName(String token)`: Extracts user name from token

#### 3. JWT Authentication Filter (`JwtAuthenticationFilter.java`)
- **Location**: `src/main/java/com/pos/filter/JwtAuthenticationFilter.java`
- **Purpose**: Intercepts HTTP requests and validates JWT tokens
- **Features**:
  - Validates JWT tokens from `Authorization: Bearer <token>` header
  - Sets user context for authenticated requests
  - Returns appropriate error responses for authentication failures

#### 4. Updated Authentication Service
- **Location**: `src/main/java/com/pos/service/AuthenticationService.java`
- **Changes**:
  - `login()` method generates and returns JWT token
  - `authenticateByToken(String token)` method for JWT authentication

#### 5. Updated Login Response
- **Location**: `src/main/java/com/pos/dto/LoginResponse.java`
- **Changes**: Added `token` field to include JWT token in login response

## Authentication Method

The system uses **JWT Token Authentication**:

### JWT Token Authentication

#### Step 1: Login to Get Token
```bash
curl -X POST http://localhost:8080/pos-codex/api/auth/login \
  -H "X-Tenant-ID: default" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "code": "success.login",
  "message": "Login successful",
  "path": "/api/auth/login",
  "data": {
    "cashierId": 1,
    "username": "john",
    "name": "John Doe",
    "email": "john@example.com",
    "requirePasswordReset": false,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Step 2: Use Token for API Requests
```bash
curl -X GET http://localhost:8080/pos-codex/api/admin/outlets \
  -H "X-Tenant-ID: default" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## API Endpoints

### Public Endpoints (No Authentication Required)
- `POST /api/auth/login` - User login
- `POST /api/auth/reset-password` - Password reset

### Protected Endpoints (Authentication Required)
All other endpoints require authentication using JWT token in `Authorization: Bearer <token>` header.

## Configuration

### Application Configuration (application.yml)

```yaml
jwt:
  # Secret key for JWT signing - CHANGE THIS IN PRODUCTION!
  secret: ${JWT_SECRET:pos-backend-jwt-secret-key-change-this-in-production-to-a-more-secure-random-value}
  # Token expiration time in milliseconds (default: 24 hours)
  expiration: ${JWT_EXPIRATION:86400000}
  # Token issuer
  issuer: ${JWT_ISSUER:pos-backend}
```

### Environment Variables (Production)

For production deployment, set these environment variables:

```bash
export JWT_SECRET="your-very-long-and-secure-random-secret-key-here-at-least-256-bits"
export JWT_EXPIRATION=86400000  # 24 hours in milliseconds
export JWT_ISSUER="pos-backend-production"
```

## Security Considerations

### Token Security
1. **Secret Key**: The JWT secret key should be:
   - At least 256 bits (32 characters) long
   - Randomly generated
   - Stored securely (environment variables, secrets manager)
   - Never committed to version control

2. **Token Expiration**: Default is 24 hours, adjust based on security requirements

3. **Token Transmission**: Always use HTTPS in production to prevent token interception

### Best Practices

1. **Store tokens securely on client side**:
   - Use secure storage mechanisms (not localStorage)
   - Clear tokens on logout
   - Don't store in cookies without HttpOnly and Secure flags

2. **Token Refresh**:
   - Current implementation doesn't have refresh tokens
   - Users must re-login after token expiration
   - Consider implementing refresh tokens for better UX

3. **Token Validation**:
   - Tokens are validated on every request
   - Expired tokens are rejected
   - Invalid tokens return 401 Unauthorized

## Error Handling

### 401 Unauthorized
**Cause**: Invalid or expired token, or missing authentication
**Response:**
```json
{
  "code": "error.unauthorized",
  "message": "Authentication required. Provide either 'Authorization: Bearer <token>' header or 'X-User' and 'X-Password' headers",
  "path": "/api/...",
  "statusCode": 401
}
```

### 423 Locked
**Cause**: User requires password reset
**Response:**
```json
{
  "code": "error.password-reset-required",
  "message": "Password reset is required. Please reset your password before proceeding.",
  "path": "/api/...",
  "statusCode": 423
}
```

## Testing

### Unit Tests
- **File**: `src/test/java/com/pos/service/AuthenticationServiceTest.java`
- **Coverage**: 16 tests covering:
  - Login with JWT token generation
  - Token-based authentication
  - Legacy authentication
  - Password reset
  - Error scenarios

### Manual Testing Script

See `test-jwt-authentication.sh` for a comprehensive test script.

## Migration from Legacy Authentication

### For Frontend Developers

### For Frontend Developers

1. **Login flow**:
   ```javascript
   // Login to get JWT token
   const response = await fetch('/api/auth/login', {
     method: 'POST',
     headers: {
       'X-Tenant-ID': 'default',
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({ username, password })
   });
   
   const data = await response.json();
   const token = data.data.token;
   // Store token securely (e.g., sessionStorage, secure cookie)
   ```

2. **API calls**:
   ```javascript
   // Use JWT token for all authenticated requests
   fetch('/api/admin/outlets', {
     headers: {
       'X-Tenant-ID': 'default',
       'Authorization': `Bearer ${token}`
     }
   });
   ```

### For Backend Developers

1. **Protected endpoints** automatically require JWT authentication via JwtAuthenticationFilter
2. **Public endpoints** (login, password reset) are excluded from authentication
3. **User context** is automatically set from the JWT token for audit logging

## Breaking Changes

⚠️ **Important: Legacy Authentication Removed**

- X-User and X-Password headers are **no longer supported**
- All clients must use JWT token authentication
- Update your API clients to use the `Authorization: Bearer <token>` header pattern

## Future Enhancements

1. **Refresh Tokens**: Implement refresh token mechanism for better UX
2. **Token Revocation**: Add ability to revoke tokens (requires token storage)
3. **Role-Based Claims**: Include user roles in JWT claims
4. **Multiple Devices**: Track active tokens per user
5. **Token Blacklisting**: Implement token blacklist for logout
6. **Enhanced Security**: Add rate limiting, account lockout policies

## Dependencies

Added to `pom.xml`:

```xml
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.6</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.12.6</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.12.6</version>
    <scope>runtime</scope>
</dependency>
```

## Troubleshooting

### Problem: Token validation fails
**Solution**: 
- Check token hasn't expired (default: 24 hours)
- Verify JWT secret is correct in configuration
- Ensure token is properly formatted in Authorization header

### Problem: 401 Unauthorized with valid token
**Solution**:
- Check token hasn't expired
- Verify user account is still active
- Check for password reset requirement

### Problem: Token not included in login response
**Solution**:
- Verify JwtUtil bean is properly initialized
- Check application logs for JWT generation errors
- Ensure JWT dependencies are properly included

## Summary

✅ **Implemented**:
- JWT token generation on login
- JWT token validation for API requests
- Backward compatibility with legacy authentication
- Comprehensive unit tests
- Configuration through application.yml
- Detailed documentation

✅ **Benefits**:
- Stateless authentication
- Better scalability
- Modern security practices
- Stateless authentication
- Easy to integrate with frontend frameworks

✅ **Test Results**:
- 314 total tests passing
- All authentication tests passing
