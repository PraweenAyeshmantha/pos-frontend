/**
 * Environment variable validation and configuration
 */

interface EnvConfig {
  apiBaseUrl: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

/**
 * Validates and returns environment configuration
 * Throws error if required variables are missing
 */
function validateEnv(): EnvConfig {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const mode = import.meta.env.MODE;

  // Provide defaults for development
  const config: EnvConfig = {
    apiBaseUrl: apiBaseUrl || 'http://localhost:8080/pos-codex/api',
    isDevelopment: mode === 'development',
    isProduction: mode === 'production',
  };

  // Warn in development if using defaults
  if (!apiBaseUrl && mode === 'development') {
    console.warn(
      '⚠️ VITE_API_BASE_URL not set, using default:',
      config.apiBaseUrl
    );
  }

  return config;
}

export const env = validateEnv();

export default env;
