# Outlets Feature - Visual User Guide

## 📍 Navigation Path

```
Login → POS Admin Page → Outlets Tile → Outlets Management Page
```

## 🖼️ What You'll See

### Step 1: POS Admin Page
When you navigate to the POS Admin page, you'll see three tiles:

```
╔════════════════════════════════════════════════════════╗
║                    POS Admin                           ║
║    Centralize your administrative tasks...             ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   ║
║  │     📊      │  │     🛠️      │  │     🏪      │   ║
║  │             │  │             │  │             │   ║
║  │  Analytics  │  │Configuration│  │   Outlets   │   ║
║  │             │  │             │  │             │   ║
║  │  Review     │  │  Update POS │  │  Manage     │   ║
║  │  sales      │  │  settings,  │  │  store      │   ║
║  │  trends...  │  │  integra... │  │  locations  │   ║
║  │             │  │             │  │             │   ║
║  │  → Manage   │  │  → Manage   │  │  → Manage   │   ║
║  └─────────────┘  └─────────────┘  └─────────────┘   ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
```

**Click the "Outlets" tile (🏪) to proceed**

---

### Step 2: Outlets List Page
After clicking, you'll see the main Outlets management page:

```
╔════════════════════════════════════════════════════════════════════════╗
║  Outlets                                        [Add New] [Visit POS]  ║
║  Manage your store locations, addresses, and outlet-specific settings. ║
╠════════════════════════════════════════════════════════════════════════╣
║                                        Search: [___________] [Search]  ║
╠════════════════════════════════════════════════════════════════════════╣
║  [Bulk actions ▼] [Apply]                                              ║
╠═══╦══════╦════════════╦═══════════╦═══════════╦════════╦═════════════╣
║ ☐ ║ ID   ║ Name       ║ Mode      ║ Address   ║ Email  ║ Status      ║
╠═══╬══════╬════════════╬═══════════╬═══════════╬════════╬═════════════╣
║ ☐ ║  2   ║ Cafe/Rest  ║ Cafe/Rest ║ 361 Roger ║ rest@  ║ ● Enabled  ║
║   ║      ║            ║           ║ City:Cinc ║ email  ║             ║
║   ║      ║            ║           ║ State:OH  ║        ║  [Assign]   ║
║   ║      ║            ║           ║           ║        ║  [Kitchen]  ║
╠═══╬══════╬════════════╬═══════════╬═══════════╬════════╬═════════════╣
║ ☐ ║  1   ║ Grocery St ║ Grocery   ║ 1373 Bomb ║ groc@  ║ ● Enabled  ║
║   ║      ║            ║           ║ City:Bell ║ email  ║             ║
║   ║      ║            ║           ║ State:MI  ║        ║  [Assign]   ║
║   ║      ║            ║           ║           ║        ║  [Kitchen]  ║
╠═══╩══════╩════════════╩═══════════╩═══════════╩════════╩═════════════╣
║  [Bulk actions ▼] [Apply]                                              ║
╚════════════════════════════════════════════════════════════════════════╝
```

**Actions Available**:
- **Add New**: Opens modal to create a new outlet
- **Visit POS**: Navigate to POS interface
- **Search**: Filter outlets by name, email, phone, city, or mode
- **Assign Stocks**: Assign inventory to outlet (future feature)
- **Kitchen View**: Edit outlet details
- **Bulk actions**: Perform actions on selected outlets

---

### Step 3: Add New Outlet Modal
When you click "Add New", a modal appears with a comprehensive form:

