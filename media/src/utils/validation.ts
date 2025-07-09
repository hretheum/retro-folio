// Input validation and sanitization utilities

export const sanitizeInput = (input: string): string => {
  // Remove script tags and dangerous HTML
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

export const validateName = (name: string): boolean => {
  const sanitized = sanitizeInput(name);
  return sanitized.length >= 2 && sanitized.length <= 50;
};

export const validateMessage = (message: string): boolean => {
  const sanitized = sanitizeInput(message);
  return sanitized.length >= 5 && sanitized.length <= 1000;
};

export const validateLocation = (location: string): boolean => {
  const sanitized = sanitizeInput(location);
  return sanitized.length <= 100;
};

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateGuestbookEntry = (data: {
  name: string;
  email?: string;
  website?: string;
  location?: string;
  message: string;
}): ValidationResult => {
  const errors: string[] = [];

  // Validate name
  if (!data.name.trim()) {
    errors.push('Name is required');
  } else if (!validateName(data.name)) {
    errors.push('Name must be between 2 and 50 characters');
  }

  // Validate email if provided
  if (data.email && data.email.trim() && !validateEmail(data.email)) {
    errors.push('Invalid email format');
  }

  // Validate website if provided
  if (data.website && data.website.trim() && !validateUrl(data.website)) {
    errors.push('Invalid website URL (must start with http:// or https://)');
  }

  // Validate location if provided
  if (data.location && !validateLocation(data.location)) {
    errors.push('Location must be less than 100 characters');
  }

  // Validate message
  if (!data.message.trim()) {
    errors.push('Message is required');
  } else if (!validateMessage(data.message)) {
    errors.push('Message must be between 5 and 1000 characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};