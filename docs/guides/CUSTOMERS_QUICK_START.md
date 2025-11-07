# Customers Page - Quick Start Guide

## Accessing the Page

Navigate to: **Admin → Customers** or directly to `/admin/customers`

## Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Customers                                                    │
│ Build lasting relationships with a unified view of your      │
│ shoppers and their visits.                                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │  🔍 Search Customer...  │ Showing 12 • 10 active  [+] │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Customer    Email           Phone      Loyalty Status  │ │
│ │ ──────────────────────────────────────────────────────  │ │
│ │ [M] Mark    mark@...        408-405    100  [Active]   │ │
│ │     Doe                     -8954                       │ │
│ │     ID: 1                              [View] [Edit] [X]│ │
│ │                                                          │ │
│ │ [J] John    john@...        678-951    50   [Active]   │ │
│ │     Wick                    -8399                       │ │
│ │     ID: 2                              [View] [Edit] [X]│ │
│ └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Main Features

### 1. Search Bar
- Type to search by **name**, **email**, or **phone**
- Results filter instantly (no API calls)
- Shows count: "Showing X customers • Y active"

### 2. Add Customer Button
- Opens modal with full form
- Required: Name and Email
- Optional: Phone, address, tax number, loyalty points
- Form validation with error messages

### 3. Customer Table
Each row shows:
- **Avatar** with initials
- **Name** and **ID**
- **Email** (or em dash if empty)
- **Phone** (or em dash if empty)
- **Loyalty Points** count
- **Status** badge (Active/Inactive)
- **Updated** timestamp
- **Actions**: View, Edit, Delete buttons

### 4. Action Buttons

#### View Button (Gray)
- Opens read-only modal
- All fields disabled
- Only "Close" button shown
- Perfect for quick reference

#### Edit Button (Blue)
- Opens editable modal
- Pre-filled with current data
- "Update Customer" button
- Form validation active

#### Delete Button (Red)
- Shows confirmation dialog
- "Are you sure?" message
- Must confirm to delete
- Soft delete (sets inactive)

## Modal Forms

### Add/Edit Customer Form Structure

```
┌─────────────────────────────────────────┐
│ Add New Customer                    [×] │
├─────────────────────────────────────────┤
│                                         │
│ First Name *        │ Email *           │
│ [             ]     │ [             ]   │
│                                         │
│ Phone                                   │
│ [                               ]       │
│                                         │
│ Address Line 1                          │
│ [                               ]       │
│                                         │
│ Address Line 2                          │
│ [                               ]       │
│                                         │
│ Country             │ State             │
│ [United States]     │ [Select State]    │
│                                         │
│ City                │ Postcode          │
│ [             ]     │ [             ]   │
│                                         │
│ Tax Number          │ Loyalty Points    │
│ [             ]     │ [0]               │
│                                         │
│ Status                                  │
│ [Active            ▾]                   │
│                                         │
├─────────────────────────────────────────┤
│                     [Cancel]  [Save]    │
└─────────────────────────────────────────┘
```

## States & Feedback

### Loading State
```
┌────────────────────────────────┐
│         ⟳ (spinning)           │
│    Loading customers...        │
└────────────────────────────────┘
```

### Empty State
```
┌────────────────────────────────┐
│     No customers yet           │
│                                │
│  Add your first customer to    │
│  start building lasting        │
│  relationships.                │
│                                │
│       [Add customer]           │
└────────────────────────────────┘
```

### Success Toast
```
┌─────────────────────────────────┐
│ ✓ Customer Created              │
│   Mark Doe added successfully   │
└─────────────────────────────────┘
```

### Error Toast
```
┌─────────────────────────────────┐
│ ✗ Error                         │
│   Failed to load customers      │
└─────────────────────────────────┘
```

### Delete Confirmation
```
┌─────────────────────────────────┐
│ Delete Customer                 │
│                                 │
│ Are you sure you want to delete │
│ "Mark Doe"? This action cannot  │
│ be undone.                      │
│                                 │
│         [Cancel]  [Delete]      │
└─────────────────────────────────┘
```

## User Workflows

### Adding a Customer
1. Click **"Add customer"** button
2. Fill in **Name** (required) and **Email** (required)
3. Optionally fill other fields
4. Click **"Save"**
5. Success toast appears
6. Customer appears at top of table

### Viewing a Customer
1. Find customer in table
2. Click **"View"** button
3. Modal opens in read-only mode
4. Review all details
5. Click **"Close"** or press Escape

### Editing a Customer
1. Find customer in table
2. Click **"Edit"** button
3. Modal opens with editable fields
4. Modify any fields
5. Click **"Update Customer"**
6. Success toast appears
7. Table updates with new data

### Deleting a Customer
1. Find customer in table
2. Click **"Delete"** button (red)
3. Confirmation dialog appears
4. Click **"Delete"** to confirm
5. Success toast appears
6. Customer removed from table

### Searching for a Customer
1. Click in search box
2. Type name, email, or phone
3. Table filters instantly
4. Shows count of matching results
5. Clear search to see all

## Keyboard Shortcuts

- **Escape** - Close modal
- **Enter** - Submit form (when focused)
- **Tab** - Navigate form fields
- **Click outside modal** - Close modal

## Field Validation

### Name
- **Required**
- Must not be empty
- Trimmed automatically

### Email
- **Required** in Add modal
- Must be valid format (user@domain.com)
- Shows error for invalid format

### Phone
- Optional
- No format restrictions

### Loyalty Points
- Optional
- Must be numeric
- Defaults to 0

### Other Fields
- All optional
- Text fields trimmed automatically
- Empty values saved as `undefined`

## Status Badges

### Active (Green)
- Customer can make purchases
- Appears in searches
- Normal operations

### Inactive (Gray)
- Customer soft-deleted
- Hidden from active lists
- Can be reactivated by editing

## Tips

1. **Search is fast** - Uses local filtering, no server delay
2. **Sort by updated** - Most recent changes appear first
3. **Em dash (—)** - Indicates missing/empty data
4. **Avatar initials** - Auto-generated from first letter of name
5. **Loyalty points** - Can be manually adjusted
6. **Address fields** - Stored as comma-separated internally
7. **State dropdown** - Currently shows top 10 US states (expandable)

## Common Questions

**Q: Can I bulk delete customers?**  
A: Not yet - delete one at a time for safety

**Q: Can I export customer list?**  
A: Not yet - planned for future update

**Q: What happens when I delete a customer?**  
A: Soft delete - sets status to INACTIVE, can be restored

**Q: Can customers have duplicate emails?**  
A: Yes - backend allows it (for now)

**Q: How are loyalty points used?**  
A: Display only currently - loyalty program coming soon

**Q: Can I see customer purchase history?**  
A: Not yet - coming in future update

## Technical Details

### API Endpoints
- `GET /api/pos/customers` - Fetch all
- `GET /api/pos/customers/:id` - Fetch one
- `GET /api/pos/customers/search?term=` - Search
- `POST /api/pos/customers` - Create
- `PUT /api/pos/customers/:id` - Update
- `DELETE /api/pos/customers/:id` - Delete (soft)

### Browser Support
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome)

### Performance
- **Load time**: <1 second for 100 customers
- **Search**: Real-time local filtering
- **Table render**: Optimized with React memoization

## Need Help?

Check the full implementation documentation:
`docs/implementation/CUSTOMERS_IMPLEMENTATION_COMPLETE.md`

---

**Status:** ✅ Production Ready  
**Version:** 1.0.0  
**Last Updated:** November 2025
