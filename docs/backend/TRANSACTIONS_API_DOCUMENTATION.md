# Transactions API Documentation

## Overview

The Transactions API allows you to view all transactions created at the Point of Sale, showing the inflow and outflow of funds through the outlet. This API provides comprehensive filtering capabilities to refine transactions as required.

## Base URL

```
/api/admin/transactions
```

## Authentication

All requests require a valid tenant identifier in the request header:

```
X-Tenant-ID: your-tenant-id
```

## Endpoints

### Get All Transactions

Retrieves all transactions with comprehensive details including outlet and cashier information.

**Endpoint:** `GET /api/admin/transactions`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `outletId` | Long | No | Filter transactions by specific outlet |
| `transactionType` | String | No | Filter by transaction type (CASH_IN, CASH_OUT, OPENING_BALANCE, CLOSING_BALANCE, EXPENSE, REFUND) |
| `cashierId` | Long | No | Filter transactions by specific cashier |
| `startDate` | ISO 8601 DateTime | No | Filter transactions from this date |
| `endDate` | ISO 8601 DateTime | No | Filter transactions until this date |

**Response Status Codes:**

- `200 OK` - Transactions retrieved successfully
- `400 Bad Request` - Invalid query parameters
- `401 Unauthorized` - Missing or invalid tenant ID
- `500 Internal Server Error` - Server error

**Response Body:**

```json
{
  "status": "SUCCESS",
  "code": "success",
  "message": "Transactions retrieved successfully",
  "timestamp": "2025-10-14T17:00:00Z",
  "path": "/api/admin/transactions",
  "data": [
    {
      "id": 1,
      "transactionType": "CASH_IN",
      "amount": 100.00,
      "description": "Opening cash drawer",
      "referenceNumber": "REF-001",
      "transactionDate": "2025-10-14T08:00:00Z",
      "createdDate": "2025-10-14T08:00:00Z",
      "outletId": 1,
      "outletName": "Main Store",
      "outletCode": "MS001",
      "cashierId": 5,
      "cashierName": "John Doe",
      "cashierUsername": "johndoe"
    }
  ]
}
```

### Get Transaction by ID

Retrieves a specific transaction by its ID.

**Endpoint:** `GET /api/admin/transactions/{id}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | Long | Yes | Transaction unique identifier |

**Response Status Codes:**

- `200 OK` - Transaction retrieved successfully
- `404 Not Found` - Transaction not found
- `401 Unauthorized` - Missing or invalid tenant ID

### Create Transaction

Creates a new transaction record.

**Endpoint:** `POST /api/admin/transactions`

**Request Body:**

```json
{
  "outlet": {
    "id": 1
  },
  "cashier": {
    "id": 5
  },
  "transactionType": "CASH_IN",
  "amount": 100.00,
  "description": "Opening cash drawer",
  "referenceNumber": "REF-001"
}
```

**Response Status Codes:**

- `201 Created` - Transaction created successfully
- `400 Bad Request` - Invalid request body
- `401 Unauthorized` - Missing or invalid tenant ID

## Transaction Types

The following transaction types are supported:

| Type | Description |
|------|-------------|
| `CASH_IN` | Money added to the cash drawer |
| `CASH_OUT` | Money removed from the cash drawer |
| `OPENING_BALANCE` | Opening balance at the start of a shift |
| `CLOSING_BALANCE` | Closing balance at the end of a shift |
| `EXPENSE` | Business expenses paid from the cash drawer |
| `REFUND` | Refunds issued to customers |

## Usage Examples

### Example 1: Get All Transactions

```bash
curl -X GET "http://localhost:8080/api/admin/transactions" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant1"
```

### Example 2: Get Transactions for Specific Outlet

```bash
curl -X GET "http://localhost:8080/api/admin/transactions?outletId=1" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant1"
```

### Example 3: Get Transactions by Type

```bash
curl -X GET "http://localhost:8080/api/admin/transactions?transactionType=CASH_IN" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant1"
```

### Example 4: Get Transactions by Outlet and Type

```bash
curl -X GET "http://localhost:8080/api/admin/transactions?outletId=1&transactionType=EXPENSE" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant1"
```

### Example 5: Get Transactions by Date Range

```bash
curl -X GET "http://localhost:8080/api/admin/transactions?startDate=2025-10-01T00:00:00Z&endDate=2025-10-14T23:59:59Z" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant1"
```

### Example 6: Get Transactions by Outlet and Date Range

```bash
curl -X GET "http://localhost:8080/api/admin/transactions?outletId=1&startDate=2025-10-01T00:00:00Z&endDate=2025-10-14T23:59:59Z" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant1"
```

### Example 7: Get Transactions by Cashier

```bash
curl -X GET "http://localhost:8080/api/admin/transactions?cashierId=5" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant1"
```

### Example 8: Create a Transaction

```bash
curl -X POST "http://localhost:8080/api/admin/transactions" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant1" \
  -d '{
    "outlet": {"id": 1},
    "cashier": {"id": 5},
    "transactionType": "CASH_IN",
    "amount": 100.00,
    "description": "Opening cash drawer",
    "referenceNumber": "REF-001"
  }'
