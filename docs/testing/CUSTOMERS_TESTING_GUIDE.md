# Customers Page - Testing Guide

## Pre-Test Checklist

### Backend Verification
Ensure the backend is running:
```powershell
# Navigate to backend root
cd e:\Dev Projects\Workspace\pos-backend

# Start the backend (if not running)
mvn spring-boot:run
# OR
java -jar target/pos-backend-0.0.1-SNAPSHOT.jar
```

Backend should be accessible at: `http://localhost:8080/posai`

### Frontend Verification
Ensure the frontend is running:
```powershell
# Navigate to frontend directory
cd e:\Dev Projects\Workspace\pos-backend\pos-frontend

# Start the frontend (if not running)
npm run dev
```

Frontend should be accessible at: `http://localhost:5173`

### Login
1. Open browser: `http://localhost:5173`
2. Login with admin credentials
3. Navigate to **Admin** → **Customers**

---

## Test Suite

### ✅ Test 1: Page Load
**Expected:** Page loads with customer list

**Steps:**
1. Navigate to `/admin/customers`
2. Wait for page to load

**Verify:**
- [ ] Page header shows "Customers"
- [ ] Search bar is visible
- [ ] "Add customer" button is visible
- [ ] Customer count shows (e.g., "Showing 12 customers • 10 active")
- [ ] Table displays with columns: Customer, Email, Phone, Loyalty Points, Status, Updated, Actions
- [ ] Customers appear in table (if any exist)

---

### ✅ Test 2: Empty State
**Expected:** Empty state displays when no customers exist

**Steps:**
1. If customers exist, delete all via API or database
2. Refresh page

**Verify:**
- [ ] Message "No customers yet" appears
- [ ] Descriptive text about adding first customer
- [ ] "Add customer" button in center of empty state

---

### ✅ Test 3: Search Functionality
**Expected:** Search filters customers in real-time

**Steps:**
1. Ensure multiple customers exist
2. Type in search box: "john"
3. Type in search box: "doe@email.com"
4. Type in search box: "555-1234"
5. Clear search box

**Verify:**
- [ ] Search by name filters correctly
- [ ] Search by email filters correctly
- [ ] Search by phone filters correctly
- [ ] Customer count updates (e.g., "Showing 1 customers")
- [ ] Clearing search shows all customers again
- [ ] Search is case-insensitive
- [ ] Partial matches work

---

### ✅ Test 4: Add Customer - Success
**Expected:** New customer created successfully

**Steps:**
1. Click "Add customer" button
2. Fill in form:
   - First Name: "Test Customer"
   - Email: "test@example.com"
   - Phone: "555-0100"
   - Address Line 1: "123 Test St"
   - City: "Test City"
   - State: "California"
   - Postcode: "12345"
3. Click "Save"

**Verify:**
- [ ] Modal opens with form
- [ ] All form fields are editable
- [ ] Modal closes after save
- [ ] Success toast appears: "Test Customer added successfully"
- [ ] New customer appears at top of table
- [ ] Customer details match entered data
- [ ] Page refreshes are not needed

---

### ✅ Test 5: Add Customer - Validation
**Expected:** Form validates required fields

**Steps:**
1. Click "Add customer" button
2. Leave Name empty, click "Save"
3. Fill Name: "Test"
4. Enter invalid email: "notanemail"
5. Click "Save"

**Verify:**
- [ ] Error appears: "Customer name is required"
- [ ] Error appears: "Please enter a valid email address"
- [ ] Form does not submit with errors
- [ ] Error disappears when fixed

---

### ✅ Test 6: View Customer
**Expected:** Customer details shown in read-only mode

**Steps:**
1. Find any customer in table
2. Click "View" button

**Verify:**
- [ ] Modal opens with title "View Customer"
- [ ] All fields populated with customer data
- [ ] All fields are disabled (grayed out)
- [ ] No "Save" or "Update" button
- [ ] Only "Close" button visible
- [ ] Pressing Escape closes modal
- [ ] Clicking backdrop closes modal

---

### ✅ Test 7: Edit Customer - Success
**Expected:** Customer updated successfully

**Steps:**
1. Find any customer in table
2. Click "Edit" button
3. Change Name to "Updated Name"
4. Change Email to "updated@example.com"
5. Click "Update Customer"

**Verify:**
- [ ] Modal opens with title "Edit Customer"
- [ ] All fields pre-populated
- [ ] Fields are editable
- [ ] Modal closes after update
- [ ] Success toast appears: "Updated Name updated successfully"
- [ ] Table reflects new values
- [ ] Updated timestamp changes

---

### ✅ Test 8: Edit Customer - Validation
**Expected:** Form validates on edit

**Steps:**
1. Click "Edit" on any customer
2. Clear the Name field
3. Click "Update Customer"
4. Restore Name, enter invalid email
5. Click "Update Customer"

**Verify:**
- [ ] Error appears: "Customer name is required"
- [ ] Error appears: "Please enter a valid email address"
- [ ] Form does not submit with errors

---

