# Barcode Management API Documentation

## Overview

The Barcode Management API provides comprehensive functionality for assigning, managing, and printing barcodes for products in the POS system. All items have ID-based barcodes by default, but custom barcodes can be assigned for specific needs.

## Base URL
```
http://localhost:8080/pos-codex/api/admin/barcodes
```

## Features

- **Assign Custom Barcodes**: Attach custom barcodes to individual products
- **Bulk Barcode Assignment**: Import barcodes for multiple products via CSV-like data
- **Primary Barcode Management**: Set a primary barcode for each product
- **Barcode Printing**: Prepare barcodes for printing in configurable quantities
- **Barcode Lookup**: Find products by barcode code
- **Default ID-based Barcodes**: All products get automatic ID-based barcodes

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
  "code": "success.barcode.assigned",
  "message": "Barcode assigned successfully",
  "timestamp": "2025-10-13T18:00:00Z",
  "path": "/api/admin/barcodes/assign",
  "data": { ... }
}
```

---

## API Endpoints

### 1. Assign Custom Barcode to Product

Assign a custom barcode to a specific product.

```http
POST /api/admin/barcodes/assign
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
  "code": "BC-APPLE-001",
  "isPrimary": true
}
```

**Request Parameters:**
- `productId` (required): ID of the product to assign the barcode to
- `code` (required): Barcode code/number
- `isPrimary` (optional): Whether this is the primary barcode for the product (default: false)

**Response (201 Created):**
```json
{
  "code": "success.barcode.assigned",
  "message": "Barcode assigned successfully",
  "timestamp": "2025-10-13T18:00:00Z",
  "path": "/api/admin/barcodes/assign",
  "data": {
    "id": 1,
    "code": "BC-APPLE-001",
    "productId": 1,
    "productName": "Apple",
    "isPrimary": true
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid request data
- `404 Not Found`: Product not found
- `409 Conflict`: Barcode already exists

**Example (cURL):**
```bash
curl -X POST "http://localhost:8080/pos-codex/api/admin/barcodes/assign" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "code": "BC-APPLE-001",
    "isPrimary": true
  }'
```

---

### 2. Bulk Assign Barcodes

Assign barcodes to multiple products at once. Useful for CSV imports.

```http
POST /api/admin/barcodes/assign/bulk
```

**Request Headers:**
```
X-Tenant-ID: PaPos
Content-Type: application/json
```

**Request Body:**
```json
{
  "productBarcodeMappings": {
    "1": "BC-APPLE-001",
    "2": "BC-BANANA-002",
    "3": "BC-ORANGE-003"
  }
}
```

**Request Parameters:**
- `productBarcodeMappings` (required): Map of product IDs to barcode codes

**Response (201 Created):**
```json
{
  "code": "success.barcodes.bulk.assigned",
  "message": "Barcodes assigned successfully",
  "timestamp": "2025-10-13T18:00:00Z",
  "path": "/api/admin/barcodes/assign/bulk",
  "data": [
    {
      "id": 1,
      "code": "BC-APPLE-001",
      "productId": 1,
      "productName": "Apple",
      "isPrimary": false
    },
    {
      "id": 2,
      "code": "BC-BANANA-002",
      "productId": 2,
      "productName": "Banana",
      "isPrimary": false
    },
    {
      "id": 3,
      "code": "BC-ORANGE-003",
      "productId": 3,
      "productName": "Orange",
      "isPrimary": false
    }
  ]
}
```

**Example (cURL):**
```bash
curl -X POST "http://localhost:8080/pos-codex/api/admin/barcodes/assign/bulk" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "productBarcodeMappings": {
      "1": "BC-APPLE-001",
      "2": "BC-BANANA-002",
      "3": "BC-ORANGE-003"
    }
  }'
```

---

### 3. Get Barcodes by Product

Retrieve all barcodes associated with a specific product.

```http
GET /api/admin/barcodes/product/{productId}
```

**Path Parameters:**
- `productId`: Product ID

**Request Headers:**
```
X-Tenant-ID: PaPos
```

**Response (200 OK):**
```json
{
  "code": "success",
  "message": "Barcodes retrieved successfully",
  "timestamp": "2025-10-13T18:00:00Z",
  "path": "/api/admin/barcodes/product/1",
  "data": [
    {
      "id": 1,
      "code": "BC-APPLE-001",
      "productId": 1,
      "productName": "Apple",
      "isPrimary": true
    },
    {
      "id": 2,
      "code": "PROD-00000001",
      "productId": 1,
      "productName": "Apple",
      "isPrimary": false
    }
  ]
}
```

**Example (cURL):**
```bash
curl -X GET "http://localhost:8080/pos-codex/api/admin/barcodes/product/1" \
  -H "X-Tenant-ID: PaPos"
```

---

### 4. Get Barcode by Code

Retrieve a barcode by its code.

```http
GET /api/admin/barcodes/{code}
```

**Path Parameters:**
- `code`: Barcode code

**Request Headers:**
```
X-Tenant-ID: PaPos
```

**Response (200 OK):**
```json
{
  "code": "success",
  "message": "Barcode retrieved successfully",
  "timestamp": "2025-10-13T18:00:00Z",
  "path": "/api/admin/barcodes/BC-APPLE-001",
  "data": {
    "id": 1,
    "code": "BC-APPLE-001",
    "productId": 1,
    "productName": "Apple",
    "isPrimary": true
  }
}
```

**Example (cURL):**
```bash
curl -X GET "http://localhost:8080/pos-codex/api/admin/barcodes/BC-APPLE-001" \
  -H "X-Tenant-ID: PaPos"
```

---

### 5. Get Primary Barcode for Product

Retrieve the primary barcode for a specific product.

```http
GET /api/admin/barcodes/product/{productId}/primary
```

**Path Parameters:**
- `productId`: Product ID

**Request Headers:**
```
X-Tenant-ID: PaPos
```

**Response (200 OK):**
```json
{
  "code": "success",
  "message": "Primary barcode retrieved successfully",
  "timestamp": "2025-10-13T18:00:00Z",
  "path": "/api/admin/barcodes/product/1/primary",
  "data": {
    "id": 1,
    "code": "BC-APPLE-001",
    "productId": 1,
    "productName": "Apple",
    "isPrimary": true
  }
}
```

**Example (cURL):**
```bash
curl -X GET "http://localhost:8080/pos-codex/api/admin/barcodes/product/1/primary" \
  -H "X-Tenant-ID: PaPos"
```

---

### 6. Update Barcode

Update barcode code or primary status.

```http
PUT /api/admin/barcodes/{barcodeId}?code={newCode}&isPrimary={isPrimary}
```

**Path Parameters:**
- `barcodeId`: Barcode ID

**Query Parameters:**
- `code` (optional): New barcode code
- `isPrimary` (optional): Set as primary barcode (true/false)

**Request Headers:**
```
X-Tenant-ID: PaPos
```

**Response (200 OK):**
```json
{
  "code": "success.barcode.updated",
  "message": "Barcode updated successfully",
  "timestamp": "2025-10-13T18:00:00Z",
  "path": "/api/admin/barcodes/1",
  "data": {
    "id": 1,
    "code": "BC-APPLE-NEW",
    "productId": 1,
    "productName": "Apple",
    "isPrimary": true
  }
}
```

**Example (cURL):**
```bash
# Update barcode code
curl -X PUT "http://localhost:8080/pos-codex/api/admin/barcodes/1?code=BC-APPLE-NEW" \
  -H "X-Tenant-ID: PaPos"

# Set as primary barcode
curl -X PUT "http://localhost:8080/pos-codex/api/admin/barcodes/1?isPrimary=true" \
  -H "X-Tenant-ID: PaPos"
```

---

### 7. Delete Barcode

Delete a barcode from the system.

```http
DELETE /api/admin/barcodes/{barcodeId}
```

**Path Parameters:**
- `barcodeId`: Barcode ID

**Request Headers:**
```
X-Tenant-ID: PaPos
```

**Response (200 OK):**
```json
{
  "code": "success.barcode.deleted",
  "message": "Barcode deleted successfully",
  "timestamp": "2025-10-13T18:00:00Z",
  "path": "/api/admin/barcodes/1",
  "data": null
}
```

**Example (cURL):**
```bash
curl -X DELETE "http://localhost:8080/pos-codex/api/admin/barcodes/1" \
  -H "X-Tenant-ID: PaPos"
```

---

### 8. Prepare Barcodes for Printing

Prepare multiple barcodes for printing with configurable quantities.

```http
POST /api/admin/barcodes/print
```

**Request Headers:**
```
X-Tenant-ID: PaPos
Content-Type: application/json
```

**Request Body:**
```json
{
  "barcodeCodes": [
    "BC-APPLE-001",
    "BC-BANANA-002",
    "BC-ORANGE-003"
  ],
  "quantity": 5
}
```

**Request Parameters:**
- `barcodeCodes` (required): List of barcode codes to print
- `quantity` (required): Number of copies to print for each barcode (minimum: 1)

**Response (200 OK):**
```json
{
  "code": "success.barcodes.prepared",
  "message": "Barcodes prepared for printing",
  "timestamp": "2025-10-13T18:00:00Z",
  "path": "/api/admin/barcodes/print",
  "data": [
    {
      "id": 1,
      "code": "BC-APPLE-001",
      "productId": 1,
      "productName": "Apple",
      "isPrimary": true
    },
    {
      "id": 1,
      "code": "BC-APPLE-001",
      "productId": 1,
      "productName": "Apple",
      "isPrimary": true
    },
    ... (repeated 5 times for each barcode)
  ]
}
```

**Example (cURL):**
```bash
curl -X POST "http://localhost:8080/pos-codex/api/admin/barcodes/print" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "barcodeCodes": ["BC-APPLE-001", "BC-BANANA-002"],
    "quantity": 3
  }'
```

---

## Common Use Cases

### 1. Assign Custom Barcode to a Single Product

```bash
curl -X POST "http://localhost:8080/pos-codex/api/admin/barcodes/assign" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 123,
    "code": "8901234567890",
    "isPrimary": true
  }'
```

### 2. Bulk Import Barcodes from CSV

After processing a CSV file with columns: `product_id,barcode`, create a mapping and call:

```bash
curl -X POST "http://localhost:8080/pos-codex/api/admin/barcodes/assign/bulk" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "productBarcodeMappings": {
      "1": "8901234567890",
      "2": "8901234567891",
      "3": "8901234567892"
    }
  }'
```

### 3. Print Multiple Barcodes

Print 10 copies each of selected product barcodes:

```bash
curl -X POST "http://localhost:8080/pos-codex/api/admin/barcodes/print" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "barcodeCodes": ["8901234567890", "8901234567891"],
    "quantity": 10
  }'
```

### 4. Look Up Product by Scanning Barcode

```bash
curl -X GET "http://localhost:8080/pos-codex/api/admin/barcodes/8901234567890" \
  -H "X-Tenant-ID: PaPos"
```

---

## WooCommerce CSV Import Integration

To assign barcodes via WooCommerce CSV import, include metadata with:
- **Meta Key**: `_ddwcpos_barcode_init`
- **Meta Value**: Desired barcode number

Example CSV row:
```csv
ID,Name,Price,Meta: _ddwcpos_barcode_init
123,Apple,1.99,8901234567890
```

After import, use the bulk assignment API to sync barcodes:

```bash
curl -X POST "http://localhost:8080/pos-codex/api/admin/barcodes/assign/bulk" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "productBarcodeMappings": {
      "123": "8901234567890"
    }
  }'
```

---

## Default Barcode Format

All products automatically receive an ID-based barcode in the format:
```
PROD-{8-digit-padded-id}
```

Examples:
- Product ID 1: `PROD-00000001`
- Product ID 123: `PROD-00000123`
- Product ID 999999: `PROD-00999999`

---

## Printer Configuration

Barcode printing respects printer configuration settings. See [PRINTER_CONFIGURATION_GUIDE.md](PRINTER_CONFIGURATION_GUIDE.md) for details on:
- Barcode page dimensions
- Margins
- Orientation (horizontal/vertical)
- Barcode formats

---

## Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `error.product.not.found` | 404 | Product not found with given ID |
| `error.barcode.not.found` | 404 | Barcode not found with given code |
| `error.barcode.already.exists` | 409 | Barcode code already exists |
| `error.validation.failed` | 400 | Request validation failed |
| `error.business.rule.violation` | 409 | Business rule violation |

---

## Best Practices

1. **Primary Barcode**: Set one barcode as primary for each product
2. **Unique Codes**: Ensure all barcode codes are unique across the system
3. **Standard Formats**: Use standard barcode formats (EAN-13, UPC-A, Code 128) when possible
4. **Bulk Operations**: Use bulk assignment for importing large datasets
5. **Print Testing**: Test print quantities with small batches first
6. **Backup**: Keep a backup of barcode assignments before bulk operations

---

## Related Documentation

- [PRINTER_CONFIGURATION_GUIDE.md](PRINTER_CONFIGURATION_GUIDE.md) - Barcode printer settings
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Complete API reference
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - System overview

---

## Support

For issues or questions about barcode management, please refer to the main API documentation or contact support.
