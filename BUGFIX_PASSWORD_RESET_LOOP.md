# Bug Fix: Password Reset Redirect Loop

## Issue Description

After successfully resetting their password and logging in again with the new password, users experienced an infinite redirect loop between the dashboard and password reset pages. However, when typing the dashboard URL directly in the browser address bar, it would load correctly.

## Root Cause

The LoginPage component was automatically navigating to the intended destination (dashboard) immediately after successful login, without checking if the user still required a password reset. This created a race condition with the ProtectedRoute component:

1. User logs in after password reset → backend returns `requirePasswordReset: false`
2. LoginPage's useEffect detects `isAuthenticated: true` and immediately navigates to dashboard
3. ProtectedRoute checks `user.requirePasswordReset` but might see stale or transitional state
4. If ProtectedRoute sees `requirePasswordReset: true`, it redirects back to reset-password
5. This creates an infinite loop

The issue didn't occur with direct URL access because in that case, the AuthContext would initialize fresh from localStorage with the correct `requirePasswordReset: false` value.

## Solution

Modified the LoginPage's navigation logic to check the `requirePasswordReset` flag before deciding where to navigate:

**Before:**
```typescript
useEffect(() => {
  if (isAuthenticated) {
    navigate(from, { replace: true });  // Always navigate to intended destination
  }
}, [isAuthenticated, navigate, from]);
```

**After:**
```typescript
useEffect(() => {
  if (isAuthenticated && user) {
    // If password reset is required, redirect to reset password page
    if (user.requirePasswordReset) {
      navigate('/reset-password', { replace: true });
    } else {
      // Otherwise, redirect to intended destination
      navigate(from, { replace: true });
    }
  }
}, [isAuthenticated, user, navigate, from]);
```

## Changes Made

### File: `src/pages/auth/LoginPage.tsx`

1. **Line 10**: Added `user` to the destructured values from `useAuth()`
2. **Lines 19-29**: Updated the useEffect to check `user.requirePasswordReset` before navigation
3. **Lines 43-44**: Updated comment to reflect new navigation behavior

## Why This Fix Works

1. **Synchronous State Check**: LoginPage now checks the same `user.requirePasswordReset` value that ProtectedRoute will check
2. **No Race Condition**: Navigation only happens after the authentication state is fully determined
3. **Respects Backend Response**: Uses the `requirePasswordReset` value directly from the login API response
4. **Consistent Flow**: Both first login (with password reset required) and subsequent logins follow the same logic
5. **Clear Responsibilities**: Each component has a well-defined role in the authentication flow

## Authentication Flow (After Fix)

### First Login (requirePasswordReset: true)
1. User logs in → backend returns `requirePasswordReset: true`
2. LoginPage useEffect checks → `user.requirePasswordReset` is true
3. Navigates to `/reset-password` ✓
4. ProtectedRoute allows access to reset password page ✓

### After Password Reset
1. User resets password successfully
2. Logs out and redirected to login page with success message ✓

### Second Login (requirePasswordReset: false)
1. User logs in with new password → backend returns `requirePasswordReset: false`
2. LoginPage useEffect checks → `user.requirePasswordReset` is false
3. Navigates to `/admin/dashboard` ✓
4. ProtectedRoute checks → `user.requirePasswordReset` is false
5. Dashboard renders successfully ✓
6. **No redirect loop** ✓

## Testing

### Manual Testing Steps

1. **Login with password reset required**
   - Login with default credentials
   - Verify redirect to reset password page
   
2. **Reset password**
   - Complete password reset form
   - Verify logout and redirect to login page
   - Verify success message displayed

3. **Login with new password**
   - Login with the new password
   - Verify redirect to dashboard
   - **Verify no redirect loop occurs**
   - Verify can navigate to other pages

4. **Direct URL access**
   - Type dashboard URL directly in browser
   - Verify dashboard loads correctly
   - Verify no redirect to reset password page

### Expected Results

- ✅ No redirect loop after password reset and re-login
- ✅ Password reset requirement properly enforced on first login
- ✅ Dashboard accessible after successful password reset
- ✅ Direct URL access works correctly
- ✅ User experience is smooth and intuitive

## Compatibility

- **Backend**: No changes required - uses existing API contract
- **Existing Users**: No impact on users who don't require password reset
- **Data Migration**: None required
- **Breaking Changes**: None

## Related Files

- `src/pages/auth/LoginPage.tsx` - Modified (navigation logic)
- `src/pages/auth/ResetPasswordPage.tsx` - No changes (already correct)
- `src/contexts/AuthContext.tsx` - No changes (already correct)
- `src/services/authService.ts` - No changes (already correct)
- `src/components/auth/ProtectedRoute.tsx` - No changes (already correct)

## Verification

The fix has been:
- ✅ Linted (no ESLint errors)
- ✅ Type-checked (no TypeScript errors)
- ✅ Built successfully
- ✅ Logic verified through code review
- ✅ Flow documented and validated

## Notes

- This fix maintains the requirement that users must login again after password reset
- The authentication flow now properly uses the `requirePasswordReset` value from login API responses
- The fix is minimal and surgical - only changes the navigation logic in LoginPage
- No changes to backend, API contracts, or data models required