```
╔═══════════════════════════════════════════════════════════════╗
║  Add Outlet                                              ✕    ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  Name *                                                       ║
║  [Grocery Store________________________________]              ║
║                                                               ║
║  Mode *                                                       ║
║  [Grocery/Retail ▼___________________________]                ║
║                                                               ║
║  Inventory Type *                                             ║
║  [Custom/Manual Stock ▼______________________]                ║
║                                                               ║
║  Address Line 1 *                                             ║
║  [1373 Bombardier Way______________________]                  ║
║                                                               ║
║  Address Line 2                                               ║
║  [_________________________________________]                  ║
║                                                               ║
║  City *                                                       ║
║  [Belleville_______________________________]                  ║
║                                                               ║
║  State *                                                      ║
║  [Michigan_________________________________]                  ║
║                                                               ║
║  Country *                                                    ║
║  [United States (US) ▼_____________________]                  ║
║                                                               ║
║  Postcode *                                                   ║
║  [48111____________________________________]                  ║
║                                                               ║
║  Phone *                                                      ║
║  [9876543210_______________________________]                  ║
║                                                               ║
║  Email *                                                      ║
║  [grocery_outlet@email.com_________________]                  ║
║                                                               ║
║  Payments *                                                   ║
║  [× Cash] [× Card] [× Chip & Pin] [× PayPal]                ║
║  [× Bank Transfer]                                            ║
║                                                               ║
║  Invoice *                                                    ║
║  [Default Invoice ▼________________________]                  ║
║                                                               ║
║  Tables                                                       ║
║  [e.g., 1, 2, 3, 4_________________________]                  ║
║                                                               ║
║  Status *                                                     ║
║  [Enabled ▼________________________________]                  ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║                                        [Cancel]    [Save]     ║
╚═══════════════════════════════════════════════════════════════╝
```

**Form Fields**:
- **Required fields** marked with asterisk (*)
- **Dropdowns** for predefined values
- **Multi-select** payment methods (click to toggle)
- **Text inputs** for addresses and contact info
- **Validation** ensures all required fields are filled

---

### Step 4: Success Notification
After saving, you'll see a success toast:

```
                           ┌────────────────────────────┐
                           │  ✓  Success                │
                           │                            │
                           │  Outlet created            │
                           │  successfully              │
                           └────────────────────────────┘
```

The toast appears in the bottom-right corner and auto-dismisses after 3 seconds.

---

### Step 5: Updated Outlets List
Your new outlet now appears in the table:

```
╠═══╬══════╬════════════╬═══════════╬═══════════╬════════╬═════════════╣
║ ☐ ║  3   ║ Grocery St ║ Grocery   ║ 1373 Bomb ║ groc@  ║ ● Enabled  ║
║   ║      ║ (NEW)      ║ /Retail   ║ City:Bell ║ outlet ║             ║
║   ║      ║            ║           ║ State:MI  ║ @email ║  [Assign]   ║
║   ║      ║            ║           ║ Post:4811 ║        ║  [Kitchen]  ║
╠═══╬══════╬════════════╬═══════════╬═══════════╬════════╬═════════════╣
```

---

## 🔍 Search Functionality

Type in the search box to filter outlets in real-time:

**Example**: Typing "Bell" filters to show only outlets in Belleville:

```
Search: [Bell____________] [Search]

Results showing outlets in Belleville, MI
```

**Search works across**:
- Outlet name
- Email address
- Phone number
- City name
- Mode type

---

## ✏️ Edit Outlet

Click "Kitchen View" button to edit:

```
╔═══════════════════════════════════════════════════════════════╗
║  Edit Outlet                                             ✕    ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  Name *                                                       ║
║  [Grocery Store________________________________]              ║
║         (Pre-filled with existing data)                       ║
║                                                               ║
║  [... all other fields pre-filled ...]                        ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║                                        [Cancel]    [Save]     ║
╚═══════════════════════════════════════════════════════════════╝
```

**Edit Mode Features**:
- All fields pre-filled with current values
- Make changes as needed
- Click "Save" to update
- Click "Cancel" to discard changes

---

## 🗑️ Delete Outlet

When deleting (future feature), you'll see a confirmation:

```
                    ┌────────────────────────────┐
                    │  Delete Outlet             │
                    ├────────────────────────────┤
                    │                            │
                    │  Are you sure you want to  │
                    │  delete "Grocery Store"?   │
                    │                            │
                    │  This action cannot be     │
                    │  undone.                   │
                    │                            │
                    ├────────────────────────────┤
                    │      [Cancel]  [Delete]    │
                    └────────────────────────────┘
```

