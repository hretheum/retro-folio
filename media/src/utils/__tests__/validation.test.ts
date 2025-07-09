import {
  sanitizeInput,
  validateEmail,
  validateUrl,
  validateName,
  validateMessage,
  validateLocation,
  validateGuestbookEntry
} from '../validation';

describe('Validation Utils', () => {
  describe('sanitizeInput', () => {
    it('removes script tags', () => {
      const input = 'Hello <script>alert("XSS")</script>World';
      expect(sanitizeInput(input)).toBe('Hello World');
    });

    it('removes iframe tags', () => {
      const input = 'Hello <iframe src="evil.com"></iframe>World';
      expect(sanitizeInput(input)).toBe('Hello World');
    });

    it('removes javascript: protocols', () => {
      const input = 'Click <a href="javascript:alert(1)">here</a>';
      expect(sanitizeInput(input)).toBe('Click <a href="alert(1)">here</a>');
    });

    it('removes event handlers', () => {
      const input = '<div onclick="alert(1)">Click me</div>';
      expect(sanitizeInput(input)).toBe('<div "alert(1)">Click me</div>');
    });

    it('trims whitespace', () => {
      const input = '  Hello World  ';
      expect(sanitizeInput(input)).toBe('Hello World');
    });

    it('preserves safe HTML', () => {
      const input = '<strong>Bold</strong> and <em>italic</em>';
      expect(sanitizeInput(input)).toBe('<strong>Bold</strong> and <em>italic</em>');
    });
  });

  describe('validateEmail', () => {
    it('validates correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.com')).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('user space@example.com')).toBe(false);
    });
  });

  describe('validateUrl', () => {
    it('validates correct URLs', () => {
      expect(validateUrl('http://example.com')).toBe(true);
      expect(validateUrl('https://example.com')).toBe(true);
      expect(validateUrl('https://subdomain.example.com/path?query=value')).toBe(true);
    });

    it('rejects invalid URLs', () => {
      expect(validateUrl('not a url')).toBe(false);
      expect(validateUrl('ftp://example.com')).toBe(false);
      expect(validateUrl('javascript:alert(1)')).toBe(false);
      expect(validateUrl('example.com')).toBe(false);
    });
  });

  describe('validateName', () => {
    it('validates correct names', () => {
      expect(validateName('John')).toBe(true);
      expect(validateName('John Doe')).toBe(true);
      expect(validateName('Jean-Pierre')).toBe(true);
    });

    it('rejects invalid names', () => {
      expect(validateName('J')).toBe(false); // Too short
      expect(validateName('A'.repeat(51))).toBe(false); // Too long
      expect(validateName('')).toBe(false); // Empty
      expect(validateName('  ')).toBe(false); // Only whitespace
    });
  });

  describe('validateMessage', () => {
    it('validates correct messages', () => {
      expect(validateMessage('Hello!')).toBe(true);
      expect(validateMessage('This is a longer message with multiple sentences.')).toBe(true);
    });

    it('rejects invalid messages', () => {
      expect(validateMessage('Hi')).toBe(false); // Too short
      expect(validateMessage('A'.repeat(1001))).toBe(false); // Too long
      expect(validateMessage('')).toBe(false); // Empty
      expect(validateMessage('    ')).toBe(false); // Only whitespace
    });
  });

  describe('validateLocation', () => {
    it('validates correct locations', () => {
      expect(validateLocation('New York')).toBe(true);
      expect(validateLocation('London, UK')).toBe(true);
      expect(validateLocation('')).toBe(true); // Empty is allowed
    });

    it('rejects invalid locations', () => {
      expect(validateLocation('A'.repeat(101))).toBe(false); // Too long
    });
  });

  describe('validateGuestbookEntry', () => {
    const validEntry = {
      name: 'John Doe',
      email: 'john@example.com',
      website: 'https://example.com',
      location: 'New York',
      message: 'Great website!'
    };

    it('validates a complete valid entry', () => {
      const result = validateGuestbookEntry(validEntry);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('validates entry with optional fields missing', () => {
      const result = validateGuestbookEntry({
        name: 'John Doe',
        message: 'Great website!'
      });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('detects missing required fields', () => {
      const result = validateGuestbookEntry({
        name: '',
        message: ''
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name is required');
      expect(result.errors).toContain('Message is required');
    });

    it('detects invalid name', () => {
      const result = validateGuestbookEntry({
        ...validEntry,
        name: 'J'
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name must be between 2 and 50 characters');
    });

    it('detects invalid email', () => {
      const result = validateGuestbookEntry({
        ...validEntry,
        email: 'invalid-email'
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('detects invalid website', () => {
      const result = validateGuestbookEntry({
        ...validEntry,
        website: 'not-a-url'
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid website URL (must start with http:// or https://)');
    });

    it('detects invalid location', () => {
      const result = validateGuestbookEntry({
        ...validEntry,
        location: 'A'.repeat(101)
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Location must be less than 100 characters');
    });

    it('detects invalid message', () => {
      const result = validateGuestbookEntry({
        ...validEntry,
        message: 'Hi'
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Message must be between 5 and 1000 characters');
    });
  });
});