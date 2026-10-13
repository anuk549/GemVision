export const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/[^\s]+$/i,
  phone: /^[+]?[\d\s()-]{7,15}$/,
  digits: /^\d+$/,
  decimal: /^-?\d+(\.\d+)?$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  name: /^[a-zA-Z\s.'-]+$/,
};

export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

export const rules = {
  required: (message = 'This field is required') => (value) =>
    isEmpty(value) ? message : null,

  email: (message = 'Enter a valid email address') => (value) =>
    isEmpty(value) || patterns.email.test(String(value).trim()) ? null : message,

  url: (message = 'Enter a valid URL') => (value) =>
    isEmpty(value) || patterns.url.test(String(value).trim()) ? null : message,

  phone: (message = 'Enter a valid phone number') => (value) =>
    isEmpty(value) || patterns.phone.test(String(value).trim()) ? null : message,

  digits: (message = 'Numbers only') => (value) =>
    isEmpty(value) || patterns.digits.test(String(value).trim()) ? null : message,

  number: (message = 'Enter a valid number') => (value) =>
    isEmpty(value) || !Number.isNaN(Number(value)) ? null : message,

  min: (length, message) => (value) =>
    isEmpty(value) || String(value).length >= length
      ? null
      : message || `Must be at least ${length} characters`,

  max: (length, message) => (value) =>
    isEmpty(value) || String(value).length <= length
      ? null
      : message || `Must be at most ${length} characters`,

  minValue: (min, message) => (value) =>
    isEmpty(value) || Number(value) >= min ? null : message || `Must be at least ${min}`,

  maxValue: (max, message) => (value) =>
    isEmpty(value) || Number(value) <= max ? null : message || `Must be at most ${max}`,

  pattern: (regex, message = 'Invalid value') => (value) =>
    isEmpty(value) || regex.test(String(value).trim()) ? null : message,

  oneOf: (allowed = [], message = 'Invalid option') => (value) =>
    isEmpty(value) || allowed.includes(value) ? null : message,

  match: (otherValue, message = 'Values do not match') => (value) =>
    isEmpty(value) || value === otherValue ? null : message,

  custom: (fn, message = 'Invalid value') => (value, values) => {
    const result = fn(value, values);
    if (result === true || result === undefined || result === null) return null;
    if (result === false) return message;
    return result;
  },
};

export const normalizeValidators = (validators) => {
  if (!validators) return [];
  if (typeof validators === 'function') return [validators];
  return Array.isArray(validators) ? validators : [];
};

export const validateValue = (value, validators, values = {}) => {
  const list = normalizeValidators(validators);
  for (const validator of list) {
    const error = validator(value, values);
    if (error) return error;
  }
  return null;
};

export const validateForm = (values, schema = {}) => {
  const errors = {};
  Object.keys(schema).forEach((field) => {
    const error = validateValue(values[field], schema[field], values);
    if (error) errors[field] = error;
  });
  return errors;
};

export const hasErrors = (errors = {}) => Object.keys(errors).length > 0;
