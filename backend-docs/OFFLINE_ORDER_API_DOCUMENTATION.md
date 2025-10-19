# Offline Order API Documentation

This document describes the offline order functionality added to the POS Backend system.

## Overview

The offline order feature allows cashiers to create orders when there's no internet connection. Once internet is restored, these orders can be synced online. This feature is only available when the inventory type is set to CUSTOM (manual stock) to prevent security issues with centralized/WooCommerce inventory.

## Prerequisites

To use offline orders, ensure the following configurations are set:

1. **Enable Offline Orders**: Set `enable_offline_orders` to `true` in GENERAL configuration
2. **Inventory Type**: Set `inventory_type` to `CUSTOM` in GENERAL configuration

**Important**: Offline orders are **NOT allowed** when `inventory_type` is `CENTRALIZED` for security reasons.

## API Endpoints

### 1. Create Offline Order

Creates a new order and marks it as offline.

**Endpoint**: `POST /api/pos/orders`

**Request Body**:
```json
{
  "outletId": 1,
  "cashierId": 1,
  "customerId": 2,
  "orderType": "COUNTER",
  "items": [
    {
      "productId": 10,
      "productName": "Product Name",
      "quantity": 2,
      "unitPrice": 15.50,
      "discountAmount": 0,
      "notes": null,
      "weight": null
    }
  ],
  "discountAmount": 0,
  "discountType": "FIXED",
  "couponCode": null,
  "payments": [
    {
      "paymentMethodId": 1,
      "amount": 31.00
    }
  ],
  "notes": "Customer notes",
  "isOffline": true
}
```

**Response**: 
```json
{
  "status": "success",
  "messageKey": "success.order.created",
  "message": "Order created successfully",
  "timestamp": "2025-10-17T14:00:00Z",
  "path": "/api/pos/orders",
  "data": {
    "id": 1,
    "orderNumber": "ORD-1729177200000-A1B2C3D4",
    "isOnline": false,
    "status": "COMPLETED",
    "totalAmount": 31.00,
    ...
  }
}
```

**Validation Rules**:
- If `isOffline` is `true`:
  - `enable_offline_orders` configuration must be `true`
  - `inventory_type` configuration must be `CUSTOM`
- If validation fails, returns HTTP 400 with appropriate error message

### 2. Sync Offline Order

Syncs an offline order to online status.

**Endpoint**: `POST /api/pos/orders/{orderId}/sync`

**Path Parameters**:
- `orderId` (Long): The ID of the order to sync

**Response**:
```json
{
  "status": "success",
  "messageKey": "success.order.synced",
  "message": "Offline order synced successfully",
  "timestamp": "2025-10-17T14:00:00Z",
  "path": "/api/pos/orders/1/sync",
  "data": {
    "id": 1,
    "orderNumber": "ORD-1729177200000-A1B2C3D4",
    "isOnline": true,
    "status": "COMPLETED",
    ...
  }
}
```

**Validation Rules**:
- Order must exist
- Order must be offline (`isOnline` = `false`)
- Order must be completed (`status` = `COMPLETED`)
- If validation fails, returns HTTP 400 with appropriate error message

### 3. Get Offline Orders

Retrieves all offline orders for a specific outlet.

**Endpoint**: `GET /api/pos/orders/offline`

**Query Parameters**:
- `outletId` (Long, required): The outlet ID

**Response**:
```json
{
  "status": "success",
  "message": "Offline orders retrieved successfully",
  "timestamp": "2025-10-17T14:00:00Z",
  "path": "/api/pos/orders/offline?outletId=1",
  "data": [
    {
      "id": 1,
      "orderNumber": "ORD-1729177200000-A1B2C3D4",
      "isOnline": false,
      "status": "COMPLETED",
      ...
    },
    {
      "id": 2,
      "orderNumber": "ORD-1729177300000-E5F6G7H8",
      "isOnline": false,
      "status": "COMPLETED",
      ...
    }
  ]
}
```

### 4. Filter Orders by Online Status

Enhanced the existing orders endpoint to filter by online/offline status.

**Endpoint**: `GET /api/admin/orders`

**Query Parameters**:
- `outletId` (Long, optional): Filter by outlet
- `status` (String, optional): Filter by order status
- `isOnline` (Boolean, optional): Filter by online/offline status
  - `true`: Only online orders
  - `false`: Only offline orders
  - `null`: All orders
- `startDate` (DateTime, optional): Start date for date range filter
- `endDate` (DateTime, optional): End date for date range filter

**Example Requests**:
```
GET /api/admin/orders?outletId=1&status=COMPLETED&isOnline=false
GET /api/admin/orders?outletId=1&isOnline=true
GET /api/admin/orders?outletId=1
```

## Error Codes

| Error Code | HTTP Status | Description |
|-----------|-------------|-------------|
| `error.offline-order.not-enabled` | 400 | Offline orders are not enabled in configuration |
| `error.offline-order.centralized-inventory` | 400 | Offline orders not allowed with CENTRALIZED inventory |
| `error.order.already-online` | 400 | Order is already synced online |
| `error.order.not-completed` | 400 | Only completed orders can be synced |

## Workflow Example

### 1. Normal Workflow (Online Order)
```
1. Cashier creates order with isOffline=false or null
2. Order is immediately saved as online (isOnline=true)
3. No sync needed
```

### 2. Offline Workflow
```
1. Internet connection is lost
2. Cashier creates order with isOffline=true
3. Order is saved as offline (isOnline=false)
4. Internet connection is restored
5. Cashier retrieves offline orders: GET /api/pos/orders/offline?outletId=1
6. Cashier syncs each order: POST /api/pos/orders/{orderId}/sync
7. Orders are now online (isOnline=true)
```

## Security Considerations

1. **Inventory Type Restriction**: 
   - Offline orders are blocked when inventory type is CENTRALIZED
   - This prevents stock discrepancies between online and POS systems

2. **Sync Validation**:
   - Only completed orders can be synced
   - Orders already online cannot be synced again
   - Proper error messages guide users

3. **Configuration Check**:
   - Offline orders must be explicitly enabled
   - System validates configuration before allowing offline orders

## Configuration Setup

To enable offline orders, create or update the following configurations:

```sql
-- Enable offline orders
INSERT INTO configurations (config_key, config_value, category, description, data_type, created_date, record_status, version)
VALUES ('enable_offline_orders', 'true', 'GENERAL', 'Enable offline order mode', 'BOOLEAN', NOW(), 'ACTIVE', 0)
ON DUPLICATE KEY UPDATE config_value = 'true';

-- Set inventory type to CUSTOM
INSERT INTO configurations (config_key, config_value, category, description, data_type, created_date, record_status, version)
VALUES ('inventory_type', 'CUSTOM', 'GENERAL', 'Inventory type (CUSTOM or CENTRALIZED)', 'STRING', NOW(), 'ACTIVE', 0)
ON DUPLICATE KEY UPDATE config_value = 'CUSTOM';
```

## Testing

### Unit Tests
- `PosServiceOfflineOrderTest`: Comprehensive test coverage for offline order functionality
  - Test offline order creation with CUSTOM inventory
  - Test blocking offline orders with CENTRALIZED inventory
  - Test blocking when offline orders are disabled
  - Test online order creation (no validation)
  - Test syncing offline orders
  - Test validation errors

### Integration Testing
1. Set up configurations as described above
2. Test creating offline orders via API
3. Test syncing offline orders
4. Test filtering orders by online status
5. Verify error handling for invalid scenarios
