# BCrypt Password Hashing - Quick Start Guide

## For Developers

### Creating a New Cashier

When creating a new cashier through the API, simply provide the password in plaintext. The system will automatically hash it with BCrypt before storing:

```json
POST /api/admin/cashiers
{
  "name": "John Doe",
  "username": "johndoe",
  "password": "mySecurePassword123",
  "email": "john@example.com",
  "isActive": true
}
```

The `CashierService.createCashier()` method automatically encodes the password using BCrypt.

### Updating a Cashier's Password

When updating a cashier's password, provide the new password in plaintext:

```json
PUT /api/admin/cashiers/1
{
  "name": "John Doe",
  "password": "newSecurePassword456",
  "email": "john@example.com"
}
```

The `CashierService.updateCashier()` method automatically encodes the new password using BCrypt.

### User Login

Users can log in with their username and password. The system will verify the password using BCrypt:

```json
POST /api/auth/login
{
  "username": "johndoe",
  "password": "mySecurePassword123"
}
```

Response:
```json
{
  "cashierId": 1,
  "username": "johndoe",
  "name": "John Doe",
  "email": "john@example.com",
  "requirePasswordReset": false,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Password Reset Flow

For existing users who need to reset their passwords (including migration from plaintext):

```json
POST /api/auth/reset-password
{
  "username": "johndoe",
  "currentPassword": "oldPassword",
  "newPassword": "newSecurePassword789",
  "confirmPassword": "newSecurePassword789"
}
```

The system will:
1. Verify the current password using BCrypt matches
2. Check that new password is different from current
3. Encode the new password with BCrypt
4. Clear the `requirePasswordReset` flag

## For System Administrators

### Migration Plan for Existing Users

When you deploy this update:

1. **Before Deployment**: Back up your database
2. **During Deployment**: The Liquibase migration will run automatically:
   - Sets `require_password_reset = 1` for all existing cashiers
   - Ensures password column can store BCrypt hashes (VARCHAR 255)
3. **After Deployment**: 
   - Existing users will see `requirePasswordReset: true` in their login response
   - They must reset their password before continuing
   - New passwords will be BCrypt hashed

### Testing the Implementation

1. Create a test cashier:
```bash
curl -X POST http://localhost:8080/api/admin/cashiers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "username": "testuser",
    "password": "TestPassword123",
    "email": "test@example.com",
    "isActive": true
  }'
```

2. Log in with the test cashier:
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "TestPassword123"
  }'
```

3. Verify password is hashed in database:
```sql
SELECT username, password FROM cashiers WHERE username = 'testuser';
```

The password should look like: `$2a$10$abcdefghijklmnopqrstuvwxyz...` (60 characters)

### Database Changes

The migration creates changeset `028-migrate-passwords-to-bcrypt` which:
- Updates all cashiers to require password reset
- Ensures password column is VARCHAR(255)

To verify:
```sql
-- Check if migration ran
SELECT * FROM DATABASECHANGELOG WHERE ID = '028-migrate-passwords-to-bcrypt';

-- Check cashiers requiring password reset
SELECT username, require_password_reset FROM cashiers;
```

### Rollback (if needed)

If you need to rollback (note: cannot restore plaintext passwords):
```bash
mvn liquibase:rollback -Dliquibase.rollbackCount=1
```

## Security Notes

### BCrypt Hash Format
BCrypt hashes are 60 characters long and follow this format:
```
$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
\__/\/ \____________________/\_____________________________/
Alg Cost      Salt                        Hash
```

- **Alg**: BCrypt version (2a, 2b, etc.)
- **Cost**: Computational cost factor (10 = 2^10 = 1024 rounds)
- **Salt**: 22-character random salt (automatic)
- **Hash**: 31-character hash result

### Why BCrypt?
- **Adaptive**: Cost can be increased as computers get faster
- **Slow**: Intentionally slow to prevent brute-force attacks
- **Salted**: Each password has unique salt (prevents rainbow tables)
- **One-way**: Cannot be reversed to get original password

### Password Storage Rules
✅ **DO:**
- Store passwords using BCrypt
- Use `passwordEncoder.encode()` when saving passwords
- Use `passwordEncoder.matches()` when verifying passwords
- Force password reset for migrated users

❌ **DON'T:**
- Store plaintext passwords
- Compare passwords with equals()
- Log or display passwords in any form
- Reuse passwords across systems

## Troubleshooting

### "Invalid username or password" after migration
- User needs to reset password through password reset flow
- Check if `require_password_reset` is true for the user

### Password not being hashed
- Verify PasswordEncoder bean is configured
- Check that CashierService is injecting PasswordEncoder
- Ensure password is not null or empty

### Tests failing
- Mock PasswordEncoder in tests
- Use BCrypt-formatted hashes in test data
- Verify mock expectations match actual usage

## Support

For issues or questions:
1. Check `BCRYPT_PASSWORD_IMPLEMENTATION.md` for detailed implementation
2. Review test cases in `AuthenticationServiceTest` and `CashierServiceTest`
3. Contact development team
