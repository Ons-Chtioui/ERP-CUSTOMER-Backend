import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { Invoice } from '../commercial/invoices/entities/invoice.entity';
import { Quote } from '../commercial/quotes/entities/quote.entity';
import { StockAlert } from '../stock-alerts/entities/stock-alert.entity';
import { Warehouse } from '../warehouses/entities/warehouse.entity';
import { InventoryItem } from '../components/entities/inventory-item.entity';
import { OrderLine } from '../orders/entities/order-line.entity';
import { InvoiceLine } from '../commercial/invoices/entities/invoice-line.entity';
export declare class DashboardService {
    private orderRepo;
    private invoiceRepo;
    private quoteRepo;
    private alertRepo;
    private warehouseRepo;
    private invItemRepo;
    private orderLineRepo;
    private invoiceLineRepo;
    constructor(orderRepo: Repository<Order>, invoiceRepo: Repository<Invoice>, quoteRepo: Repository<Quote>, alertRepo: Repository<StockAlert>, warehouseRepo: Repository<Warehouse>, invItemRepo: Repository<InventoryItem>, orderLineRepo: Repository<OrderLine>, invoiceLineRepo: Repository<InvoiceLine>);
    getAnalytics(): Promise<{
        revenue: {
            paid: number;
            unpaid: number;
        };
        orders: {
            byStatus: {
                status: any;
                count: number;
                total: number;
            }[];
            delivered: any;
        };
        invoices: {
            byStatus: {
                status: any;
                count: number;
                total: number;
            }[];
            overdue: any;
        };
        quotes: {
            byStatus: {
                status: any;
                count: number;
            }[];
            conversionRate: number;
        };
        topProducts: {
            name: any;
            reference: any;
            quantity: number;
            revenue: number;
        }[];
        stockAlerts: {
            id: number;
            component: string;
            warehouse: string;
            quantity: number;
            threshold: number;
        }[];
        warehouses: {
            id: number;
            name: string;
            code: string;
            items: number;
            value: number;
        }[];
        monthlyRevenue: {
            month: any;
            revenue: number;
        }[];
    }>;
    exportCsv(type: 'dashboard' | 'orders' | 'invoices'): Promise<string>;
}
