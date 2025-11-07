# Payment Screen - Visual Design Reference

## 🎨 Payment Modal Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Payment                                                     [X]     │
│  Complete the order payment                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  │  Total Due   │ │Total Paying  │ │  Pay Left    │ │   Change     │
│  │   $19.80     │ │   $20.00     │ │   $0.00      │ │   $0.20      │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
│  Blue             Emerald          Amber             Violet           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────┐  ┌───────────────────────────────┐ │
│  │ PAYMENT METHODS             │  │ QUICK AMOUNTS & NUMBER PAD    │ │
│  │                             │  │                               │ │
│  │ ┌─────────────────────────┐ │  │ [$19.80] [$20.00]           │ │
│  │ │ Payment 1           [x] │ │  │ [$30.00] [$40.00]           │ │
│  │ │ Method: [Cash ▼]        │ │  │                               │ │
│  │ │ Amount: [$____20.00]    │ │  │ ┌───────────────────────┐   │ │
│  │ └─────────────────────────┘ │  │ │ [1] [2] [3]           │   │ │
│  │                             │  │ │ [4] [5] [6]           │   │ │
│  │ ┌─────────────────────────┐ │  │ │ [7] [8] [9]           │   │ │
│  │ │ Payment 2           [x] │ │  │ │ [.] [0] [00]          │   │ │
│  │ │ Method: [Card ▼]        │ │  │ │                       │   │ │
│  │ │ Amount: [$_____5.00]    │ │  │ │ [clear] [backspace]   │   │ │
│  │ └─────────────────────────┘ │  │ └───────────────────────┘   │ │
│  │                             │  │                               │ │
│  │ [+ Add Another Method]      │  │                               │ │
│  │                             │  │                               │ │
│  │ ┌─────────────────────────┐ │  │                               │ │
│  │ │ Add Order Note          │ │  │                               │ │
│  │ │ ___________________     │ │  │                               │ │
│  │ │ ___________________     │ │  │                               │ │
│  │ └─────────────────────────┘ │  │                               │ │
│  └─────────────────────────────┘  └───────────────────────────────┘ │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                             [Cancel]  [Pay]          │
└─────────────────────────────────────────────────────────────────────┘
```

## 🎊 Success Modal Layout

```
┌─────────────────────────────────────┐
│                                     │
│         ┌───────────────┐           │
│         │   ✓           │           │
│         │  SUCCESS      │           │
│         └───────────────┘           │
│                                     │
│      Payment Successful!            │
│      Order #ORD-12345               │
│                                     │
├─────────────────────────────────────┤
│                                     │
│    ┌──────────────────────────┐    │
│    │     Change Due           │    │
│    │       $0.20              │    │
│    └──────────────────────────┘    │
│         Violet highlight            │
├─────────────────────────────────────┤
│  Order Summary                      │
│                                     │
│  Subtotal         $18.00            │
│  Tax              $1.80             │
│  ──────────────────────             │
│  Total            $19.80            │
│  Paid             $20.00            │
│  Change           $0.20             │
│                                     │
├─────────────────────────────────────┤
│  [  Print Receipt  ]                │
│  [ Start New Order ]                │
│       Close                         │
└─────────────────────────────────────┘
```

## 📐 Dimensions & Spacing

### Payment Modal
- **Width**: `max-w-5xl` (80rem / 1280px)
- **Height**: Auto (scrollable)
- **Padding**: `px-8 py-6`
- **Border Radius**: `rounded-3xl`
- **Grid Columns**: 
  - Totals: 4 columns
  - Main Content: 2 columns (1:1 ratio)

### Success Modal
- **Width**: `max-w-md` (28rem / 448px)
- **Height**: Auto
- **Padding**: `px-8 py-6`
- **Border Radius**: `rounded-3xl`

### Component Sizes
- **Total Cards**: `px-6 py-4`
- **Payment Entry**: `p-4`
- **Number Pad Button**: `px-6 py-5`
- **Quick Amount**: `px-4 py-3`

## 🎨 Color System

### Totals Display
```css
/* Total Due - Blue */
.total-due {
  border: 1px solid rgb(219, 234, 254);    /* blue-100 */
  background: rgb(239, 246, 255);          /* blue-50 */
  color: rgb(29, 78, 216);                 /* blue-700 */
}

