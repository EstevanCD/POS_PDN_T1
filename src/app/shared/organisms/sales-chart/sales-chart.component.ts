import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Bar {
  label: string;
  value: number;
  heightPct: number;
  x: number;
}

/**
 * Gráfico de barras simple en SVG, sin librerías externas (chart.js, etc.)
 * para mantener el bundle liviano. Ideal para el resumen mensual de ventas.
 */
@Component({
  selector: 'app-sales-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart">
      <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" preserveAspectRatio="xMidYMid meet">
        <line
          *ngFor="let g of gridLines"
          [attr.x1]="padding"
          [attr.x2]="width - padding"
          [attr.y1]="g"
          [attr.y2]="g"
          class="chart__grid"
        />
        <g *ngFor="let bar of bars">
          <rect
            [attr.x]="bar.x"
            [attr.y]="height - padding - bar.heightPct"
            [attr.width]="barWidth"
            [attr.height]="bar.heightPct"
            rx="4"
            class="chart__bar"
          />
          <text [attr.x]="bar.x + barWidth / 2" [attr.y]="height - padding + 16" class="chart__label" text-anchor="middle">
            {{ bar.label }}
          </text>
        </g>
      </svg>
      <p class="chart__empty" *ngIf="!bars.length">No hay ventas registradas en este período.</p>
    </div>
  `,
  styles: [`
    .chart { width: 100%; }
    svg { width: 100%; height: 220px; }
    .chart__grid { stroke: var(--color-border); stroke-width: 1; }
    .chart__bar { fill: var(--color-primary); }
    .chart__label { font-size: 8px; fill: var(--color-text-muted); }
    .chart__empty { color: var(--color-text-muted); text-align: center; padding: var(--space-6); font-size: var(--fs-sm); }
  `],
})
export class SalesChartComponent implements OnChanges {
  @Input() data: { day: string; total: number }[] = [];

  width = 600;
  height = 220;
  padding = 24;
  barWidth = 20;
  bars: Bar[] = [];
  gridLines: number[] = [];

  ngOnChanges() {
    if (!this.data.length) {
      this.bars = [];
      return;
    }
    const max = Math.max(...this.data.map((d) => d.total), 1);
    const usableWidth = this.width - this.padding * 2;
    const gap = this.data.length > 1 ? usableWidth / this.data.length : usableWidth;
    this.barWidth = Math.min(28, gap * 0.6);

    this.bars = this.data.map((d, i) => ({
      label: d.day.slice(8, 10),
      value: d.total,
      heightPct: (d.total / max) * (this.height - this.padding * 2),
      x: this.padding + i * gap + (gap - this.barWidth) / 2,
    }));

    this.gridLines = [0.25, 0.5, 0.75, 1].map((f) => this.height - this.padding - f * (this.height - this.padding * 2));
  }
}
