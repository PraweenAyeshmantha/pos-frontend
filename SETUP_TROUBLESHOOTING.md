# Environment Setup Troubleshooting Guide

## Issue: "VITE_API_BASE_URL is not set!" Error

### Problem
When you try to run the application, you see an error message:
```
❌ VITE_API_BASE_URL is not set!

Please create a .env file in the root directory with:
VITE_API_BASE_URL=your_api_url_here

Example: VITE_API_BASE_URL=http://localhost:8080/posai/api
You can copy .env.example to .env and update the values.
```

### Solution

The application requires environment variables to be configured before it can run. Follow these steps:

#### Option 1: Quick Setup (Recommended)

Run the automated setup script:

**For Linux/Mac:**
```bash
./setup.sh
```

**For Windows:**
```bash
setup.bat
```

This will automatically create a `.env` file with the default configuration.

#### Option 2: Manual Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and update the API URL if needed:
   ```env
   VITE_API_BASE_URL=http://localhost:8080/posai/api
   ```

3. Save the file and restart your development server

### Verification

After creating the `.env` file, verify it exists:

```bash
# Linux/Mac
ls -la | grep .env

# Windows
dir | findstr .env
```

You should see both `.env` and `.env.example` files.

### Common Issues

#### 1. .env file not found
**Cause:** The `.env` file was not created or is in the wrong directory.
**Solution:** Make sure you run the setup script or create the `.env` file in the root directory of the project (same location as `package.json`).

#### 2. Changes not taking effect
**Cause:** Vite needs to be restarted after `.env` changes.
**Solution:** Stop the dev server (Ctrl+C) and run `npm run dev` again.

#### 3. Wrong API URL
**Cause:** The `VITE_API_BASE_URL` points to an incorrect or unreachable backend.
**Solution:** Update the `.env` file with the correct backend API URL. Make sure:
- The URL does not have a trailing slash
- The backend server is running
- The URL is accessible from your machine

#### 4. .env file is committed to git
**Cause:** The `.env` file should not be committed to version control.
**Solution:** The `.env` file is already in `.gitignore`. If you accidentally committed it:
```bash
git rm --cached .env
git commit -m "Remove .env from version control"
```

### Why is this needed?

The `.env` file contains environment-specific configuration that varies between:
- Development, staging, and production environments
- Different developers' local setups
- Different deployment targets

This is why it's:
1. Not committed to version control (in `.gitignore`)
2. Created from `.env.example` which serves as a template
3. Required before running the application

### Additional Help

If you continue to experience issues:
1. Check that your Node.js version is 18 or higher: `node --version`
2. Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
3. Clear the Vite cache: `rm -rf node_modules/.vite`
4. Review the [Getting Started](./README.md#getting-started) section in the README

### Environment Variables Reference

The application uses the following environment variables:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_BASE_URL` | Yes | Backend API base URL (no trailing slash) | `http://localhost:8080/posai/api` |

Note: The `TENANT_ID` is dynamically obtained from the URL path (`/posai/{tenantId}`) and does not need to be configured in the `.env` file.
