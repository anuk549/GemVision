export const formatDate = (value, options = {}) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const { locale = 'en-US', dateStyle = 'medium' } = options;
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
};

export const formatNumber = (value, options = {}) => {
  const number = Number(value);
  if (Number.isNaN(number)) return String(value ?? '');
  try {
    return new Intl.NumberFormat(options.locale || 'en-US', options).format(number);
  } catch {
    return String(number);
  }
};

export const truncate = (value, length = 40) => {
  const text = String(value ?? '');
  if (text.length <= length) return text;
  return `${text.slice(0, length - 1)}…`;
};

export const slugify = (value) =>
  String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
