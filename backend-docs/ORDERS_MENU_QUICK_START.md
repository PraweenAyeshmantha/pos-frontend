# Orders Menu APIs - Quick Start Guide

## 🚀 Overview

This guide provides a quick reference for the Orders Menu APIs that enable comprehensive order management in the POS system.

## 📋 What's New

### New APIs Added

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/orders/{id}/details` | GET | Get complete order with items |
| `/api/admin/orders/{id}/restore` | POST | Restore held order to cart |
| `/api/admin/orders/{id}/transfer-to-kitchen` | POST | Send order to kitchen |
| `/api/admin/orders/{id}` | DELETE | Remove non-completed order |

### Existing APIs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/orders` | GET | List all orders (with filters) |
| `/api/admin/orders/{id}` | GET | Get single order |
| `/api/admin/orders/{id}/hold` | POST | Put order on hold |
| `/api/admin/orders/{id}/cancel` | POST | Cancel order |
| `/api/admin/orders/{id}/refund` | POST | Refund order |

## 🎯 Common Use Cases

### 1. Display Order List with Filters

```bash
# Get all orders
GET /api/admin/orders

# Get online orders
GET /api/admin/orders?outletId=1&isOnline=true

# Get held orders
GET /api/admin/orders?outletId=1&status=ON_HOLD

# Get orders by date range
GET /api/admin/orders?outletId=1&startDate=2025-10-01T00:00:00Z&endDate=2025-10-15T23:59:59Z
```

### 2. View Order Details

```bash
# Get order with all items
GET /api/admin/orders/362/details

# Response includes:
# - Order information
# - Customer details
# - Outlet and cashier info
# - Complete items list with pricing
# - Tax and discount breakdown
```

### 3. Manage Held Orders

```bash
# Put order on hold
POST /api/admin/orders/362/hold

# Restore to cart for editing
POST /api/admin/orders/362/restore

# Transfer to kitchen (restaurant/cafe mode)
POST /api/admin/orders/362/transfer-to-kitchen

# Remove unwanted order
DELETE /api/admin/orders/362
```

### 4. Process Refunds

```bash
# Refund completed order
POST /api/admin/orders/362/refund
```

## 📊 Order Status Flow

```
DRAFT
  ↓
  ├→ ON_HOLD
  │    ↓
  │    ├→ DRAFT (restore)
  │    ├→ PREPARING (transfer to kitchen)
  │    └→ DELETED
  ↓
PENDING
  ↓
PREPARING (kitchen)
  ↓
READY
  ↓
COMPLETED
  ↓
REFUNDED
```

## 🔍 Response Format

All endpoints return standardized responses:

```json
{
  "status": "SUCCESS",
  "code": "success",
  "message": "Human-readable message",
  "timestamp": "2025-10-15T17:00:00Z",
  "path": "/api/admin/orders/362",
  "data": { ... }
}
```

## 💡 Key Features

### OrderDetailDTO
- **Complete Order Info**: All order details in one call
- **Items Included**: Full item list with pricing
- **Customer Data**: Name, email, phone
- **Outlet Info**: Name, code, address
- **Cashier Info**: Name, username
- **Table Info**: For dine-in orders

### OrderItemDTO
- Product details (ID, name)
- Quantity and unit price
- Tax calculations
- Discount information
- Custom item flag

## 🧪 Testing

### Run Tests
```bash
# All tests
./mvnw test

# Orders Menu tests only
./mvnw test -Dtest=OrderServiceNewApisTest,OrderControllerNewApisTest
```

### Manual API Testing
```bash
# Make script executable
chmod +x test-orders-api.sh

# Run tests (requires running server)
./test-orders-api.sh
```

## 📖 Documentation

| Document | Description |
|----------|-------------|
| `ORDERS_API_DOCUMENTATION.md` | Complete API reference |
| `ORDERS_MENU_APIS_IMPLEMENTATION_SUMMARY.md` | Technical implementation details |
| `test-orders-api.sh` | Manual testing script |

## 🎨 UI Integration Map

Based on the provided screenshots:

### Order List Screen
- **Online/Offline/Hold Buttons**: Filter using `status=ON_HOLD` or `isOnline=true/false`
- **Search**: Use order number filter
- **Order Cards**: Display data from OrderDTO
  - Order number (`orderNumber`)
  - Date (`createdDate`)
  - Customer (`customerName`, `customerEmail`)
  - Amount (`totalAmount`)
  - Status (`status`)

### Order Details Screen
- **Order Info**: Use `GET /api/admin/orders/{id}/details`
- **Items List**: Iterate through `items` array
  - Product name (`productName`)
  - Quantity (`quantity`)
  - Price (`unitPrice`)
  - Total (`totalAmount`)
- **Totals Section**:
  - Subtotal (`subtotal`)
  - Tax (`taxAmount`)
  - Discount (`discountAmount`)
  - Total (`totalAmount`)
  - Cash/Change (`paidAmount`, `changeAmount`)

### Action Buttons
- **Print Invoice**: Use order details data
- **Refund**: Call `POST /api/admin/orders/{id}/refund`
- **Restore to Cart**: Call `POST /api/admin/orders/{id}/restore`
- **Transfer to Kitchen**: Call `POST /api/admin/orders/{id}/transfer-to-kitchen`
- **Delete**: Call `DELETE /api/admin/orders/{id}`

## ⚡ Quick Reference

### Status Codes
- `200 OK` - Success
- `400 Bad Request` - Invalid operation
- `404 Not Found` - Order not found
- `500 Internal Server Error` - Server error

### Business Rules
✅ Only ON_HOLD orders can be restored  
✅ Only ON_HOLD or DRAFT orders can be transferred to kitchen  
✅ Completed orders cannot be deleted  
✅ All order state transitions are validated  

## 🚦 Getting Started

1. **Start the server**
   ```bash
   ./mvnw spring-boot:run
   ```

2. **Test an endpoint**
   ```bash
   curl http://localhost:8080/api/admin/orders \
     -H "X-Tenant-ID: tenant1"
   ```

3. **View documentation**
   - See `ORDERS_API_DOCUMENTATION.md` for complete reference

4. **Run tests**
   ```bash
   ./mvnw test
   ```

## 📞 Support

For detailed information:
- **API Docs**: `ORDERS_API_DOCUMENTATION.md`
- **Implementation**: `ORDERS_MENU_APIS_IMPLEMENTATION_SUMMARY.md`
- **Test Script**: `test-orders-api.sh`

## ✅ Checklist

Implementation checklist for frontend developers:

- [ ] Integrate order list endpoint with filters
- [ ] Implement order details view with items
- [ ] Add hold order functionality
- [ ] Add restore to cart button
- [ ] Add transfer to kitchen button (restaurant mode)
- [ ] Add delete order button
- [ ] Add refund order functionality
- [ ] Implement print invoice using order data
- [ ] Add error handling for all operations
- [ ] Test all status transitions

---

**All APIs are ready for integration!** 🎉
