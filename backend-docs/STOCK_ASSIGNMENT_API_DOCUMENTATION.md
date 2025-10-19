# Stock Assignment API Documentation

## Overview

The Stock Assignment API provides comprehensive functionality for assigning and managing custom stock quantities for products at different outlets in the POS system. This feature supports both centralized and custom inventory management, allowing administrators to maintain outlet-specific stock levels while keeping the centralized stock consistent for all outlets and WooCommerce shop integration.

## Base URL
```
http://localhost:8080/pos-codex/api/admin/stocks
```

## Features

- **Assign Custom Stock**: Set specific stock quantities for products at individual outlets
- **Bulk Stock Assignment**: Import stock quantities for multiple products across outlets via CSV-like data
- **WooCommerce CSV Import Support**: Compatible with WooCommerce product import metadata format
- **Stock Management**: View, update, and track stock levels across outlets
- **Low Stock Alerts**: Monitor products that have reached reorder levels

## Authentication & Headers

### Required Headers
- `X-Tenant-ID`: Tenant identifier (required for all requests)
- `Authorization`: Bearer <token> (required for authentication)
- `Content-Type`: `application/json` (for POST/PUT requests)

For authentication details, see [AUTHENTICATION_API_DOCUMENTATION.md](AUTHENTICATION_API_DOCUMENTATION.md)

## API Response Format

All endpoints return responses in the standard format:

```json
{
  "code": "success.stock.assigned",
  "message": "Stock assigned successfully",
  "timestamp": "2025-10-14T13:00:00Z",
  "path": "/api/admin/stocks/assign",
  "data": { ... }
}
```

---

## API Endpoints

### 1. Assign Stock to Product at Outlet

Assign or update stock quantity for a specific product at a specific outlet.

```http
POST /api/admin/stocks/assign
```

**Request Headers:**
```
X-Tenant-ID: PaPos
Content-Type: application/json
```

**Request Body:**
```json
{
  "productId": 1,
  "outletId": 2,
  "quantity": 100.00
}
```

**Request Parameters:**
- `productId` (required): The product identifier
- `outletId` (required): The outlet identifier
- `quantity` (required): Stock quantity (must be >= 0)

**Response (201 Created):**
```json
{
  "code": "success.stock.assigned",
  "message": "Stock assigned successfully",
  "timestamp": "2025-10-14T13:00:00Z",
  "path": "/api/admin/stocks/assign",
  "data": {
    "id": 1,
    "productId": 1,
    "productName": "Apple iPhone 14",
    "outletId": 2,
    "outletName": "Downtown Store",
    "quantity": 100.00,
    "reorderLevel": null,
    "maxStockLevel": null
  }
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8080/pos-codex/api/admin/stocks/assign" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "outletId": 2,
    "quantity": 100.00
  }'
```

---

### 2. Bulk Assign Stocks

Assign or update stock quantities for multiple products across multiple outlets at once. This endpoint is essential for CSV imports and bulk operations.

```http
POST /api/admin/stocks/assign/bulk
```

**Request Headers:**
```
X-Tenant-ID: PaPos
Content-Type: application/json
```

**Request Body:**
```json
{
  "productOutletStockMappings": {
    "1_2": 100.00,
    "1_3": 50.00,
    "2_2": 75.00,
    "3_3": 200.00
  }
}
```

**Key Format:** `"productId_outletId"` (e.g., `"1_2"` means product ID 1 at outlet ID 2)

**Request Parameters:**
- `productOutletStockMappings` (required): Map of product-outlet combinations to stock quantities
  - Key: `"productId_outletId"` format
  - Value: Stock quantity as decimal number

