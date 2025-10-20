# Sales Receipt/Invoice API Documentation

## Overview

This API endpoint provides comprehensive invoice/receipt data for orders, combining order details, items, payments, outlet information, and the appropriate invoice template. This data can be used to generate and print sales receipts or invoices.

## Endpoint

### Get Invoice/Receipt Data for an Order

Retrieves all the information needed to print an invoice or receipt for a specific order.

**Endpoint:** `GET /api/admin/orders/{id}/invoice`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | Long | Yes | Order ID |

**Response Status Codes:**

- `200 OK` - Invoice data retrieved successfully
- `404 Not Found` - Order not found
- `401 Unauthorized` - Missing or invalid authentication
- `500 Internal Server Error` - Server error

**Response Body:**

```json
{
  "status": "SUCCESS",
  "code": "success",
  "message": "Invoice data retrieved successfully",
  "timestamp": "2025-10-17T17:40:00Z",
  "path": "/api/admin/orders/1/invoice",
  "data": {
    "orderId": 1,
    "orderNumber": "ORD-001",
    "orderType": "COUNTER",
    "status": "COMPLETED",
    "orderDate": "2025-10-17T10:30:00Z",
    "completedDate": "2025-10-17T10:35:00Z",
    
    "customerId": 123,
    "customerName": "Jane Smith",
    "customerEmail": "jane@example.com",
    "customerPhone": "1234567890",
    
    "outletId": 1,
    "outletName": "Main Store",
    "outletCode": "MS001",
    "outletAddress": "123 Main Street, City, State 12345",
    "outletPhone": "555-0100",
    "outletEmail": "main@store.com",
    
    "cashierId": 5,
    "cashierName": "John Doe",
    "cashierUsername": "johndoe",
    
    "tableId": 10,
    "tableNumber": "T-05",
    
    "items": [
      {
        "id": 1,
        "productId": 100,
        "productName": "Coffee Beans 1kg",
        "quantity": 2.00,
        "unitPrice": 25.00,
        "discountAmount": 0.00,
        "taxRate": 10.00,
        "taxAmount": 5.00,
        "totalAmount": 50.00,
        "notes": null,
        "isCustom": false
      },
      {
        "id": 2,
        "productId": 101,
        "productName": "Tea Bags - Box of 100",
        "quantity": 1.00,
        "unitPrice": 15.00,
        "discountAmount": 2.00,
        "taxRate": 10.00,
        "taxAmount": 1.30,
        "totalAmount": 13.00,
        "notes": null,
        "isCustom": false
      }
    ],
    
    "subtotal": 65.00,
    "discountAmount": 2.00,
    "couponCode": "SAVE10",
    "taxAmount": 6.30,
    "totalAmount": 63.00,
    "paidAmount": 70.00,
    "changeAmount": 7.00,
    
    "payments": [
      {
        "paymentId": 1,
        "paymentMethod": "Cash",
        "amount": 70.00,
        "paymentDate": "2025-10-17T10:35:00Z",
        "referenceNumber": "REF-001"
      }
    ],
    
    "invoiceTemplate": {
      "id": 1,
      "name": "Standard Invoice Template",
      "headerText": "Welcome to Main Store\nThank you for shopping with us!",
      "footerText": "For any queries, please contact us at main@store.com\nVisit us again!",
      "logoUrl": "https://example.com/logo.png",
      "showCompanyInfo": true,
      "showTaxDetails": true,
      "paperSize": "A4",
      "isDefault": true,
      "isActive": true
    },
    
    "notes": "Customer requested gift wrapping"
  }
}
```

## Data Model

### InvoiceDataDTO

Complete invoice data combining all information needed for printing.