### ✅ Test 9: Delete Customer - Success
**Expected:** Customer deleted with confirmation

**Steps:**
1. Find any customer in table
2. Note customer name
3. Click "Delete" button (red)
4. Confirmation dialog appears
5. Click "Delete" in dialog

**Verify:**
- [ ] Confirmation dialog shows
- [ ] Dialog shows customer name
- [ ] Message: "Are you sure you want to delete..."
- [ ] After confirming, customer removed from table
- [ ] Success toast appears: "[Name] has been removed"
- [ ] Soft delete (status changes to INACTIVE)

---

### ✅ Test 10: Delete Customer - Cancel
**Expected:** Delete canceled without changes

**Steps:**
1. Find any customer in table
2. Click "Delete" button
3. Click "Cancel" in confirmation dialog

**Verify:**
- [ ] Confirmation dialog appears
- [ ] Clicking Cancel closes dialog
- [ ] Customer remains in table
- [ ] No toast notification
- [ ] No changes to data

---

### ✅ Test 11: Modal Interactions
**Expected:** Modals handle all interaction patterns

**Steps:**
1. Open "Add customer" modal
2. Press Escape key
3. Open "Add customer" modal again
4. Click backdrop (outside modal)
5. Open "Add customer" modal again
6. Fill some fields
7. Click "Cancel"

**Verify:**
- [ ] Escape key closes modal
- [ ] Clicking backdrop closes modal
- [ ] Cancel button closes modal
- [ ] No data is saved when closing without submit
- [ ] Modal disappears from DOM when closed

---

### ✅ Test 12: Loyalty Points
**Expected:** Loyalty points display and update

**Steps:**
1. Add customer with Loyalty Points: "100"
2. Edit customer, change to "250"
3. Save

**Verify:**
- [ ] Points show in table
- [ ] Points update after edit
- [ ] Points must be numeric
- [ ] Negative values not allowed (min="0")
- [ ] Default is 0 if not specified

---

### ✅ Test 13: Status Management
**Expected:** Active/Inactive status works

**Steps:**
1. Add customer with Status: "Active"
2. Verify green badge shows
3. Edit customer, change to "Inactive"
4. Save

**Verify:**
- [ ] Active shows green badge (emerald)
- [ ] Inactive shows gray badge (slate)
- [ ] Status changes reflect immediately
- [ ] Active count updates in search bar

---

### ✅ Test 14: Address Handling
**Expected:** Address fields combine correctly

**Steps:**
1. Add customer with:
   - Address Line 1: "123 Main St"
   - Address Line 2: "Apt 4B"
   - City: "New York"
   - State: "California"
   - Postcode: "10001"
2. Save
3. Edit same customer
4. Verify all fields pre-populated

**Verify:**
- [ ] Address parts stored as comma-separated
- [ ] Edit modal parses address correctly
- [ ] All address parts editable separately
- [ ] Empty address parts handled (em dash in table)

---

### ✅ Test 15: Missing Data Display
**Expected:** Missing data shows em dash (—)

**Steps:**
1. Add customer with only Name and Email
2. Leave Phone, Address empty
3. Save

**Verify:**
- [ ] Phone column shows "—"
- [ ] Missing fields show "—" not empty space
- [ ] Consistent across all columns

---

### ✅ Test 16: Sorting
**Expected:** Customers sorted by updated date

**Steps:**
1. Create Customer A
2. Create Customer B
3. Edit Customer A (change name)
4. Refresh page

**Verify:**
- [ ] Most recently updated appears first
- [ ] Order maintained after operations
- [ ] Created date used if no updated date

---

### ✅ Test 17: Avatar Display
**Expected:** Avatar shows customer initials

**Steps:**
1. Add customer "John Doe"
2. Add customer "alice smith"
3. View table

**Verify:**
- [ ] Avatar shows "J" for John
- [ ] Avatar shows "A" for alice
- [ ] First letter capitalized regardless of input
- [ ] Blue circle background
- [ ] Consistent size and styling

---

### ✅ Test 18: Responsive Design
**Expected:** Works on different screen sizes

**Steps:**
1. Resize browser to mobile width (< 768px)
2. Resize to tablet width (768px - 1024px)
3. Resize to desktop width (> 1024px)

**Verify:**
- [ ] Table scrolls horizontally on mobile
- [ ] Form fields stack on mobile
- [ ] Search and button layout adapts
- [ ] Modal width adjusts
- [ ] All functionality works on all sizes

---

### ✅ Test 19: Loading State
**Expected:** Shows loading spinner

**Steps:**
1. Clear browser cache
2. Navigate to customers page
3. Observe initial load

**Verify:**
- [ ] Spinning loader appears
- [ ] Message "Loading customers..." displays
- [ ] Loader disappears when data loads
- [ ] No error state during normal load

---

### ✅ Test 20: Error Handling
**Expected:** Errors displayed appropriately

**Steps:**
1. Stop backend server
2. Try to add customer
3. Try to edit customer
4. Try to delete customer
5. Restart backend

