import type { Response } from 'express';
import { DocumentsService } from './documents.service';
export declare class DocumentsController {
    private readonly service;
    constructor(service: DocumentsService);
    private streamPdf;
    quotePdf(id: number, res: Response): Promise<void>;
    sendQuote(id: number): Promise<import("../commercial/quotes/entities/quote.entity").Quote>;
    invoicePdf(id: number, res: Response): Promise<void>;
    sendInvoice(id: number): Promise<import("../commercial/invoices/entities/invoice.entity").Invoice>;
    deliveryPdf(id: number, res: Response): Promise<void>;
    orderPdf(id: number, res: Response): Promise<void>;
    inventoryPdf(id: number, res: Response): Promise<void>;
}
