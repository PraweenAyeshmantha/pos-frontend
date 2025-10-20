# Manual Testing Guide for Dynamic Tenant ID

This guide provides test scenarios to verify the dynamic tenant ID implementation.

## Prerequisites
1. Start the development server: `npm run dev`
2. Ensure the backend API is running (if testing full integration)
3. Have a valid tenant ID (e.g., "PaPos" or "TestTenant")

## Test Scenarios

### Test 1: Access Without Tenant ID (Should Fail)
**Expected:** User sees error message about invalid URL format

1. Navigate to: `http://localhost:5173/`
   - ✅ Should display error page with message about correct URL format
   
2. Navigate to: `http://localhost:5173/login`
   - ✅ Should display error page (no tenant ID in path)

3. Navigate to: `http://localhost:5173/admin/dashboard`
   - ✅ Should display error page (no tenant ID in path)

### Test 2: Access With Tenant ID (Should Succeed)
**Expected:** User can access application with tenant ID in URL

1. Navigate to: `http://localhost:5173/posai/PaPos/login`
   - ✅ Should display login page
   - ✅ URL should remain: `/posai/PaPos/login`

2. Navigate to: `http://localhost:5173/posai/TestTenant/login`
   - ✅ Should display login page
   - ✅ URL should remain: `/posai/TestTenant/login`

### Test 3: Login Flow
**Expected:** Tenant ID is preserved throughout authentication

1. Navigate to: `http://localhost:5173/posai/PaPos/login`
2. Enter valid credentials and login
   - ✅ Should redirect to: `/posai/PaPos/admin/dashboard`
   - ✅ Tenant ID "PaPos" should be maintained in URL

3. Check browser network tab
   - ✅ All API requests should have `X-Tenant-ID: PaPos` header

### Test 4: Navigation Between Pages
**Expected:** Tenant ID is preserved in all navigation

1. Login with tenant ID "PaPos"
2. Navigate to Dashboard
   - ✅ URL: `/posai/PaPos/admin/dashboard`
3. Click on "Customers" in sidebar
   - ✅ URL: `/posai/PaPos/admin/customers`
4. Click on "Orders" in sidebar
   - ✅ URL: `/posai/PaPos/admin/orders`
5. Click on "Settings" in sidebar
   - ✅ URL: `/posai/PaPos/admin/settings`
6. Navigate to POS Admin page
   - ✅ URL: `/posai/PaPos/admin/pos-admin`
7. Click on "Analytics" tile
   - ✅ URL: `/posai/PaPos/admin/statistics`
8. Click on "Configuration" tile
   - ✅ URL: `/posai/PaPos/admin/configuration/general`
9. Click on "Outlets" tile
   - ✅ URL: `/posai/PaPos/admin/outlets`

### Test 5: Password Reset Flow
**Expected:** Tenant ID preserved through password reset

1. Login with account that requires password reset
   - ✅ Should redirect to: `/posai/PaPos/reset-password`
2. Complete password reset
   - ✅ Should redirect to: `/posai/PaPos/login` with success message
3. Login with new password
   - ✅ Should redirect to: `/posai/PaPos/admin/dashboard`

### Test 6: Logout Flow
**Expected:** User redirected to login with same tenant ID

1. While logged in at: `/posai/PaPos/admin/dashboard`
2. Click logout button
   - ✅ Should redirect to: `/posai/PaPos/login`
   - ✅ Tenant ID should be preserved

### Test 7: Protected Routes
**Expected:** Unauthenticated users redirected to login with tenant ID

1. Clear session storage (or use incognito mode)
2. Navigate to: `http://localhost:5173/posai/PaPos/admin/dashboard`
   - ✅ Should redirect to: `/posai/PaPos/login`
   - ✅ After login, should redirect back to dashboard

### Test 8: Multiple Tenants
**Expected:** Different tenants can be accessed with different URLs

1. Login with: `http://localhost:5173/posai/TenantA/login`
   - ✅ All subsequent navigation should use "TenantA"
   - ✅ API requests should have `X-Tenant-ID: TenantA` header

2. Open new incognito window
3. Login with: `http://localhost:5173/posai/TenantB/login`
   - ✅ All subsequent navigation should use "TenantB"
   - ✅ API requests should have `X-Tenant-ID: TenantB` header

### Test 9: Browser Refresh
**Expected:** Tenant ID maintained after page refresh

1. Navigate to: `http://localhost:5173/posai/PaPos/admin/dashboard`
2. Refresh the page (F5 or Ctrl+R)
   - ✅ Should remain at: `/posai/PaPos/admin/dashboard`
   - ✅ Page should load correctly with tenant context

### Test 10: Direct URL Access
**Expected:** Deep links work with tenant ID

1. Open browser to: `http://localhost:5173/posai/PaPos/admin/statistics`
   - ✅ If not authenticated: redirect to `/posai/PaPos/login`
   - ✅ If authenticated: display statistics page
   - ✅ After login: redirect back to `/posai/PaPos/admin/statistics`

## API Integration Tests

### Test 11: API Request Headers
**Expected:** All API requests include tenant ID header

1. Login with tenant ID "PaPos"
2. Open browser DevTools > Network tab
3. Perform various actions (navigate, fetch data)
4. Check API requests
   - ✅ All requests to backend should include header: `X-Tenant-ID: PaPos`

### Test 12: Error Handling
**Expected:** Errors preserve tenant ID in redirects

1. While at: `/posai/PaPos/admin/dashboard`
2. Trigger 401 error (e.g., expired token)
   - ✅ Should redirect to: `/posai/PaPos/login`

3. Trigger 423 error (password reset required)
   - ✅ Should redirect to: `/posai/PaPos/reset-password`

## Edge Cases

### Test 13: Invalid Tenant ID Format
**Expected:** Application handles invalid tenant IDs gracefully

1. Navigate to: `http://localhost:5173/posai//login` (empty tenant ID)
   - ✅ Should display error page

2. Navigate to: `http://localhost:5173/posai/tenant-with-special-chars@#$/login`
   - ⚠️ May work at frontend but could fail at backend - depends on backend validation

### Test 14: URL Encoding
**Expected:** Tenant IDs with special characters are handled

1. Navigate to: `http://localhost:5173/posai/Tenant%20Space/login`
   - ✅ Should work if backend accepts spaces in tenant IDs

## Checklist

- [ ] All navigation maintains tenant ID in URL
- [ ] Login/logout flows preserve tenant ID
- [ ] API requests include correct `X-Tenant-ID` header
- [ ] Access without tenant ID shows error page
- [ ] Protected routes work correctly with tenant ID
- [ ] Browser refresh maintains tenant context
- [ ] Multiple tenants can be accessed independently
- [ ] Deep linking works with tenant ID in URL
- [ ] Error redirects preserve tenant ID

## Notes

- The tenant ID "PaPos" is used as the default example throughout these tests
- Replace "PaPos" with your actual tenant ID when testing
- All API requests will automatically include the tenant ID from the URL
- No environment variables need to be set for tenant ID anymore