| Field | Type | Description |
|-------|------|-------------|
| `orderId` | Long | Order unique identifier |
| `orderNumber` | String | Human-readable order number |
| `orderType` | String | Type of order (DINE_IN, TAKEAWAY, DELIVERY, COUNTER) |
| `status` | String | Current order status |
| `orderDate` | ISO 8601 DateTime | When the order was created |
| `completedDate` | ISO 8601 DateTime | When the order was completed (if applicable) |
| `customerId` | Long | Customer unique identifier (may be null) |
| `customerName` | String | Customer full name (may be null) |
| `customerEmail` | String | Customer email address (may be null) |
| `customerPhone` | String | Customer phone number (may be null) |
| `outletId` | Long | Outlet unique identifier |
| `outletName` | String | Name of the outlet |
| `outletCode` | String | Outlet code |
| `outletAddress` | String | Outlet full address |
| `outletPhone` | String | Outlet contact phone |
| `outletEmail` | String | Outlet email address |
| `cashierId` | Long | Cashier unique identifier (may be null) |
| `cashierName` | String | Name of the cashier (may be null) |
| `cashierUsername` | String | Cashier username (may be null) |
| `tableId` | Long | Table unique identifier (for dine-in orders, may be null) |
| `tableNumber` | String | Table number (for dine-in orders, may be null) |
| `items` | List<OrderItemDTO> | List of order items |
| `subtotal` | BigDecimal | Subtotal amount before taxes and discounts |
| `discountAmount` | BigDecimal | Total discount applied to the order |
| `couponCode` | String | Coupon code used (may be null) |
| `taxAmount` | BigDecimal | Total tax amount |
| `totalAmount` | BigDecimal | Final total amount |
| `paidAmount` | BigDecimal | Amount paid by customer |
| `changeAmount` | BigDecimal | Change given to customer |
| `payments` | List<PaymentDetailDTO> | List of payments made |
| `invoiceTemplate` | InvoiceTemplateDTO | Invoice template configuration (may be null) |
| `notes` | String | Additional order notes (may be null) |

### PaymentDetailDTO

Payment information within the invoice data.

| Field | Type | Description |
|-------|------|-------------|
| `paymentId` | Long | Payment unique identifier |
| `paymentMethod` | String | Name of the payment method (Cash, Credit Card, etc.) |
| `amount` | BigDecimal | Payment amount |
| `paymentDate` | ISO 8601 DateTime | When the payment was made |
| `referenceNumber` | String | Payment reference number (may be null) |

### InvoiceTemplateDTO

Invoice template configuration for rendering the invoice.

| Field | Type | Description |
|-------|------|-------------|
| `id` | Long | Template unique identifier |
| `name` | String | Template name |
| `headerText` | String | Header text to display on invoice |
| `footerText` | String | Footer text to display on invoice |
| `logoUrl` | String | URL to company logo image |
| `showCompanyInfo` | Boolean | Whether to show company information |
| `showTaxDetails` | Boolean | Whether to show detailed tax information |
| `paperSize` | String | Paper size (A4, LETTER, etc.) |
| `isDefault` | Boolean | Whether this is the default template |
| `isActive` | Boolean | Whether this template is active |

## How It Works

### Invoice Template Selection

The API automatically selects the appropriate invoice template using the following logic:

1. **Outlet-Specific Template**: First, it looks for an active invoice template that has been specifically assigned to the order's outlet.

2. **Default Template**: If no outlet-specific template is found, it falls back to the default invoice template.

3. **No Template**: If neither is found (rare case), the invoice data is returned without template information, and the frontend can use a default layout.

### Use Cases

#### 1. Print Invoice After Order Completion

When an order is completed, fetch the invoice data and print it:

```bash
curl -X GET "http://localhost:8080/pos-codex/api/admin/orders/123/invoice" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json"
```

#### 2. Reprint Invoice from Orders Menu

From the orders menu, select a previous order and reprint its invoice:

```bash
curl -X GET "http://localhost:8080/pos-codex/api/admin/orders/456/invoice" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json"
```

#### 3. Email Invoice to Customer

Retrieve the invoice data, format it as HTML or PDF, and email it to the customer using the customer email from the response.

## Frontend Integration

### Recommended Implementation Steps

1. **Fetch Invoice Data**: Call the endpoint after order completion or when user requests to print/view invoice

2. **Render Invoice**: Use the invoice template configuration to render the invoice:
   - Display `logoUrl` if provided and `invoiceTemplate` is not null
   - Show header text from `invoiceTemplate.headerText`
   - Display outlet information if `invoiceTemplate.showCompanyInfo` is true
   - Show detailed tax breakdown if `invoiceTemplate.showTaxDetails` is true
   - Display footer text from `invoiceTemplate.footerText`

3. **Format for Printing**: 
   - Use the `paperSize` from template for print layout
   - Format amounts with 2 decimal places
   - Group items logically
   - Calculate and display subtotals, taxes, discounts clearly

4. **Handle Missing Data**: 
   - Gracefully handle null fields (customer info, table info, etc.)
   - Use default values when template is not available

### Example Frontend Code (Pseudo)

