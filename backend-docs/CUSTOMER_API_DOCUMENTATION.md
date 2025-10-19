# Customer Menu API Documentation

This document provides comprehensive documentation for all Customer Menu APIs as required for the POS system.

## Overview

The Customer Menu allows cashiers to:
- **Add** new customers
- **Update** existing customer information
- **Delete** customers (soft delete)
- **Search** customers by name, email, or phone number
- **View** all customers or only active customers
- **Set Customer** for an order by selecting from the customer list

All APIs require the `X-Tenant-ID` header for multi-tenancy support.

---

## Base URL

```
/api/pos/customers
```

---

## API Endpoints

### 1. Create Customer

**Endpoint:** `POST /api/pos/customers`

**Description:** Creates a new customer in the system.

**Headers:**
- `X-Tenant-ID`: Your tenant identifier (required)
- `Content-Type`: application/json

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "1234567890",
  "address": "123 Main Street, City, State, ZIP",
  "taxNumber": "TAX123456",
  "loyaltyPoints": 0,
  "isActive": true
}
```

**Response (201 Created):**
```json
{
  "code": "success.customer.created",
  "message": "Customer created successfully",
  "timestamp": "2025-10-15T14:30:00Z",
  "path": "/api/pos/customers",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "1234567890",
    "address": "123 Main Street, City, State, ZIP",
    "taxNumber": "TAX123456",
    "loyaltyPoints": 0,
    "isActive": true,
    "createdDate": "2025-10-15T14:30:00Z",
    "lastModifiedDate": "2025-10-15T14:30:00Z"
  }
}
```

**Example:**
```bash
curl -X POST "http://localhost:8080/pos-codex/api/pos/customers" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "1234567890",
    "address": "123 Main Street",
    "taxNumber": "TAX123456",
    "loyaltyPoints": 0,
    "isActive": true
  }'
```

---

### 2. Update Customer

**Endpoint:** `PUT /api/pos/customers/{id}`

**Description:** Updates an existing customer's information.

**Headers:**
- `X-Tenant-ID`: Your tenant identifier (required)
- `Content-Type`: application/json

**Path Parameters:**
- `id`: Customer ID (Long)

**Request Body:**
```json
{
  "name": "John Updated Doe",
  "email": "john.updated@example.com",
  "phone": "9876543210",
  "address": "456 Oak Avenue, Town, State, ZIP",
  "taxNumber": "TAX789012",
  "loyaltyPoints": 50,
  "isActive": true
}
```

**Response (200 OK):**
```json
{
  "code": "success.customer.updated",
  "message": "Customer updated successfully",
  "timestamp": "2025-10-15T14:35:00Z",
  "path": "/api/pos/customers/1",
  "data": {
    "id": 1,
    "name": "John Updated Doe",
    "email": "john.updated@example.com",
    "phone": "9876543210",
    "address": "456 Oak Avenue, Town, State, ZIP",
    "taxNumber": "TAX789012",
    "loyaltyPoints": 50,
    "isActive": true,
    "createdDate": "2025-10-15T14:30:00Z",
    "lastModifiedDate": "2025-10-15T14:35:00Z"
  }
}
```

**Example:**
```bash
curl -X PUT "http://localhost:8080/pos-codex/api/pos/customers/1" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Updated Doe",
    "email": "john.updated@example.com",
    "phone": "9876543210",
    "address": "456 Oak Avenue",
    "taxNumber": "TAX789012",
    "isActive": true
  }'
```

---

### 3. Get Customer by ID

**Endpoint:** `GET /api/pos/customers/{id}`

**Description:** Retrieves a specific customer by their ID.

**Headers:**
- `X-Tenant-ID`: Your tenant identifier (required)

**Path Parameters:**
- `id`: Customer ID (Long)

**Response (200 OK):**
```json
{
  "code": "success",
  "message": "Customer retrieved successfully",
  "timestamp": "2025-10-15T14:40:00Z",
  "path": "/api/pos/customers/1",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "1234567890",
    "address": "123 Main Street, City, State, ZIP",
    "taxNumber": "TAX123456",
    "loyaltyPoints": 100,
    "isActive": true,
    "createdDate": "2025-10-15T14:30:00Z",
    "lastModifiedDate": "2025-10-15T14:35:00Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "code": "error.not.found",
  "message": "Customer not found with id: 999",
  "timestamp": "2025-10-15T14:40:00Z",
  "path": "/api/pos/customers/999"
}
```

**Example:**
```bash
curl -X GET "http://localhost:8080/pos-codex/api/pos/customers/1" \
  -H "X-Tenant-ID: PaPos"
