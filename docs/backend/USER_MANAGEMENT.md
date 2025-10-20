# User Management System

This document describes the new user management system implemented in the POS backend.

## Overview

The system now includes a comprehensive user management structure that separates user information from cashier-specific data, providing better scalability and role-based access control.

## Database Schema

### Tables Created

1. **users** - Main user table storing authentication and profile information
2. **user_categories** - Predefined user roles (ADMIN, CASHIER)
3. **user_category_mapping** - Maps users to their assigned categories/roles
4. **user_access** - Stores screen-level permissions for each user

### Default User Categories

- **ADMIN** - Full system access with administrative privileges
- **CASHIER** - Point of sale operations access

## Default Admin Account

A default administrator account is created during initial setup:

- **Username**: `admin`
- **Password**: `admin123`
- **Email**: `admin@pos.com`
- **Status**: Active (password reset required on first login)

**Important**: The admin user must change the default password on first login.

## Features

### User Authentication

- The system supports authentication for both new User accounts and legacy Cashier accounts
- JWT tokens now include user access information
- Password reset functionality with validation
- Account status management (active/inactive)

### User Access Control

- Screen-level access permissions (view, create, edit, delete)
- Category-based role assignment
- Default admin has full access to all screens

### Token Structure

JWT tokens now include:
- User ID
- Username
- Name
- User access permissions (list of screens with CRUD permissions)

Example token payload:
```json
{
  "sub": "admin",
  "userId": 1,
  "name": "System Administrator",
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
```

### Login Response

Login responses now include:
- User ID
- Username
- Name
- Email
- Password reset requirement flag
- JWT token
- User categories (roles)
- User access permissions

## API Endpoints

### Login
```
POST /api/auth/login
```

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "success.login.password-reset-required",
  "data": {
    "userId": 1,
    "username": "admin",
    "name": "System Administrator",
    "email": "admin@pos.com",
    "requirePasswordReset": true,
    "token": "eyJhbGciOiJIUzI1NiJ9...",
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

### Reset Password
```
POST /api/auth/reset-password
```

**Request:**
```json
{
  "username": "admin",
  "currentPassword": "admin123",
  "newPassword": "newSecurePassword",
  "confirmPassword": "newSecurePassword"
}
```

## Migration Path

### Backward Compatibility

The system maintains backward compatibility with existing Cashier accounts:
- Existing cashier accounts continue to work without modification
- Authentication checks User table first, then falls back to Cashier table
- JWT tokens for cashiers use the legacy format (cashierId instead of userId)

### Future Migration

A `user_id` column has been added to the `cashiers` table to support future migration:
- Cashiers can be linked to User accounts
- This allows gradual migration from Cashier-based to User-based authentication
- Once all cashiers are migrated, the duplicate authentication fields can be removed from the Cashiers table

## Security Features

- BCrypt password hashing
- Forced password reset on first login for default admin
- Token-based authentication with expiration
- Active/inactive account status checks
- Password validation (must differ from current password)

## Database Migrations

All changes are managed through Liquibase migrations:
- 029-create-users-table.yaml
- 030-create-user-categories-table.yaml
- 031-insert-default-user-categories.yaml
- 032-create-user-category-mapping-table.yaml
- 033-create-user-access-table.yaml
- 034-insert-default-admin-user.yaml
- 035-add-user-id-to-cashiers.yaml

## Testing

Comprehensive unit tests cover:
- User login flow
- Cashier login flow (backward compatibility)
- Password reset for both User and Cashier
- Token-based authentication
- Invalid credentials handling
- Inactive account handling
- Password reset requirement

All tests pass successfully with zero security vulnerabilities detected by CodeQL.
