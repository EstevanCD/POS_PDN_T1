import { Component, Input } from '@angular/core';

/**
 * Átomo de ícono ligero basado en emojis para evitar dependencias externas
 * (font icon libs). Fácil de reemplazar por SVG sprite en el futuro.
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  template: `<span class="icon" [style.fontSize.px]="size">{{ glyph }}</span>`,
  styles: [`.icon { display: inline-flex; line-height: 1; }`],
})
export class IconComponent {
  @Input() glyph = '•';
  @Input() size = 18;
}
