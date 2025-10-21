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
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const mode = import.meta.env.MODE;

  // Check if VITE_API_BASE_URL is set
  if (!apiBaseUrl) {
    const errorMessage = 
      '❌ VITE_API_BASE_URL is not set!\n\n' +
      'Please create a .env file in the root directory with:\n' +
      'VITE_API_BASE_URL=your_api_url_here\n\n' +
      'Example: VITE_API_BASE_URL=http://localhost:8080/posai/api\n' +
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
