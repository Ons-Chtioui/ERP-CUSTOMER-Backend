
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn('increment')
  declare id: string;

  @Column({ unique: true })
  declare code: string;

  @Column({ length: 150 })
  declare name: string;

  @Column({ type: 'varchar', length: 191, nullable: true })
  declare email: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  declare phone: string | null;

  @Column({ type: 'text', nullable: true })
  declare address: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  declare city: string | null;

  @Column({ type: 'varchar', length: 60, default: 'Tunisie' })
  declare country: string;

  @Column({ name: 'tva_number', type: 'varchar', length: 50, nullable: true })
  declare tvaNumber: string | null;

  @Column({ name: 'is_active', default: true })
  declare isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  declare updatedAt: Date;
}