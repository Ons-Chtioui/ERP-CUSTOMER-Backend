import type { Response } from 'express';
import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly service;
    constructor(service: DashboardService);
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
    export(type: "dashboard" | "orders" | "invoices" | undefined, format: "csv" | "json" | undefined, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
