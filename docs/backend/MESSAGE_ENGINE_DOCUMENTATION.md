# Message Engine and Response Format Documentation

## Overview

This document describes the comprehensive message engine and standardized response format implemented in the POS Backend system. The implementation provides a consistent, user-friendly API response structure for both success and error scenarios.

## Core Components

### 1. UnifiedResponse

A standardized response wrapper for all API responses that provides consistency across the application.

**Structure:**
```json
{
  "status": "SUCCESS" | "ERROR",
  "code": "message.key",
  "message": "Human-readable message",
  "timestamp": "2025-10-11T07:40:00.000Z",
  "path": "/api/endpoint",
  "data": { ... },  // Present in success responses
  "errors": [ ... ]  // Present in validation error responses
}
```

**Key Features:**
- **status**: Indicates whether the operation was successful or encountered an error
- **code**: Message key for programmatic identification and i18n support
- **message**: Human-readable, localized message for end users
- **timestamp**: ISO 8601 formatted timestamp with UTC timezone
- **path**: The request URI that was accessed
- **data**: The response payload (only in success responses)
- **errors**: Array of validation errors (only in validation failure responses)

### 2. MessageService

Centralized service for resolving localized messages from message properties files.

**Key Methods:**
- `getMessage(String key, Object... args)`: Resolves a message by key with optional formatting arguments
- `getMessageOrDefault(String key, String defaultMessage, Object... args)`: Resolves with a fallback default
- `hasMessage(String key)`: Checks if a message key exists

**Features:**
- Locale-aware message resolution
- Fallback support when keys are not found
- Argument formatting support
- Exception handling with logging

### 3. ResponseBuilder

Utility component for building standardized responses.

**Key Methods:**
- `success(String messageKey, HttpServletRequest request, T data)`: Builds success response with data
- `success(String messageKey, HttpServletRequest request)`: Builds success response without data
- `created(String messageKey, HttpServletRequest request, T data)`: Builds HTTP 201 Created response
- `error(HttpStatus status, String messageKey, HttpServletRequest request)`: Builds error response
- `error(HttpStatus status, String messageKey, HttpServletRequest request, List<ValidationError> errors)`: Builds validation error response

### 4. GlobalExceptionHandler

Comprehensive exception handler that converts exceptions to user-friendly responses.

**Handled Exception Types:**
- `MethodArgumentNotValidException`: Bean validation failures
- `ApplicationException`: Custom business exceptions
- `DataIntegrityViolationException`: Database constraint violations
- `EntityNotFoundException`: Resource not found errors
- `HttpRequestMethodNotSupportedException`: Invalid HTTP methods
- `MissingServletRequestParameterException`: Missing required parameters
- `MethodArgumentTypeMismatchException`: Type conversion errors
- `HttpMessageNotReadableException`: Malformed JSON requests
- `NoResourceFoundException`: 404 resource not found
- `Exception`: Catch-all for unexpected errors

**Features:**
- Automatic logging of all exceptions
- User-friendly error messages
- Detailed validation error information
- Consistent response format

## Response Examples

### Success Response (with data)

**Request:** `GET /api/admin/outlets/1`

**Response:**
```json
{
  "status": "SUCCESS",
  "code": "success",
  "message": "Outlet retrieved successfully",
  "timestamp": "2025-10-11T07:40:00.123Z",
  "path": "/api/admin/outlets/1",
  "data": {
    "id": 1,
    "name": "Main Branch",
    "address": "123 Main St",
    "active": true
  },
  "errors": null
}
```

### Success Response (without data)

**Request:** `DELETE /api/admin/outlets/1`

**Response:**
```json
{
  "status": "SUCCESS",
  "code": "success.outlet.deleted",
  "message": "Outlet has been removed successfully",
  "timestamp": "2025-10-11T07:40:00.123Z",
  "path": "/api/admin/outlets/1",
  "data": null,
  "errors": null
}
```

### Validation Error Response

