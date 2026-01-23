export interface DateFormatterOptions {
  locale?: string;
  emptyValue?: string;
}

export class DateFormatter {
  private readonly timezone: string;
  private readonly locale: string;
  private readonly emptyValue: string;

  constructor(timezone: string, options?: DateFormatterOptions) {
    this.timezone = timezone;
    this.locale = options?.locale ?? 'en-US';
    this.emptyValue = options?.emptyValue ?? '—';
  }

  /**
   * Format Unix timestamp (seconds) to localized date string
   */
  format(timestamp?: number | null): string {
    if (timestamp === undefined || timestamp === null) {
      return this.emptyValue;
    }

    const date = new Date(timestamp * 1000);
    return new Intl.DateTimeFormat(this.locale, {
      timeZone: this.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  }
}
