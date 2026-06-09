import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToMany, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Component } from './component.entity';
@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn('increment')
    id!: number;
    @Column({ length: 150 })
    nom!: string;   
    @Column({ length:30, nullable: true })
    code!: string;
    @Column({ length: 191, nullable: true })
    email!: string;
    @Column({ length: 30, nullable: true })
    telephone!: string  ;
    @Column({ type:'text', nullable: true })
    adresse!: string;
    @Column({ length: 60, nullable: true })
    pays!: string;
    @Column({ name: 'is_active', default: true })
    isActive!: boolean;
    @OneToMany(() => Component, (component) => component.supplier)
    components!: Component[]    ;       
    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;   
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;               
}