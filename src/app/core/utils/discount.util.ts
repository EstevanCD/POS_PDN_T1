export type DiscountType = 'percentage' | 'fixed';

export interface Discount {
    type: DiscountType;
    value: number;
    reason: string;
}

/** Calcula cuánto se descuenta de un subtotal, sin pasarse del subtotal disponible */
export function calculateDiscountAmount(subtotal: number, discount: Discount | null | undefined): number {
    if (!discount || !discount.value || discount.value <= 0) return 0;
    const amount = discount.type === 'percentage' ? (subtotal * discount.value) / 100 : discount.value;
    return Math.min(Math.max(amount, 0), subtotal);
}