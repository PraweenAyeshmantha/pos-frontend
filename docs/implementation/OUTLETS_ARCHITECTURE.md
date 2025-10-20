# Outlets Feature - Component Architecture

## Component Hierarchy

```
App.tsx (Root)
│
├── AuthProvider (Context)
│   └── ProtectedRoute
│       └── AdminLayout
│           ├── SideNavigation
│           ├── TopNavigation
│           └── Content Area
│               │
│               ├── POSAdminPage
│               │   └── Outlets Tile (Navigates to /admin/outlets)
│               │
│               └── OutletsPage (/admin/outlets)
│                   ├── Header Section
│                   │   ├── Title & Description
│                   │   ├── "Add New" Button
│                   │   ├── "Visit POS" Button
│                   │   └── Search Bar
│                   │
│                   ├── Outlets Table
│                   │   ├── Table Header (with bulk actions)
│                   │   ├── Table Body
│                   │   │   └── Outlet Rows
│                   │   │       ├── Checkbox
│                   │   │       ├── Outlet Data
│                   │   │       └── Action Buttons
│                   │   └── Table Footer (with bulk actions)
│                   │
│                   ├── AddOutletModal (Conditional)
│                   │   ├── Modal Header
│                   │   ├── Form Fields
│                   │   │   ├── Text Inputs
│                   │   │   ├── Dropdowns
│                   │   │   └── Payment Method Chips
│                   │   └── Modal Footer
│                   │       ├── Cancel Button
│                   │       └── Save Button
│                   │
│                   ├── ConfirmationDialog (Conditional)
│                   │   ├── Title
│                   │   ├── Message
│                   │   └── Buttons
│                   │       ├── Cancel
│                   │       └── Confirm
│                   │
│                   └── Alert Toast (Conditional)
│                       ├── Icon
│                       ├── Title
│                       └── Message
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        User Actions                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      OutletsPage.tsx                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ State Management                                      │  │
│  │  • outlets: Outlet[]                                  │  │
│  │  • loading: boolean                                   │  │
│  │  • error: string | null                               │  │
│  │  • showAddModal: boolean                              │  │
│  │  • editingOutlet: Outlet | null                       │  │
│  │  • searchQuery: string                                │  │
│  │  • deleteConfirm: { show, outlet }                    │  │
│  │  • alert: { type, title, message }                    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   outletService.ts                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ API Methods                                           │  │
│  │  • getAll() → GET /admin/outlets                      │  │
│  │  • getById(id) → GET /admin/outlets/:id               │  │
│  │  • create(data) → POST /admin/outlets                 │  │
│  │  • update(data) → PUT /admin/outlets/:id              │  │
│  │  • delete(id) → DELETE /admin/outlets/:id             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      apiClient.ts                           │
│  (Axios instance with base URL and interceptors)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend API Server                      │
└─────────────────────────────────────────────────────────────┘
```

## State Management Flow

### Fetching Outlets
```
Component Mount
    │
    ▼
fetchOutlets()
    │
    ├─► setLoading(true)
    │
    ├─► outletService.getAll()
    │       │
    │       ├─► Success: setOutlets(data)
    │       └─► Error: setError(message)
    │
    └─► setLoading(false)
```

### Creating Outlet
```
User clicks "Add New"
    │
    ▼
setShowAddModal(true)
    │
    ▼
User fills form in AddOutletModal
    │
    ▼
User clicks "Save"
    │
    ├─► setSaving(true)
    │
    ├─► outletService.create(formData)
    │       │
    │       ├─► Success:
    │       │   ├─► setShowAddModal(false)
    │       │   ├─► setAlert({ success })
    │       │   └─► fetchOutlets()
    │       │
    │       └─► Error:
    │           └─► setError(message)
    │
    └─► setSaving(false)
```

### Editing Outlet
```
User clicks "Kitchen View"
    │
    ▼
setEditingOutlet(outlet)
    │
    ▼
setShowAddModal(true)
    │
    ▼
Modal pre-fills with outlet data
    │
    ▼
User modifies form
    │
    ▼
User clicks "Save"
    │
    ├─► setSaving(true)
    │
    ├─► outletService.update(formData)
    │       │
    │       ├─► Success:
    │       │   ├─► setShowAddModal(false)
    │       │   ├─► setEditingOutlet(null)
    │       │   ├─► setAlert({ success })
    │       │   └─► fetchOutlets()
    │       │
    │       └─► Error:
    │           └─► setError(message)
    │
    └─► setSaving(false)
```

### Deleting Outlet
```
User clicks "Delete" (future)
    │
    ▼
setDeleteConfirm({ show: true, outlet })
    │
    ▼
User sees ConfirmationDialog
    │
    ├─► User clicks "Cancel"
    │   └─► setDeleteConfirm({ show: false, outlet: null })
    │
    └─► User clicks "Confirm"
        │
        ├─► outletService.delete(outlet.id)
        │       │
        │       ├─► Success:
        │       │   ├─► setAlert({ success })
        │       │   └─► fetchOutlets()
        │       │
        │       └─► Error:
        │           └─► setAlert({ error })
        │
        └─► setDeleteConfirm({ show: false, outlet: null })
```

## Component Props

### OutletsPage
```typescript
// No props - standalone page component
```

