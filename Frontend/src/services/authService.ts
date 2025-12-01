// API Service for authentication endpoints
const API_BASE_URL = 'http://68.183.80.191:8000/api';

// ============ PASSWORD RESET ENDPOINTS ============

/**
 * Request OTP for password reset
 * @param email - User's email address
 * @returns Promise with message or error
 */
export const requestPasswordReset = async (email: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/forgot-password/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send OTP');
    }

    return {
      success: true,
      message: data.message,
      email: data.email || email,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
};

/**
 * Verify OTP for password reset
 * @param email - User's email address
 * @param otp - 6-digit OTP code
 * @returns Promise with verification result
 */
export const verifyOTP = async (email: string, otp: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/verify-otp/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'OTP verification failed');
    }

    return {
      success: true,
      message: data.message,
      email: data.email || email,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
};

/**
 * Reset password with new password
 * @param email - User's email address
 * @param password - New password
 * @param confirmPassword - Confirm password
 * @returns Promise with reset result
 */
export const resetPassword = async (
  email: string,
  password: string,
  confirmPassword: string
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reset-password/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, confirm_password: confirmPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Password reset failed');
    }

    return {
      success: true,
      message: data.message,
      email: data.email || email,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
};
