# JWT Authentication Quick Start Guide

## 🚀 Getting Started with JWT Authentication

This guide will help you quickly start using JWT authentication in the POS Backend system.

## Quick Overview

The POS Backend now supports **two authentication methods**:
1. **JWT Token Authentication** (Recommended) - Modern, stateless authentication
2. **Legacy Header Authentication** - Backward compatible with existing systems

## 1. Login and Get Your JWT Token

### Request
```bash
curl -X POST http://localhost:8080/pos-codex/api/auth/login \
  -H "X-Tenant-ID: default" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your-username",
    "password": "your-password"
  }'
```

### Response
```json
{
  "code": "success.login",
  "message": "Login successful",
  "data": {
    "cashierId": 1,
    "username": "john",
    "name": "John Doe",
    "email": "john@example.com",
    "requirePasswordReset": false,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjYXNoaWVySWQiOjEsIm5hbWUiOiJKb2huIERvZSIsInN1YiI6ImpvaG4iLCJpc3MiOiJwb3MtYmFja2VuZCIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDg2NDAwfQ.xxxxx"
  }
}
```

**Important**: Save the `token` value - you'll need it for all subsequent API calls!

## 2. Use Your Token to Access APIs

### With JWT Token (Recommended)
```bash
curl -X GET http://localhost:8080/pos-codex/api/admin/outlets \
  -H "X-Tenant-ID: default" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Replace `YOUR_TOKEN_HERE` with the actual token from the login response.

### With Legacy Headers (Still Supported)
```bash
curl -X GET http://localhost:8080/pos-codex/api/admin/outlets \
  -H "X-Tenant-ID: default" \
  -H "X-User: your-username" \
  -H "X-Password: your-password"
```

## 3. Frontend Integration Examples

### JavaScript/React
```javascript
// Login and get token
async function login(username, password) {
  const response = await fetch('http://localhost:8080/pos-codex/api/auth/login', {
    method: 'POST',
    headers: {
      'X-Tenant-ID': 'default',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  const token = data.data.token;
  
  // Store token securely (e.g., in memory, secure storage, NOT localStorage)
  return token;
}

// Use token for API calls
async function getOutlets(token) {
  const response = await fetch('http://localhost:8080/pos-codex/api/admin/outlets', {
    headers: {
      'X-Tenant-ID': 'default',
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
}
```

### Python
```python
import requests

# Login and get token
def login(username, password):
    response = requests.post(
        'http://localhost:8080/pos-codex/api/auth/login',
        headers={
            'X-Tenant-ID': 'default',
            'Content-Type': 'application/json'
        },
        json={
            'username': username,
            'password': password
        }
    )
    
    data = response.json()
    return data['data']['token']

# Use token for API calls
def get_outlets(token):
    response = requests.get(
        'http://localhost:8080/pos-codex/api/admin/outlets',
        headers={
            'X-Tenant-ID': 'default',
            'Authorization': f'Bearer {token}'
        }
    )
    
    return response.json()
```

### Java
```java
// Login and get token
public String login(String username, String password) throws IOException {
    HttpClient client = HttpClient.newHttpClient();
    
    String requestBody = String.format(
        "{\"username\":\"%s\",\"password\":\"%s\"}", 
        username, password
    );
    
    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create("http://localhost:8080/pos-codex/api/auth/login"))
        .header("X-Tenant-ID", "default")
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(requestBody))
        .build();
    
    HttpResponse<String> response = client.send(request, 
        HttpResponse.BodyHandlers.ofString());
    
    // Parse JSON and extract token
    // ... (use Jackson, Gson, or other JSON library)
    return token;
}

// Use token for API calls
public String getOutlets(String token) throws IOException {
    HttpClient client = HttpClient.newHttpClient();
    
    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create("http://localhost:8080/pos-codex/api/admin/outlets"))
        .header("X-Tenant-ID", "default")
        .header("Authorization", "Bearer " + token)
        .GET()
        .build();
    
    HttpResponse<String> response = client.send(request, 
        HttpResponse.BodyHandlers.ofString());
    
    return response.body();
}
```

## 4. Important Notes

### Token Expiration
- **Default**: Tokens expire after 24 hours
- After expiration, you'll receive a 401 error
- **Solution**: Re-login to get a new token

### Security Best Practices
1. **Never** store tokens in localStorage or cookies without proper security flags
2. **Always** use HTTPS in production
3. **Never** commit JWT secret to version control
4. **Clear** tokens on logout
5. **Validate** tokens on the server side (handled automatically)

### Error Handling

#### 401 Unauthorized
**Meaning**: Token is invalid, expired, or missing
**Action**: Re-login to get a new token

```json
{
  "code": "error.unauthorized",
  "message": "Authentication required...",
  "statusCode": 401
}
```

#### 423 Locked
**Meaning**: Password reset required
**Action**: Call `/api/auth/reset-password` endpoint

```json
{
  "code": "error.password-reset-required",
  "message": "Password reset is required...",
  "statusCode": 423
}
```

## 5. Testing

### Run Automated Tests
```bash
# Make script executable (first time only)
chmod +x test-jwt-authentication.sh

# Run tests
./test-jwt-authentication.sh
```

### Manual Testing
1. Start the POS Backend server
2. Use the curl commands shown above
3. Verify you receive a token in the login response
4. Use the token to access protected endpoints

## 6. Configuration

### Environment Variables (Production)
```bash
# Set these in your production environment
export JWT_SECRET="your-very-long-and-secure-random-secret-key"
export JWT_EXPIRATION=86400000  # 24 hours
export JWT_ISSUER="pos-backend-production"
```

### Application Configuration (application.yml)
```yaml
jwt:
  secret: ${JWT_SECRET:default-dev-secret}
  expiration: ${JWT_EXPIRATION:86400000}
  issuer: ${JWT_ISSUER:pos-backend}
```

## 7. Migration from Legacy Auth

### Gradual Migration
1. **Phase 1**: Both methods work (current state)
2. **Phase 2**: Update frontend to use JWT
3. **Phase 3**: Monitor usage
4. **Phase 4**: Optional - disable legacy auth

### No Breaking Changes
- Existing clients continue to work
- No forced migration timeline
- Choose when to migrate

## 8. Common Issues

### Issue: Token not in response
**Solution**: Check server logs, verify JwtUtil bean initialization

### Issue: 401 with valid token
**Solutions**:
- Check token hasn't expired
- Verify correct format: `Authorization: Bearer <token>`
- Ensure no extra spaces in header

### Issue: Cannot access any endpoints
**Solutions**:
- Verify server is running
- Check tenant ID is correct
- Confirm network connectivity

## 9. Next Steps

1. **Read Full Documentation**: [JWT_AUTHENTICATION_GUIDE.md](JWT_AUTHENTICATION_GUIDE.md)
2. **Review Security**: Check production security settings
3. **Update Frontend**: Integrate JWT in your frontend application
4. **Monitor**: Track token usage and errors
5. **Optimize**: Adjust token expiration based on needs

## 10. Support

For detailed documentation, see:
- **Full Guide**: [JWT_AUTHENTICATION_GUIDE.md](JWT_AUTHENTICATION_GUIDE.md)
- **API Documentation**: [AUTHENTICATION_API_DOCUMENTATION.md](AUTHENTICATION_API_DOCUMENTATION.md)
- **Test Script**: `test-jwt-authentication.sh`

---

**Quick Reference**:
- Login: `POST /api/auth/login` → Get token
- Use: `Authorization: Bearer <token>` header
- Expires: 24 hours (default)
- Both JWT and legacy auth work simultaneously
