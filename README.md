# POS Frontend - React Application

Modern React-based frontend application for the Point of Sale (POS) system backend.

## Features

- **General Configuration Screen**: Admin interface to manage POS system configurations
- **Modern UI**: Built with React, TypeScript, and Tailwind CSS
- **Responsive Design**: Clean and professional interface following modern UI standards
- **API Integration**: Complete integration with backend REST APIs
- **Type Safety**: Full TypeScript support for better developer experience

## Tech Stack

- **React 19**: Latest version with modern hooks and features
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **React Router**: Client-side routing
- **Axios**: HTTP client for API requests
- **Tailwind CSS 3**: Utility-first CSS framework
- **ESLint**: Code linting and quality checks

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Backend POS API running (see backend-docs for setup)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and update with your backend API URL:

```bash
cp .env.example .env
```

Edit `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8080/pos-codex/api
VITE_TENANT_ID=PaPos
```

### 3. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### 5. Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/          # React components
│   └── admin/          # Admin-specific components
│       └── GeneralConfiguration/
├── pages/              # Page components
│   └── admin/
├── services/           # API service layer
│   ├── apiClient.ts   # Axios configuration
│   └── configurationService.ts
├── types/              # TypeScript type definitions
│   └── configuration.ts
├── App.tsx             # Main app component with routing
├── main.tsx            # Application entry point
└── index.css           # Global styles with Tailwind
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint to check code quality

## Features Implemented

### General Configuration Screen

The admin screen includes the following configuration options:

1. **License Activation**: Activate/deactivate the POS license
2. **Module Enable/Disable**: Toggle POS module features
3. **Inventory Type**: Choose between Custom/Manual or Centralized stock
4. **Order Status**: Set default order status for POS orders
5. **Default Product Barcode**: Configure barcode type (Product ID or SKU)
6. **Order Emails**: Enable/disable email notifications
7. **Split Payment**: Allow multiple payment methods
8. **Order Notes**: Enable order notes functionality
9. **Offline Orders**: Fast order creation mode
10. **Custom Products**: Allow adding custom products
11. **Cash Drawer Popup**: Automated cash drawer prompt
12. **Product Variations**: Display variations as separate products
13. **Weight-Based Pricing**: Enable unit/weight pricing
14. **Kitchen Auto-Send**: Automatically send orders to kitchen on hold
15. **Logo Upload**: Brand logo for POS and receipts
16. **Default Customer**: Set guest/default customer
17. **POS Endpoint**: Configure POS URL endpoint
18. **Kitchen Endpoint**: Configure kitchen view URL endpoint

### Navigation Tabs

The interface includes tabs for different configuration sections:
- General (implemented)
- Payments (placeholder)
- PWA (placeholder)
- Login (placeholder)
- Printer (placeholder)
- Layout (placeholder)

## API Integration

The application integrates with the following backend endpoints:

- `GET /api/admin/configurations/general` - Fetch all general configurations
- `GET /api/admin/configurations/by-key` - Get specific configuration
- `PUT /api/admin/configurations/{id}` - Update single configuration
- `POST /api/admin/configurations/bulk-update` - Update multiple configurations

See `backend-docs/GENERAL_CONFIGURATION_GUIDE.md` for detailed API documentation.

## Development Notes

- The application uses modern React patterns with functional components and hooks
- API calls are centralized in service files for better maintainability
- TypeScript interfaces ensure type safety across the application
- Tailwind CSS provides utility classes for rapid UI development
- The app gracefully handles backend connection errors with informative messages

## Future Enhancements

- Implement remaining configuration tabs (Payments, PWA, Login, Printer, Layout)
- Add authentication and login screens
- Implement form validation with error messages
- Add loading states and skeleton screens
- Implement toast notifications for better UX
- Add unit and integration tests
- Implement internationalization (i18n)

## Contributing

1. Create a feature branch
2. Make your changes
3. Run linting: `npm run lint`
4. Build to ensure no errors: `npm run build`
5. Submit a pull request

## License

This project is part of the POS system and follows the same license terms.
