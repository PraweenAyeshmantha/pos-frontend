# Transactions Submenu Feature

## Overview

The Transactions submenu displays all transactions created at the Point of Sale, showing the inflow and outflow of funds through the outlet. This feature provides comprehensive details about each transaction including transaction type, amounts, outlet details, and cashier information. Various filters are available to refine transactions as required.

## Implementation

### TransactionDTO

A new Data Transfer Object (DTO) has been created to properly serialize transaction information with all related entities:

**File:** `src/main/java/com/pos/dto/TransactionDTO.java`

The `TransactionDTO` includes the following information:

#### Transaction Basic Information
- `id`: Transaction unique identifier
- `transactionType`: Type of transaction (CASH_IN, CASH_OUT, OPENING_BALANCE, CLOSING_BALANCE, EXPENSE, REFUND)
- `amount`: Transaction amount
- `description`: Description of the transaction
- `referenceNumber`: Reference number for the transaction
- `transactionDate`: When the transaction occurred
- `createdDate`: When the transaction record was created

#### Outlet Details
- `outletId`: Outlet unique identifier
- `outletName`: Name of the outlet where transaction was created
- `outletCode`: Outlet code

#### Cashier Details
- `cashierId`: Cashier unique identifier (if applicable)
- `cashierName`: Name of the cashier who created the transaction
- `cashierUsername`: Cashier username

### API Endpoint

**Endpoint:** `GET /api/admin/transactions`

**Description:** Retrieves all transactions with full details including outlet and cashier information.

**Query Parameters:**
- `outletId` (optional): Filter transactions by outlet
- `transactionType` (optional): Filter transactions by type (CASH_IN, CASH_OUT, OPENING_BALANCE, CLOSING_BALANCE, EXPENSE, REFUND)
- `cashierId` (optional): Filter transactions by cashier
- `startDate` (optional): Filter transactions from this date (ISO 8601 format)
- `endDate` (optional): Filter transactions until this date (ISO 8601 format)

**Response Format:**
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
    },
    {
      "id": 2,
      "transactionType": "EXPENSE",
      "amount": 50.00,
      "description": "Utility bill payment",
      "referenceNumber": null,
      "transactionDate": "2025-10-14T10:30:00Z",
      "createdDate": "2025-10-14T10:30:00Z",
      "outletId": 1,
      "outletName": "Main Store",
      "outletCode": "MS001",
      "cashierId": null,
      "cashierName": null,
      "cashierUsername": null
    }
  ]
}
```

### Service Layer

**File:** `src/main/java/com/pos/service/TransactionService.java`

New methods added to retrieve transactions as DTOs:
- `getAllTransactionsAsDTO()`: Get all transactions with full details
- `getTransactionsByOutletAsDTO(Long outletId)`: Get transactions filtered by outlet
- `getTransactionsByOutletAndTypeAsDTO(Long outletId, TransactionType type)`: Get transactions filtered by outlet and type
- `getTransactionsByTypeAsDTO(TransactionType type)`: Get transactions filtered by type
- `getTransactionsByDateRangeAsDTO(Long outletId, OffsetDateTime startDate, OffsetDateTime endDate)`: Get transactions within a date range for specific outlet
- `getTransactionsByDateRangeAllOutletsAsDTO(OffsetDateTime startDate, OffsetDateTime endDate)`: Get transactions within a date range for all outlets
- `getTransactionsByCashierAsDTO(Long cashierId)`: Get transactions filtered by cashier

### Repository Layer

**File:** `src/main/java/com/pos/repository/TransactionRepository.java`

Enhanced query methods for filtering:
- `findByOutletId(Long outletId)`: Find transactions by outlet
- `findByOutletIdAndTransactionType(Long outletId, TransactionType type)`: Find transactions by outlet and type
- `findByOutletIdAndDateRange(Long outletId, OffsetDateTime startDate, OffsetDateTime endDate)`: Find transactions by outlet and date range
- `findByDateRange(OffsetDateTime startDate, OffsetDateTime endDate)`: Find transactions by date range (all outlets)
- `findByTransactionType(TransactionType type)`: Find transactions by type
- `findByCashierId(Long cashierId)`: Find transactions by cashier

## Usage Examples

### Get All Transactions
```bash
curl -X GET http://localhost:8080/api/admin/transactions \
  -H "Content-Type: application/json"
```

### Get Transactions for Specific Outlet
```bash
curl -X GET "http://localhost:8080/api/admin/transactions?outletId=1" \
  -H "Content-Type: application/json"
```

### Get Transactions by Type
```bash
curl -X GET "http://localhost:8080/api/admin/transactions?transactionType=CASH_IN" \
  -H "Content-Type: application/json"
```

### Get Transactions by Outlet and Type
```bash
curl -X GET "http://localhost:8080/api/admin/transactions?outletId=1&transactionType=EXPENSE" \
  -H "Content-Type: application/json"
```

### Get Transactions by Date Range
```bash
curl -X GET "http://localhost:8080/api/admin/transactions?startDate=2025-10-01T00:00:00Z&endDate=2025-10-14T23:59:59Z" \
  -H "Content-Type: application/json"
```

### Get Transactions by Outlet and Date Range
```bash
curl -X GET "http://localhost:8080/api/admin/transactions?outletId=1&startDate=2025-10-01T00:00:00Z&endDate=2025-10-14T23:59:59Z" \
  -H "Content-Type: application/json"
```

### Get Transactions by Cashier
```bash
curl -X GET "http://localhost:8080/api/admin/transactions?cashierId=5" \
  -H "Content-Type: application/json"
```

## Transaction Types

The system supports the following transaction types:

- **CASH_IN**: Money added to the cash drawer
- **CASH_OUT**: Money removed from the cash drawer
- **OPENING_BALANCE**: Opening balance at the start of a shift
- **CLOSING_BALANCE**: Closing balance at the end of a shift
- **EXPENSE**: Business expenses paid from the cash drawer
- **REFUND**: Refunds issued to customers

## Benefits

1. **Complete Information**: The DTO includes all necessary information for displaying transactions in the UI without requiring additional API calls
2. **No Lazy Loading Issues**: All related entities (outlet, cashier) are eagerly loaded and included in the response
3. **Clean Separation**: The DTO pattern separates the domain model from the API response, allowing for future changes without breaking the API
4. **Type Safety**: All enums are converted to strings for easier consumption by frontend applications
5. **Null Safety**: The DTO handles null relationships gracefully, only including cashier details when they exist
6. **Flexible Filtering**: Multiple filter options allow users to view transactions by outlet, type, date range, or cashier

## Frontend Integration

The frontend can consume this API to display:
- Transaction list view with all details
- Inflow and outflow of funds
- Outlet where the transaction was created
- Cashier who created the transaction (if applicable)
- Transaction type and dates
- Financial details including amounts and descriptions
- Filtering by outlet, type, date range, or cashier

## Testing

Unit tests have been created to verify the implementation:
- **File:** `src/test/java/com/pos/dto/TransactionDTOTest.java` - Tests cover conversion with all details, partial details, and edge cases
- **File:** `src/test/java/com/pos/service/TransactionServiceTest.java` - Tests cover all service methods including filtering operations

## Backward Compatibility

The original Transaction entity endpoints remain unchanged. This implementation adds new DTO-based methods alongside the existing ones, ensuring backward compatibility with any existing integrations.
