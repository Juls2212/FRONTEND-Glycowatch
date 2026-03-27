const FALLBACK_TIMEZONES = [
  "UTC",
  "America/Bogota",
  "America/Mexico_City",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/Madrid",
  "Europe/London"
];

function getBrowserTimezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

export function getTimezoneOptions(): string[] {
  const intlApi = Intl as unknown as { supportedValuesOf?: (key: string) => string[] };
  const fromIntl = intlApi.supportedValuesOf ? intlApi.supportedValuesOf("timeZone") : [];
  const browserTimezone = getBrowserTimezone();
  const all = new Set<string>([...(browserTimezone ? [browserTimezone] : []), ...FALLBACK_TIMEZONES, ...fromIntl]);
  return Array.from(all);
}

export function getBrowserTimezoneOrDefault(): string {
  return getBrowserTimezone() ?? "UTC";
}

export function formatTimezoneLabel(timezone: string): string {
  return timezone.replaceAll("_", " ");
}