/* Total Paying - Emerald */
.total-paying {
  border: 1px solid rgb(209, 250, 229);    /* emerald-100 */
  background: rgb(236, 253, 245);          /* emerald-50 */
  color: rgb(4, 120, 87);                  /* emerald-700 */
}

/* Pay Left - Amber */
.pay-left {
  border: 1px solid rgb(254, 243, 199);    /* amber-100 */
  background: rgb(255, 251, 235);          /* amber-50 */
  color: rgb(180, 83, 9);                  /* amber-700 */
}

/* Change - Violet */
.change {
  border: 1px solid rgb(237, 233, 254);    /* violet-100 */
  background: rgb(245, 243, 255);          /* violet-50 */
  color: rgb(109, 40, 217);                /* violet-700 */
}
```

### Buttons
```css
/* Primary Button (Pay) */
.btn-primary {
  background: rgb(37, 99, 235);            /* blue-600 */
  color: white;
  hover: rgb(29, 78, 216);                 /* blue-700 */
}

/* Secondary Button (Cancel) */
.btn-secondary {
  background: white;
  border: 1px solid rgb(226, 232, 240);    /* slate-200 */
  color: rgb(71, 85, 105);                 /* slate-600 */
  hover: rgb(248, 250, 252);               /* slate-50 */
}

/* Danger Button (Remove) */
.btn-danger {
  color: rgb(225, 29, 72);                 /* rose-600 */
  hover: rgb(190, 18, 60);                 /* rose-700 */
}
```

## 📱 Responsive Breakpoints

### Desktop (lg: 1024px+)
- Full 2-column layout
- Side-by-side payment methods and number pad
- Wide modal (max-w-5xl)

### Tablet (md: 768px - 1023px)
- 2-column layout maintained
- Slightly narrower spacing

### Mobile (sm: < 768px)
- Single column stack
- Payment methods full width
- Number pad full width below
- Reduced padding

## 🎯 Interactive States

### Button States
```
Default → Hover → Active → Disabled

[Pay]     [Pay]   [Pay]   [Pay $5.00 more]
blue-600  blue-700 scale-95  slate-300
```

### Input States
```
Default → Focus → Error

border-slate-200  border-blue-500  border-rose-500
                  ring-blue-100    ring-rose-100
```

## 🔤 Typography Scale

```css
/* Headings */
h2: text-2xl font-bold              /* Payment, Success title */
h3: text-sm font-semibold           /* Section headers */

/* Labels */
text-sm font-medium                 /* Input labels */
text-xs font-medium                 /* Small labels */

/* Amounts */
text-3xl font-bold                  /* Main totals */
text-4xl font-bold                  /* Change amount */
text-lg font-semibold               /* Number pad */

/* Body */
text-sm                             /* Regular text */
text-xs                             /* Helper text */
```

## 🎭 Animations

### Modal Entry
```css
/* Backdrop */
opacity: 0 → 1
backdrop-blur: 0 → sm
duration: 200ms

