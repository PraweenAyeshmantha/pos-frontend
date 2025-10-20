# Admin Login Guide

This guide explains how to login as the default administrator and access the POS Backend system.

## 🔑 Default Admin Credentials

When you first start the POS Backend application, a default administrator account is automatically created with the following credentials:

- **Username:** `admin`
- **Password:** `admin123`
- **Email:** admin@pos.com
- **Password Reset Required:** Yes (on first login)

## 📋 Step-by-Step Login Process

### Step 1: First-Time Login

When logging in for the first time, you must use the default credentials:

**Request:**
```bash
curl -X POST http://localhost:8080/posai/api/auth/login \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Response:**
```json
{
  "status": "SUCCESS",
  "code": "success.login.password-reset-required",
  "message": "Login successful, but you need to reset your password before proceeding.",
  "data": {
    "userId": 1,
    "username": "admin",
    "name": "System Administrator",
    "email": "admin@pos.com",
    "requirePasswordReset": true,
    "token": "eyJhbGciOiJIUzUxMiJ9...",
    "userCategories": [
      {
        "id": 1,
        "categoryCode": "ADMIN",
        "categoryName": "Administrator",
        "description": "Full system access with administrative privileges"
      }
    ],
    "userAccess": [
      {
        "screenCode": "ALL",
        "screenName": "All Screens",
        "canView": true,
        "canCreate": true,
        "canEdit": true,
        "canDelete": true
      }
    ]
  }
}
```

⚠️ **Important:** Notice that `requirePasswordReset: true` indicates you must reset your password before using the system.

### Step 2: Reset Password

After the initial login, you must reset your password:

**Request:**
```bash
curl -X POST http://localhost:8080/posai/api/auth/reset-password \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "currentPassword": "admin123",
    "newPassword": "YourNewSecurePassword123!",
    "confirmPassword": "YourNewSecurePassword123!"
  }'
```

**Response:**
```json
{
  "status": "SUCCESS",
  "code": "success.password-reset",
  "message": "Your password has been updated successfully.",
  "data": {
    "userId": 1,
    "username": "admin",
    "name": "System Administrator",
    "email": "admin@pos.com",
    "requirePasswordReset": false,
    "message": "Password reset successful. Please login with your new password."
  }
}
```

### Step 3: Login with New Password

After resetting your password, login again with your new credentials:

**Request:**
```bash
curl -X POST http://localhost:8080/posai/api/auth/login \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "YourNewSecurePassword123!"
  }'
```

**Response:**
```json
{
  "status": "SUCCESS",
  "code": "success.login",
  "message": "Login successful",
  "data": {
    "userId": 1,
    "username": "admin",
    "name": "System Administrator",
    "email": "admin@pos.com",
    "requirePasswordReset": false,
    "token": "eyJhbGciOiJIUzUxMiJ9.eyJ1c2VyQWNjZXNzIjpbeyJjYW5WaWV3Ijp0cnVlLCJjYW5FZGl0Ijp0cnVlLCJjYW5EZWxldGUiOnRydWUsInNjcmVlbk5hbWUiOiJBbGwgU2NyZWVucyIsImNhbkNyZWF0ZSI6dHJ1ZSwic2NyZWVuQ29kZSI6IkFMTCJ9XSwibmFtZSI6IlN5c3RlbSBBZG1pbmlzdHJhdG9yIiwidXNlcklkIjoxLCJzdWIiOiJhZG1pbiIsImlzcyI6InBvcy1iYWNrZW5kIiwiaWF0IjoxNzYwODc4MTU0LCJleHAiOjE3NjA5NjQ1NTR9...",
    "userCategories": [
      {
        "id": 1,
        "categoryCode": "ADMIN",
        "categoryName": "Administrator",
        "description": "Full system access with administrative privileges"
      }
    ],
    "userAccess": [
      {
        "screenCode": "ALL",
        "screenName": "All Screens",
        "canView": true,
        "canCreate": true,
        "canEdit": true,
        "canDelete": true
      }
    ]
  }
}
```

✅ **Success!** Now `requirePasswordReset: false` and you have a valid JWT token to access protected endpoints.

### Step 4: Access Protected Endpoints

Use the JWT token from the login response to access protected endpoints:

**Request:**
```bash
curl -X GET http://localhost:8080/posai/api/admin/outlets \
  -H "X-Tenant-ID: PaPos" \
  -H "Authorization: Bearer eyJhbGciOiJIUzUxMiJ9..."
```

## 🎯 Quick Start Script

Here's a complete bash script to login as admin for the first time:

```bash
#!/bin/bash

# Configuration
BASE_URL="http://localhost:8080/posai"
TENANT_ID="PaPos"

# Default credentials
DEFAULT_USERNAME="admin"
DEFAULT_PASSWORD="admin123"

# Your new password
NEW_PASSWORD="YourNewSecurePassword123!"

echo "Step 1: Initial login with default credentials..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$DEFAULT_USERNAME\",\"password\":\"$DEFAULT_PASSWORD\"}")

