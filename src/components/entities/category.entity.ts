import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToMany, CreateDateColumn,
} from 'typeorm';
import { Component } from './component.entity';
@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('increment')
    id!: number;        
    @Column({ length: 100 })
    nom!: string;   
    @Column({ type: 'text', nullable: true })
    description!: string;       
    @OneToMany(() => Component, (component) => component.category)
    components!: Component[];
    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;
}