# Response Format Quick Reference

## For Frontend Developers

### Response Structure

All API responses follow this structure:

```typescript
interface UnifiedResponse<T> {
  status: 'SUCCESS' | 'ERROR';
  code: string;           // Message key for programmatic use
  message: string;        // Human-readable message
  timestamp: string;      // ISO 8601 format
  path: string;          // Request URI
  data?: T;              // Present in success responses
  errors?: ValidationError[];  // Present in validation failures
}

interface ValidationError {
  field: string;         // Field name that failed validation
  message: string;       // Error message for this field
  rejectedValue?: any;   // The value that was rejected
}
```

### Quick Examples

#### 1. Success Response
```json
{
  "status": "SUCCESS",
  "code": "success.outlet.created",
  "message": "Outlet has been created successfully",
  "timestamp": "2025-10-11T07:40:00.123Z",
  "path": "/api/admin/outlets",
  "data": { "id": 1, "name": "Main Branch" }
}
```

#### 2. Validation Error Response
```json
{
  "status": "ERROR",
  "code": "error.validation",
  "message": "Please review the information you provided...",
  "timestamp": "2025-10-11T07:40:00.123Z",
  "path": "/api/admin/outlets",
  "errors": [
    {
      "field": "name",
      "message": "Outlet name is required",
      "rejectedValue": null
    },
    {
      "field": "email",
      "message": "Invalid email format",
      "rejectedValue": "invalid-email"
    }
  ]
}
```

#### 3. Business Error Response
```json
{
  "status": "ERROR",
  "code": "error.insufficient-stock",
  "message": "This operation would result in negative stock",
  "timestamp": "2025-10-11T07:40:00.123Z",
  "path": "/api/admin/stock/adjust"
}
```

#### 4. Not Found Response
```json
{
  "status": "ERROR",
  "code": "error.not-found",
  "message": "We couldn't find what you're looking for",
  "timestamp": "2025-10-11T07:40:00.123Z",
  "path": "/api/admin/outlets/999"
}
```

### Frontend Code Templates

#### React/TypeScript Example

```typescript
// Type definitions
interface ApiResponse<T> {
  status: 'SUCCESS' | 'ERROR';
  code: string;
  message: string;
  timestamp: string;
  path: string;
  data?: T;
  errors?: ValidationError[];
}

interface ValidationError {
  field: string;
  message: string;
  rejectedValue?: any;
}

// API call with error handling
async function fetchOutlet(id: number): Promise<Outlet> {
  try {
    const response = await fetch(`/api/admin/outlets/${id}`);
    const result: ApiResponse<Outlet> = await response.json();
    
    if (result.status === 'SUCCESS') {
      toast.success(result.message);
      return result.data!;
    } else {
      toast.error(result.message);
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Failed to fetch outlet:', error);
    throw error;
  }
}

// Form submission with validation error handling
async function createOutlet(data: OutletFormData): Promise<Outlet> {
  try {
    const response = await fetch('/api/admin/outlets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result: ApiResponse<Outlet> = await response.json();
    
    if (result.status === 'SUCCESS') {
      toast.success(result.message);
      return result.data!;
    } else {
      // Handle validation errors
      if (result.errors && result.errors.length > 0) {
        result.errors.forEach(error => {
          setFieldError(error.field, error.message);
        });
      } else {
        toast.error(result.message);
      }
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Failed to create outlet:', error);
    throw error;
  }
}
```

#### Vue.js Example

```javascript
// Composable for API calls
import { ref } from 'vue';
import { useToast } from '@/composables/useToast';

export function useApi() {
  const toast = useToast();
  const loading = ref(false);
  const errors = ref({});

  async function call(endpoint, options = {}) {
    loading.value = true;
    errors.value = {};
    
    try {
      const response = await fetch(endpoint, options);
      const result = await response.json();
      
      if (result.status === 'SUCCESS') {
        toast.success(result.message);
        return result.data;
      } else {
        // Handle validation errors
        if (result.errors) {
          result.errors.forEach(error => {
            errors.value[error.field] = error.message;
          });
        }
        toast.error(result.message);
        throw new Error(result.message);
      }
    } finally {
      loading.value = false;
    }
  }

  return { call, loading, errors };
}

// Usage in component
const { call, loading, errors } = useApi();

async function handleSubmit(formData) {
  try {
    const outlet = await call('/api/admin/outlets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    console.log('Created outlet:', outlet);
  } catch (error) {
    // Error already displayed via toast
    console.error(error);
  }
}
```

#### Axios Interceptor Example

