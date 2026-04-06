type DecimalRestrictionOptions = {
  maxIntegerDigits: number;
  maxFractionDigits?: number;
};

export function normalizeEmailInput(value: string): string {
  return value.replace(/^\s+/, "").slice(0, 254);
}

export function trimInputValue(value: string): string {
  return value.trim();
}

export function normalizeDeviceNameInput(value: string): string {
  return value.replace(/^\s+/, "").slice(0, 80);
}

export function normalizeDeviceNameOnBlur(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeDeviceIdentifierInput(value: string): string {
  return value.replace(/[^A-Za-z0-9._:-]/g, "").slice(0, 120);
}

export function normalizeRestrictedDecimalInput(value: string, options: DecimalRestrictionOptions): string {
  const sanitized = value.replace(",", ".").replace(/[^\d.]/g, "");
  if (!sanitized) return "";

  const [rawIntegerPart = "", ...rawFractionParts] = sanitized.split(".");
  const integerPart = rawIntegerPart.slice(0, options.maxIntegerDigits);

  if (rawFractionParts.length === 0) {
    return integerPart;
  }

  if (options.maxFractionDigits === 0) {
    return integerPart;
  }

  const fractionPart = rawFractionParts.join("").slice(0, options.maxFractionDigits ?? rawFractionParts.join("").length);
  return fractionPart ? `${integerPart}.${fractionPart}` : `${integerPart}.`;
}