**Response (201 Created):**
```json
{
  "code": "success.stocks.bulk.assigned",
  "message": "Stocks assigned successfully",
  "timestamp": "2025-10-14T13:00:00Z",
  "path": "/api/admin/stocks/assign/bulk",
  "data": [
    {
      "id": 1,
      "productId": 1,
      "productName": "Apple iPhone 14",
      "outletId": 2,
      "outletName": "Downtown Store",
      "quantity": 100.00,
      "reorderLevel": null,
      "maxStockLevel": null
    },
    {
      "id": 2,
      "productId": 1,
      "productName": "Apple iPhone 14",
      "outletId": 3,
      "outletName": "Mall Store",
      "quantity": 50.00,
      "reorderLevel": null,
      "maxStockLevel": null
    },
    {
      "id": 3,
      "productId": 2,
      "productName": "Samsung Galaxy S23",
      "outletId": 2,
      "outletName": "Downtown Store",
      "quantity": 75.00,
      "reorderLevel": null,
      "maxStockLevel": null
    }
  ]
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8080/pos-codex/api/admin/stocks/assign/bulk" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "productOutletStockMappings": {
      "1_2": 100.00,
      "1_3": 50.00,
      "2_2": 75.00
    }
  }'
```

---

### 3. Get Stock by ID

Retrieve details of a specific stock record.

```http
GET /api/admin/stocks/{id}
```

**Request Headers:**
```
X-Tenant-ID: PaPos
```

**URL Parameters:**
- `id`: Stock record identifier

**Response (200 OK):**
```json
{
  "code": "success",
  "message": "Stock retrieved successfully",
  "timestamp": "2025-10-14T13:00:00Z",
  "path": "/api/admin/stocks/1",
  "data": {
    "id": 1,
    "productId": 1,
    "productName": "Apple iPhone 14",
    "outletId": 2,
    "outletName": "Downtown Store",
    "quantity": 100.00,
    "reorderLevel": 20.00,
    "maxStockLevel": 200.00
  }
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:8080/pos-codex/api/admin/stocks/1" \
  -H "X-Tenant-ID: PaPos"
```

---

### 4. Get Stock by Product and Outlet

Retrieve stock information for a specific product at a specific outlet.

```http
GET /api/admin/stocks/product/{productId}/outlet/{outletId}
```

**Request Headers:**
```
X-Tenant-ID: PaPos
```

**URL Parameters:**
- `productId`: Product identifier
- `outletId`: Outlet identifier

**Response (200 OK):**
```json
{
  "code": "success",
  "message": "Stock retrieved successfully",
  "timestamp": "2025-10-14T13:00:00Z",
  "path": "/api/admin/stocks/product/1/outlet/2",
  "data": {
    "id": 1,
    "productId": 1,
    "productName": "Apple iPhone 14",
    "outletId": 2,
    "outletName": "Downtown Store",
    "quantity": 100.00,
    "reorderLevel": 20.00,
    "maxStockLevel": 200.00
  }
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:8080/pos-codex/api/admin/stocks/product/1/outlet/2" \
  -H "X-Tenant-ID: PaPos"
```

---

### 5. Get All Stocks for an Outlet

Retrieve all stock records for a specific outlet.

```http
GET /api/admin/stocks/outlet/{outletId}
```

**Request Headers:**
```
X-Tenant-ID: PaPos
```

**URL Parameters:**
- `outletId`: Outlet identifier

**Response (200 OK):**
```json
{
  "code": "success",
  "message": "Stocks retrieved successfully",
  "timestamp": "2025-10-14T13:00:00Z",
  "path": "/api/admin/stocks/outlet/2",
  "data": [
    {
      "id": 1,
      "productId": 1,
      "productName": "Apple iPhone 14",
      "outletId": 2,
      "outletName": "Downtown Store",
      "quantity": 100.00,
      "reorderLevel": 20.00,
      "maxStockLevel": 200.00
    },
    {
      "id": 2,
      "productId": 2,
      "productName": "Samsung Galaxy S23",
      "outletId": 2,
      "outletName": "Downtown Store",
      "quantity": 75.00,
      "reorderLevel": 15.00,
      "maxStockLevel": 150.00
    }
  ]
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:8080/pos-codex/api/admin/stocks/outlet/2" \
  -H "X-Tenant-ID: PaPos"
```

---

### 6. Get Low Stock Items for Outlet

Retrieve products that have reached or fallen below their reorder levels at a specific outlet.

```http
GET /api/admin/stocks/outlet/{outletId}/low
```

**Request Headers:**
```
X-Tenant-ID: PaPos
```

**URL Parameters:**
- `outletId`: Outlet identifier