```javascript
import axios from 'axios';
import { toast } from '@/utils/toast';

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

// Response interceptor
api.interceptors.response.use(
  (response) => {
    const result = response.data;
    
    if (result.status === 'SUCCESS') {
      // Optionally show success toast
      if (response.config.showSuccessToast) {
        toast.success(result.message);
      }
      return result.data; // Return just the data
    }
    
    return response;
  },
  (error) => {
    if (error.response) {
      const result = error.response.data;
      
      // Handle validation errors
      if (result.errors && result.errors.length > 0) {
        const validationErrors = {};
        result.errors.forEach(err => {
          validationErrors[err.field] = err.message;
        });
        error.validationErrors = validationErrors;
      }
      
      // Show error toast
      toast.error(result.message || 'An error occurred');
    } else {
      // Network error
      toast.error('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

// Usage
async function createOutlet(data) {
  try {
    const outlet = await api.post('/admin/outlets', data, {
      showSuccessToast: true
    });
    return outlet;
  } catch (error) {
    if (error.validationErrors) {
      // Display field-specific errors
      Object.entries(error.validationErrors).forEach(([field, message]) => {
        setFieldError(field, message);
      });
    }
    throw error;
  }
}
```

### Common Response Codes

#### Success Codes
- `success` - Generic success
- `success.created` - Entity created
- `success.updated` - Entity updated
- `success.deleted` - Entity deleted
- `success.retrieved` - Entity retrieved
- `success.outlet.created/updated/deleted`
- `success.product.created/updated/deleted`
- `success.customer.created/updated/deleted`
- `success.order.created/updated/cancelled/completed`

#### Error Codes
- `error.generic` - Unexpected error
- `error.validation` - Validation failed
- `error.not-found` - Resource not found
- `error.unauthorized` - Authentication required
- `error.forbidden` - Insufficient permissions
- `error.data-integrity` - Database constraint violation
- `error.insufficient-stock` - Stock operation would go negative
- `error.duplicate` - Duplicate entry
- `error.method-not-supported` - Invalid HTTP method
- `error.invalid-request-body` - Malformed JSON

### Best Practices

#### 1. Always Check Status
```javascript
if (response.status === 'SUCCESS') {
  // Handle success
} else {
  // Handle error
}
```

#### 2. Display User-Friendly Messages
```javascript
// Always display the message field
toast.info(response.message);
```

#### 3. Handle Validation Errors
```javascript
if (response.errors && response.errors.length > 0) {
  response.errors.forEach(error => {
    showFieldError(error.field, error.message);
  });
}
```

#### 4. Use Code for Logic
```javascript
if (response.code === 'error.insufficient-stock') {
  showStockWarning();
} else {
  showGenericError(response.message);
}
```

#### 5. Log for Debugging
```javascript
console.log('API Response:', {
  code: response.code,
  status: response.status,
  path: response.path,
  timestamp: response.timestamp
});
```

### Testing Response Format

```javascript
describe('API Response Format', () => {
  it('should have correct structure for success', async () => {
    const response = await api.get('/outlets/1');
    
    expect(response.status).toBe('SUCCESS');
    expect(response.code).toBeDefined();
    expect(response.message).toBeDefined();
    expect(response.timestamp).toBeDefined();
    expect(response.path).toBeDefined();
    expect(response.data).toBeDefined();
  });

  it('should have validation errors on validation failure', async () => {
    const response = await api.post('/outlets', { /* invalid data */ });
    
    expect(response.status).toBe('ERROR');
    expect(response.code).toBe('error.validation');
    expect(response.errors).toBeInstanceOf(Array);
    expect(response.errors[0]).toHaveProperty('field');
    expect(response.errors[0]).toHaveProperty('message');
  });

  it('should have error message on business error', async () => {
    const response = await api.delete('/categories/1');
    
    expect(response.status).toBe('ERROR');
    expect(response.code).toBeDefined();
    expect(response.message).toBeDefined();
  });
});
```

### Error Handling Checklist

- [ ] Check `status` field before accessing data
- [ ] Display `message` to user
- [ ] Handle `errors` array for validation failures
- [ ] Use `code` for conditional logic
- [ ] Log `path` and `timestamp` for debugging
- [ ] Handle network errors separately
- [ ] Show appropriate UI feedback
- [ ] Clear previous errors before new request

### Common Mistakes to Avoid

❌ **Don't assume success based on HTTP status code alone**
```javascript
// Wrong
if (response.status === 200) {
  const data = response.data;
}
```

✅ **Always check the status field**
```javascript
// Correct
if (response.status === 'SUCCESS') {
  const data = response.data;
}
```

❌ **Don't ignore validation errors**
```javascript
// Wrong
toast.error(response.message);
```

✅ **Display field-specific errors**
```javascript
// Correct
if (response.errors) {
  response.errors.forEach(error => {
    showFieldError(error.field, error.message);
  });
} else {
  toast.error(response.message);
}
```

❌ **Don't hardcode messages**
```javascript
// Wrong
toast.success('Outlet created successfully');
```

✅ **Use the message from response**
```javascript
// Correct
toast.success(response.message);
```

### Support

For questions or issues:
- Review `MESSAGE_ENGINE_DOCUMENTATION.md` for detailed documentation
- Check `BACKWARD_COMPATIBILITY.md` for migration guide
- Review example controller in `ExampleNewPatternController.java`
- Contact backend team for clarification
