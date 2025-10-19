# Backward Compatibility Guide

## Overview

The new message engine and unified response format has been designed to maintain backward compatibility with existing controllers while providing an improved, standardized approach for new development.

## Current State

### Existing Response Format (ApiResponse)

The existing `ApiResponse` class continues to work as before:

```java
public record ApiResponse<T>(
    String code, 
    String message, 
    OffsetDateTime timestamp, 
    String path, 
    T data
)
```

**Example Usage:**
```java
@GetMapping("/{id}")
public ResponseEntity<ApiResponse<Outlet>> getOutlet(
        @PathVariable Long id,
        HttpServletRequest request) {
    Outlet outlet = outletService.getOutletById(id);
    return ResponseEntity.ok(ApiResponse.success(
        "success", 
        "Outlet retrieved successfully", 
        request.getRequestURI(), 
        outlet
    ));
}
```

### New Response Format (UnifiedResponse)

The new `UnifiedResponse` provides enhanced features:

```java
public record UnifiedResponse<T>(
    ResponseStatus status,  // NEW: SUCCESS or ERROR
    String code, 
    String message, 
    OffsetDateTime timestamp, 
    String path, 
    T data,
    List<ValidationError> errors  // NEW: For validation failures
)
```

**Example Usage:**
```java
@GetMapping("/{id}")
public ResponseEntity<UnifiedResponse<Outlet>> getOutlet(
        @PathVariable Long id,
        HttpServletRequest request) {
    Outlet outlet = outletService.getOutletById(id);
    return responseBuilder.success("success", request, outlet);
}
```

## Key Differences

| Feature | ApiResponse (Old) | UnifiedResponse (New) |
|---------|-------------------|------------------------|
| Status Field | ❌ Not present | ✅ SUCCESS/ERROR enum |
| Error Details | ❌ Not present | ✅ Validation errors array |
| Message Resolution | Manual | ✅ Automatic via MessageService |
| Consistency | Manual | ✅ Enforced by ResponseBuilder |
| Logging | Manual | ✅ Automatic in exception handler |

## Migration Strategies

### Strategy 1: Gradual Migration (Recommended)

Continue using `ApiResponse` in existing controllers and adopt `UnifiedResponse` for new endpoints:

**Existing Code (No Changes Required):**
```java
@RestController
@RequestMapping("/api/admin/outlets")
public class OutletController {
    private final OutletService outletService;
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Outlet>> getOutlet(@PathVariable Long id, HttpServletRequest request) {
        Outlet outlet = outletService.getOutletById(id);
        return ResponseEntity.ok(ApiResponse.success("success", "Outlet retrieved", request.getRequestURI(), outlet));
    }
}
```

**New Code (Using New Format):**
```java
@RestController
@RequestMapping("/api/v2/admin/outlets")
public class OutletControllerV2 {
    private final OutletService outletService;
    private final ResponseBuilder responseBuilder;
    
    @GetMapping("/{id}")
    public ResponseEntity<UnifiedResponse<Outlet>> getOutlet(@PathVariable Long id, HttpServletRequest request) {
        Outlet outlet = outletService.getOutletById(id);
        return responseBuilder.success("success", request, outlet);
    }
}
```

### Strategy 2: In-Place Update

Update existing controllers one at a time:

**Before:**
```java
@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService productService;
    
    @PostMapping
    public ResponseEntity<ApiResponse<Product>> createProduct(
            @RequestBody Product product,
            HttpServletRequest request) {
        Product created = productService.createProduct(product);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("success.product.created", 
                      "Product created successfully", 
                      request.getRequestURI(), 
                      created));
    }
}
```

**After:**
```java
@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService productService;
    private final ResponseBuilder responseBuilder;
    
    @PostMapping
    public ResponseEntity<UnifiedResponse<Product>> createProduct(
            @RequestBody Product product,
            HttpServletRequest request) {
        Product created = productService.createProduct(product);
        return responseBuilder.created("success.product.created", request, created);
    }
}
```

