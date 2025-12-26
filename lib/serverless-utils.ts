/**
 * Utility functions for serverless environment handling
 * Helps with common deployment issues between local and production
 */

/**
 * Checks if the current environment is serverless (Vercel, Netlify, etc.)
 */
export const isServerlessEnvironment = (): boolean => {
  return !!(
    process.env.VERCEL || 
    process.env.NETLIFY || 
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT
  );
};

/**
 * Gets appropriate timeout for serverless functions
 * Vercel has different timeout limits based on plan
 */
export const getServerlessTimeout = (): number => {
  if (process.env.VERCEL) {
    // Vercel Pro/Enterprise: 60s, Hobby: 10s
    return process.env.VERCEL_ENV === 'production' ? 8000 : 5000;
  }
  
  if (process.env.NETLIFY) {
    // Netlify functions timeout after 10s (free) or 26s (pro)
    return 8000;
  }
  
  // Default safe timeout for other serverless platforms
  return 5000;
};

/**
 * Creates a timeout promise that rejects after specified ms
 */
export const createTimeout = (ms: number, message = 'Operation timeout'): Promise<never> => {
  return new Promise((_, reject) => 
    setTimeout(() => reject(new Error(message)), ms)
  );
};

/**
 * Wraps a promise with timeout protection
 */
export const withTimeout = async <T>(
  promise: Promise<T>, 
  timeoutMs: number, 
  timeoutMessage = 'Operation timeout'
): Promise<T> => {
  return Promise.race([
    promise,
    createTimeout(timeoutMs, timeoutMessage)
  ]);
};

/**
 * Executes a function with retry logic for serverless environments
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 2,
  delayMs = 1000
): Promise<T> => {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt <= maxRetries) {
        console.warn(`Attempt ${attempt} failed, retrying in ${delayMs}ms:`, lastError.message);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  throw lastError;
};

/**
 * Safe async function executor that doesn't block the main thread
 */
export const executeAsync = <T>(
  operation: () => Promise<T>,
  onError?: (error: Error) => void
): void => {
  operation().catch(error => {
    const err = error instanceof Error ? error : new Error('Unknown error');
    console.error('Async operation failed:', err);
    onError?.(err);
  });
};

/**
 * Checks if the current environment supports long-running processes
 */
export const supportsLongRunningTasks = (): boolean => {
  return !isServerlessEnvironment() || !!process.env.VERCEL_ENV;
};

/**
 * Gets the base URL for the current environment
 */
export const getBaseUrl = (): string => {
  // Production URL from environment
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  
  // Vercel automatic URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Development fallback
  return 'http://localhost:3000';
};

/**
 * Logs with environment context for better debugging
 */
export const logWithContext = (message: string, data?: any): void => {
  const context = {
    env: process.env.NODE_ENV,
    serverless: isServerlessEnvironment(),
    vercel: !!process.env.VERCEL,
    timestamp: new Date().toISOString(),
  };
  
  if (data) {
    console.log(`[${context.env}] ${message}`, { ...context, data });
  } else {
    console.log(`[${context.env}] ${message}`, context);
  }
};