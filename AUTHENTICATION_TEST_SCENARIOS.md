# Authentication Test Scenarios

This document outlines test scenarios to verify the password reset loop fix works correctly.

## Prerequisites

- Backend API is running and accessible
- Test user account exists with default password that requires reset

## Test Scenario 1: First Login with Password Reset Required

**Steps:**
1. Navigate to login page (`/login`)
2. Enter username: `test_user`
3. Enter password: `default_password`
4. Click "Sign In"

**Expected Results:**
- ✓ Login is successful
- ✓ User is redirected to `/reset-password` page
- ✓ Reset password form is displayed
- ✓ Welcome message shows user's name

**Backend Response:**
```json
{
  "data": {
    "requirePasswordReset": true,
    "token": "...",
    "username": "test_user",
    "name": "Test User"
  }
}
```

---

## Test Scenario 2: Password Reset

**Steps:**
1. (Starting from reset password page after Test Scenario 1)
2. Enter current password: `default_password`
3. Enter new password: `newpassword123`
4. Enter confirm password: `newpassword123`
5. Click "Reset Password"

**Expected Results:**
- ✓ Password reset API call succeeds
- ✓ User is logged out
- ✓ User is redirected to `/login` page
- ✓ Success message is displayed: "Password reset successful! Please login with your new password."
- ✓ sessionStorage is cleared (no `authToken` or `user` items)

**Backend Response:**
```json
{
  "code": "200",
  "message": "Password reset successful. Please login with your new password."
}
```

---

## Test Scenario 3: Login After Password Reset (THE CRITICAL TEST)

**Steps:**
1. (Starting from login page with success message after Test Scenario 2)
2. Enter username: `test_user`
3. Enter new password: `newpassword123`
4. Click "Sign In"

**Expected Results:**
- ✓ Login is successful
- ✓ User is redirected to `/admin/dashboard` page (NOT to `/reset-password`)
- ✓ **No redirect loop occurs** ← This is the key fix!
- ✓ Dashboard page loads correctly
- ✓ User can navigate to other pages normally

**Backend Response:**
```json
{
  "data": {
    "requirePasswordReset": false,
    "token": "...",
    "username": "test_user",
    "name": "Test User"
  }
}
```

**What we're testing:**
- The fix ensures navigation happens immediately after login using fresh data from the backend
- No race condition occurs where stale state might cause redirect to reset password page
- The `requirePasswordReset: false` value from backend is used directly for navigation

---

## Test Scenario 4: Subsequent Login

**Steps:**
1. (Starting from dashboard after Test Scenario 3)
2. Click logout button
3. User is redirected to `/login` page
4. Enter username: `test_user`
5. Enter password: `newpassword123`
6. Click "Sign In"

**Expected Results:**
- ✓ Login is successful
- ✓ User is redirected to `/admin/dashboard` page
- ✓ No redirect to `/reset-password` page
- ✓ Dashboard page loads correctly

**Backend Response:**
```json
{
  "data": {
    "requirePasswordReset": false,
    "token": "...",
    "username": "test_user",
    "name": "Test User"
  }
}
```

---

## Test Scenario 5: Direct URL Access While Authenticated

**Steps:**
1. (Starting from dashboard after successful login)
2. Type `/reset-password` in browser address bar
3. Press Enter

**Expected Results:**
- ✓ User stays on dashboard (or is redirected back to dashboard)
- ✓ ProtectedRoute checks `user.requirePasswordReset` → false
- ✓ User cannot access reset password page if password reset is not required

**Alternative Test:**
1. (Starting from dashboard after successful login)
2. Type `/admin/orders` in browser address bar
3. Press Enter

**Expected Results:**
- ✓ Orders page loads successfully
- ✓ No redirect to reset password page

---

## Test Scenario 6: Navigate to Login While Already Authenticated

**Steps:**
1. (Starting from dashboard after successful login)
2. Type `/login` in browser address bar
3. Press Enter

**Expected Results:**
- ✓ User is redirected back to dashboard (or wherever they should be)
- ✓ The useEffect in LoginPage handles this edge case
- ✓ User doesn't see the login form

---

## Test Scenario 7: Login with Invalid Credentials

**Steps:**
1. Navigate to `/login` page
2. Enter username: `test_user`
3. Enter password: `wrong_password`
4. Click "Sign In"

**Expected Results:**
- ✓ Login fails
- ✓ Error message is displayed: "Invalid username or password"
- ✓ User stays on login page
- ✓ No navigation occurs

**Backend Response:**
```json
{
  "status": 401,
  "message": "Invalid credentials"
}
```

---

## Test Scenario 8: Network Error During Login

**Steps:**
1. Stop the backend server
2. Navigate to `/login` page
3. Enter username: `test_user`
4. Enter password: `newpassword123`
5. Click "Sign In"

**Expected Results:**
- ✓ Login fails
- ✓ Error message is displayed: "Unable to connect to the server. Please try again."
- ✓ User stays on login page
- ✓ No navigation occurs

---

## Test Scenario 9: Session Expiry

**Steps:**
1. Login successfully (requirePasswordReset: false)
2. Navigate to dashboard
3. Wait for token to expire (or manually remove token from sessionStorage)
4. Try to access a protected route (e.g., navigate to `/admin/orders`)

**Expected Results:**
- ✓ API call returns 401 error
- ✓ apiClient interceptor catches the error
- ✓ sessionStorage is cleared
- ✓ User is redirected to `/login` page

---

## Critical Success Criteria

For the fix to be considered successful, **Test Scenario 3** must pass without any redirect loop:

1. ✅ User logs in after password reset
2. ✅ Backend returns `requirePasswordReset: false`
3. ✅ User is immediately redirected to dashboard
4. ✅ NO redirect to `/reset-password` page
5. ✅ NO continuous loop
6. ✅ User can navigate normally

## Implementation Details

The fix works by:
1. Making `login()` function return the `User` object
2. In `LoginPage.handleSubmit()`, capturing the returned user data
3. Navigating immediately based on `loggedInUser.requirePasswordReset` value
4. This eliminates the race condition where `useEffect` might check stale state

## Testing Tools

### Manual Testing
- Use browser DevTools to monitor:
  - Network tab: Check API requests/responses
  - Application tab: Check sessionStorage contents
  - Console: Check for errors or warnings

### Automated Testing (Future)
- Unit tests for `login()` function
- Integration tests for `LoginPage` component
- E2E tests for complete authentication flow

## Notes

- All tests should be performed in an incognito/private browser window to ensure clean state
- Clear browser cache and sessionStorage before each test run
- Test with both admin and regular user accounts
- Verify token persistence/expiry behavior
