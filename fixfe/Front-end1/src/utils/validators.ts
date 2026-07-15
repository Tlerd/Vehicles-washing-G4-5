export const isValidPhone = (phone: string): boolean => {
  return /^0\d{9}$/.test(phone);
};

export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidLicensePlate = (plate: string): boolean => {
  return plate.length >= 6 && plate.length <= 12;
};

export const isRequired = (value: string): boolean => {
  return value.trim().length > 0;
};