**Request:** `POST /api/admin/outlets` with invalid data

**Response:**
```json
{
  "status": "ERROR",
  "code": "error.validation",
  "message": "Please review the information you provided and correct any errors before submitting again",
  "timestamp": "2025-10-11T07:40:00.123Z",
  "path": "/api/admin/outlets",
  "data": null,
  "errors": [
    {
      "field": "name",
      "message": "Name is required",
      "rejectedValue": null
    },
    {
      "field": "address",
      "message": "Address must be between 5 and 200 characters",
      "rejectedValue": "123"
    }
  ]
}
```

### Business Logic Error Response

**Request:** `DELETE /api/admin/categories/1` (category has sub-categories)

**Response:**
```json
{
  "status": "ERROR",
  "code": "error.category-in-use",
  "message": "This category cannot be deleted because it contains sub-categories. Please remove or reassign the sub-categories first",
  "timestamp": "2025-10-11T07:40:00.123Z",
  "path": "/api/admin/categories/1",
  "data": null,
  "errors": null
}
```

### Not Found Error Response

**Request:** `GET /api/admin/outlets/999` (doesn't exist)

**Response:**
```json
{
  "status": "ERROR",
  "code": "error.not-found",
  "message": "We couldn't find what you're looking for. It may have been removed or doesn't exist",
  "timestamp": "2025-10-11T07:40:00.123Z",
  "path": "/api/admin/outlets/999",
  "data": null,
  "errors": null
}
```

## Message Keys

### Error Message Categories

#### Generic Errors
- `error.generic`: Unexpected system errors
- `error.not-found`: Resource not found
- `error.bad-request`: Invalid request data
- `error.validation`: Validation failures
- `error.data-integrity`: Database constraint violations
- `error.unauthorized`: Authentication required
- `error.forbidden`: Insufficient permissions

#### HTTP Errors
- `error.method-not-supported`: Invalid HTTP method
- `error.missing-parameter`: Required parameter missing
- `error.type-mismatch`: Parameter type conversion error
- `error.invalid-request-body`: Malformed JSON
- `error.resource-not-found`: 404 not found

#### Business Logic Errors
- `error.category-in-use`: Category has dependencies
- `error.brand-in-use`: Brand has dependencies
- `error.insufficient-stock`: Stock operation would go negative
- `error.duplicate`: Duplicate entry detected

### Success Message Categories

#### Generic Success
- `success.operation.completed`: Generic operation success
- `success.created`: Entity created
- `success.updated`: Entity updated
- `success.deleted`: Entity deleted
- `success.retrieved`: Entity retrieved

#### Entity-Specific Success
- `success.outlet.created/updated/deleted`
- `success.customer.created/updated/deleted`
- `success.product.created/updated/deleted`
- `success.order.created/updated/cancelled/completed`
- `success.stock.adjusted`
- `success.configuration.saved`

## Usage Guidelines for Frontend Developers

### 1. Always Check the Status Field

```javascript
if (response.status === 'SUCCESS') {
  // Handle success
  const data = response.data;
  showSuccessMessage(response.message);
} else {
  // Handle error
  showErrorMessage(response.message);
}
```

### 2. Display User-Friendly Messages

The `message` field is always user-friendly and can be displayed directly to end users:

```javascript
toast.success(response.message);  // For success
toast.error(response.message);    // For errors
```

### 3. Handle Validation Errors

For validation errors, display field-specific messages:

```javascript
if (response.errors && response.errors.length > 0) {
  response.errors.forEach(error => {
    showFieldError(error.field, error.message);
  });
}
```

### 4. Use Message Codes for Programmatic Logic

Use the `code` field for conditional logic or translations:

```javascript
if (response.code === 'error.insufficient-stock') {
  // Show special UI for stock issues
  showStockWarning(response.message);
}
```

### 5. Extract Response Data

Success responses contain data in the `data` field:

```javascript
const outlet = response.data;
console.log(outlet.name);  // Access outlet properties
```

### 6. Display Timestamps

The timestamp is in ISO 8601 format and can be formatted for display:

```javascript
const date = new Date(response.timestamp);
const formattedDate = date.toLocaleString();
```

## Best Practices

### For Backend Developers

1. **Always use message keys**: Never hardcode messages in code
   ```java
   // Good
   throw new ResourceNotFoundException("error.outlet.not-found", outletId);
   
   // Bad
   throw new ResourceNotFoundException("Outlet not found");
   ```

2. **Use ResponseBuilder in controllers**: Maintain consistency
   ```java
   @GetMapping("/{id}")
   public ResponseEntity<UnifiedResponse<Outlet>> getOutlet(
           @PathVariable Long id,
           HttpServletRequest request) {
       Outlet outlet = outletService.getOutletById(id);
       return responseBuilder.success("success", request, outlet);
   }
   ```

3. **Add new messages to messages.properties**: Keep all messages centralized
   ```properties
   success.custom.operation=Your custom operation completed successfully
   ```

4. **Log exceptions appropriately**: Use correct log levels
   ```java
   log.warn("User attempted invalid operation");  // For expected errors
   log.error("Unexpected system error", ex);      // For unexpected errors
   ```

### For Frontend Developers

1. **Check status before accessing data**: Always verify success
   ```javascript
   if (response.status === 'SUCCESS' && response.data) {
     // Safe to access data
   }
   ```

2. **Display all validation errors**: Don't just show the first one
   ```javascript
   response.errors?.forEach(error => {
     showError(error.field, error.message);
   });
   ```

3. **Handle network errors separately**: The unified response is for HTTP responses
   ```javascript
   try {
     const response = await api.getOutlet(id);
     // Handle unified response
   } catch (networkError) {
     // Handle network/connectivity errors
   }
   ```

4. **Cache message codes for offline support**: Consider storing common messages
   ```javascript
   const messageCache = {
     'error.not-found': 'Item not found',
     'success.updated': 'Updated successfully'
   };
   ```

## Internationalization (i18n)

The system supports multiple languages through message properties files:

1. **Default**: `messages.properties` (English)
2. **Other languages**: `messages_fr.properties`, `messages_es.properties`, etc.

The locale is automatically detected from the request headers (`Accept-Language`).

## Testing

### Testing Exception Handling

```java
@Test
void testValidationError() {
    // Test validation with invalid data
    // Verify response has status=ERROR
    // Verify errors array is populated
}

@Test
void testBusinessLogicError() {
    // Test business rule violation
    // Verify correct error code
    // Verify user-friendly message
}
```

### Testing Message Resolution

```java
@Test
void testMessageResolution() {
    String message = messageService.getMessage("error.not-found");
    assertNotNull(message);
    assertNotEquals("error.not-found", message); // Should be resolved
}
```

## Migration Guide

For existing code using the old `ApiResponse` format:

### Old Format (Still Supported)
```java
return ResponseEntity.ok(ApiResponse.success("success", "Message", request.getRequestURI(), data));
```

### New Format (Recommended)
```java
return responseBuilder.success("success", request, data);
```

Both formats work, but the new format is recommended for consistency and better error handling.

## Troubleshooting

### Message Not Resolving
- Check if the key exists in `messages.properties`
- Verify the MessageSource bean is configured
- Check for typos in message keys

### Validation Errors Not Showing
- Ensure `@Valid` annotation is present on controller method parameters
- Verify validation constraints on DTOs/entities
- Check if GlobalExceptionHandler is active

### Wrong HTTP Status Codes
- Verify the correct exception type is being thrown
- Check if custom ApplicationException sets the right status
- Review GlobalExceptionHandler mappings

## Future Enhancements

Planned improvements:
1. Support for multiple locales with automatic detection
2. Error code documentation endpoint
3. Client-side error code registry
4. Automated message key validation in CI/CD
5. Error analytics and monitoring integration