**Response (200 OK):**
```json
{
  "code": "success",
  "message": "Low stocks retrieved successfully",
  "timestamp": "2025-10-14T13:00:00Z",
  "path": "/api/admin/stocks/outlet/2/low",
  "data": [
    {
      "id": 3,
      "productId": 3,
      "productName": "Apple AirPods Pro",
      "outletId": 2,
      "outletName": "Downtown Store",
      "quantity": 5.00,
      "reorderLevel": 10.00,
      "maxStockLevel": 50.00
    }
  ]
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:8080/pos-codex/api/admin/stocks/outlet/2/low" \
  -H "X-Tenant-ID: PaPos"
```

---

### 7. Update Stock

Update stock quantity and settings for a specific stock record.

```http
PUT /api/admin/stocks/{id}
```

**Request Headers:**
```
X-Tenant-ID: PaPos
Content-Type: application/json
```

**URL Parameters:**
- `id`: Stock record identifier

**Request Body:**
```json
{
  "productId": 1,
  "outletId": 2,
  "quantity": 150.00
}
```

**Response (200 OK):**
```json
{
  "code": "success.stock.updated",
  "message": "Stock updated successfully",
  "timestamp": "2025-10-14T13:00:00Z",
  "path": "/api/admin/stocks/1",
  "data": {
    "id": 1,
    "productId": 1,
    "productName": "Apple iPhone 14",
    "outletId": 2,
    "outletName": "Downtown Store",
    "quantity": 150.00,
    "reorderLevel": 20.00,
    "maxStockLevel": 200.00
  }
}
```

**cURL Example:**
```bash
curl -X PUT "http://localhost:8080/pos-codex/api/admin/stocks/1" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "outletId": 2,
    "quantity": 150.00
  }'
```

---

### 8. Delete Stock

Delete a stock record.

```http
DELETE /api/admin/stocks/{id}
```

**Request Headers:**
```
X-Tenant-ID: PaPos
```

**URL Parameters:**
- `id`: Stock record identifier

**Response (200 OK):**
```json
{
  "code": "success.stock.deleted",
  "message": "Stock deleted successfully",
  "timestamp": "2025-10-14T13:00:00Z",
  "path": "/api/admin/stocks/1",
  "data": null
}
```

**cURL Example:**
```bash
curl -X DELETE "http://localhost:8080/pos-codex/api/admin/stocks/1" \
  -H "X-Tenant-ID: PaPos"
```

---

## WooCommerce CSV Import Integration

To assign custom outlet stocks via WooCommerce CSV import, include metadata with:
- **Meta Key**: `_ddwcpos_outlet_stock_{outlet_id}` (e.g., `_ddwcpos_outlet_stock_1` for outlet ID 1)
- **Meta Value**: Desired stock quantity

### Example CSV Format

```csv
ID,Name,Price,Meta: _ddwcpos_outlet_stock_1,Meta: _ddwcpos_outlet_stock_2,Meta: _ddwcpos_outlet_stock_3
123,Apple iPhone 14,999.99,100,50,75
124,Samsung Galaxy S23,899.99,80,40,60
125,Apple AirPods Pro,249.99,200,150,100
```

### CSV Import Workflow

1. **Prepare CSV File**: Create a CSV file with product data and outlet stock metadata
2. **Import to WooCommerce**: Use WooCommerce product import feature to import the CSV
3. **Sync Stocks**: After import, use the bulk assignment API to sync the stocks

### Bulk Assignment After CSV Import

After importing products via WooCommerce CSV, you can sync the stock data:

```bash
curl -X POST "http://localhost:8080/pos-codex/api/admin/stocks/assign/bulk" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "productOutletStockMappings": {
      "123_1": 100,
      "123_2": 50,
      "123_3": 75,
      "124_1": 80,
      "124_2": 40,
      "124_3": 60,
      "125_1": 200,
      "125_2": 150,
      "125_3": 100
    }
  }'
```

---

## Common Use Cases

### 1. Assign Custom Stock to a Single Product at an Outlet

When you need to set stock for one product at one outlet:

```bash
curl -X POST "http://localhost:8080/pos-codex/api/admin/stocks/assign" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "outletId": 2,
    "quantity": 100.00
  }'
```

