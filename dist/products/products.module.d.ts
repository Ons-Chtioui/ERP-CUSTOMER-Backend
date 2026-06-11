import { OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ProductsService } from './products.service';
export declare class ProductsModule implements OnModuleInit {
    private readonly moduleRef;
    private readonly productsService;
    constructor(moduleRef: ModuleRef, productsService: ProductsService);
    onModuleInit(): void;
}