### AddOutletModal
```typescript
interface AddOutletModalProps {
  outlet: Outlet | null;        // null = create, object = edit
  onClose: () => void;          // Close modal callback
  onSuccess: () => void;        // Success callback (refresh list)
}
```

### ConfirmationDialog (Reusable)
```typescript
interface ConfirmationDialogProps {
  open: boolean;                // Show/hide dialog
  title: string;                // Dialog title
  message: string;              // Confirmation message
  confirmLabel?: string;        // Confirm button text
  cancelLabel?: string;         // Cancel button text
  onConfirm: () => void;        // Confirm callback
  onCancel?: () => void;        // Cancel callback
}
```

### Alert (Reusable)
```typescript
interface AlertProps {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  onClose?: () => void;
}
```

## Styling Architecture

### Tailwind CSS Classes

#### Colors
```css
Primary:   bg-blue-600, text-blue-600, border-blue-600
Success:   bg-green-500, text-green-800, bg-green-100
Error:     bg-red-500, text-red-800, bg-red-100
Warning:   bg-orange-400, text-orange-800, bg-orange-100
Info:      bg-cyan-500, text-cyan-800, bg-cyan-100
Neutral:   bg-gray-50/100/200/600/700/800/900
Tile:      bg-amber-100, text-amber-600
```

#### Typography
```css
Headings:  text-3xl font-semibold
Body:      text-sm/base text-gray-600/700
Labels:    text-sm font-medium text-gray-700
Buttons:   text-sm font-semibold
```

#### Spacing
```css
Padding:   p-4/6/8
Margin:    m-2/4/6/8
Gap:       gap-2/3/4/6
```

#### Borders
```css
Border:    border border-gray-200
Rounded:   rounded-lg (8px), rounded-xl (12px), rounded-2xl (16px)
```

#### Shadows
```css
Card:      shadow-sm
Modal:     shadow-xl
```

## Hooks Used

### Built-in React Hooks
```typescript
useState    - Component state management
useEffect   - Side effects (data fetching)
useCallback - Memoized callbacks
useMemo     - Memoized values (filtered outlets)
```

### Custom Hooks (Potential)
```typescript
useOutlets()      - Fetch and manage outlets
useOutletForm()   - Form state management
useSearchFilter() - Search functionality
```

## Type Safety

### Interface Definitions
```typescript
// Core Types
Outlet                    // Full outlet object
CreateOutletRequest       // Create payload
UpdateOutletRequest       // Update payload

// API Types
ApiResponse<T>            // Standard API response wrapper

// Component Types
AddOutletModalProps       // Modal component props
AlertType                 // Alert type enum
```

### Type Guards
```typescript
// Validation in service layer
if (!response.data.data) {
  throw new Error('Invalid response');
}
return response.data.data; // Typed return
```

## Performance Optimizations

### Code Splitting
```typescript
// Lazy loading
const OutletsPage = lazy(() => import('./pages/admin/outlets/OutletsPage'));
```

### Memoization
```typescript
// Memoized filtered outlets
const filteredOutlets = useMemo(() => {
  return outlets.filter(/* search logic */);
}, [outlets, searchQuery]);

// Memoized callbacks
const handleEdit = useCallback((outlet) => {
  /* ... */
}, []);
```

### Component Optimization
```typescript
// Memo wrapper for pure components
export default memo(AddOutletModal);
```

## Error Handling Strategy

### Levels
```
1. Service Layer
   ├─► Try-catch in API calls
   └─► Throw specific errors

2. Component Layer
   ├─► Catch errors from service
   ├─► Set error state
   └─► Display to user

3. User Feedback
   ├─► Alert toasts for temporary errors
   ├─► Inline errors in forms
   └─► Console logs for debugging
```

### Error Types
```typescript
Network Errors     - Connection issues
Validation Errors  - Invalid data
Server Errors      - Backend failures
Not Found Errors   - Missing resources
```

## Testing Strategy

### Unit Tests
```typescript
✓ OutletsPage renders correctly
✓ Search filters outlets
✓ Modal opens/closes
✓ Form validation works
✓ Service methods call correct endpoints
```

### Integration Tests
```typescript
✓ Create outlet flow
✓ Edit outlet flow
✓ Delete outlet flow
✓ Error handling
```

### E2E Tests
```typescript
✓ Login → Navigate → Add outlet
✓ Search and find outlet
✓ Edit and verify changes
✓ Delete with confirmation
```

## Accessibility Features

- ✅ Semantic HTML elements
- ✅ Proper form labels (for/id attributes)
- ✅ Keyboard navigation support
- ✅ Focus management in modals
- ✅ ARIA attributes on interactive elements
- ✅ Color contrast compliance
- ✅ Screen reader friendly

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Dependencies Graph

```
OutletsPage
    ├── React
    ├── AdminLayout
    ├── Alert
    ├── ConfirmationDialog
    ├── AddOutletModal
    │   ├── React
    │   ├── react-dom (createPortal)
    │   └── outletService
    ├── outletService
    │   ├── apiClient
    │   └── Outlet types
    └── Outlet types
```

---

**Architecture Version**: 1.0.0  
**Last Updated**: October 20, 2025  
**Status**: ✅ Production Ready (Frontend)
