import { ZodIssue } from "zod";

export function mapZodIssuesToFieldErrors<TField extends string>(issues: ZodIssue[]): Partial<Record<TField, string>> {
  const fieldErrors: Partial<Record<TField, string>> = {};

  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field !== "string") continue;
    if (fieldErrors[field as TField]) continue;
    fieldErrors[field as TField] = issue.message;
  }

  return fieldErrors;
}