### Strategy 3: API Versioning

Create a new API version path for the new format:

```java
// Old API - remains unchanged
@RestController
@RequestMapping("/api/v1/admin/outlets")
public class OutletControllerV1 { ... }

// New API - uses new format
@RestController
@RequestMapping("/api/v2/admin/outlets")
public class OutletControllerV2 { ... }
```

## Exception Handling Changes

### What Changed

The `GlobalExceptionHandler` now returns `UnifiedResponse` instead of `ApiError`:

**Before:**
```java
@ExceptionHandler(EntityNotFoundException.class)
public ResponseEntity<ApiError> handleEntityNotFound(
        EntityNotFoundException ex, 
        HttpServletRequest request) {
    return buildError(HttpStatus.NOT_FOUND, "error.not-found", request, null);
}
```

**After:**
```java
@ExceptionHandler(EntityNotFoundException.class)
public ResponseEntity<UnifiedResponse<Void>> handleEntityNotFound(
        EntityNotFoundException ex, 
        HttpServletRequest request) {
    String message = messageService.getMessage("error.not-found");
    UnifiedResponse<Void> response = UnifiedResponse.error(
        "error.not-found", 
        message, 
        request.getRequestURI()
    );
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
}
```

### Impact on Existing Code

**Controllers:** No changes required - they continue to work with their return types
**Exception Handling:** Automatic - all exceptions are now handled with the new format
**Frontend:** Will need to handle both formats during transition period

## Frontend Compatibility

### Detecting Response Format

Frontend code can detect which format is being used:

```javascript
function handleResponse(response) {
    if (response.status === 'SUCCESS' || response.status === 'ERROR') {
        // New UnifiedResponse format
        return handleUnifiedResponse(response);
    } else {
        // Old ApiResponse format (status field doesn't exist or is different)
        return handleLegacyResponse(response);
    }
}
```

### Unified Handler

Create a wrapper to handle both formats:

```javascript
class ApiResponseHandler {
    static isSuccess(response) {
        // New format
        if (response.status) {
            return response.status === 'SUCCESS';
        }
        // Old format - check HTTP status or assume success if data exists
        return !!response.data;
    }
    
    static getData(response) {
        return response.data;
    }
    
    static getMessage(response) {
        return response.message;
    }
    
    static getErrors(response) {
        // Only in new format
        return response.errors || [];
    }
}

// Usage
const response = await api.getOutlet(1);
if (ApiResponseHandler.isSuccess(response)) {
    const outlet = ApiResponseHandler.getData(response);
    console.log(outlet);
} else {
    const errors = ApiResponseHandler.getErrors(response);
    displayErrors(errors);
}
```

## Testing Both Formats

### Testing Old Format

```java
@Test
void testOldFormatResponse() {
    ResponseEntity<ApiResponse<Outlet>> response = outletController.getOutlet(1L, mockRequest);
    
    assertEquals(HttpStatus.OK, response.getStatusCode());
    assertNotNull(response.getBody());
    assertEquals("success", response.getBody().code());
    assertNotNull(response.getBody().data());
}
```

### Testing New Format

```java
@Test
void testNewFormatResponse() {
    ResponseEntity<UnifiedResponse<Outlet>> response = outletControllerV2.getOutlet(1L, mockRequest);
    
    assertEquals(HttpStatus.OK, response.getStatusCode());
    assertNotNull(response.getBody());
    assertEquals(ResponseStatus.SUCCESS, response.getBody().status());
    assertEquals("success", response.getBody().code());
    assertNotNull(response.getBody().data());
    assertNull(response.getBody().errors());
}
```

## Deprecation Timeline

While both formats work indefinitely, we recommend the following timeline:

### Phase 1: Parallel Support (Current)
- ✅ Both formats work simultaneously
- ✅ New development uses `UnifiedResponse`
- ✅ Existing code continues with `ApiResponse`
- ✅ Documentation covers both approaches

