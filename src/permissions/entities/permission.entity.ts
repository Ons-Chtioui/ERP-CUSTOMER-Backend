import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('increment')
    id!: number;

  // Convention : "module.action" ex: "stock.edit"
  @Column({ unique: true, length: 100 })
    nom!: string;

  @Column({ length: 60 })
    module!: string;  // "Stock", "BOM", "Commandes"...

  @Column({ length: 60 })
    action!: string;  // "Consulter", "Créer", "Modifier"...

  @Column({ type: 'text', nullable: true })
    description!: string;
}