```

---

### 4. Get All Customers

**Endpoint:** `GET /api/pos/customers`

**Description:** Retrieves all customers (both active and inactive) in the system.

**Headers:**
- `X-Tenant-ID`: Your tenant identifier (required)

**Response (200 OK):**
```json
{
  "code": "success",
  "message": "Customers retrieved successfully",
  "timestamp": "2025-10-15T14:45:00Z",
  "path": "/api/pos/customers",
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "1234567890",
      "address": "123 Main Street",
      "taxNumber": "TAX123456",
      "loyaltyPoints": 100,
      "isActive": true
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane.smith@example.com",
      "phone": "5555555555",
      "address": "789 Elm Street",
      "taxNumber": "TAX789012",
      "loyaltyPoints": 50,
      "isActive": false
    }
  ]
}
```

**Example:**
```bash
curl -X GET "http://localhost:8080/pos-codex/api/pos/customers" \
  -H "X-Tenant-ID: PaPos"
```

---

### 5. Get Active Customers

**Endpoint:** `GET /api/pos/customers?active=true`

**Description:** Retrieves only active customers (isActive = true). This is the recommended endpoint for the POS customer selection menu.

**Headers:**
- `X-Tenant-ID`: Your tenant identifier (required)

**Query Parameters:**
- `active`: boolean (true for active customers only)

**Response (200 OK):**
```json
{
  "code": "success",
  "message": "Customers retrieved successfully",
  "timestamp": "2025-10-15T14:50:00Z",
  "path": "/api/pos/customers?active=true",
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "1234567890",
      "address": "123 Main Street",
      "taxNumber": "TAX123456",
      "loyaltyPoints": 100,
      "isActive": true
    },
    {
      "id": 3,
      "name": "Bob Johnson",
      "email": "bob.johnson@example.com",
      "phone": "7777777777",
      "address": "456 Pine Road",
      "taxNumber": "TAX345678",
      "loyaltyPoints": 200,
      "isActive": true
    }
  ]
}
```

**Example:**
```bash
curl -X GET "http://localhost:8080/pos-codex/api/pos/customers?active=true" \
  -H "X-Tenant-ID: PaPos"
```

---

### 6. Search Customers

**Endpoint:** `GET /api/pos/customers/search?term={searchTerm}`

**Description:** Searches for customers by name, email, or phone number. Only returns active customers. This is the primary endpoint for the customer search functionality in the POS menu.

**Headers:**
- `X-Tenant-ID`: Your tenant identifier (required)

**Query Parameters:**
- `term`: Search term (String) - searches in name, email, and phone fields

**Response (200 OK):**
```json
{
  "code": "success",
  "message": "Customers found",
  "timestamp": "2025-10-15T14:55:00Z",
  "path": "/api/pos/customers/search?term=john",
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "1234567890",
      "address": "123 Main Street",
      "taxNumber": "TAX123456",
      "loyaltyPoints": 100,
      "isActive": true
    },
    {
      "id": 4,
      "name": "Johnny Walker",
      "email": "johnny.walker@example.com",
      "phone": "8888888888",
      "address": "321 Maple Ave",
      "taxNumber": "TAX901234",
      "loyaltyPoints": 75,
      "isActive": true
    }
  ]
}
```

**Search Examples:**

**Search by name:**
```bash
curl -X GET "http://localhost:8080/pos-codex/api/pos/customers/search?term=John" \
  -H "X-Tenant-ID: PaPos"
```

**Search by email:**
```bash
curl -X GET "http://localhost:8080/pos-codex/api/pos/customers/search?term=john.doe@example.com" \
  -H "X-Tenant-ID: PaPos"
```

**Search by phone:**
```bash
curl -X GET "http://localhost:8080/pos-codex/api/pos/customers/search?term=1234567890" \
  -H "X-Tenant-ID: PaPos"
```

**Search with partial match:**
```bash
curl -X GET "http://localhost:8080/pos-codex/api/pos/customers/search?term=123" \
  -H "X-Tenant-ID: PaPos"
