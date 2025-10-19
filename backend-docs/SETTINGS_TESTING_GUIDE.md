# Settings Menu API Testing Guide

## Overview

This guide provides instructions for testing the Settings Menu APIs both manually and automatically.

## Prerequisites

- Running POS backend server
- `curl` and `jq` installed (for automated testing)
- Valid cashier and outlet data in the database

## Automated Testing

### Using the Test Script

A bash script is provided for automated testing of all Settings Menu endpoints.

**Run the script:**
```bash
./test-settings-api.sh
```

**With custom parameters:**
```bash
BASE_URL=http://localhost:8080 CASHIER_ID=1 OUTLET_ID=2 ./test-settings-api.sh
```

**Environment Variables:**
- `BASE_URL`: Backend server URL (default: http://localhost:8080)
- `CASHIER_ID`: Cashier ID for testing (default: 1)
- `OUTLET_ID`: Outlet ID for switch outlet test (default: 2)

**Test Coverage:**
The script includes 14 comprehensive tests:

**Outlet Settings Tests:**
1. Get Outlet Settings
2. Update Outlet Settings (partial)
3. Update Outlet Settings (full)
4. Reset Outlet Data
5. Verify Settings After Reset
6. Switch Outlet

**Account Settings Tests:**
7. Get Account Settings
8. Update Account Settings
9. Verify Account Update
10. Change Password (expected failure without valid password)

**Error Handling Tests:**
11. Invalid Cashier ID
12. Password Mismatch
13. Missing Required Fields
14. Invalid Outlet ID

**Expected Output:**
```
==========================================
Settings Menu API Test Script
==========================================
Base URL: http://localhost:8080
Cashier ID: 1
Outlet ID: 2

==========================================
OUTLET SETTINGS TESTS
==========================================

Test 1: Get Outlet Settings
Request: GET /api/pos/settings/outlet
Response:
{
  "status": "success",
  ...
}
✓ PASSED

...

==========================================
TEST SUMMARY
==========================================
Tests Run: 14
Tests Passed: 14
Tests Failed: 0
All tests passed!
```

## Manual Testing

### Setup

1. **Start the backend server:**
```bash
mvn spring-boot:run
```

2. **Verify server is running:**
```bash
curl http://localhost:8080/actuator/health
```

### Test Scenarios

#### Scenario 1: Configure Outlet Settings

**Step 1: Get current settings**
```bash
curl -X GET http://localhost:8080/api/pos/settings/outlet | jq
```

**Expected Response:**
```json
{
  "status": "success",
  "code": "success",
  "message": "Outlet settings retrieved successfully",
  "data": {
    "displayCategoryCards": true,
    "enableSounds": true,
    "pageWidthMm": 80,
    "pageHeightMm": 297,
    "pageMarginMm": 10
  }
}
```

**Step 2: Update display settings**
```bash
curl -X PUT http://localhost:8080/api/pos/settings/outlet \
  -H "Content-Type: application/json" \
  -d '{
    "displayCategoryCards": false,
    "enableSounds": false
  }' | jq
```

**Expected Response:**
```json
{
  "status": "success",
  "code": "success.outlet.settings.updated",
  "message": "Outlet settings updated successfully",
  "data": {
    "displayCategoryCards": false,
    "enableSounds": false,
    "pageWidthMm": 80,
    "pageHeightMm": 297,
    "pageMarginMm": 10
  }
}
```

**Step 3: Update printer settings**
```bash
curl -X PUT http://localhost:8080/api/pos/settings/outlet \
  -H "Content-Type: application/json" \
  -d '{
    "pageWidthMm": 150,
    "pageHeightMm": 300,
    "pageMarginMm": 15
  }' | jq
```

**Step 4: Reset to defaults**
```bash
curl -X POST http://localhost:8080/api/pos/settings/outlet/reset | jq
```

**Expected Response:**
```json
{
  "status": "success",
  "code": "success.outlet.reset",
  "message": "Outlet data has been reset successfully",
  "data": {
    "message": "Outlet data has been reset to default values"
  }
}
```

#### Scenario 2: Switch Outlet

**Prerequisite:** Cashier must be assigned to multiple outlets

**Step 1: Get cashier's assigned outlets**
```bash
curl -X GET http://localhost:8080/api/admin/cashiers/1/outlets | jq
```

**Step 2: Switch to another outlet**
```bash
curl -X POST http://localhost:8080/api/pos/settings/outlet/switch/1 \
  -H "Content-Type: application/json" \
  -d '{
    "outletId": 2
  }' | jq
```

**Expected Response:**
```json
{
  "status": "success",
  "code": "success.outlet.switched",
  "message": "Outlet switched successfully",
  "data": {
    "id": 2,
    "name": "Downtown Branch",
    "code": "OUT002",
    "mode": "RESTAURANT_CAFE",
    "isActive": true
  }
}
```

#### Scenario 3: Manage Account Settings

**Step 1: Get current account info**
```bash
curl -X GET http://localhost:8080/api/pos/settings/account/1 | jq
```

**Expected Response:**
```json
{
  "status": "success",
  "code": "success",
  "message": "Account settings retrieved successfully",
  "data": {
    "id": 1,
    "firstName": "Jack",
    "lastName": "Shepard",
    "email": "cashier@email.com",
    "username": "jack.shepard"
  }
}
```

**Step 2: Update name**
```bash
curl -X PUT http://localhost:8080/api/pos/settings/account/1 \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe"
  }' | jq
```

**Expected Response:**
```json
{
  "status": "success",
  "code": "success.account.updated",
  "message": "Account settings updated successfully",
  "data": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "cashier@email.com",
    "username": "john.doe"
  }
}
```

#### Scenario 4: Change Password

**Step 1: Attempt password change**
```bash
curl -X PUT http://localhost:8080/api/pos/settings/account/1/password \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "currentPass123",
    "newPassword": "newPass456",
    "confirmPassword": "newPass456"
  }' | jq
```

**Expected Response (success):**
```json
{
  "status": "success",
  "code": "success.password.changed",
  "message": "Password changed successfully",
  "data": null
}
```

**Expected Response (wrong current password):**
```json
{
  "status": "error",
  "code": "error.password.invalid",
  "message": "Current password is incorrect"
}
```

**Expected Response (password mismatch):**
```json
{
  "status": "error",
  "code": "error.password.mismatch",
  "message": "New password and confirm password do not match"
}
```

### Error Testing

#### Test 1: Invalid Cashier ID
```bash
curl -X GET http://localhost:8080/api/pos/settings/account/99999 | jq
```

**Expected Response:**
```json
{
  "status": "error",
  "code": "error.resource.not-found",
  "message": "Cashier not found with id: 99999"
}
```

#### Test 2: Missing Required Fields
```bash
curl -X PUT http://localhost:8080/api/pos/settings/account/1 \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John"
  }' | jq
```

**Expected Response:**
```json
{
  "status": "error",
  "code": "error.validation",
  "message": "Last name is required"
}
```

#### Test 3: Invalid Outlet for Switch
```bash
curl -X POST http://localhost:8080/api/pos/settings/outlet/switch/1 \
  -H "Content-Type: application/json" \
  -d '{
    "outletId": 99999
  }' | jq
```

**Expected Response:**
```json
{
  "status": "error",
  "code": "error.resource.not-found",
  "message": "Outlet not found with id: 99999"
}
```

#### Test 4: Unassigned Outlet Switch
```bash
curl -X POST http://localhost:8080/api/pos/settings/outlet/switch/1 \
  -H "Content-Type: application/json" \
  -d '{
    "outletId": 5
  }' | jq
```

**Expected Response:**
```json
{
  "status": "error",
  "code": "error.outlet.not-assigned",
  "message": "Cashier does not have access to the specified outlet"
}
```

## Unit Testing

### Running Tests

**Run all tests:**
```bash
mvn test
```

**Run only Settings tests:**
```bash
mvn test -Dtest=SettingsControllerTest
```

**Test Coverage:**
- `testGetOutletSettings`: Verifies outlet settings retrieval
- `testUpdateOutletSettings`: Verifies outlet settings update
- `testResetOutletData`: Verifies settings reset to defaults
- `testSwitchOutlet`: Verifies outlet switching functionality
- `testGetAccountSettings`: Verifies account settings retrieval
- `testUpdateAccountSettings`: Verifies account information update
- `testChangePassword`: Verifies password change functionality

**Expected Output:**
```
[INFO] Running com.pos.controller.SettingsControllerTest
[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0
```

## Integration Testing

### Prerequisites

1. Running MySQL database
2. Database populated with test data:
   - At least one cashier
   - At least two outlets
   - Cashier assigned to multiple outlets
   - Existing configuration entries

### Setup Test Data

**Create test cashier:**
```sql
INSERT INTO cashiers (name, username, password, email, is_active, require_password_reset)
VALUES ('Test Cashier', 'test.cashier', 'password123', 'test@example.com', true, false);
```

**Create test outlets:**
```sql
INSERT INTO outlets (name, code, address, phone, email, mode, is_active)
VALUES 
  ('Main Outlet', 'OUT001', '123 Main St', '+1234567890', 'main@example.com', 'GROCERY_RETAIL', true),
  ('Branch Outlet', 'OUT002', '456 Branch Ave', '+0987654321', 'branch@example.com', 'RESTAURANT_CAFE', true);
```

**Assign cashier to outlets:**
```sql
INSERT INTO cashier_outlets (cashier_id, outlet_id)
VALUES 
  (1, 1),
  (1, 2);
```

**Initialize configuration:**
```sql
INSERT INTO configurations (config_key, config_value, category, description, data_type)
VALUES 
  ('display_category_cards', 'true', 'LAYOUT', 'Display category cards in main menu', 'BOOLEAN'),
  ('enable_sounds', 'true', 'GENERAL', 'Enable sound effects', 'BOOLEAN'),
  ('page_width', '80', 'PRINTER', 'Printer page width in mm', 'INTEGER'),
  ('page_height', '297', 'PRINTER', 'Printer page height in mm', 'INTEGER'),
  ('page_margin', '10', 'PRINTER', 'Printer page margin in mm', 'INTEGER');
```

### Full Integration Test Flow

**1. Start with default settings**
```bash
curl http://localhost:8080/api/pos/settings/outlet | jq
```

**2. Update settings**
```bash
curl -X PUT http://localhost:8080/api/pos/settings/outlet \
  -H "Content-Type: application/json" \
  -d '{"displayCategoryCards": false, "pageWidthMm": 150}' | jq
```

**3. Verify settings persisted**
```bash
curl http://localhost:8080/api/pos/settings/outlet | jq
```

**4. Switch outlet**
```bash
curl -X POST http://localhost:8080/api/pos/settings/outlet/switch/1 \
  -H "Content-Type: application/json" \
  -d '{"outletId": 2}' | jq
```

**5. Update account**
```bash
curl -X PUT http://localhost:8080/api/pos/settings/account/1 \
  -H "Content-Type: application/json" \
  -d '{"firstName": "Updated", "lastName": "Name"}' | jq
```

**6. Verify account update**
```bash
curl http://localhost:8080/api/pos/settings/account/1 | jq
```

**7. Reset outlet settings**
```bash
curl -X POST http://localhost:8080/api/pos/settings/outlet/reset | jq
```

**8. Verify reset**
```bash
curl http://localhost:8080/api/pos/settings/outlet | jq
```

## Performance Testing

### Load Testing with Apache Bench

**Test outlet settings retrieval:**
```bash
ab -n 1000 -c 10 http://localhost:8080/api/pos/settings/outlet
```

**Test account settings retrieval:**
```bash
ab -n 1000 -c 10 http://localhost:8080/api/pos/settings/account/1
```

**Expected Performance:**
- Response time: < 100ms for GET requests
- Response time: < 200ms for PUT/POST requests
- Throughput: > 100 requests/second
- Error rate: 0%

## Troubleshooting

### Common Issues

**Issue:** Connection refused
**Solution:** Ensure backend server is running on the specified port

**Issue:** 404 Not Found
**Solution:** Verify the correct base URL and endpoint paths

**Issue:** 500 Internal Server Error
**Solution:** Check server logs for stack traces and database connectivity

**Issue:** Validation errors
**Solution:** Verify request body matches the expected format and required fields are present

**Issue:** Unauthorized access
**Solution:** Implement and configure authentication/authorization if required

### Debug Mode

**Enable debug logging:**
```bash
java -jar target/pos-backend.jar --logging.level.com.pos=DEBUG
```

**Check logs:**
```bash
tail -f logs/application.log
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Test Settings API

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up JDK 21
      uses: actions/setup-java@v2
      with:
        java-version: '21'
        distribution: 'temurin'
    
    - name: Run tests
      run: mvn test -Dtest=SettingsControllerTest
    
    - name: Generate test report
      run: mvn surefire-report:report
```

## Additional Resources

- [API Documentation](SETTINGS_API_DOCUMENTATION.md)
- [Implementation Summary](SETTINGS_IMPLEMENTATION_SUMMARY.md)
- [Main README](README.md)

## Support

For issues or questions:
1. Check the API documentation
2. Review the implementation summary
3. Run the automated test script
4. Check server logs
5. Create an issue in the repository