---

### 2. Bulk Import Stocks from CSV

After processing a CSV file with columns: `product_id,outlet_id,quantity`, create a mapping and call:

```bash
curl -X POST "http://localhost:8080/pos-codex/api/admin/stocks/assign/bulk" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "productOutletStockMappings": {
      "1_1": 100,
      "1_2": 50,
      "2_1": 75,
      "2_2": 25,
      "3_1": 200,
      "3_2": 150
    }
  }'
```

---

### 3. Set Custom Stock for One Product Across Multiple Outlets

Distribute the same product across different outlets with custom quantities:

```bash
curl -X POST "http://localhost:8080/pos-codex/api/admin/stocks/assign/bulk" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "productOutletStockMappings": {
      "1_1": 100,
      "1_2": 50,
      "1_3": 75,
      "1_4": 25
    }
  }'
```

---

### 4. Monitor Low Stock Items

Check which products need restocking at a specific outlet:

```bash
curl -X GET "http://localhost:8080/pos-codex/api/admin/stocks/outlet/2/low" \
  -H "X-Tenant-ID: PaPos"
```

---

## Error Handling

### Common Error Responses

**404 Not Found - Product Not Found:**
```json
{
  "code": "error.resource.not.found",
  "message": "Product not found with id: 999",
  "timestamp": "2025-10-14T13:00:00Z",
  "path": "/api/admin/stocks/assign/bulk",
  "data": null
}
```

**404 Not Found - Outlet Not Found:**
```json
{
  "code": "error.resource.not.found",
  "message": "Outlet not found with id: 999",
  "timestamp": "2025-10-14T13:00:00Z",
  "path": "/api/admin/stocks/assign/bulk",
  "data": null
}
```

**400 Bad Request - Invalid Quantity:**
```json
{
  "code": "error.validation.failed",
  "message": "Quantity must be greater than or equal to 0",
  "timestamp": "2025-10-14T13:00:00Z",
  "path": "/api/admin/stocks/assign",
  "data": null
}
```

**400 Bad Request - Invalid Key Format:**
```json
{
  "code": "error.validation.failed",
  "message": "Invalid key format. Expected format: productId_outletId",
  "timestamp": "2025-10-14T13:00:00Z",
  "path": "/api/admin/stocks/assign/bulk",
  "data": null
}
```

---

## Best Practices

1. **Use Bulk Assignment for Large Imports**: When importing multiple stock records, always use the bulk endpoint to reduce API calls and improve performance.

2. **Validate Data Before Import**: Ensure product IDs and outlet IDs exist before attempting bulk assignments to avoid partial failures.

3. **Monitor Bulk Assignment Warnings**: The bulk assignment endpoint logs warnings for failed items but continues processing valid entries. Check the response to identify any issues.

4. **Set Reorder Levels**: Configure reorder levels for products to receive low stock alerts and maintain optimal inventory.

5. **Regular Stock Audits**: Use the outlet stock listing endpoint to periodically audit stock levels across outlets.

6. **WooCommerce Integration**: When using WooCommerce CSV import, maintain the metadata key format `_ddwcpos_outlet_stock_{outlet_id}` for consistency.

---

## Inventory Types

The system supports two inventory management modes (configured via general settings):

### Custom Inventory
- Each outlet maintains its own stock quantities
- Stock levels are independent across outlets
- Use this mode when outlets manage their own inventory
- Default mode for the stock assignment API

### Centralized Inventory
- Shared stock across all outlets and WooCommerce shop
- Stock deductions affect all locations
- Use this mode for unified inventory management
- Stock assignment API can still be used to track per-outlet allocations

---

## Technical Notes

- All stock quantities use `BigDecimal` with precision of 10 and scale of 2
- Stock records have a unique constraint on `product_id` and `outlet_id` combination
- Updating an existing stock record will replace the quantity
- Negative quantities are not allowed
- The API supports multi-tenancy via the `X-Tenant-ID` header
- All timestamps use ISO 8601 format (UTC)

---

## Support

For additional information or support, refer to:
- General Configuration Guide
- Product Management API Documentation
- Outlet Management API Documentation
- WooCommerce Integration Guide