**Verify:**
- [ ] Error toast appears on failed create
- [ ] Error toast appears on failed update
- [ ] Error toast appears on failed delete
- [ ] Error messages are user-friendly
- [ ] Page remains functional
- [ ] Can retry after backend restored

---

### ✅ Test 21: Keyboard Navigation
**Expected:** Full keyboard accessibility

**Steps:**
1. Open modal
2. Press Tab repeatedly
3. Use Shift+Tab to reverse
4. Press Enter on focused button
5. Press Escape

**Verify:**
- [ ] Tab moves through all fields
- [ ] Focus visible on all elements
- [ ] Enter submits form
- [ ] Escape closes modal
- [ ] No keyboard traps

---

### ✅ Test 22: Multiple Operations
**Expected:** Multiple actions work in sequence

**Steps:**
1. Add 3 customers
2. Edit first customer
3. Delete second customer
4. View third customer
5. Search for first customer
6. Add another customer

**Verify:**
- [ ] All operations complete successfully
- [ ] Table updates after each operation
- [ ] No stale data
- [ ] Toasts appear for each operation
- [ ] Search still works

---

### ✅ Test 23: Toast Notifications
**Expected:** Toasts appear and disappear

**Steps:**
1. Perform any successful operation
2. Wait for toast
3. Perform another operation

**Verify:**
- [ ] Success toasts are green
- [ ] Error toasts are red
- [ ] Toasts auto-dismiss after ~5 seconds
- [ ] Can manually close with X button
- [ ] Multiple toasts stack if needed

---

### ✅ Test 24: Form State Management
**Expected:** Form state resets properly

**Steps:**
1. Open "Add customer" modal
2. Fill some fields
3. Close modal
4. Open "Add customer" modal again

**Verify:**
- [ ] Fields are empty/default
- [ ] No previous data remains
- [ ] Status defaults to "Active"
- [ ] Loyalty points defaults to "0"
- [ ] Country defaults to "United States (US)"

---

### ✅ Test 25: Concurrent Users (Optional)
**Expected:** Changes reflect across sessions

**Steps:**
1. Open customers page in two browser tabs
2. Add customer in Tab 1
3. Refresh Tab 2

**Verify:**
- [ ] New customer appears in Tab 2
- [ ] Both tabs can add customers
- [ ] No conflicts
- [ ] Data consistent across tabs

---

## Performance Tests

### Load Time
- [ ] Page loads in < 2 seconds with 100 customers
- [ ] Search responds in < 100ms
- [ ] Modal opens in < 100ms

### Memory
- [ ] No memory leaks after 10+ operations
- [ ] Browser dev tools show stable memory

### Network
- [ ] Only necessary API calls made
- [ ] Search doesn't call API (local filtering)
- [ ] Proper error handling on network failure

---

## Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## API Testing (Optional)

Use Postman or curl to test backend directly:

### Create Customer
```bash
curl -X POST http://localhost:8080/posai/api/pos/customers \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: PaPos" \
  -d '{
    "name": "API Test Customer",
    "email": "api@test.com",
    "phone": "555-9999",
    "recordStatus": "ACTIVE"
  }'
```

### Get All Customers
```bash
curl -X GET http://localhost:8080/posai/api/pos/customers \
  -H "X-Tenant-ID: PaPos"
```

### Search Customers
```bash
curl -X GET "http://localhost:8080/posai/api/pos/customers/search?term=test" \
  -H "X-Tenant-ID: PaPos"
```

### Update Customer
```bash
curl -X PUT http://localhost:8080/posai/api/pos/customers/1 \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: PaPos" \
  -d '{
    "name": "Updated Name",
    "email": "updated@test.com",
    "recordStatus": "ACTIVE"
  }'
```

### Delete Customer
```bash
curl -X DELETE http://localhost:8080/posai/api/pos/customers/1 \
  -H "X-Tenant-ID: PaPos"
```

---

## Known Issues / Limitations

1. **State Dropdown** - Currently shows only 10 states, can be expanded
2. **Country** - Only US supported, multi-country coming soon
3. **Duplicate Emails** - Backend allows duplicates
4. **Bulk Operations** - Not yet implemented
5. **Export** - CSV export not yet available
6. **Purchase History** - Not linked yet

---

## Success Criteria

All 25 functional tests pass ✅  
No console errors during operations ✅  
Responsive on all screen sizes ✅  
Accessible via keyboard ✅  
Works on all major browsers ✅  

---

## Troubleshooting

### Modal doesn't open
- Check browser console for errors
- Verify React portal is rendering
- Check z-index conflicts

### Data doesn't load
- Verify backend is running
- Check network tab for 404/500 errors
- Verify X-Tenant-ID header

### Search doesn't work
- Check searchQuery state in React DevTools
- Verify matchesQuery function logic
- Check filteredCustomers memo

### Form doesn't submit
- Check validation logic
- Verify required fields filled
- Check browser console for errors

---

**Testing Status:** Ready for QA ✅  
**Last Updated:** November 2025  
**Tested By:** _________________  
**Date Tested:** _________________