```

---

### 7. Delete Customer

**Endpoint:** `DELETE /api/pos/customers/{id}`

**Description:** Soft deletes a customer by setting their `isActive` flag to false. The customer record remains in the database but is excluded from active customer lists and searches.

**Headers:**
- `X-Tenant-ID`: Your tenant identifier (required)

**Path Parameters:**
- `id`: Customer ID (Long)

**Response (200 OK):**
```json
{
  "code": "success.customer.deleted",
  "message": "Customer deleted successfully",
  "timestamp": "2025-10-15T15:00:00Z",
  "path": "/api/pos/customers/1",
  "data": null
}
```

**Error Response (404 Not Found):**
```json
{
  "code": "error.not.found",
  "message": "Customer not found with id: 999",
  "timestamp": "2025-10-15T15:00:00Z",
  "path": "/api/pos/customers/999"
}
```

**Example:**
```bash
curl -X DELETE "http://localhost:8080/pos-codex/api/pos/customers/1" \
  -H "X-Tenant-ID: PaPos"
```

---

## Integration with Order Creation

When creating an order in the POS system, the customer ID from the customer selection can be passed in the order creation request:

```json
{
  "outletId": 1,
  "cashierId": 1,
  "customerId": 1,
  "orderType": "COUNTER",
  "items": [...],
  "payments": [...]
}
```

See the [POS Endpoint Documentation](POS_ENDPOINT_GUIDE.md) for more details on order creation.

---

## Search Behavior

The customer search API (`/search?term=`) has the following characteristics:

1. **Case-Insensitive**: Searches are case-insensitive for better user experience
2. **Partial Matching**: Supports partial string matching (e.g., "john" will match "John Doe")
3. **Multi-Field Search**: Searches across name, email, and phone number fields
4. **Active Only**: Only returns customers where `isActive = true`
5. **Wildcard Matching**: Uses SQL LIKE with % wildcards for flexible searching

**Example Search Scenarios:**

| Search Term | Matches |
|-------------|---------|
| "john" | John Doe, Johnny Walker, john@email.com |
| "doe" | John Doe, Jane Doe |
| "123" | All customers with "123" in phone or any field |
| "@example.com" | All customers with example.com email addresses |

---

## Soft Delete Behavior

The delete operation performs a **soft delete**:

- Sets `isActive = false`
- Customer record remains in database
- Excluded from:
  - Active customer lists (`?active=true`)
  - Customer search results
  - Customer selection in POS
- Still accessible via:
  - Get by ID endpoint
  - Get all customers endpoint (without active filter)

This ensures historical order data remains valid and allows for customer reactivation if needed.

---

## Field Validation

### Required Fields:
- `name` (String, max 200 characters)

### Optional Fields:
- `email` (String, max 100 characters)
- `phone` (String, max 20 characters)
- `address` (String, max 500 characters)
- `taxNumber` (String, max 50 characters)
- `loyaltyPoints` (Integer, defaults to 0)
- `isActive` (Boolean, defaults to true)

---

## Error Handling

### Common Error Responses:

**404 Not Found:**
```json
{
  "code": "error.not.found",
  "message": "Customer not found with id: {id}",
  "timestamp": "2025-10-15T15:00:00Z",
  "path": "/api/pos/customers/{id}"
}
```

**400 Bad Request:**
```json
{
  "code": "error.validation",
  "message": "Validation failed",
  "timestamp": "2025-10-15T15:00:00Z",
  "path": "/api/pos/customers",
  "errors": [
    {
      "field": "name",
      "message": "Name is required"
    }
  ]
}
```

---

## Testing

A comprehensive test script is provided at `test-customer-api.sh` which tests all endpoints:

```bash
chmod +x test-customer-api.sh
./test-customer-api.sh
```

This script will:
1. Create customers
2. Update customer information
3. Retrieve customers by ID
4. Get all customers
5. Get active customers
6. Search by name, email, and phone
7. Delete customers
8. Verify soft delete behavior

---

## Summary

The Customer Menu APIs provide complete functionality for:

✅ **Create** - Add new customers to the system  
✅ **Read** - View all customers, active customers, or specific customer by ID  
✅ **Update** - Modify customer information  
✅ **Delete** - Soft delete customers (set inactive)  
✅ **Search** - Find customers by name, email, or phone number  

All APIs support multi-tenancy via the `X-Tenant-ID` header and follow RESTful conventions with standardized response formats.
