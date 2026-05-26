function sanitizeHtml(str) {
  if (!str) return '';
  return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '').replace(/on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]+/gi, '').replace(/javascript\s*:/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
}

function getLevel(rating) {
  if (rating >= 5000) return 'C2'; if (rating >= 3000) return 'C1'; if (rating >= 1500) return 'B2';
  if (rating >= 700) return 'B1'; if (rating >= 300) return 'A2'; return 'A1';
}

module.exports = { sanitizeHtml, getLevel };
