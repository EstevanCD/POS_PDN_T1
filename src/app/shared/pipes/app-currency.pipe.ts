import { Pipe, PipeTransform, inject } from '@angular/core';
import { SettingsService, CurrencyCode } from '../../core/services/settings.service';

const LOCALE_MAP: Record<CurrencyCode, string> = {
    COP: 'es-CO',
    USD: 'en-US',
    EUR: 'es-ES',
};

@Pipe({ name: 'appCurrency', standalone: true, pure: false })
export class AppCurrencyPipe implements PipeTransform {
    private settings = inject(SettingsService);

    transform(value: number | null | undefined): string {
        if (value === null || value === undefined) return '';
        const currency = this.settings.currency();
        const locale = LOCALE_MAP[currency];
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            minimumFractionDigits: currency === 'COP' ? 0 : 2,
            maximumFractionDigits: currency === 'COP' ? 0 : 2,
        }).format(value);
    }
}