**Safety Feature**: Confirmation prevents accidental deletions

---

## 📱 Responsive Design

### Desktop View (Wide Screen)
- Table shows all columns
- 3-column tile layout on POS Admin
- Full modal width

### Tablet View (Medium Screen)
- Table horizontally scrollable
- 2-column tile layout
- Adjusted modal width

### Mobile View (Small Screen)
- Table horizontally scrollable
- 1-column tile layout
- Full-screen modal

---

## 🎨 Color Coding

### Status Badges
```
● Enabled   = Green background, green text
● Disabled  = Red background, red text
```

### Buttons
```
[Primary Action]  = Blue background, white text
[Secondary]       = White background, blue border/text
[Cancel]          = Gray background, gray text
[Delete]          = Red background, white text
```

### Tile Colors
```
Analytics (📊)      = Indigo accent
Configuration (🛠️)  = Emerald accent
Outlets (🏪)        = Amber accent
```

---

## ⌨️ Keyboard Navigation

- **Tab**: Move between form fields
- **Enter**: Submit form (when in modal)
- **Escape**: Close modal
- **Arrow Keys**: Navigate dropdown options
- **Space**: Toggle checkboxes

---

## 🚨 Error Handling

### Loading State
```
        ┌─────────────────────────┐
        │      ⟳  Loading         │
        │   Loading outlets...    │
        └─────────────────────────┘
```

### Error State
```
╔═══════════════════════════════════════════════════════════════╗
║  ⚠️  Error                                                     ║
║  Failed to load outlets. Please try again.                    ║
╚═══════════════════════════════════════════════════════════════╝
```

### Empty State
```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║              No outlets found.                                ║
║       Click "Add New" to create your first outlet.            ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

### Form Validation Error
```
╔═══════════════════════════════════════════════════════════════╗
║  ⚠️  Please fill in all required fields                       ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## 💡 Tips & Tricks

### Quick Actions
1. **Double-click** a row to edit (future feature)
2. Use **search** before scrolling long lists
3. **Select multiple** outlets for bulk operations
4. Check **status badge** before editing

### Best Practices
- Fill all required fields (marked with *)
- Use clear, descriptive outlet names
- Keep contact information up-to-date
- Enable outlets only when ready to use
- Select appropriate payment methods
- Configure tables for restaurant mode

### Common Workflows

**Adding First Outlet**:
1. Click "Add New"
2. Fill all required fields
3. Select payment methods
4. Set status to "Enabled"
5. Click "Save"

**Updating Outlet**:
1. Find outlet in list (use search if needed)
2. Click "Kitchen View"
3. Modify fields as needed
4. Click "Save"

**Searching Outlets**:
1. Type in search box
2. Results filter automatically
3. Clear search to see all outlets

---

## 🎯 What to Expect

### Immediate Feedback
- ✅ Loading spinners during data fetch
- ✅ Success toasts after actions
- ✅ Error messages if something fails
- ✅ Confirmation dialogs for destructive actions

### Real-time Updates
- ✅ List refreshes after create/edit/delete
- ✅ Search filters instantly
- ✅ Status changes reflect immediately

### Smooth Experience
- ✅ No page reloads
- ✅ Fast modal open/close
- ✅ Responsive on all devices
- ✅ Keyboard accessible

---

## 📞 Need Help?

### Documentation
- [Full Implementation Guide](./OUTLETS_IMPLEMENTATION.md)
- [Quick Reference](./OUTLETS_QUICK_REFERENCE.md)
- [Architecture Details](./OUTLETS_ARCHITECTURE.md)

### Common Issues

**"No outlets found"**
- This is normal on first visit
- Click "Add New" to create your first outlet
- Or wait for backend integration if data should exist

**"Failed to load outlets"**
- Check your internet connection
- Verify backend API is running
- Check browser console for errors

**Form won't submit**
- Check all required fields are filled (marked with *)
- Verify email format is correct
- Ensure phone number is valid

---

**Enjoy managing your outlets! 🎉**

*For technical details, see the [Complete Implementation Guide](./OUTLETS_COMPLETE.md)*
