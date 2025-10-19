# Circular Dependency Fix

## Problem
The application had a circular dependency between three Spring beans that prevented it from starting:

```
┌─────┐
|  jwtAuthenticationFilter
↑     ↓
|  authenticationService
↑     ↓
|  securityConfig
└─────┘
```

### Dependency Chain
1. `SecurityConfig` creates and depends on `JwtAuthenticationFilter`
2. `JwtAuthenticationFilter` depends on `AuthenticationService`
3. `AuthenticationService` depends on `PasswordEncoder` (which was defined in `SecurityConfig`)

This created a circular dependency: SecurityConfig → JwtAuthenticationFilter → AuthenticationService → SecurityConfig

## Solution
The circular dependency was resolved by extracting the `PasswordEncoder` bean into a separate configuration class:

### Changes Made
1. **Created `PasswordEncoderConfig.java`**
   - New configuration class containing only the `PasswordEncoder` bean
   - No dependencies on other beans, breaking the circular dependency chain

2. **Modified `SecurityConfig.java`**
   - Removed the `PasswordEncoder` bean method
   - Removed unused imports
   - SecurityConfig now only depends on filters (JwtAuthenticationFilter and TenantRequestFilter)

### New Dependency Chain
After the fix, the dependency chain is linear:
```
SecurityConfig → JwtAuthenticationFilter → AuthenticationService → PasswordEncoder (from PasswordEncoderConfig)
```

## Benefits
- ✅ Application starts without circular dependency errors
- ✅ Follows Spring best practices (separation of concerns)
- ✅ No behavioral changes - all functionality remains the same
- ✅ All existing tests continue to pass
- ✅ Added new unit tests for the PasswordEncoderConfig

## Testing
- All 16 tests in `AuthenticationServiceTest` pass
- All 3 tests in `PasswordEncoderConfigTest` pass
- No security vulnerabilities introduced (verified with CodeQL)

## References
- Spring Boot Documentation: [Circular Dependencies](https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#beans-dependency-resolution)
