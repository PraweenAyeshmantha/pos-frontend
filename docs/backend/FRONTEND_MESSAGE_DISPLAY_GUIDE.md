# Login Error Handling and Message Display Guidelines

## Overview
This document describes the updated API response format for the login endpoint and provides guidance for frontend developers on how to display error and success messages in the POS frontend application.

## API Response Format

### Unified Response Structure
All API responses now follow a consistent `UnifiedResponse` format with the following structure:

```json
{
  "status": "SUCCESS" | "ERROR",
  "messageType": "SUCCESS" | "ERROR" | "WARNING" | "INFO",
  "code": "message.key.identifier",
  "message": "Human-readable message text",
  "timestamp": "2025-10-18T19:30:00.000Z",
  "path": "/api/auth/login",
  "data": { ... },
  "errors": [ ... ]
}
```

### Field Descriptions

- **status**: Overall status of the operation (`SUCCESS` or `ERROR`)
- **messageType**: Type of message for UI styling purposes:
  - `SUCCESS`: Green background, checkmark icon
  - `ERROR`: Red background, error/cross icon
  - `WARNING`: Yellow/Orange background, warning icon
  - `INFO`: Blue background, info icon
- **code**: Message key for internationalization
- **message**: User-friendly message in the current language
- **timestamp**: ISO 8601 timestamp of the response
- **path**: API endpoint path
- **data**: Response payload (present on success)
- **errors**: Validation errors (present on validation failures)

## Login Endpoint Examples

### Successful Login
```json
{
  "status": "SUCCESS",
  "messageType": "SUCCESS",
  "code": "success.login",
  "message": "Login successful. Welcome back!",
  "timestamp": "2025-10-18T19:30:00.000Z",
  "path": "/api/auth/login",
  "data": {
    "cashierId": 1,
    "username": "john",
    "name": "John Doe",
    "email": "john@example.com",
    "requirePasswordReset": false,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login Failed - Invalid Credentials
```json
{
  "status": "ERROR",
  "messageType": "ERROR",
  "code": "error.invalid-credentials",
  "message": "The username or password you entered is incorrect. Please try again.",
  "timestamp": "2025-10-18T19:30:00.000Z",
  "path": "/api/auth/login"
}
```

### Login Failed - Inactive Account
```json
{
  "status": "ERROR",
  "messageType": "ERROR",
  "code": "error.bad-request",
  "message": "Account is inactive",
  "timestamp": "2025-10-18T19:30:00.000Z",
  "path": "/api/auth/login"
}
```

### Validation Error - Missing Fields
```json
{
  "status": "ERROR",
  "messageType": "ERROR",
  "code": "error.validation",
  "message": "Please review the information you provided and correct any errors before submitting again.",
  "timestamp": "2025-10-18T19:30:00.000Z",
  "path": "/api/auth/login",
  "errors": [
    {
      "field": "username",
      "message": "Username is required",
      "rejectedValue": null
    }
  ]
}
```

## Frontend Implementation Guide

### 1. Prevent Page Refresh on Login Failure
**DO NOT** use form submission that causes page reload. Use AJAX/Fetch API or Axios:

```javascript
// Example using Fetch API
async function handleLogin(username, password) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password })
    });
    
    const result = await response.json();
    
    if (result.status === 'SUCCESS') {
      // Handle successful login
      localStorage.setItem('token', result.data.token);
      showMessage(result.messageType, result.message);
      
      // Redirect or update UI
      if (result.data.requirePasswordReset) {
        redirectToPasswordReset();
      } else {
        redirectToDashboard();
      }
    } else {
      // Handle error
      showMessage(result.messageType, result.message);
    }
  } catch (error) {
    showMessage('ERROR', 'Unable to connect to the server. Please try again.');
  }
}
```

### 2. Display Messages in Bottom-Right Corner

Create a toast/alert component that appears in the bottom-right corner:

```css
.toast-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  max-width: 400px;
}

.toast {
  display: flex;
  align-items: center;
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
}

.toast-success {
  background-color: #10b981;
  color: white;
}

.toast-error {
  background-color: #ef4444;
  color: white;
}

.toast-warning {
  background-color: #f59e0b;
  color: white;
}

.toast-info {
  background-color: #3b82f6;
  color: white;
}

.toast-close {
  margin-left: auto;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 20px;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}
```

### 3. JavaScript Toast Implementation

```javascript
function showMessage(messageType, message, duration = 5000) {
  // Create toast container if it doesn't exist
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${messageType.toLowerCase()}`;
  
  // Add icon based on message type
  const icon = getIconForMessageType(messageType);
  
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="closeToast(this)">×</button>
  `;
  
  container.appendChild(toast);
  
  // Auto-dismiss after duration
  if (duration > 0) {
    setTimeout(() => {
      closeToast(toast.querySelector('.toast-close'));
    }, duration);
  }
}

function closeToast(closeButton) {
  const toast = closeButton.closest('.toast');
  toast.style.animation = 'slideOut 0.3s ease-out';
  setTimeout(() => {
    toast.remove();
  }, 300);
}

function getIconForMessageType(messageType) {
  const icons = {
    'SUCCESS': '✓',
    'ERROR': '✕',
    'WARNING': '⚠',
    'INFO': 'ℹ'
  };
  return icons[messageType] || 'ℹ';
}
```

### 4. React Example (if using React)

```jsx
import React, { useState, useEffect } from 'react';
import './Toast.css';

export const Toast = ({ message, messageType, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  const icons = {
    SUCCESS: '✓',
    ERROR: '✕',
    WARNING: '⚠',
    INFO: 'ℹ'
  };
  
  return (
    <div className={`toast toast-${messageType.toLowerCase()}`}>
      <span className="toast-icon">{icons[messageType]}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
};

export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="toast-container">
      {toasts.map((toast, index) => (
        <Toast
          key={index}
          message={toast.message}
          messageType={toast.messageType}
          onClose={() => removeToast(index)}
        />
      ))}
    </div>
  );
};
```

## HTTP Status Codes

The API returns appropriate HTTP status codes:

- **200 OK**: Successful login
- **400 Bad Request**: Validation errors or bad request (inactive account)
- **404 Not Found**: Invalid credentials (intentionally using 404 for security)
- **500 Internal Server Error**: Unexpected server errors

## Best Practices

1. **Always handle errors**: Check the `status` field in the response
2. **Use messageType for styling**: Don't hardcode colors based on status
3. **Show user-friendly messages**: Display the `message` field, not error codes
4. **Support internationalization**: The backend returns localized messages
5. **Prevent page refresh**: Use AJAX/Fetch for all API calls
6. **Auto-dismiss non-critical messages**: Success and info messages should auto-dismiss
7. **Keep errors visible**: Error messages should stay until user closes them or takes action
8. **Provide close button**: Always allow users to manually dismiss messages

## Testing Checklist

- [ ] Login with valid credentials shows success message
- [ ] Login with invalid credentials shows error message
- [ ] Error messages appear in bottom-right corner
- [ ] Messages auto-dismiss after 5 seconds
- [ ] Messages can be manually closed
- [ ] Page does not refresh on login failure
- [ ] Multiple messages can be displayed simultaneously
- [ ] Messages use correct colors for each type
- [ ] Messages are readable and user-friendly
- [ ] Inactive account shows appropriate error message
