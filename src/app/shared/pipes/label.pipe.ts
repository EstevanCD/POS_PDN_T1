import { Pipe, PipeTransform } from '@angular/core';
import { paymentMethodLabel, roleLabel, expenseCategoryLabel, orderStatusLabel } from '../../core/utils/labels';

export type LabelKind = 'payment' | 'role' | 'expenseCategory' | 'orderStatus';

@Pipe({ name: 'appLabel', standalone: true })
export class LabelPipe implements PipeTransform {
  transform(value: string | null | undefined, kind: LabelKind): string {
    switch (kind) {
      case 'payment': return paymentMethodLabel(value);
      case 'role': return roleLabel(value);
      case 'expenseCategory': return expenseCategoryLabel(value);
      case 'orderStatus': return orderStatusLabel(value);
      default: return value ?? '—';
    }
  }
}