# Analytics API Documentation

## Overview

The Analytics API provides comprehensive sales reporting and analytics for the Point of Sale system. It allows users to view various sales metrics with flexible date range and outlet filtering options.

## Base URL

```
/api/analytics
```

## Authentication

All analytics endpoints require authentication and a valid `X-Tenant-ID` header for multi-tenant isolation.

## Endpoints

### Get Sales Analytics

Retrieves comprehensive sales analytics with optional filtering by outlet and date range.

**Endpoint:** `GET /api/analytics/sales`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `outletId` | Long | No | Filter analytics by specific outlet ID |
| `startDate` | OffsetDateTime | No | Start date for date range filtering (ISO 8601 format) |
| `endDate` | OffsetDateTime | No | End date for date range filtering (ISO 8601 format) |

**Response Format:**

```json
{
  "code": "success",
  "message": "Sales analytics retrieved successfully",
  "timestamp": "2025-10-12T08:00:00Z",
  "path": "/api/analytics/sales",
  "data": {
    "totalSales": 15000.00,
    "netSales": 14500.00,
    "totalOrders": 150,
    "averageOrderValue": 100.00,
    "totalItemsSold": 450.00,
    "totalReturns": 5,
    "discountedOrders": 75,
    "grossDiscountAmount": 500.00,
    "totalTax": 1350.00,
    "averageOrderTax": 9.00
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `totalSales` | BigDecimal | Sum of all completed orders' total amounts |
| `netSales` | BigDecimal | Total sales minus refunded/returned order amounts |
| `totalOrders` | Long | Number of completed orders |
| `averageOrderValue` | BigDecimal | Average value per order (totalSales / totalOrders) |
| `totalItemsSold` | BigDecimal | Sum of quantities from all order items in completed orders |
| `totalReturns` | Long | Number of refunded/returned orders |
| `discountedOrders` | Long | Number of completed orders with discounts applied |
| `grossDiscountAmount` | BigDecimal | Total discount amount across all completed orders |
| `totalTax` | BigDecimal | Total tax collected from completed orders |
| `averageOrderTax` | BigDecimal | Average tax per order |

## Usage Examples

### Example 1: Get Analytics for All Orders

**Request:**
```http
GET /api/analytics/sales
X-Tenant-ID: tenant1
```

**Response:**
```json
{
  "code": "success",
  "message": "Sales analytics retrieved successfully",
  "timestamp": "2025-10-12T08:00:00Z",
  "path": "/api/analytics/sales",
  "data": {
    "totalSales": 50000.00,
    "netSales": 48500.00,
    "totalOrders": 500,
    "averageOrderValue": 100.00,
    "totalItemsSold": 1500.00,
    "totalReturns": 15,
    "discountedOrders": 250,
    "grossDiscountAmount": 2500.00,
    "totalTax": 4500.00,
    "averageOrderTax": 9.00
  }
}
```

### Example 2: Get Analytics for a Specific Outlet

**Request:**
```http
GET /api/analytics/sales?outletId=1
X-Tenant-ID: tenant1
```

**Response:**
```json
{
  "code": "success",
  "message": "Sales analytics retrieved successfully",
  "timestamp": "2025-10-12T08:00:00Z",
  "path": "/api/analytics/sales",
  "data": {
    "totalSales": 25000.00,
    "netSales": 24250.00,
    "totalOrders": 250,
    "averageOrderValue": 100.00,
    "totalItemsSold": 750.00,
    "totalReturns": 8,
    "discountedOrders": 125,
    "grossDiscountAmount": 1250.00,
    "totalTax": 2250.00,
    "averageOrderTax": 9.00
  }
}
```

### Example 3: Get Analytics for a Date Range

**Request:**
```http
GET /api/analytics/sales?startDate=2025-10-01T00:00:00Z&endDate=2025-10-12T23:59:59Z
X-Tenant-ID: tenant1
```

**Response:**
```json
{
  "code": "success",
  "message": "Sales analytics retrieved successfully",
  "timestamp": "2025-10-12T08:00:00Z",
  "path": "/api/analytics/sales",
  "data": {
    "totalSales": 12000.00,
    "netSales": 11700.00,
    "totalOrders": 120,
    "averageOrderValue": 100.00,
    "totalItemsSold": 360.00,
    "totalReturns": 3,
    "discountedOrders": 60,
    "grossDiscountAmount": 600.00,
    "totalTax": 1080.00,
    "averageOrderTax": 9.00
  }
}
```

### Example 4: Get Analytics for a Specific Outlet and Date Range

**Request:**
```http
GET /api/analytics/sales?outletId=1&startDate=2025-10-01T00:00:00Z&endDate=2025-10-12T23:59:59Z
X-Tenant-ID: tenant1
```

**Response:**
```json
{
  "code": "success",
  "message": "Sales analytics retrieved successfully",
  "timestamp": "2025-10-12T08:00:00Z",
  "path": "/api/analytics/sales",
  "data": {
    "totalSales": 6000.00,
    "netSales": 5850.00,
    "totalOrders": 60,
    "averageOrderValue": 100.00,
    "totalItemsSold": 180.00,
    "totalReturns": 2,
    "discountedOrders": 30,
    "grossDiscountAmount": 300.00,
    "totalTax": 540.00,
    "averageOrderTax": 9.00
  }
}
```

## Business Logic

### Calculation Rules

1. **Total Sales**: Calculated by summing the `totalAmount` field from all orders with status `COMPLETED`.

2. **Net Sales**: Total sales minus the sum of `totalAmount` from orders with status `REFUNDED`.

3. **Total Orders**: Count of all orders with status `COMPLETED`.

4. **Average Order Value**: `totalSales / totalOrders` (rounded to 2 decimal places).

5. **Total Items Sold**: Sum of all `quantity` fields from order items belonging to completed orders.

6. **Total Returns**: Count of all orders with status `REFUNDED`.

7. **Discounted Orders**: Count of completed orders where `discountAmount > 0`.

8. **Gross Discount Amount**: Sum of all `discountAmount` fields from completed orders.

9. **Total Tax**: Sum of all `taxAmount` fields from completed orders.

10. **Average Order Tax**: `totalTax / totalOrders` (rounded to 2 decimal places).

### Order Status Considerations

- Only orders with status `COMPLETED` are included in sales calculations (total sales, average order value, etc.)
- Orders with status `REFUNDED` are counted separately as returns and their amounts are subtracted from net sales
- Orders with other statuses (`DRAFT`, `PENDING`, `PREPARING`, `READY`, `CANCELLED`, `ON_HOLD`) are excluded from all calculations

## Error Responses

### Invalid Date Range

If `startDate` is after `endDate`, the API will still process the request but may return zero or unexpected results.

### Non-existent Outlet

If the specified `outletId` doesn't exist, the API will return analytics with zero values.

**Response:**
```json
{
  "code": "success",
  "message": "Sales analytics retrieved successfully",
  "timestamp": "2025-10-12T08:00:00Z",
  "path": "/api/analytics/sales",
  "data": {
    "totalSales": 0.00,
    "netSales": 0.00,
    "totalOrders": 0,
    "averageOrderValue": 0.00,
    "totalItemsSold": 0.00,
    "totalReturns": 0,
    "discountedOrders": 0,
    "grossDiscountAmount": 0.00,
    "totalTax": 0.00,
    "averageOrderTax": 0.00
  }
}
```

## Performance Considerations

- The analytics calculations are performed on-demand and may take longer for large datasets
- For optimal performance, consider using specific date ranges rather than querying all historical data
- Date range queries utilize database indexes on the `created_date` field for efficient filtering

## Future Enhancements

Potential future additions to the Analytics API:

1. **Hourly/Daily/Weekly/Monthly Aggregations**: Pre-calculated analytics for common time periods
2. **Product-Level Analytics**: Best-selling products, product category performance
3. **Cashier Performance**: Sales by cashier
4. **Customer Analytics**: Top customers, customer purchase patterns
5. **Payment Method Analytics**: Sales breakdown by payment method
6. **Trend Analysis**: Sales trends over time with comparison to previous periods
7. **Export Functionality**: Export analytics data in CSV, Excel, or PDF formats
