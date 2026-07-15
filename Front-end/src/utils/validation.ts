export function isValidOptionalEmail(email: string | undefined): boolean {
  if (!email || email.trim() === '') return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  return /^0\d{9}$/.test(phone.trim());
}

export function isValidName(name: string): boolean {
  return name.trim().length >= 2;
}
