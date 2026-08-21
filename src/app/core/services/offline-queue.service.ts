import { Injectable, signal } from '@angular/core';
import { Order } from '../models/order.model';

const STORAGE_KEY = 'pos_offline_orders_queue';

@Injectable({ providedIn: 'root' })
export class OfflineQueueService {
    pendingCount = signal(0);
    isOnline = signal(navigator.onLine);

    constructor() {
        window.addEventListener('online', () => this.isOnline.set(true));
        window.addEventListener('offline', () => this.isOnline.set(false));
        this.refreshCount();
    }

    private getQueue(): Order[] {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    private setQueue(orders: Order[]) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
        this.refreshCount();
    }

    private refreshCount() {
        this.pendingCount.set(this.getQueue().length);
    }

    enqueue(order: Order) {
        const queue = this.getQueue();
        queue.push({ ...order, id: `offline-${Date.now()}-${Math.random().toString(36).slice(2)}` });
        this.setQueue(queue);
    }

    getAll(): Order[] {
        return this.getQueue();
    }

    removeFirst() {
        const queue = this.getQueue();
        queue.shift();
        this.setQueue(queue);
    }
}