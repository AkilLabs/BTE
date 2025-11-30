// JWT utility functions for decoding and extracting token data

/**
 * Decode JWT token to get payload
 * @param token - JWT token string
 * @returns Decoded payload object or null if invalid
 */
export const decodeJWT = (token: string) => {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    // Decode payload (second part)
    const payload = parts[1];
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

/**
 * Get user role from JWT token
 * @param token - JWT token string
 * @returns User role ('user', 'admin', etc.) or null
 */
export const getUserRoleFromToken = (token: string) => {
  const payload = decodeJWT(token);
  return payload?.role || null;
};

/**
 * Get user name from JWT token
 * @param token - JWT token string
 * @returns User name or null
 */
export const getUserNameFromToken = (token: string) => {
  const payload = decodeJWT(token);
  return payload?.name || null;
};

/**
 * Get navigation path based on user role
 * @param role - User role from JWT
 * @returns Path to navigate to
 */
export const getNavigationPath = (role: string) => {
  switch (role) {
    case 'admin':
      return '/admin-dashboard';
    case 'user':
      return '/user-home';
    default:
      return '/user-home';
  }
};
