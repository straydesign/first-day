/**
 * Shared password validation.
 * Rules: >= 6 chars, >= 1 uppercase, >= 1 symbol, >= 2 numbers.
 * Returns null if valid, or an error message string.
 */
export function validatePassword(password: string): string | null {
  if (password.length < 6) {
    return "Password must be at least 6 characters";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one capital letter";
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return "Password must contain at least one symbol";
  }
  if ((password.match(/\d/g) || []).length < 2) {
    return "Password must contain at least two numbers";
  }
  return null;
}
