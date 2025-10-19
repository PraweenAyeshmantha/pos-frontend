# POS Frontend Project

## Overview

A complete frontend application for the Point of Sale (POS) system has been created in the `pos-frontend/` directory. This modern React-based application provides a user-friendly interface for retail operations.

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm 9+
- Backend API running on `http://localhost:8080/pos-codex`

### Installation

```bash
cd pos-frontend
npm install
cp .env.example .env
npm run dev
```

The application will start on `http://localhost:5173`

## Features

- **Modern Tech Stack**: React 19, TypeScript, Vite, TailwindCSS
- **Authentication**: JWT-based login with protected routes
- **Product Management**: Browse, search, and filter products
- **Cart System**: Real-time cart management with quantity controls
- **Barcode Support**: Quick product lookup via barcode scanning
- **Responsive Design**: Works on desktop, tablet, and mobile

## Project Structure

```
pos-frontend/
├── src/
│   ├── components/     # React components (Cart, ProductGrid, SearchBar, etc.)
│   ├── pages/         # Page components (Login, POS)
│   ├── services/      # API services (auth, products, orders)
│   ├── store/         # State management (Zustand)
│   └── App.tsx        # Main application
├── README.md          # Comprehensive documentation
├── DOCUMENTATION.md   # Technical documentation
├── MIGRATION_GUIDE.md # Guide to move to separate repository
└── package.json       # Dependencies and scripts
```

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Moving to Separate Repository

The frontend is designed to be moved to its own repository. Follow the detailed instructions in `pos-frontend/MIGRATION_GUIDE.md` to:

1. Create a new repository called `pos-frontend`
2. Push the frontend code to the new repository
3. Deploy independently

## Integration with Backend

The frontend connects to the backend API endpoints:
- Authentication: `/auth/login`, `/auth/logout`
- Products: `/products`, `/categories`
- Orders: `/orders`, `/payments`

Configure the API URL in `.env`:
```env
VITE_API_BASE_URL=http://localhost:8080/pos-codex
```

## Documentation

- **[README.md](pos-frontend/README.md)**: Getting started guide
- **[DOCUMENTATION.md](pos-frontend/DOCUMENTATION.md)**: Technical documentation
- **[MIGRATION_GUIDE.md](pos-frontend/MIGRATION_GUIDE.md)**: Repository separation guide

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.1.1 | UI Framework |
| TypeScript | 5.9.3 | Type Safety |
| Vite | 7.1.7 | Build Tool |
| React Router | 7.9.4 | Routing |
| Zustand | 5.0.8 | State Management |
| Axios | 1.12.2 | HTTP Client |
| TailwindCSS | 3.4.17 | Styling |
| Heroicons | 2.2.0 | Icons |

## Build Status

✅ **All checks passed**
- TypeScript compilation: Success
- Production build: Success (280 KB JS, 14 KB CSS)
- ESLint: No errors

## Screenshots

### Login Page
Clean and professional login interface with JWT authentication.

### POS Interface
Main point of sale screen with:
- Product grid with search and filtering
- Real-time shopping cart
- Category navigation
- Barcode scanning support

## Support & Contributing

For issues and questions:
1. Check the documentation in `pos-frontend/`
2. Review the migration guide for deployment
3. See the main backend README for API documentation

## License

MIT License - This project is part of the POS Backend system.

---

**Note**: This frontend project is currently located in the `pos-backend` repository for convenience. It is recommended to move it to a separate `pos-frontend` repository for better organization and independent deployment. See `MIGRATION_GUIDE.md` for instructions.
