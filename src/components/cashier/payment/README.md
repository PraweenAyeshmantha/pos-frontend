# Payment Components

Professional payment interface components for the POS system.

## Components

### PaymentModal
The main payment interface that handles:
- Multiple payment method selection
- Split payments support
- Real-time calculations
- Number pad input
- Quick amount buttons
- Order notes (optional)

**Props**:
```typescript
interface PaymentModalProps {
  open: boolean;                    // Control modal visibility
  totalDue: number;                 // Order total amount
  onConfirm: (                      // Payment completion callback
    payments: Array<{
      paymentMethodId: number;
      amount: number;
    }>,
    notes: string
  ) => void;
  onClose: () => void;              // Close/cancel callback
  paymentMethods: PaymentMethod[];  // Available payment methods
  enableOrderNotes?: boolean;       // Show/hide order notes field
}
```

**Usage**:
```tsx
<PaymentModal
  open={paymentModalOpen}
  totalDue={totalDue}
  onConfirm={handlePaymentConfirm}
  onClose={() => setPaymentModalOpen(false)}
  paymentMethods={paymentMethods}
  enableOrderNotes={true}
/>
```

### PaymentSuccessModal
Success confirmation screen that displays:
- Success icon and message
- Order number
- Change amount (if applicable)
- Order summary breakdown
- Action buttons (print, new order)

**Props**:
```typescript
interface PaymentSuccessModalProps {
  open: boolean;                    // Control modal visibility
  order: Order | null;              // Completed order data
  onClose: () => void;              // Close callback
  onPrintReceipt?: () => void;      // Print receipt action (optional)
  onNewOrder?: () => void;          // Start new order action (optional)
}
```

**Usage**:
```tsx
<PaymentSuccessModal
  open={successModalOpen}
  order={completedOrder}
  onClose={() => setSuccessModalOpen(false)}
  onPrintReceipt={handlePrintReceipt}
  onNewOrder={handleNewOrder}
/>
```

## Features

✅ **Multiple Payment Methods**: Cash, card, and custom methods  
✅ **Split Payments**: Add multiple payments per order  
✅ **Real-time Calculations**: Live updates for all totals  
✅ **Number Pad**: Full numeric keypad with validation  
✅ **Quick Amounts**: Pre-calculated convenience buttons  
✅ **Order Notes**: Optional special instructions field  
✅ **Payment Validation**: Prevents incomplete payments  
✅ **Success Feedback**: Clear confirmation with change display  
✅ **Professional Design**: Follows admin design standards  
✅ **Responsive**: Works on desktop, tablet, and mobile  

## Quick Start

1. **Import the components**:
```tsx
import PaymentModal from '../../components/cashier/payment/PaymentModal';
import PaymentSuccessModal from '../../components/cashier/payment/PaymentSuccessModal';
```

2. **Set up state**:
```tsx
const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
const [paymentModalOpen, setPaymentModalOpen] = useState(false);
const [successModalOpen, setSuccessModalOpen] = useState(false);
const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
```

3. **Load payment methods**:
```tsx
useEffect(() => {
  const loadPaymentMethods = async () => {
    const methods = await posService.getPaymentMethods();
    setPaymentMethods(methods);
  };
  loadPaymentMethods();
}, []);
```

4. **Handle payment confirmation**:
```tsx
const handlePaymentConfirm = async (payments, notes) => {
  const order = await posService.createOrder({
    outletId: 1,
    cashierId: 1,
    orderType: 'COUNTER',
    items: cartItems.map(item => ({
      productId: item.productId,
      productName: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
    })),
    payments: payments,
    notes: notes || null,
  });
  
  setCompletedOrder(order);
  setPaymentModalOpen(false);
  setSuccessModalOpen(true);
  setCartItems([]);
};
```

5. **Render the components**:
```tsx
<PaymentModal
  open={paymentModalOpen}
  totalDue={totalDue}
  onConfirm={handlePaymentConfirm}
  onClose={() => setPaymentModalOpen(false)}
  paymentMethods={paymentMethods}
  enableOrderNotes={true}
/>

<PaymentSuccessModal
  open={successModalOpen}
  order={completedOrder}
  onClose={() => setSuccessModalOpen(false)}
  onNewOrder={handleNewOrder}
/>
```

## Documentation

- **Full Implementation**: `../../../docs/frontend/PAYMENT_SCREEN_IMPLEMENTATION.md`
- **Quick Start Guide**: `../../../docs/frontend/PAYMENT_SCREEN_QUICK_START.md`
- **Design Reference**: `../../../docs/frontend/PAYMENT_SCREEN_DESIGN.md`
- **Summary**: `../../../docs/frontend/PAYMENT_SCREEN_SUMMARY.md`

## Examples

### Basic Payment Flow
```tsx
// User clicks "Proceed to Pay"
const handleProceedToPay = () => {
  if (cartItems.length === 0) {
    showToast('warning', 'Cart is empty');
    return;
  }
  setPaymentModalOpen(true);
};

// Payment confirmed
const handlePaymentConfirm = async (payments, notes) => {
  try {
    const order = await posService.createOrder({...});
    setCompletedOrder(order);
    setSuccessModalOpen(true);
  } catch (error) {
    showToast('error', 'Payment failed');
  }
};
```

### Split Payment Example
```tsx
// User enters multiple payments in the modal:
// Payment 1: Cash - $30.00
// Payment 2: Card - $25.50
// Total: $55.50

// Passed to onConfirm as:
[
  { paymentMethodId: 1, amount: 30.00 },
  { paymentMethodId: 2, amount: 25.50 }
]
```

### Change Calculation
```tsx
// Order Total: $19.80
// Customer Pays: $20.00
// Change: $0.20

// Backend calculates and returns in Order object:
{
  totalAmount: 19.80,
  paidAmount: 20.00,
  changeAmount: 0.20
}
```

## Styling

Components use Tailwind CSS with the following design tokens:

**Colors**:
- Blue: Total Due, Primary Actions
- Emerald: Total Paying, Success
- Amber: Pay Left, Warnings
- Violet: Change Amount

**Spacing**:
- Padding: `px-6 py-4` for cards
- Gap: `gap-3` or `gap-4` for grids
- Border Radius: `rounded-xl` or `rounded-2xl`

**Typography**:
- Headings: `text-2xl font-bold`
- Labels: `text-sm font-medium`
- Amounts: `text-3xl font-bold`

## Accessibility

- ✅ Semantic HTML
- ✅ ARIA labels
- ✅ Keyboard navigation
- ✅ Focus management
- ✅ High contrast colors
- ✅ Large touch targets (44px minimum)

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## License

Part of the POS Backend System - © 2025