### Phase 2: Gradual Migration (Next 3-6 months)
- Update high-traffic endpoints first
- Update controllers as they're modified for other reasons
- Frontend adapts to handle both formats
- Monitor usage patterns

### Phase 3: Deprecation Notice (6-12 months)
- Mark `ApiResponse` success methods as `@Deprecated`
- Add migration guide warnings in logs
- Provide automated migration tools
- Update all documentation to new format

### Phase 4: Full Migration (12+ months)
- All controllers use `UnifiedResponse`
- Frontend only expects new format
- Remove deprecated code
- Archive old format documentation

## Best Practices During Transition

### For Backend Developers

1. **New Features:** Always use `UnifiedResponse` and `ResponseBuilder`
   ```java
   return responseBuilder.success("success.new-feature", request, data);
   ```

2. **Bug Fixes:** Can remain with existing format unless significant refactoring
   ```java
   return ResponseEntity.ok(ApiResponse.success("success", "Message", request.getRequestURI(), data));
   ```

3. **Refactoring:** Use as opportunity to migrate to new format
   ```java
   // Old
   return ResponseEntity.ok(ApiResponse.success(...));
   
   // New
   return responseBuilder.success(...);
   ```

4. **Documentation:** Note which format each endpoint uses
   ```java
   /**
    * Get outlet by ID
    * Response Format: UnifiedResponse (v2)
    */
   @GetMapping("/{id}")
   public ResponseEntity<UnifiedResponse<Outlet>> getOutlet(...) { ... }
   ```

### For Frontend Developers

1. **Build Adapters:** Create response handlers for both formats
   ```javascript
   const adapter = new ResponseFormatAdapter();
   const data = adapter.extractData(response);
   ```

2. **Version Detection:** Check response structure to determine format
   ```javascript
   const isNewFormat = response.hasOwnProperty('status') && 
                       (response.status === 'SUCCESS' || response.status === 'ERROR');
   ```

3. **Graceful Degradation:** Handle missing fields in old format
   ```javascript
   const errors = response.errors || [];
   const status = response.status || (response.data ? 'SUCCESS' : 'ERROR');
   ```

4. **Feature Detection:** Use new features when available
   ```javascript
   if (response.errors && response.errors.length > 0) {
       // Display detailed validation errors (new format)
       displayValidationErrors(response.errors);
   } else if (response.code === 'error.validation') {
       // Show generic validation message (old format)
       showGenericError(response.message);
   }
   ```

## Common Issues and Solutions

### Issue 1: Type Mismatch in Controller

**Problem:** Controller returns `ApiResponse` but handler returns `UnifiedResponse`

**Solution:** This is expected and works correctly. Controllers can return their declared type, and exception handlers return error responses in the new format.

### Issue 2: Frontend Not Handling New Format

**Problem:** Frontend expects old format and breaks with new errors

**Solution:** Implement the adapter pattern shown above to handle both formats gracefully.

### Issue 3: Message Keys Not Resolving

**Problem:** Message appears as key instead of human-readable text

**Solution:** Ensure message key exists in `messages.properties` and `MessageService` is properly injected.

### Issue 4: Missing Status Field

**Problem:** Response doesn't include `status` field

**Solution:** Ensure controller uses `UnifiedResponse` type and `ResponseBuilder` for creating responses.

## Support and Questions

For questions about migration or backward compatibility:
1. Review this document and `MESSAGE_ENGINE_DOCUMENTATION.md`
2. Check existing examples in the codebase
3. Consult with the backend team
4. Test both formats in your specific use case

## Summary

- ✅ No breaking changes to existing code
- ✅ Both formats work simultaneously
- ✅ New format provides better error handling
- ✅ Gradual migration is supported
- ✅ Frontend can handle both formats
- ✅ Clear timeline for eventual full migration