/* Modal */
scale: 0.95 → 1
opacity: 0 → 1
duration: 300ms
ease: ease-out
```

### Button Press
```css
/* Number Pad */
transform: scale(1) → scale(0.95)
duration: 100ms
```

### Success Icon
```css
/* Checkmark */
stroke-dasharray: animate
duration: 500ms
```

## 📊 Layout Grid

### Payment Modal Grid Structure
```
┌─────────────────────────────────────┐
│ Header (1 row, full width)          │
├─────────────────────────────────────┤
│ Totals (1 row, 4 cols)              │
├──────────────────┬──────────────────┤
│ Payment Methods  │ Number Pad       │
│ (1 col, auto)    │ (1 col, auto)    │
│                  │                  │
├──────────────────┴──────────────────┤
│ Footer (1 row, right-aligned)       │
└─────────────────────────────────────┘
```

### Success Modal Grid Structure
```
┌─────────────────────────┐
│ Icon (centered)         │
├─────────────────────────┤
│ Title (centered)        │
├─────────────────────────┤
│ Change (full width)     │
├─────────────────────────┤
│ Summary (list)          │
├─────────────────────────┤
│ Actions (stacked)       │
└─────────────────────────┘
```

## 🎨 Design Tokens

### Spacing
```
xs: 0.5rem  (8px)
sm: 0.75rem (12px)
md: 1rem    (16px)
lg: 1.5rem  (24px)
xl: 2rem    (32px)
2xl: 3rem   (48px)
```

### Border Radius
```
sm: 0.375rem  (6px)
md: 0.5rem    (8px)
lg: 0.75rem   (12px)
xl: 1rem      (16px)
2xl: 1.5rem   (24px)
3xl: 2rem     (32px)
full: 9999px
```

### Shadows
```
sm: 0 1px 2px rgba(0, 0, 0, 0.05)
md: 0 4px 6px rgba(0, 0, 0, 0.1)
lg: 0 10px 15px rgba(0, 0, 0, 0.1)
xl: 0 20px 25px rgba(0, 0, 0, 0.15)
2xl: 0 25px 50px rgba(0, 0, 0, 0.25)
```

## 🎯 Component Hierarchy

```
PaymentModal
├── Header
│   ├── Title
│   ├── Subtitle
│   └── Close Button
├── Totals Section
│   ├── Total Due Card
│   ├── Total Paying Card
│   ├── Pay Left Card
│   └── Change Card
├── Main Content (Grid)
│   ├── Left Column
│   │   ├── Payment Entries
│   │   │   ├── Payment Method Select
│   │   │   ├── Amount Input
│   │   │   └── Remove Button
│   │   ├── Add Payment Button
│   │   └── Order Notes (optional)
│   └── Right Column
│       ├── Quick Amount Buttons
│       └── Number Pad
│           ├── Digit Buttons (0-9, ., 00)
│           └── Action Buttons (clear, backspace)
└── Footer
    ├── Cancel Button
    └── Pay Button
```

## 📏 Measurement Reference

### Icon Sizes
- Close button: 24x24px (h-6 w-6)
- Number pad icons: 20x20px (h-5 w-5)
- Success icon: 40x40px (h-10 w-10)
- Action icons: 20x20px (h-5 w-5)

### Touch Targets
- Minimum: 44x44px
- Number pad buttons: 48px height
- Quick amounts: 48px height
- Primary actions: 48px height

### Content Width
- Payment modal: 1280px max
- Success modal: 448px max
- Input fields: 100% within container
- Buttons: Auto with padding

## 🎨 Visual Hierarchy

### Primary Focus
1. **Change Amount** (largest, violet)
2. **Total Paying** (large, emerald)
3. **Pay Button** (prominent blue)

### Secondary Focus
4. Total Due (blue)
5. Payment method entries
6. Quick amount buttons

### Tertiary Focus
7. Number pad
8. Order notes
9. Cancel button

## 🔍 Accessibility Notes

### Color Contrast
- All text meets WCAG AA standards (4.5:1)
- Interactive elements meet AAA standards (7:1)
- Disabled states clearly distinguishable

### Focus Indicators
- 2px solid outline on focus
- Offset by 2px for visibility
- Color matches component theme

### Screen Reader Text
- Proper ARIA labels on all inputs
- Button purposes clearly stated
- Modal roles properly defined

---

**Design System**: Tailwind CSS v3
**Font Family**: System UI (Inter fallback)
**Base Size**: 16px (1rem)
**Scale**: 1.125 (Major Second)
