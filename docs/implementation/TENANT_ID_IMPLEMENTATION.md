# Dynamic Tenant ID Implementation

## Overview
This document describes the implementation of dynamic tenant ID extraction from URLs, replacing the previous hardcoded approach.

## URL Structure
All application routes now follow this pattern:
```
http://localhost:5173/posai/{tenantId}/{route}
```

### Examples:
- Login: `http://localhost:5173/posai/PaPos/login`
- Dashboard: `http://localhost:5173/posai/PaPos/admin/dashboard`
- Settings: `http://localhost:5173/posai/PaPos/admin/settings`
- Outlets: `http://localhost:5173/posai/PaPos/admin/outlets`

## Key Components

### 1. TenantContext (`src/contexts/TenantContext.tsx`)
Provides tenant ID through React Context, extracting it from URL parameters.

### 2. TenantRouteGuard (`src/components/auth/TenantRouteGuard.tsx`)
Blocks access to the application if the tenant ID is not present in the URL.
Shows a user-friendly error message with the correct URL format.

### 3. useTenantId Hook (`src/hooks/useTenantId.ts`)
Custom hook to access the tenant ID from anywhere in the application.

## Changes Made

### Application Structure
- **App.tsx**: Restructured routes to use nested routing with tenant ID parameter
- All routes now wrapped in `TenantRouteGuard` and `TenantProvider`

### Authentication & Navigation
- **ProtectedRoute.tsx**: Updated to include tenant ID in redirects
- **LoginPage.tsx**: Uses tenant ID from URL params for navigation
- **ResetPasswordPage.tsx**: Preserves tenant ID in logout redirect

### Layout Components
- **SideNavigation.tsx**: Prepends tenant ID to all navigation paths
- **TopNavigation.tsx**: Includes tenant ID in logout redirect
- **CashierSideNavigation.tsx**: Updates paths with tenant ID

### API Client
- **apiClient.ts**: Dynamically extracts tenant ID from current URL path
- Adds `X-Tenant-ID` header to all API requests
- Updated error handlers to preserve tenant ID in redirects

### Configuration
- **env.ts**: Removed hardcoded tenant ID
- **.env.example**: Removed `VITE_TENANT_ID` variable

## Access Control

### Without Valid Tenant ID
Users attempting to access the application without a tenant ID in the URL will see an error message:

```
⚠️ Invalid URL Format

Please access the system using the correct URL format:
http://localhost:5173/posai/{tenantId}

Contact your administrator if you don't have the correct URL.
```

### Valid Access
Users must access the application with a valid tenant ID in the URL path.

## Testing

### Build
```bash
npm run build
```

### Lint
```bash
npm run lint
```

### Development Server
```bash
npm run dev
# Access at: http://localhost:5173/posai/{your-tenant-id}/login
```

## Migration Guide

### For Users
Update bookmarks and saved URLs to include the tenant ID:
- Old: `http://localhost:5173/login`
- New: `http://localhost:5173/posai/{tenantId}/login`

### For Developers
When adding new navigation:
1. Import `useParams` from 'react-router-dom'
2. Extract tenant ID: `const { tenantId } = useParams<{ tenantId: string }>()`
3. Prepend tenant ID to paths: `` `/posai/${tenantId}/your-path` ``

## Benefits

1. **Multi-tenancy Support**: Different tenants can be served from the same application
2. **No Hardcoding**: Tenant ID is no longer hardcoded in environment variables
3. **Security**: Each tenant is isolated by URL structure
4. **Flexibility**: Easy to switch between tenants by changing the URL
5. **Clear Error Messages**: Users get helpful guidance if accessing with wrong URL format

## API Integration

The `X-Tenant-ID` header is automatically added to all API requests based on the current URL, ensuring:
- Consistent tenant identification across frontend and backend
- No manual tenant ID management in API calls
- Automatic tenant context for all HTTP requests
