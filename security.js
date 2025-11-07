// Security utilities for frontend
class SecurityUtils {
  // XSS Protection - HTML encode user input
  static escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Sanitize input for display
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }

  // Validate email format
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate phone number
  static isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  // Validate name (letters and spaces only)
  static isValidName(name) {
    const nameRegex = /^[a-zA-Z\s]+$/;
    return nameRegex.test(name) && name.trim().length >= 2;
  }

  // Generate secure random token for CSRF protection
  static generateToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Store and retrieve CSRF token
  static setCSRFToken() {
    const token = this.generateToken();
    sessionStorage.setItem('csrfToken', token);
    return token;
  }

  static getCSRFToken() {
    return sessionStorage.getItem('csrfToken');
  }

  // Secure API request wrapper
  static async secureRequest(url, options = {}) {
    const token = localStorage.getItem('authToken');
    const csrfToken = this.getCSRFToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (csrfToken && ['POST', 'PUT', 'DELETE'].includes(options.method?.toUpperCase())) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Rate limiting for client-side
  static rateLimiter = new Map();

  static checkRateLimit(action, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    const now = Date.now();
    const key = `${action}_${Math.floor(now / windowMs)}`;
    
    const attempts = this.rateLimiter.get(key) || 0;
    if (attempts >= maxAttempts) {
      return false;
    }
    
    this.rateLimiter.set(key, attempts + 1);
    return true;
  }
}

// Initialize CSRF token on page load
document.addEventListener('DOMContentLoaded', function() {
  if (!SecurityUtils.getCSRFToken()) {
    SecurityUtils.setCSRFToken();
  }
});

window.SecurityUtils = SecurityUtils;