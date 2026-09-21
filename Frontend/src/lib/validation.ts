// Field rules shared by every form. Limits mirror the Joi schemas in
// `Backend/src/validators` so the client never accepts what the API rejects.

export type Validator = (value: string) => string | null;

export const LIMITS = {
  nameMax: 80,
  fullNameMax: 120,
  passwordMin: 8,
  passwordMax: 128,
  line1Max: 200,
  cityMax: 80,
  quantityMax: 99,
  priceMax: 1_000_000,
  stockMax: 100_000,
} as const;

const NAME_OK = /^[\p{L}][\p{L}\s.'-]*$/u;
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const PHONE_IN = /^[6-9]\d{9}$/;
const PINCODE_IN = /^[1-9]\d{5}$/;

const req = (value: string, label: string) =>
  value.trim() ? null : `${label} is required`;

export const validateName =
  (label = "Name", max: number = LIMITS.nameMax): Validator =>
  (value) => {
    const v = value.trim();
    return (
      req(value, label) ??
      (/\d/.test(v) ? `${label} cannot contain numbers` : null) ??
      (!NAME_OK.test(v) ? `${label} can only use letters, spaces, . ' and -` : null) ??
      (v.length < 2 ? `${label} must be at least 2 characters` : null) ??
      (v.length > max ? `${label} must be under ${max} characters` : null)
    );
  };

export const validateEmail: Validator = (value) => {
  const v = value.trim();
  return req(value, "Email") ?? (EMAIL_OK.test(v) ? null : "Enter a valid email address");
};

/** Upper, lower, digit and symbol — reported as one line so the rule is obvious. */
export const validatePassword: Validator = (value) => {
  if (!value) return "Password is required";
  if (value.length < LIMITS.passwordMin)
    return `Password must be at least ${LIMITS.passwordMin} characters`;
  if (value.length > LIMITS.passwordMax)
    return `Password must be under ${LIMITS.passwordMax} characters`;
  const missing = [
    !/[a-z]/.test(value) && "a lowercase letter",
    !/[A-Z]/.test(value) && "an uppercase letter",
    !/\d/.test(value) && "a number",
    !/[^A-Za-z0-9]/.test(value) && "a symbol",
  ].filter(Boolean) as string[];
  if (/\s/.test(value)) return "Password cannot contain spaces";
  return missing.length ? `Password needs ${missing.join(", ")}` : null;
};

export const passwordStrength = (value: string) =>
  [
    value.length >= LIMITS.passwordMin,
    /[a-z]/.test(value),
    /[A-Z]/.test(value),
    /\d/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ].filter(Boolean).length;

export const validateConfirmPassword =
  (original: string): Validator =>
  (value) =>
    !value ? "Confirm your password" : value === original ? null : "Passwords do not match";

const indianMobileDigits = (value: string) => {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length > 10) {
    digits = digits.slice(2);
  }
  return digits;
};

export const validatePhone =
  (required = true): Validator =>
  (value) => {
    const v = value.trim();
    if (!v) return required ? "Phone number is required" : null;
    if (/[^\d\s+-]/.test(v)) return "Phone can only contain numbers";
    const digits = indianMobileDigits(v);
    return PHONE_IN.test(digits) ? null : "Enter a valid 10-digit mobile number";
  };

export const validatePincode: Validator = (value) => {
  const v = value.trim();
  return (
    req(value, "Pincode") ??
    (/\D/.test(v) ? "Pincode can only contain numbers" : null) ??
    (PINCODE_IN.test(v) ? null : "Enter a valid 6-digit pincode")
  );
};

export const validateRequired =
  (label: string, max?: number): Validator =>
  (value) => {
    const v = value.trim();
    return (
      req(value, label) ??
      (max && v.length > max ? `${label} must be under ${max} characters` : null)
    );
  };

/** Whole numbers only; used for quantity and stock. */
export const validateInteger =
  (label: string, { min = 0, max = Number.MAX_SAFE_INTEGER as number, required = true } = {}): Validator =>
  (value) => {
    const v = value.trim();
    if (!v) return required ? `${label} is required` : null;
    if (!/^\d+$/.test(v)) return `${label} must be a whole number`;
    const n = Number(v);
    if (n < min) return `${label} must be at least ${min}`;
    if (n > max) return `${label} cannot exceed ${max.toLocaleString("en-IN")}`;
    return null;
  };

/** Money: up to two decimals, within a sane ceiling. */
export const validateAmount =
  (
    label: string,
    { min = 0, max = LIMITS.priceMax as number, required = true } = {},
  ): Validator =>
  (value) => {
    const v = value.trim();
    if (!v) return required ? `${label} is required` : null;
    if (!/^\d+(\.\d{1,2})?$/.test(v))
      return `${label} must be a number with up to 2 decimals`;
    const n = Number(v);
    if (n < min) return `${label} must be at least ${min}`;
    if (n > max) return `${label} cannot exceed ${max.toLocaleString("en-IN")}`;
    return null;
  };

/** Runs a map of validators over a values map; returns only the fields that failed. */
export function validateAll<T extends Record<string, string>>(
  values: T,
  rules: Partial<Record<keyof T, Validator>>,
): Partial<Record<keyof T, string>> {
  const errors: Partial<Record<keyof T, string>> = {};
  for (const key of Object.keys(rules) as (keyof T)[]) {
    const error = rules[key]?.(values[key] ?? "");
    if (error) errors[key] = error;
  }
  return errors;
}

// Input sanitisers — applied on change so bad characters never appear.
export const digitsOnly = (value: string, max?: number) => {
  const d = value.replace(/\D/g, "");
  return max ? d.slice(0, max) : d;
};

/** Allows 10-digit mobile or 12 digits with a leading 91 country code. */
export const phoneDigitsOnly = (value: string) => digitsOnly(value, 12);

export const lettersOnly = (value: string) => value.replace(/[0-9]/g, "");

export const decimalOnly = (value: string) =>
  value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
