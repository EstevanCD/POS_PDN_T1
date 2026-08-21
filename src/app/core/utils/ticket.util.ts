import { Order } from '../models/order.model';
import { paymentMethodLabel } from './labels';

export function buildTicketText(order: Order, cafeName: string, fmt: (n: number) => string): string {
    const lines: string[] = [];
    lines.push(cafeName);
    lines.push('-----------------------------');
    lines.push(`Orden #${order.order_number ?? ''}`);
    lines.push(new Date(order.created_at ?? Date.now()).toLocaleString());
    lines.push('-----------------------------');
    order.items.forEach((it) => lines.push(`${it.quantity}x ${it.product_name}  ${fmt(it.subtotal)}`));
    lines.push('-----------------------------');
    lines.push(`TOTAL: ${fmt(order.total)}`);
    lines.push(`Pago: ${paymentMethodLabel(order.payment_method)}`);
    lines.push('-----------------------------');
    lines.push('¡Gracias por tu compra!');
    return lines.join('\n');
}

export function buildTicketHtml(order: Order, cafeName: string, fmt: (n: number) => string): string {
    const rows = order.items
        .map((it) => `<tr><td>${it.quantity}x ${it.product_name}</td><td style="text-align:right">${fmt(it.subtotal)}</td></tr>`)
        .join('');
    return `<html><head><meta charset="utf-8"/><title>Ticket</title>
    <style>
      body { font-family: monospace; width: 280px; margin: 0 auto; padding: 16px; }
      h2 { text-align: center; margin: 0 0 8px; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      td { padding: 2px 0; }
      hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
      .total { font-weight: bold; font-size: 15px; }
      .center { text-align: center; }
    </style></head>
    <body>
      <h2>${cafeName}</h2>
      <p class="center">Orden #${order.order_number ?? ''}<br/>${new Date(order.created_at ?? Date.now()).toLocaleString()}</p>
      <hr/><table>${rows}</table><hr/>
      <table><tr class="total"><td>TOTAL</td><td style="text-align:right">${fmt(order.total)}</td></tr></table>
      <p class="center">Pago: ${paymentMethodLabel(order.payment_method)}</p><hr/>
      <p class="center">¡Gracias por tu compra!</p>
    </body></html>`;
}

export function printTicket(html: string) {
    const win = window.open('', '_blank', 'width=320,height=600');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 250);
}

export function whatsappShareUrl(text: string, phone?: string): string {
    const encoded = encodeURIComponent(text);
    return phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}

export function emailShareUrl(subject: string, text: string, email?: string): string {
    const params = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    return `mailto:${email ?? ''}?${params}`;
}