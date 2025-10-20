# Testing Instructions for Authentication Fixes

## Overview
This document provides step-by-step instructions to test the two authentication issues that were fixed:
1. Password reset redirect loop
2. Session persistence across browser restarts

## Prerequisites
- Access to the POS frontend application
- Access to a test user account with default password
- Backend server running with proper authentication endpoints

## Test Scenario 1: Password Reset Loop (Issue #1)

### Expected Behavior
After resetting password and logging in with new credentials, user should be redirected to dashboard and NOT back to the password reset page.

### Testing Steps

#### Step 1: Initial Login with Default Password
1. Open the application in your browser
2. Navigate to the login page
3. Enter credentials:
   - Username: `admin` (or your test username)
   - Password: `default123` (or your default password)
4. Click "Sign In"

**✅ Expected Result:**
- Login succeeds
- User is redirected to `/reset-password` page
- Page shows "Please change your password to continue"

**❌ If this fails:**
- Check backend is returning `requirePasswordReset: true`
- Check browser console for errors

#### Step 2: Reset Password
1. On the password reset page, enter:
   - Current Password: `default123` (the default password)
   - New Password: `MyNewSecure123` (a new password)
   - Confirm Password: `MyNewSecure123` (same as new password)
2. Click "Reset Password"

**✅ Expected Result:**
- Password reset succeeds
- User is logged out
- Redirected to `/login` page
- Success message displayed: "Password reset successful! Please login with your new password."

**❌ If this fails:**
- Check backend password reset API is working
- Check browser console for errors
- Verify password meets requirements (minimum 4 characters)

#### Step 3: Login with New Password
1. On the login page (should show success message from Step 2)
2. Enter credentials:
   - Username: `admin` (same username)
   - Password: `MyNewSecure123` (the NEW password)
3. Click "Sign In"

**✅ Expected Result:**
- Login succeeds
- User is redirected to `/admin/dashboard`
- Dashboard page loads successfully
- **NO redirect to `/reset-password` page** ← **KEY TEST POINT**

**❌ If this fails:**
- This was the original bug - should now be fixed
- Check browser console for errors
- Check sessionStorage in DevTools (should show `requirePasswordReset: false`)

#### Step 4: Navigate to Other Pages
1. From the dashboard, click on "Customers" menu item
2. Then click on "Orders" menu item
3. Then click on "Statistics" menu item

**✅ Expected Result:**
- All pages load successfully
- **NO redirect to `/reset-password` page** ← **KEY TEST POINT**
- Navigation works normally

**❌ If this fails:**
- Check browser console for errors
- Check ProtectedRoute logic

#### Step 5: Logout and Login Again
1. Click logout button (if available) or clear sessionStorage manually
2. Login again with:
   - Username: `admin`
   - Password: `MyNewSecure123` (the new password)

**✅ Expected Result:**
- Login succeeds
- Redirected directly to dashboard
- **NO redirect to `/reset-password` page** ← **KEY TEST POINT**

## Test Scenario 2: Session Persistence (Issue #2)

### Expected Behavior
After closing the browser and reopening it, user should NOT be automatically logged in. They should be required to enter credentials again.

### Testing Steps

#### Step 1: Login Successfully
1. Open the application in your browser
2. Login with valid credentials
3. Verify you can access the dashboard

**✅ Expected Result:**
- Successfully logged in
- Can access protected pages

#### Step 2: Verify Session is Active
1. Open browser DevTools (F12)
2. Go to "Application" tab (Chrome) or "Storage" tab (Firefox)
3. Check "Session Storage" section
4. Verify you see:
   - `authToken`: (JWT token string)
   - `user`: (JSON object with user data)

**✅ Expected Result:**
- Session data exists in sessionStorage
- **NOT in localStorage** ← **KEY TEST POINT**

#### Step 3: Close Browser Completely
1. Close ALL browser windows and tabs
2. Make sure the browser process is completely terminated
   - Windows: Check Task Manager, no browser processes running
   - Mac: Quit the application (Cmd+Q)
   - Linux: Ensure all browser processes are closed

**⚠️ IMPORTANT:**
- Don't just close a tab - close the ENTIRE browser
- Wait at least 30 seconds to ensure process termination

