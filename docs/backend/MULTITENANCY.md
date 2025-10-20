# Multitenancy Configuration Guide

This document describes the multitenancy implementation in the POS Backend application.

## Overview

The application supports database-per-tenant multitenancy using Hibernate's multitenancy support with separate datasources for each tenant.

## Architecture

### Components

1. **MultiTenantProperties** (`com.pos.config.MultiTenantProperties`)
   - Configuration properties for tenant datasources
   - Defined in `application.yml` under `multitenancy` prefix
   - Supports multiple tenant configurations

2. **MultiTenantConnectionProviderImpl** (`com.pos.tenant.MultiTenantConnectionProviderImpl`)
   - Provides tenant-specific datasource connections
   - Falls back to default tenant if requested tenant is not found
   - Includes logging for datasource resolution

3. **TenantIdentifierResolver** (`com.pos.tenant.TenantIdentifierResolver`)
   - Resolves current tenant ID from thread-local context
   - Returns default tenant if no tenant context is set

4. **TenantRequestFilter** (`com.pos.tenant.TenantRequestFilter`)
   - Servlet filter that extracts tenant ID from HTTP headers
   - Header: `X-Tenant-ID`
   - Extracts user information from JWT token via RequestUserContext
   - Clears thread-local context after request processing

5. **MultiTenantConfig** (`com.pos.config.MultiTenantConfig`)
   - Spring configuration for multitenancy beans
   - Creates HikariCP datasource pools for each tenant
   - Configures Hibernate multitenancy properties

6. **MultiTenantLiquibaseRunner** (`com.pos.config.MultiTenantLiquibaseRunner`)
   - Runs Liquibase migrations for all configured tenants
   - Executes on application startup
   - Provides detailed logging for migration status

## Configuration

### Application Properties

```yaml
multitenancy:
  default-tenant: PaPos
  tenants:
    - id: PaPos
      url: jdbc:mysql://localhost:3306/PaPos_posdb?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC
      username: root
      password: root
    - id: tenantA
      url: jdbc:mysql://localhost:3306/tenantA_posdb?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC
      username: root
      password: root
```

### Connection Pool Settings

Each tenant datasource is configured with the following HikariCP optimizations:

- **Maximum Pool Size**: 10 connections
- **Minimum Idle**: 2 connections
- **Connection Timeout**: 30 seconds
- **Idle Timeout**: 10 minutes
- **Max Lifetime**: 30 minutes
- **Leak Detection Threshold**: 60 seconds

### MySQL-Specific Optimizations

For MySQL datasources, the following properties are automatically configured:

- `allowPublicKeyRetrieval=true` - Allows connection to MySQL 8+
- `cachePrepStmts=true` - Enables prepared statement caching
- `prepStmtCacheSize=250` - Cache size for prepared statements
- `prepStmtCacheSqlLimit=2048` - SQL limit for cached statements
- `useServerPrepStmts=true` - Uses server-side prepared statements

## Usage

### Client Request Headers

Clients must include the tenant ID in the request header:

```
X-Tenant-ID: PaPos
Authorization: Bearer <your-jwt-token>
```

For authentication details, see [AUTHENTICATION_API_DOCUMENTATION.md](AUTHENTICATION_API_DOCUMENTATION.md)

### CORS Configuration

The application is configured to allow the following headers:
- `Authorization`
- `Content-Type`
- `X-Tenant-ID`

Current allowed origin: `http://localhost:5173`

### Adding a New Tenant

1. Add tenant configuration to `application.yml`:
```yaml
multitenancy:
  tenants:
    - id: newTenant
      url: jdbc:mysql://localhost:3306/newTenant_db?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC
      username: db_user
      password: db_password
```

2. Restart the application - Liquibase will automatically run migrations for the new tenant

## Thread Safety

- **TenantContext**: Uses `ThreadLocal<String>` to store tenant ID per request thread
- **RequestUserContext**: Uses `ThreadLocal<String>` to store user information per request thread
- Both contexts are cleared after each request in the filter's `finally` block

## Database Migrations

Liquibase migrations are automatically executed for all configured tenants on application startup. The `MultiTenantLiquibaseRunner` component:

- Validates tenant datasources before running migrations
- Logs success/failure for each tenant
- Provides detailed error information if migrations fail
- Tracks migration counts (success and failures)

## Error Handling

- Invalid tenant IDs fall back to the default tenant with a warning log
- Missing datasources are logged and skipped during Liquibase migrations
- Connection pool issues are logged with leak detection enabled

## Performance Optimizations

### JPA/Hibernate
- Batch inserts and updates enabled (batch size: 20)
- Statement ordering for better performance
- Statistics generation disabled for production

### Connection Pooling
- Optimized pool sizes per tenant
- Connection leak detection enabled
- Prepared statement caching for MySQL

## Monitoring and Logging

Enable debug logging for multitenancy components:

```yaml
logging:
  level:
    "[com.pos.tenant]": DEBUG
    "[com.pos.config]": DEBUG
```

This will provide detailed logs for:
- Tenant context resolution
- Datasource selection
- User context management
- Liquibase migration progress

## Security Considerations

1. **Tenant Isolation**: Each tenant has a separate database ensuring data isolation
2. **Connection Security**: Use SSL for production databases
3. **Credentials**: Store database credentials securely (use environment variables or secret management)
4. **CORS**: Update allowed origins for production environments
5. **Filter Order**: TenantRequestFilter is executed before authentication filters

## Troubleshooting

### Common Issues

1. **"No datasource configured for tenant X"**
   - Verify tenant configuration in `application.yml`
   - Check tenant ID matches configuration exactly (case-sensitive)

2. **Connection refused errors**
   - Verify database server is running
   - Check connection URL, username, and password
   - Ensure database exists or `createDatabaseIfNotExist=true` is set

3. **Liquibase migration failures**
   - Check changelog file path: `classpath:db/changelog/db.changelog-master.yaml`
   - Verify database permissions for schema creation
   - Review logs for specific migration errors

4. **Thread context not cleared**
   - Ensure filter is properly registered in the security chain
   - Check for exceptions in request processing

## Best Practices

1. Always use the default tenant as a fallback configuration
2. Test tenant switching thoroughly in integration tests
3. Monitor connection pool metrics in production
4. Use environment-specific configuration for tenant datasources
5. Implement tenant validation before processing sensitive operations
6. Log tenant context at the start of important operations for audit trails