echo "$RESPONSE" | jq .

REQUIRE_RESET=$(echo "$RESPONSE" | jq -r '.data.requirePasswordReset')

if [ "$REQUIRE_RESET" = "true" ]; then
  echo ""
  echo "Step 2: Resetting password..."
  curl -s -X POST "$BASE_URL/api/auth/reset-password" \
    -H "X-Tenant-ID: $TENANT_ID" \
    -H "Content-Type: application/json" \
    -d "{
      \"username\":\"$DEFAULT_USERNAME\",
      \"currentPassword\":\"$DEFAULT_PASSWORD\",
      \"newPassword\":\"$NEW_PASSWORD\",
      \"confirmPassword\":\"$NEW_PASSWORD\"
    }" | jq .
  
  echo ""
  echo "Step 3: Login with new password..."
fi

echo ""
echo "Final login..."
FINAL_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$DEFAULT_USERNAME\",\"password\":\"$NEW_PASSWORD\"}")

echo "$FINAL_RESPONSE" | jq .

TOKEN=$(echo "$FINAL_RESPONSE" | jq -r '.data.token')

echo ""
echo "✅ Login successful!"
echo "Your JWT Token: $TOKEN"
echo ""
echo "You can now use this token to access protected endpoints:"
echo "curl -H 'X-Tenant-ID: $TENANT_ID' -H 'Authorization: Bearer $TOKEN' $BASE_URL/api/admin/outlets"
```

Save this script as `admin-login.sh`, make it executable with `chmod +x admin-login.sh`, and run it with `./admin-login.sh`.

## 🔐 Admin User Permissions

The default admin user has the following permissions:

- **User Category:** Administrator (ADMIN)
- **Screen Access:** ALL (Full access to all screens)
- **Permissions:**
  - ✅ View (canView: true)
  - ✅ Create (canCreate: true)
  - ✅ Edit (canEdit: true)
  - ✅ Delete (canDelete: true)

This means the admin user has full access to all features and operations in the POS system.

## 🛡️ Security Best Practices

1. **Change the Default Password Immediately**
   - The default password `admin123` should be changed immediately after first login
   - Use a strong password with at least:
     - 8 characters
     - Uppercase and lowercase letters
     - Numbers
     - Special characters

2. **Store JWT Tokens Securely**
   - Store tokens in secure storage (not localStorage for production)
   - Never expose tokens in logs or client-side code
   - Tokens expire after 24 hours by default

3. **Use HTTPS in Production**
   - Always use HTTPS in production environments
   - Never send credentials over unencrypted connections

4. **Rotate Passwords Regularly**
   - Change admin password periodically
   - Use different passwords for different environments

5. **Protect JWT Secret**
   - Change the default JWT secret in production
   - Use environment variables for configuration
   - Never commit secrets to version control

## 🔍 Troubleshooting

### Issue: "Invalid username or password"

**Cause:** You might be using the wrong credentials or the database hasn't been initialized.

**Solution:**
1. Verify the database is running: `mysql -uroot -proot PaPos_posdb -e "SELECT username FROM users WHERE username = 'admin';"`
2. Make sure you're using the correct tenant ID: `PaPos`
3. Try the default credentials: username `admin`, password `admin123`

### Issue: "Authentication required" when calling login endpoint

**Cause:** The login endpoint is being blocked by the JWT filter.

**Solution:** This issue has been fixed in the latest version. The login and reset-password endpoints are now public and don't require authentication.

### Issue: Password reset required but I can't reset

**Cause:** The reset-password endpoint requires the correct current password.

**Solution:**
1. Use the default password `admin123` as the current password
2. Make sure newPassword and confirmPassword match
3. Ensure the new password is different from the current password

### Issue: Token expired

**Cause:** JWT tokens expire after 24 hours by default.

**Solution:** Login again to get a new token.

## 📚 Related Documentation

- [JWT Authentication Guide](JWT_AUTHENTICATION_GUIDE.md) - Complete JWT authentication documentation
- [Authentication Quick Start](AUTHENTICATION_QUICK_START.md) - Quick start guide for authentication
- [API Documentation](API_DOCUMENTATION.md) - Complete API reference
- [User Management](USER_MANAGEMENT.md) - User and access control documentation

## 💡 Tips

- Save your JWT token in an environment variable for easy access during development:
  ```bash
  export JWT_TOKEN="eyJhbGciOiJIUzUxMiJ9..."
  curl -H "X-Tenant-ID: PaPos" -H "Authorization: Bearer $JWT_TOKEN" http://localhost:8080/posai/api/admin/outlets
  ```

- Use tools like Postman or Insomnia to save your token and test APIs easily

- The admin user can create additional users with different permission levels through the User Management APIs

## 🆘 Support

If you continue to experience issues:
1. Check the application logs for detailed error messages
2. Verify MySQL is running and accessible
3. Ensure the application started successfully (check for "Started PosBackendApplication" in logs)
4. Review the [Troubleshooting Guide](README.md#troubleshooting) in the main README

For additional help, please open an issue in the GitHub repository.
