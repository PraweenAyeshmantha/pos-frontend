# Statistics API Documentation

## Overview

The Statistics API provides endpoints for retrieving daily sales reports and analytics for point-of-sale operations. This API is designed to support the Statistics Menu feature where cashiers can view daily sales summaries including opening balance, cash sales, total sales, and expected drawer amounts.

## Base URL

```
/api/statistics
```

## Endpoints

### Get Daily Sales Report

Retrieves a comprehensive daily sales report for a specific outlet and date, including opening cash drawer amount, cash sales, total sales, and expected drawer amount.

**Endpoint:** `GET /api/statistics/daily-sales-report`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `outletId` | Long | Yes | The unique identifier of the outlet |
| `date` | ISO 8601 Date | No | The date to generate the report for (format: YYYY-MM-DD). Defaults to current date if not provided. |

**Response Status Codes:**

- `200 OK` - Report retrieved successfully
- `400 Bad Request` - Invalid query parameters
- `500 Internal Server Error` - Server error

**Response Body:**

```json
{
  "status": "SUCCESS",
  "code": "success",
  "message": "Daily sales report retrieved successfully",
  "timestamp": "2025-10-15T16:00:00Z",
  "path": "/api/statistics/daily-sales-report",
  "data": {
    "openCashDrawerAmount": 1000.00,
    "todaysCashSale": 803.50,
    "todaysTotalSale": 2303.38,
    "expectedDrawerAmount": 1803.50
  }
}
```

## Response Format

### Daily Sales Report DTO Fields

| Field | Type | Description |
|-------|------|-------------|
| `openCashDrawerAmount` | BigDecimal | Opening balance from OPENING_BALANCE transaction for the day |
| `todaysCashSale` | BigDecimal | Total sales paid with cash payment method for the day |
| `todaysTotalSale` | BigDecimal | Total sales (all payment methods) from completed orders for the day |
| `expectedDrawerAmount` | BigDecimal | Calculated as: opening balance + cash sales + cash in transactions - cash out transactions - expenses |

## Calculation Logic

### Open Cash Drawer Amount
- Sum of all `OPENING_BALANCE` transactions for the outlet and date

### Today's Cash Sale
- Sum of all payments from completed orders where payment method slug = "cash" for the outlet and date

### Today's Total Sale
- Sum of total amounts from all completed orders for the outlet and date

### Expected Drawer Amount
- Formula: `Opening Balance + Cash Sales + Cash In - Cash Out - Expenses`
- Where:
  - Opening Balance: Sum of OPENING_BALANCE transactions
  - Cash Sales: Total cash payments from completed orders
  - Cash In: Sum of CASH_IN transactions
  - Cash Out: Sum of CASH_OUT transactions
  - Expenses: Sum of EXPENSE transactions

## Usage Examples

### Example 1: Get Today's Sales Report

Get the daily sales report for outlet 1 for the current date:

```bash
curl -X GET "http://localhost:8080/api/statistics/daily-sales-report?outletId=1" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant1"
```

**Response:**

```json
{
  "status": "SUCCESS",
  "code": "success",
  "message": "Daily sales report retrieved successfully",
  "timestamp": "2025-10-15T16:00:00Z",
  "path": "/api/statistics/daily-sales-report",
  "data": {
    "openCashDrawerAmount": 1000.00,
    "todaysCashSale": 803.50,
    "todaysTotalSale": 2303.38,
    "expectedDrawerAmount": 1803.50
  }
}
```

### Example 2: Get Sales Report for Specific Date

Get the daily sales report for outlet 1 for October 14, 2025:

```bash
curl -X GET "http://localhost:8080/api/statistics/daily-sales-report?outletId=1&date=2025-10-14" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant1"
```

**Response:**

```json
{
  "status": "SUCCESS",
  "code": "success",
  "message": "Daily sales report retrieved successfully",
  "timestamp": "2025-10-15T16:00:00Z",
  "path": "/api/statistics/daily-sales-report",
  "data": {
    "openCashDrawerAmount": 800.00,
    "todaysCashSale": 650.25,
    "todaysTotalSale": 1950.75,
    "expectedDrawerAmount": 1425.25
  }
}
```

### Example 3: Report with No Data

When there's no data for the specified date:

```bash
curl -X GET "http://localhost:8080/api/statistics/daily-sales-report?outletId=1&date=2025-09-01" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant1"
```

**Response:**

```json
{
  "status": "SUCCESS",
  "code": "success",
  "message": "Daily sales report retrieved successfully",
  "timestamp": "2025-10-15T16:00:00Z",
  "path": "/api/statistics/daily-sales-report",
  "data": {
    "openCashDrawerAmount": 0.00,
    "todaysCashSale": 0.00,
    "todaysTotalSale": 0.00,
    "expectedDrawerAmount": 0.00
  }
}
```

## Integration with UI

The Statistics Menu in the frontend displays the following cards based on this API:

1. **Open Cash Drawer Amount** - Displays `openCashDrawerAmount`
2. **Today's Cash Sale** - Displays `todaysCashSale`
3. **Today's Total Sale** - Displays `todaysTotalSale`
4. **Expected Drawer Amount** - Displays `expectedDrawerAmount`

Additionally, the menu displays a list of today's transactions which can be retrieved using the existing Transaction API (`GET /api/admin/transactions`).

## Notes

- All monetary values are returned as BigDecimal with 2 decimal places
- Dates are in ISO 8601 format
- The API uses the system's default timezone for date calculations
- Only completed orders are included in sales calculations
- Cash sales specifically refers to payments made with the payment method slug "cash"
- Transactions of type CASH_OUT and EXPENSE are both deducted from the expected drawer amount

## Related APIs

- **Transactions API** - For retrieving detailed transaction list (`GET /api/admin/transactions`)
- **Orders API** - For retrieving order details (`GET /api/admin/orders`)
- **Analytics API** - For more detailed sales analytics (`GET /api/analytics/sales`)
