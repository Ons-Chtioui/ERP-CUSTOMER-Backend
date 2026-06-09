import { Component } from './component.entity';
export declare class Category {
    id: number;
    nom: string;
    description: string;
    components: Component[];
    createdAt: Date;
}
