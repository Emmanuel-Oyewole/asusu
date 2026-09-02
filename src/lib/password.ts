export const PASSWORD_MIN_LENGTH = 8;

export type PasswordRequirement = {
  id: string;
  label: string;
  test: (password: string) => boolean;
};

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: "length",
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (pw) => pw.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: "upper",
    label: "One uppercase letter",
    test: (pw) => /[A-Z]/.test(pw),
  },
  {
    id: "lower",
    label: "One lowercase letter",
    test: (pw) => /[a-z]/.test(pw),
  },
  { id: "number", label: "One number", test: (pw) => /[0-9]/.test(pw) },
  {
    id: "special",
    label: "One special character (!@#$%^&*)",
    test: (pw) => /[^A-Za-z0-9]/.test(pw),
  },
];

export function validatePassword(password: string): {
  valid: boolean;
  failed: PasswordRequirement[];
} {
  const failed = PASSWORD_REQUIREMENTS.filter((req) => !req.test(password));
  return { valid: failed.length === 0, failed };
}
