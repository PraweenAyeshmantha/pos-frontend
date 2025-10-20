# Multi-Language Support Examples

This document provides practical examples of using the multi-language support in the POS Backend API.

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [Testing with cURL](#testing-with-curl)
3. [JavaScript/Frontend Examples](#javascriptfrontend-examples)
4. [Testing Different Scenarios](#testing-different-scenarios)

## Basic Usage

### Setting Language via HTTP Header

The API uses the standard `Accept-Language` HTTP header to determine the user's preferred language.

#### Supported Language Codes

- `en` - English (default)
- `es` - Spanish (Español)
- `fr` - French (Français)

## Testing with cURL

### Example 1: Get Error Message in English

```bash
curl -X GET \
  -H "Accept-Language: en" \
  http://localhost:8080/pos-codex/api/admin/products/999999
```

Response:
```json
{
  "messageKey": "error.not-found",
  "message": "We couldn't find what you're looking for. It may have been removed or doesn't exist.",
  "path": "/api/admin/products/999999",
  "timestamp": "2025-10-17T19:00:00Z",
  "data": null,
  "validationErrors": null
}
```

### Example 2: Get Error Message in Spanish

```bash
curl -X GET \
  -H "Accept-Language: es" \
  http://localhost:8080/pos-codex/api/admin/products/999999
```

Response:
```json
{
  "messageKey": "error.not-found",
  "message": "No pudimos encontrar lo que está buscando. Es posible que se haya eliminado o no exista.",
  "path": "/api/admin/products/999999",
  "timestamp": "2025-10-17T19:00:00Z",
  "data": null,
  "validationErrors": null
}
```

### Example 3: Get Error Message in French

```bash
curl -X GET \
  -H "Accept-Language: fr" \
  http://localhost:8080/pos-codex/api/admin/products/999999
```

Response:
```json
{
  "messageKey": "error.not-found",
  "message": "Nous n'avons pas pu trouver ce que vous cherchez. Il a peut-être été supprimé ou n'existe pas.",
  "path": "/api/admin/products/999999",
  "timestamp": "2025-10-17T19:00:00Z",
  "data": null,
  "validationErrors": null
}
```

### Example 4: Success Message in Different Languages

Create a product and receive success message in Spanish:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Accept-Language: es" \
  -H "X-Tenant-ID: PaPos" \
  -d '{
    "name": "Test Product",
    "price": 10.99,
    "category": "Test",
    "active": true
  }' \
  http://localhost:8080/pos-codex/api/admin/products
```

Response (Success):
```json
{
  "messageKey": "success.product.created",
  "message": "El producto se ha agregado al catálogo correctamente.",
  "path": "/api/admin/products",
  "timestamp": "2025-10-17T19:00:00Z",
  "data": {
    "id": 1,
    "name": "Test Product",
    "price": 10.99,
    "category": "Test",
    "active": true
  },
  "validationErrors": null
}
```

### Example 5: Validation Error in French

Try to create a product with invalid data:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Accept-Language: fr" \
  -H "X-Tenant-ID: PaPos" \
  -d '{
    "name": "",
    "price": -5
  }' \
  http://localhost:8080/pos-codex/api/admin/products
```

Response (Validation Error):
```json
{
  "messageKey": "error.validation",
  "message": "Veuillez vérifier les informations que vous avez fournies et corriger les erreurs avant de soumettre à nouveau.",
  "path": "/api/admin/products",
  "timestamp": "2025-10-17T19:00:00Z",
  "data": null,
  "validationErrors": [
    {
      "field": "name",
      "message": "Name is required",
      "rejectedValue": ""
    },
    {
      "field": "price",
      "message": "Price must be positive",
      "rejectedValue": -5
    }
  ]
}
```

## JavaScript/Frontend Examples

### Example 1: Using Fetch API with Language Selection

```javascript
// Get user's preferred language (from browser or user settings)
const userLanguage = navigator.language.split('-')[0]; // e.g., 'en', 'es', 'fr'

// Make API request with language preference
async function getProduct(productId) {
  try {
    const response = await fetch(
      `http://localhost:8080/pos-codex/api/admin/products/${productId}`,
      {
        headers: {
          'Accept-Language': userLanguage,
          'X-Tenant-ID': 'PaPos'
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Error:', error.message);
      // Display localized error message
      alert(error.message);
    } else {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}
```

### Example 2: React Component with Language Selection

```javascript
import React, { useState } from 'react';

function ProductList() {
  const [language, setLanguage] = useState('en');
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  const fetchProducts = async () => {
    try {
      const response = await fetch(
        'http://localhost:8080/pos-codex/api/admin/products',
        {
          headers: {
            'Accept-Language': language,
            'X-Tenant-ID': 'PaPos'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message);
      } else {
        const data = await response.json();
        setProducts(data.data);
        setError(null);
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  return (
    <div>
      <h1>Products</h1>
      
      {/* Language Selector */}
      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        <option value="en">English</option>
        <option value="es">Español</option>
        <option value="fr">Français</option>
      </select>
      
      <button onClick={fetchProducts}>Load Products</button>
      
      {error && <div className="error">{error}</div>}
      
      <ul>
        {products.map(product => (
          <li key={product.id}>{product.name} - ${product.price}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Example 3: Axios Interceptor for Language

```javascript
import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:8080/pos-codex/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include language
api.interceptors.request.use(
  (config) => {
    // Get language from localStorage or user preference
    const language = localStorage.getItem('preferredLanguage') || 'en';
    config.headers['Accept-Language'] = language;
    config.headers['X-Tenant-ID'] = 'PaPos';
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Display localized error message
      console.error('Error:', error.response.data.message);
      alert(error.response.data.message);
    }
    return Promise.reject(error);
  }
);

// Usage
async function createProduct(productData) {
  try {
    const response = await api.post('/admin/products', productData);
    alert(response.data.message); // Shows localized success message
    return response.data.data;
  } catch (error) {
    // Error already handled by interceptor
    console.error('Failed to create product');
  }
}
```

## Testing Different Scenarios

### Scenario 1: Authentication Error

```bash
# English
curl -X GET \
  -H "Accept-Language: en" \
  http://localhost:8080/pos-codex/api/admin/products

# Expected: "You need to be signed in to perform this action. Please log in and try again."
```

```bash
# Spanish
curl -X GET \
  -H "Accept-Language: es" \
  http://localhost:8080/pos-codex/api/admin/products

# Expected: "Debe iniciar sesión para realizar esta acción. Por favor, inicie sesión e inténtelo de nuevo."
```

### Scenario 2: Data Integrity Violation

```bash
# Try to delete a category that has products
curl -X DELETE \
  -H "Accept-Language: fr" \
  -H "X-Tenant-ID: PaPos" \
  http://localhost:8080/pos-codex/api/admin/categories/1

# Expected (French): "Cette action ne peut pas être terminée car d'autres enregistrements dépendent de ces données."
```

### Scenario 3: Stock Insufficient

```bash
# Try to order more items than available in stock
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Accept-Language: es" \
  -H "X-Tenant-ID: PaPos" \
  -d '{
    "productId": 1,
    "quantity": 1000
  }' \
  http://localhost:8080/pos-codex/api/pos/cart

# Expected (Spanish): "Esta operación resultaría en un stock negativo. Por favor, verifique la cantidad disponible."
```

### Scenario 4: Multiple Language Support in Same Session

```bash
# First request in English
curl -X GET \
  -H "Accept-Language: en" \
  -H "X-Tenant-ID: PaPos" \
  http://localhost:8080/pos-codex/api/admin/products/999

# Then switch to French
curl -X GET \
  -H "Accept-Language: fr" \
  -H "X-Tenant-ID: PaPos" \
  http://localhost:8080/pos-codex/api/admin/products/999

# Each request will return messages in the specified language
```

## Browser Language Detection

### Automatic Language Detection Example

```javascript
// Detect browser language and use as default
function getBrowserLanguage() {
  const browserLang = navigator.language || navigator.userLanguage;
  const langCode = browserLang.split('-')[0]; // Get primary language code
  
  // Check if language is supported
  const supportedLanguages = ['en', 'es', 'fr'];
  return supportedLanguages.includes(langCode) ? langCode : 'en';
}

// Use in API calls
const language = getBrowserLanguage();
fetch('http://localhost:8080/pos-codex/api/admin/products', {
  headers: {
    'Accept-Language': language,
    'X-Tenant-ID': 'PaPos'
  }
});
```

## Tips for Frontend Integration

1. **Store User Preference**: Save the user's language preference in localStorage or cookies
2. **Fallback Gracefully**: Always have a fallback to English if translation is missing
3. **Use Message Keys**: The API returns both `messageKey` and `message`. You can use the key for custom client-side translations
4. **Language Switcher**: Provide a language switcher in your UI for better UX
5. **Testing**: Test your application with all supported languages before deployment

## Common Message Keys Reference

| Scenario | Message Key | English | Spanish | French |
|----------|-------------|---------|---------|--------|
| Resource not found | `error.not-found` | "We couldn't find what you're looking for" | "No pudimos encontrar lo que está buscando" | "Nous n'avons pas pu trouver ce que vous cherchez" |
| Validation error | `error.validation` | "Please review the information" | "Por favor, revise la información" | "Veuillez vérifier les informations" |
| Success creation | `success.created` | "The item has been created successfully" | "El elemento se ha creado correctamente" | "L'élément a été créé avec succès" |
| Unauthorized | `error.unauthorized` | "You don't have permission" | "No tiene permiso" | "Vous n'avez pas la permission" |
| Generic error | `error.generic` | "We encountered an unexpected issue" | "Encontramos un problema inesperado" | "Nous avons rencontré un problème inattendu" |

## Advanced Usage

### Supporting Multiple Languages in Query Parameters

While the current implementation uses the `Accept-Language` header, you can extend it to support query parameters:

```bash
# Example (requires custom implementation)
curl http://localhost:8080/pos-codex/api/admin/products?lang=es
```

This would require adding a custom LocaleResolver that checks both header and query parameters.

### Language Preference Per User

For a more sophisticated implementation, you could:
1. Store language preference in the user profile
2. Create a custom LocaleResolver that checks user settings first
3. Fall back to Accept-Language header if no user preference exists

This is left as a future enhancement.
