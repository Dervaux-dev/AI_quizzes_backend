const { InputError } = require('./errors');

const MAX_NAME_LENGTH = 80;
const MAX_ROLE_LENGTH = 60;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/u;
const PICTOGRAPHS = /[\p{Extended_Pictographic}\u{fe0f}]/u;

function validateText(value, label, maxLength) {
  if (typeof value !== 'string') {
    throw new InputError(`${label} is required.`);
  }
  if (CONTROL_CHARACTERS.test(value)) {
    throw new InputError(`${label} cannot contain control characters.`);
  }
  if (PICTOGRAPHS.test(value)) {
    throw new InputError(
      `${label} cannot contain emoji or pictographic characters.`,
    );
  }

  const text = value.trim().replace(/\s+/gu, ' ');
  if (!text) {
    throw new InputError(`${label} is required.`);
  }
  if (text.length > maxLength) {
    throw new InputError(
      `${label} must be ${maxLength} characters or fewer.`,
    );
  }

  return text;
}

function validateFullname(value) {
  return validateText(value, 'Full name', MAX_NAME_LENGTH);
}

function validateRole(value) {
  return validateText(value, 'Role', MAX_ROLE_LENGTH);
}

function validateEmail(value) {
  if (typeof value !== 'string') {
    throw new InputError('Email is required.');
  }

  const email = value.trim();
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    throw new InputError('A valid email is required.');
  }

  return email;
}

module.exports = {
  validateEmail,
  validateFullname,
  validateRole,
};
