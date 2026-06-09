import { Component } from './component.entity';
export declare class Supplier {
    id: number;
    nom: string;
    code: string;
    email: string;
    telephone: string;
    adresse: string;
    pays: string;
    isActive: boolean;
    components: Component[];
    createdAt: Date;
    updatedAt: Date;
}