```

## Response Format

All API responses follow a standardized format:

```json
{
  "status": "SUCCESS" | "ERROR",
  "code": "success" | "error_code",
  "message": "Human-readable message",
  "timestamp": "2025-10-14T17:00:00Z",
  "path": "/api/admin/transactions",
  "data": {} | []
}
```

### Success Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `status` | String | Always "SUCCESS" for successful requests |
| `code` | String | Success code (e.g., "success", "success.transaction.created") |
| `message` | String | Human-readable success message |
| `timestamp` | ISO 8601 DateTime | Response timestamp |
| `path` | String | API endpoint path |
| `data` | Object/Array | Response data (transaction or list of transactions) |

### Transaction DTO Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | Long | Transaction unique identifier |
| `transactionType` | String | Type of transaction |
| `amount` | BigDecimal | Transaction amount |
| `description` | String | Description of the transaction (optional) |
| `referenceNumber` | String | Reference number (optional) |
| `transactionDate` | ISO 8601 DateTime | When the transaction occurred |
| `createdDate` | ISO 8601 DateTime | When the record was created |
| `outletId` | Long | Outlet unique identifier |
| `outletName` | String | Name of the outlet |
| `outletCode` | String | Outlet code |
| `cashierId` | Long | Cashier unique identifier (optional) |
| `cashierName` | String | Cashier name (optional) |
| `cashierUsername` | String | Cashier username (optional) |

## Error Handling

Errors are returned in the following format:

```json
{
  "status": "ERROR",
  "code": "error.resource.not.found",
  "message": "Transaction not found with id: 999",
  "timestamp": "2025-10-14T17:00:00Z",
  "path": "/api/admin/transactions/999",
  "data": null
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `error.resource.not.found` | Transaction not found |
| `error.invalid.request` | Invalid request parameters |
| `error.unauthorized` | Missing or invalid tenant ID |
| `error.validation` | Validation error in request body |
| `error.internal` | Internal server error |

## Best Practices

1. **Date Ranges**: When using date range filters, always provide both `startDate` and `endDate`
2. **Timezone**: All dates should be in ISO 8601 format with timezone information (e.g., `2025-10-14T00:00:00Z`)
3. **Pagination**: For large datasets, consider implementing pagination on the client side
4. **Error Handling**: Always check the `status` field in the response before processing data
5. **Tenant ID**: Always include the `X-Tenant-ID` header in all requests

## Testing

A test script is provided at `test-transactions-api.sh` to test all API endpoints. Run it with:

```bash
./test-transactions-api.sh
```

Make sure the server is running before executing the test script.

## Related Documentation

- [Transactions Submenu Feature](TRANSACTIONS_SUBMENU_FEATURE.md) - Detailed implementation guide
- [API Documentation](API_DOCUMENTATION.md) - Complete API reference
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md) - Overall system implementation details
