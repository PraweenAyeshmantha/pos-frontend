/**
 * Environment variable validation and configuration
 */

interface EnvConfig {
  apiBaseUrl: string;
  isDevelopment: boolean;
  isProduction: boolean;
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Validates and returns environment configuration
 * Instead of throwing, marks config as invalid if required variables are missing
 */
function validateEnv(): EnvConfig {
  const mode = import.meta.env.MODE;
  const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  const fallbackRelativeBase = '/posai/api';

  // Prefer configured base URL when present, otherwise fall back to a relative path
  // The fallback ensures production builds default to /posai/api without hardcoding localhost.
  const apiBaseUrl = configuredApiBaseUrl && configuredApiBaseUrl.length > 0
    ? configuredApiBaseUrl.replace(/\/+$/, '')
    : (mode === 'production' ? fallbackRelativeBase : '');

  // Check if VITE_API_BASE_URL (or fallback) is available
  if (!apiBaseUrl) {
    const errorMessage = 
      '❌ VITE_API_BASE_URL is not set!\n\n' +
      'For local development: VITE_API_BASE_URL=http://localhost:8080/posai/api\n' +
      'For production deployments: VITE_API_BASE_URL=/posai/api\n' +
      'You can copy .env.example to .env and update the values.';
    
    console.error(errorMessage);
    
    // Return invalid config instead of throwing
    return {
      apiBaseUrl: '',
      isDevelopment: mode === 'development',
      isProduction: mode === 'production',
      isValid: false,
      errorMessage,
    };
  }

  const config: EnvConfig = {
    apiBaseUrl: apiBaseUrl,
    isDevelopment: mode === 'development',
    isProduction: mode === 'production',
    isValid: true,
  };

  return config;
}

export const env = validateEnv();

export default env;
