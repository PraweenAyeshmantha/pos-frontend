# Orders Page - Quick Reference

## Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Orders                                                       │
│ Review, fulfill, and reconcile POS orders across channels   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Showing 25 orders • 18 completed    [Search orders...    ] │
│                                                              │
│ [All Outlets ▼] [All Statuses ▼] [All Types ▼] [All Src ▼]│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Order           Customer    Outlet      Type    Status  ... │
│─────────────────────────────────────────────────────────────│
│ ORD-001         John Doe    Main St     Counter COMPLETED..│
│ [Online]                    MS-001                          │
│                                                              │
│ ORD-002         Jane Smith  Downtown    Dine In PREPARING..│
│                             DT-002                          │
└─────────────────────────────────────────────────────────────┘
```

## Components Breakdown

### 1. Page Header
- **Title**: "Orders" (3xl, semibold)
- **Description**: Descriptive subtitle in slate-600

### 2. Filter Card (rounded-2xl with border)
- **Metrics Row**: 
  - Left: "Showing X orders • Y completed" (whitespace-nowrap)
  - Right: Search input field
- **Filter Row** (4 columns on desktop, responsive):
  - Outlet dropdown
  - Status dropdown
  - Type dropdown
  - Source dropdown (Online/In-Store)

### 3. Orders Table
**Columns:**
- Order (with order number + online badge)
- Customer (name or email)
- Outlet (name + code)
- Type (Counter/Dine In/Takeaway/Delivery)
- Status (colored badge)
- Total (formatted currency)
- Date (formatted date/time)
- Actions (View button)

**Row Styling:**
- Hover state: bg-slate-50
- Vertical alignment: align-top
- Proper spacing: px-6 py-4

### 4. Order Details Modal

```
┌──────────────────────────────────────────────┐
│ Order Details            ORD-001         [×] │
├──────────────────────────────────────────────┤
│                                              │
│ Status                    Order Type        │
│ [Completed]              Counter            │
│                                              │
│ Created Date             Completed Date     │
│ Nov 7, 2025 10:30 AM    Nov 7, 2025 11:00  │
│                                              │
│ ┌────────────────────────────────────────┐ │
│ │ Outlet Information                     │ │
│ │ Name: Main Street Store                │ │
│ │ Code: MS-001                           │ │
│ └────────────────────────────────────────┘ │
│                                              │
│ ┌────────────────────────────────────────┐ │
│ │ Customer Information                   │ │
│ │ Name: John Doe                         │ │
│ │ Email: john@example.com                │ │
│ │ Phone: +1234567890                     │ │
│ └────────────────────────────────────────┘ │
│                                              │
│ ┌────────────────────────────────────────┐ │
│ │ Financial Details                      │ │
│ │ Subtotal              $100.00          │ │
│ │ Discount              -$10.00          │ │
│ │ Tax                   $9.00            │ │
│ │ ───────────────────────────────────    │ │
│ │ Total                 $99.00           │ │
│ │ Paid Amount           $100.00          │ │
│ │ Change                $1.00            │ │
│ └────────────────────────────────────────┘ │
│                                              │
│ Order Source: [Online Order]                │
│                                              │
├──────────────────────────────────────────────┤
│                              [Close]         │
└──────────────────────────────────────────────┘
```

## Status Badge Colors

| Status     | Background  | Text        | Example            |
|------------|-------------|-------------|--------------------|
| Draft      | slate-100   | slate-700   | ⚪ Draft           |
| Pending    | blue-100    | blue-700    | 🔵 Pending         |
| Preparing  | amber-100   | amber-700   | 🟠 Preparing       |
| Ready      | purple-100  | purple-700  | 🟣 Ready           |
| Completed  | emerald-100 | emerald-700 | 🟢 Completed       |
| Cancelled  | red-100     | red-700     | 🔴 Cancelled       |
| Refunded   | orange-100  | orange-700  | 🟧 Refunded        |
| On Hold    | yellow-100  | yellow-700  | 🟡 On Hold         |

## User Interactions

### Search
- Type in search box → Filters orders in real-time
- Searches: Order number, customer name, customer email, outlet name

### Filters
1. **Outlet Filter**: Select specific outlet to view only its orders
2. **Status Filter**: Filter by order status (Draft, Pending, etc.)
3. **Type Filter**: Filter by order type (Counter, Dine In, etc.)
4. **Source Filter**: Filter by Online or In-Store orders

### View Details
- Click "View" button → Opens modal with complete order information
- Click backdrop or Close button → Closes modal

## Data Flow

```
OrdersPage Component
    │
    ├─→ Fetch Orders (orderService.getAll())
    │   └─→ GET /api/admin/orders
    │
    ├─→ Fetch Outlets (outletService.getAll())
    │   └─→ GET /api/admin/outlets
    │
    ├─→ Filter & Search Logic
    │   └─→ filteredOrders (memoized)
    │
    └─→ Render
        ├─→ AdminPageHeader
        ├─→ Filter Card (Search + Dropdowns)
        ├─→ Orders Table (or Loading/Empty State)
        └─→ OrderDetailsModal (when viewing)
```

## Responsive Breakpoints

- **Mobile (< 640px)**: 
  - 1 column filters
  - Horizontal scroll table
  - Stacked modal content

- **Tablet (640px - 1024px)**:
  - 2 column filters
  - Better table visibility
  - Modal with side padding

- **Desktop (> 1024px)**:
  - 4 column filters
  - Full table visible
  - Modal centered with max-width

## Key Features

✅ Real-time search
✅ Multiple filter combinations
✅ Status-based color coding
✅ Responsive design
✅ Loading states
✅ Empty states
✅ Error handling
✅ Detailed view modal
✅ Sort by date (newest first)
✅ Online order badges
✅ Currency formatting
✅ Date/time formatting
✅ Keyboard accessible

## Performance Optimizations

- `useCallback` for stable function references
- `useMemo` for filtered orders computation
- Memoized status/type label lookups
- Efficient date parsing and formatting
- Minimal re-renders with proper React patterns