#### Step 4: Reopen Browser
1. Open the browser again (fresh start)
2. Navigate directly to the application dashboard URL
   - Example: `http://localhost:5173/admin/dashboard`

**✅ Expected Result:**
- User is redirected to `/login` page
- **NOT automatically logged in** ← **KEY TEST POINT**
- Must enter credentials again

**❌ If this fails:**
- This was the original bug - should now be fixed
- Check browser DevTools storage:
  - sessionStorage should be empty
  - localStorage should NOT contain auth data
- If localStorage has auth data, the migration didn't work

#### Step 5: Check Storage After Browser Restart
1. Before logging in, open browser DevTools
2. Check both sessionStorage and localStorage
3. Verify auth data is cleared

**✅ Expected Result:**
- sessionStorage is empty (no `authToken`, no `user`)
- localStorage is empty (no `authToken`, no `user`)
- Old localStorage data was cleaned up during migration

#### Step 6: Login Again
1. Enter valid credentials
2. Login successfully

**✅ Expected Result:**
- Login succeeds
- New session created
- Auth data stored in sessionStorage (NOT localStorage)

## Test Scenario 3: Token Expiration (Edge Case)

### Testing Steps

#### Step 1: Login and Get Token
1. Login successfully
2. Note the current time
3. Keep the browser tab open

#### Step 2: Wait for Token Expiration
⚠️ **Note:** Default token expiration is 24 hours, so this test requires patience or backend configuration change.

For faster testing, you can:
- Ask backend admin to reduce token expiration time temporarily
- Or manually expire the token by modifying backend

#### Step 3: Try to Access Protected Resource
1. After token expires, try to navigate to a protected page
2. Or make an API call

**✅ Expected Result:**
- API returns 401 Unauthorized
- User is redirected to `/login` page
- sessionStorage is cleared
- User must login again

## Debugging Tips

### Check Browser Storage
**Chrome/Edge:**
1. Press F12 to open DevTools
2. Go to "Application" tab
3. Check "Session Storage" and "Local Storage"

**Firefox:**
1. Press F12 to open DevTools
2. Go to "Storage" tab
3. Check "Session Storage" and "Local Storage"

### Check Network Requests
1. Open DevTools Network tab
2. Login and check the login API response
3. Verify response contains:
   ```json
   {
     "data": {
       "requirePasswordReset": false,  // After password reset
       "token": "eyJ..."
     }
   }
   ```

### Check Console Logs
1. Open browser console (F12 → Console)
2. Look for any errors during:
   - Login
   - Password reset
   - Navigation
   - Page loads

### Common Issues and Solutions

**Issue:** Still redirected to reset password after successful password change
- **Check:** sessionStorage has correct `requirePasswordReset: false`
- **Check:** Backend is returning `requirePasswordReset: false` in login response
- **Solution:** Clear all browser storage and try again

**Issue:** Session persists after browser restart
- **Check:** Is data in localStorage or sessionStorage?
- **Check:** Did you fully close the browser or just the tab?
- **Solution:** Ensure you're closing all browser windows

**Issue:** Cannot login at all
- **Check:** Backend server is running
- **Check:** API endpoints are accessible
- **Check:** Network tab shows API responses
- **Solution:** Verify backend configuration

## Success Criteria

All tests pass if:
- ✅ Password reset loop is fixed (no infinite redirects)
- ✅ Sessions expire when browser closes
- ✅ Users must login after browser restart
- ✅ Normal navigation works without issues
- ✅ All auth data uses sessionStorage (not localStorage)
- ✅ No errors in browser console
- ✅ Backend API responses are as expected

## Rollback Plan

If issues are found and fixes need to be reverted:
1. The changes are in 3 source files only
2. All changes can be easily reverted via git
3. No database migrations or backend changes required
4. Simply revert the commits and redeploy

## Additional Notes

- The first time users run the updated app, they will be logged out (one-time effect)
- This is expected due to the localStorage → sessionStorage migration
- Users should be informed that they need to login again after the update
- This is a security improvement and expected behavior

## Support

If you encounter any issues during testing:
1. Check browser console for error messages
2. Check browser DevTools storage tabs
3. Verify backend server is running properly
4. Review the `FIXES_APPLIED.md` document for technical details
5. Review the `AUTHENTICATION_FLOW_DIAGRAM.md` for flow visualization