```javascript
async function printInvoice(orderId) {
  // Fetch invoice data
  const response = await fetch(`/api/admin/orders/${orderId}/invoice`, {
    headers: {
      'X-Tenant-ID': 'PaPos',
      'Content-Type': 'application/json'
    }
  });
  
  const { data: invoice } = await response.json();
  
  // Render invoice
  const invoiceHtml = generateInvoiceHTML(invoice);
  
  // Print
  const printWindow = window.open('', '_blank');
  printWindow.document.write(invoiceHtml);
  printWindow.document.close();
  printWindow.print();
}

function generateInvoiceHTML(invoice) {
  const template = invoice.invoiceTemplate || {};
  
  return `
    <html>
      <head>
        <title>Invoice ${invoice.orderNumber}</title>
        <style>
          /* Styling based on ${template.paperSize || 'A4'} */
          body { font-family: Arial, sans-serif; }
          .header { text-align: center; }
          .items { margin: 20px 0; }
          .totals { text-align: right; }
        </style>
      </head>
      <body>
        ${template.logoUrl ? `<img src="${template.logoUrl}" alt="Logo"/>` : ''}
        ${template.headerText ? `<div class="header">${template.headerText}</div>` : ''}
        
        ${template.showCompanyInfo ? `
          <div class="company-info">
            <h3>${invoice.outletName}</h3>
            <p>${invoice.outletAddress}</p>
            <p>${invoice.outletPhone} | ${invoice.outletEmail}</p>
          </div>
        ` : ''}
        
        <h2>Invoice #${invoice.orderNumber}</h2>
        <p>Date: ${new Date(invoice.orderDate).toLocaleString()}</p>
        ${invoice.customerName ? `<p>Customer: ${invoice.customerName}</p>` : ''}
        
        <table class="items">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td>${item.productName}</td>
                <td>${item.quantity}</td>
                <td>$${item.unitPrice.toFixed(2)}</td>
                <td>$${item.totalAmount.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <p>Subtotal: $${invoice.subtotal.toFixed(2)}</p>
          ${invoice.discountAmount > 0 ? 
            `<p>Discount: -$${invoice.discountAmount.toFixed(2)}</p>` : ''}
          ${template.showTaxDetails ? 
            `<p>Tax: $${invoice.taxAmount.toFixed(2)}</p>` : ''}
          <h3>Total: $${invoice.totalAmount.toFixed(2)}</h3>
          <p>Paid: $${invoice.paidAmount.toFixed(2)}</p>
          ${invoice.changeAmount > 0 ? 
            `<p>Change: $${invoice.changeAmount.toFixed(2)}</p>` : ''}
        </div>
        
        ${template.footerText ? 
          `<div class="footer">${template.footerText}</div>` : ''}
      </body>
    </html>
  `;
}
```

## Error Handling

### 404 Not Found

When the specified order doesn't exist:

```json
{
  "status": "ERROR",
  "code": "error.not_found",
  "message": "Order not found with id: 999",
  "timestamp": "2025-10-17T17:40:00Z",
  "path": "/api/admin/orders/999/invoice"
}
```

### Missing Invoice Template

The system gracefully handles missing invoice templates. If no template is found, the `invoiceTemplate` field in the response will be `null`, and the frontend should use a default layout.

## Best Practices

1. **Always Check for Null Values**: Customer, cashier, table, and template information may be null

2. **Format Currency Properly**: Use 2 decimal places for all monetary values

3. **Cache Template Data**: If using the same template for multiple invoices, cache it to reduce API calls

4. **Handle Errors Gracefully**: Show user-friendly messages when orders can't be found

5. **Test Printing**: Test the print layout on actual receipt printers/paper sizes

6. **Support Multiple Formats**: Consider supporting both screen view and print view

7. **Include All Payment Methods**: Show all payments made, especially for split payments

## Related APIs

- `GET /api/admin/orders/{id}/details` - Get order details without invoice template
- `GET /api/admin/invoice-templates` - Manage invoice templates
- `GET /api/admin/invoice-templates/default` - Get the default template
- `GET /api/admin/invoice-templates/{id}/outlets` - See which outlets use which templates

## Testing

Test the endpoint with different scenarios:

```bash
# Standard completed order
curl -X GET "http://localhost:8080/pos-codex/api/admin/orders/1/invoice" \
  -H "X-Tenant-ID: PaPos"

# Order with dining table
curl -X GET "http://localhost:8080/pos-codex/api/admin/orders/2/invoice" \
  -H "X-Tenant-ID: PaPos"

# Order without customer
curl -X GET "http://localhost:8080/pos-codex/api/admin/orders/3/invoice" \
  -H "X-Tenant-ID: PaPos"

# Order with discount and coupon
curl -X GET "http://localhost:8080/pos-codex/api/admin/orders/4/invoice" \
  -H "X-Tenant-ID: PaPos"
```

## Summary

The Sales Receipt/Invoice API provides a comprehensive, single endpoint solution for retrieving all data needed to print professional invoices. It intelligently selects the appropriate invoice template and combines it with complete order information, making it easy for frontend applications to generate and print receipts with minimal effort.
