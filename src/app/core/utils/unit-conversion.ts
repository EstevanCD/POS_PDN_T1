type UnitGroup = 'mass' | 'volume' | 'count';

const UNIT_TO_BASE: Record<string, { group: UnitGroup; factor: number }> = {
    g: { group: 'mass', factor: 1 },
    kg: { group: 'mass', factor: 1000 },
    lb: { group: 'mass', factor: 453.592 },
    oz: { group: 'mass', factor: 28.3495 },
    ml: { group: 'volume', factor: 1 },
    l: { group: 'volume', factor: 1000 },
    unidad: { group: 'count', factor: 1 },
};

/** Convierte una cantidad entre unidades compatibles (masa, volumen o conteo) */
export function convertUnit(amount: number, fromUnit: string, toUnit: string): number {
    if (fromUnit === toUnit) return amount;

    const from = UNIT_TO_BASE[fromUnit];
    const to = UNIT_TO_BASE[toUnit];

    if (!from || !to || from.group !== to.group) {
        throw new Error(`No se puede convertir de "${fromUnit}" a "${toUnit}" (unidades incompatibles)`);
    }

    const amountInBase = amount * from.factor;
    return amountInBase / to.factor;
}

export const UNIT_OPTIONS: { value: string; label: string }[] = [
    { value: 'g', label: 'Gramos (g)' },
    { value: 'kg', label: 'Kilogramos (kg)' },
    { value: 'lb', label: 'Libras (lb)' },
    { value: 'oz', label: 'Onzas (oz)' },
    { value: 'ml', label: 'Mililitros (ml)' },
    { value: 'l', label: 'Litros (l)' },
    { value: 'unidad', label: 'Unidad' },
];