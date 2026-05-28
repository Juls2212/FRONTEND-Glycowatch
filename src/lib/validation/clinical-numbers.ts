export const CLINICAL_DECIMAL_PATTERN = /^\d{1,3}(?:\.\d)?$/;
export const CLINICAL_DECIMAL_MAX_LENGTH = 5;
const CLINICAL_DECIMAL_TYPING_PATTERN = /^(?:\d{0,3}|\d{1,3}\.\d{0,1})$/;

export const CLINICAL_DECIMAL_FORMAT_MESSAGE = "Usa hasta 3 digitos y maximo 1 decimal.";

type ClinicalDecimalRangeOptions = {
  min: number;
  max: number;
  unit: string;
  label: string;
};

export function isAllowedClinicalDecimalInput(value: string): boolean {
  return value.length <= CLINICAL_DECIMAL_MAX_LENGTH && CLINICAL_DECIMAL_TYPING_PATTERN.test(value);
}

export function getClinicalDecimalTypingError(value: string, range?: ClinicalDecimalRangeOptions): string | null {
  if (!value) return null;
  if (!isAllowedClinicalDecimalInput(value)) return CLINICAL_DECIMAL_FORMAT_MESSAGE;

  if (range && CLINICAL_DECIMAL_PATTERN.test(value)) {
    const parsed = Number(value);
    if (parsed < range.min || parsed > range.max) {
      return `${range.label} debe estar entre ${range.min} y ${range.max} ${range.unit}.`;
    }
  }

  return null;
}
