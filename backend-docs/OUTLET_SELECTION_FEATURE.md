# Outlet Selection Screen Feature

## Overview

This feature enables cashiers to select an outlet after successful login. The implementation provides an API endpoint that retrieves all outlets assigned to a specific cashier, allowing them to choose which outlet they will work from.

## Problem Statement

Upon logging in successfully, the cashier will be provided with a list of allocated outlets and must choose the specific outlet where they will work. Once the outlet is selected, all the data will be fed for that specific outlet.

## Implementation

### API Endpoint

**Endpoint:** `GET /api/pos/cashier/{username}/outlets`

**Description:** Retrieves all outlets assigned to a cashier by their username.

**Headers:**
- `X-Tenant-ID`: Your tenant identifier (required)

**Path Parameters:**
- `username`: The cashier's username (required)

**Response Format:**
```json
{
  "code": "success",
  "message": "Cashier outlets retrieved successfully",
  "timestamp": "2025-10-15T13:50:00Z",
  "path": "/api/pos/cashier/johndoe/outlets",
  "data": [
    {
      "id": 1,
      "name": "Main Store",
      "code": "MAIN001",
      "mode": "GROCERY_RETAIL",
      "address": "123 Main Street",
      "phone": "555-0100",
      "email": "main@store.com",
      "isActive": true,
      "createdAt": "2025-10-11T08:00:00Z",
      "updatedAt": "2025-10-11T08:00:00Z"
    }
  ]
}
```

### Code Changes

#### 1. Service Layer (`CashierService.java`)

Added new method to retrieve outlets by cashier username:

```java
@Transactional(readOnly = true)
public Set<Outlet> getCashierOutletsByUsername(String username) {
    Cashier cashier = getCashierByUsername(username);
    return cashier.getAssignedOutlets();
}
```

#### 2. Controller Layer (`PosController.java`)

Added new endpoint to expose the functionality:

```java
@GetMapping("/cashier/{username}/outlets")
public ResponseEntity<ApiResponse<Set<Outlet>>> getCashierOutletsByUsername(
        @PathVariable String username,
        HttpServletRequest request) {
    Set<Outlet> outlets = cashierService.getCashierOutletsByUsername(username);
    return ResponseEntity.ok(ApiResponse.success("success", "Cashier outlets retrieved successfully", 
            request.getRequestURI(), outlets));
}
```

#### 3. Tests

Added comprehensive tests for both service and controller layers:

**CashierServiceTest:**
- `testGetCashierOutletsByUsername_Success`: Tests successful retrieval of outlets
- `testGetCashierOutletsByUsername_CashierNotFound_ThrowsException`: Tests error handling when cashier doesn't exist

**PosControllerTest:**
- `testGetCashierOutletsByUsername_ReturnsOutlets`: Tests endpoint with outlets
- `testGetCashierOutletsByUsername_EmptyOutlets_ReturnsEmptySet`: Tests endpoint with no outlets

## Usage Flow

1. **Login**: Cashier logs in with username and password (authentication flow - separate feature)
2. **Fetch Outlets**: After successful login, the frontend calls `GET /api/pos/cashier/{username}/outlets`
3. **Display Selection**: The frontend displays the list of outlets to the cashier
4. **Select Outlet**: Cashier selects one outlet from the list
5. **Store Selection**: The selected outlet ID is stored in the session/local state
6. **Scoped Operations**: All subsequent POS operations (products, orders, transactions) use the selected outlet ID

## Example Usage

### Using curl:
```bash
curl -X GET "http://localhost:8080/pos-codex/api/pos/cashier/johndoe/outlets" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json"
```

### Using the test script:
```bash
./test-outlet-selection-api.sh
```

### Frontend Integration (React/TypeScript example):
```typescript
async function fetchCashierOutlets(username: string): Promise<Outlet[]> {
  try {
    const response = await fetch(`/api/pos/cashier/${username}/outlets`, {
      method: 'GET',
      headers: {
        'X-Tenant-ID': 'PaPos',
        'Content-Type': 'application/json'
      }
    });
    
    const result: ApiResponse<Outlet[]> = await response.json();
    
    if (result.status === 'SUCCESS') {
      return result.data || [];
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Failed to fetch cashier outlets:', error);
    throw error;
  }
}

// In the outlet selection component
const outlets = await fetchCashierOutlets(username);
// Display outlets in a dropdown or list for selection
```

## Error Handling

### Cashier Not Found (404)
```json
{
  "code": "error.resource.not.found",
  "message": "Cashier not found with username: johndoe",
  "timestamp": "2025-10-15T13:50:00Z",
  "path": "/api/pos/cashier/johndoe/outlets",
  "data": null
}
```

## Notes

- The endpoint returns only outlets explicitly assigned to the cashier via the admin panel
- If the cashier has no assigned outlets, an empty array is returned
- The outlet selection must be made before proceeding with POS operations
- Once an outlet is selected, it should be included in subsequent API calls as needed
- The endpoint is under the `/api/pos` path, indicating it's part of the POS (cashier-facing) APIs, not admin APIs

## Admin Configuration

Before a cashier can see outlets in the selection screen, an admin must:

1. Create outlets via `POST /api/admin/outlets`
2. Create a cashier via `POST /api/admin/cashiers`
3. Assign outlets to the cashier via `POST /api/admin/cashiers/{id}/outlets/{outletId}`

Example admin workflow:
```bash
# 1. Create outlet
curl -X POST "http://localhost:8080/pos-codex/api/admin/outlets" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Store",
    "code": "MAIN001",
    "mode": "GROCERY_RETAIL",
    "address": "123 Main Street",
    "phone": "555-0100",
    "email": "main@store.com"
  }'

# 2. Create cashier
curl -X POST "http://localhost:8080/pos-codex/api/admin/cashiers" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "username": "johndoe",
    "password": "password123",
    "email": "john@example.com"
  }'

# 3. Assign outlet to cashier
curl -X POST "http://localhost:8080/pos-codex/api/admin/cashiers/1/outlets/1" \
  -H "X-Tenant-ID: PaPos"
```

## Testing

Run the tests with:
```bash
# Test service layer
mvn test -Dtest=CashierServiceTest

# Test controller layer
mvn test -Dtest=PosControllerTest

# Run all tests (excluding integration tests)
mvn test -Dtest='!PosBackendApplicationTests'
```

All tests pass successfully, confirming the implementation is correct.
