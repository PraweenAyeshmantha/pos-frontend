# Orders Submenu Feature

## Overview

The Orders submenu displays all orders generated at the point of sale, including comprehensive details about each order such as client information, dates, status, total amounts, outlet details, and cashier information.

## Implementation

### OrderDTO

A new Data Transfer Object (DTO) has been created to properly serialize order information with all related entities:

**File:** `src/main/java/com/pos/dto/OrderDTO.java`

The `OrderDTO` includes the following information:

#### Order Basic Information
- `id`: Order unique identifier
- `orderNumber`: Human-readable order number
- `orderType`: Type of order (DINE_IN, TAKEAWAY, DELIVERY, COUNTER)
- `status`: Current order status (DRAFT, PENDING, PREPARING, READY, COMPLETED, CANCELLED, REFUNDED, ON_HOLD)
- `createdDate`: When the order was created
- `completedDate`: When the order was completed (if applicable)
- `isOnline`: Whether this is an online order

#### Financial Information
- `subtotal`: Subtotal amount before taxes and discounts
- `discountAmount`: Discount applied to the order
- `taxAmount`: Tax amount
- `totalAmount`: Final total amount
- `paidAmount`: Amount paid by customer
- `changeAmount`: Change given to customer
- `notes`: Any additional notes for the order

#### Customer Details (Client Information)
- `customerId`: Customer unique identifier
- `customerName`: Customer full name
- `customerEmail`: Customer email address
- `customerPhone`: Customer phone number

#### Outlet Details
- `outletId`: Outlet unique identifier
- `outletName`: Name of the outlet where order was placed
- `outletCode`: Outlet code

#### Cashier Details
- `cashierId`: Cashier unique identifier
- `cashierName`: Name of the cashier who processed the order
- `cashierUsername`: Cashier username

### API Endpoint

**Endpoint:** `GET /api/admin/orders`

**Description:** Retrieves all orders with full details including customer, outlet, and cashier information.

**Query Parameters:**
- `outletId` (optional): Filter orders by outlet
- `status` (optional): Filter orders by status (DRAFT, PENDING, PREPARING, READY, COMPLETED, CANCELLED, REFUNDED, ON_HOLD)
- `startDate` (optional): Filter orders from this date (ISO 8601 format)
- `endDate` (optional): Filter orders until this date (ISO 8601 format)

**Response Format:**
```json
{
  "status": "SUCCESS",
  "code": "success",
  "message": "Orders retrieved successfully",
  "timestamp": "2025-10-14T17:00:00Z",
  "path": "/api/admin/orders",
  "data": [
    {
      "id": 1,
      "orderNumber": "ORD-001",
      "orderType": "COUNTER",
      "status": "COMPLETED",
      "subtotal": 100.00,
      "discountAmount": 10.00,
      "taxAmount": 9.00,
      "totalAmount": 99.00,
      "paidAmount": 100.00,
      "changeAmount": 1.00,
      "notes": "Customer requested extra napkins",
      "createdDate": "2025-10-14T10:30:00Z",
      "completedDate": "2025-10-14T10:35:00Z",
      "isOnline": false,
      "customerId": 123,
      "customerName": "Jane Smith",
      "customerEmail": "jane@example.com",
      "customerPhone": "1234567890",
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

### Service Layer

**File:** `src/main/java/com/pos/service/OrderService.java`

New methods added to retrieve orders as DTOs:
- `getAllOrdersAsDTO()`: Get all orders with full details
- `getOrdersByOutletAsDTO(Long outletId)`: Get orders filtered by outlet
- `getOrdersByOutletAndStatusAsDTO(Long outletId, OrderStatus status)`: Get orders filtered by outlet and status
- `getOrdersByDateRangeAsDTO(Long outletId, OffsetDateTime startDate, OffsetDateTime endDate)`: Get orders within a date range

## Usage Examples

### Get All Orders
```bash
curl -X GET http://localhost:8080/api/admin/orders \
  -H "Content-Type: application/json"
```

### Get Orders for Specific Outlet
```bash
curl -X GET "http://localhost:8080/api/admin/orders?outletId=1" \
  -H "Content-Type: application/json"
```

### Get Orders by Status
```bash
curl -X GET "http://localhost:8080/api/admin/orders?outletId=1&status=COMPLETED" \
  -H "Content-Type: application/json"
```

### Get Orders by Date Range
```bash
curl -X GET "http://localhost:8080/api/admin/orders?outletId=1&startDate=2025-10-01T00:00:00Z&endDate=2025-10-14T23:59:59Z" \
  -H "Content-Type: application/json"
```

## Benefits

1. **Complete Information**: The DTO includes all necessary information for displaying orders in the UI without requiring additional API calls
2. **No Lazy Loading Issues**: All related entities (customer, outlet, cashier) are eagerly loaded and included in the response
3. **Clean Separation**: The DTO pattern separates the domain model from the API response, allowing for future changes without breaking the API
4. **Type Safety**: All enums are converted to strings for easier consumption by frontend applications
5. **Null Safety**: The DTO handles null relationships gracefully, only including customer and cashier details when they exist

## Frontend Integration

The frontend can consume this API to display:
- Order list view with all details
- Customer information per order
- Outlet where the order was placed
- Cashier who processed the order
- Order status and dates
- Financial details including totals and payment information

## Testing

Unit tests have been created to verify the OrderDTO conversion:
- **File:** `src/test/java/com/pos/dto/OrderDTOTest.java`
- Tests cover conversion with all details, partial details, and edge cases

## Backward Compatibility

The original Order entity endpoints remain unchanged. This implementation adds new DTO-based methods alongside the existing ones, ensuring backward compatibility with any existing integrations.
