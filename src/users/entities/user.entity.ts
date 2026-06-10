import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, ManyToMany,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  JoinColumn, JoinTable,
} from 'typeorm';
import type { Role } from '../../roles/entities/role.entity';
import { Permission } from '../../permissions/entities/permission.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ name: 'company_id', nullable: true })
  companyId!: number;

  @Column({ length: 100 })
  nom!: string;

  @Column({ length: 100 })
  prenom!: string;

  @Column({ unique: true, length: 191 })
  email!: string;

  @Column()
  password!: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'failed_attempts', default: 0 })
  failedAttempts!: number;

  @Column({ name: 'locked_until', nullable: true, type: 'timestamp' })
  lockedUntil!: Date | null;

  @Column({ name: 'email_verified_at', nullable: true, type: 'timestamp' })
  emailVerifiedAt!: Date | null;

  @Column({ name: 'last_login_at', nullable: true, type: 'timestamp' })
  lastLoginAt!: Date | null;

  @Column({ name: 'password_changed_at', nullable: true, type: 'timestamp' })
  passwordChangedAt!: Date | null;

  // String reference to break circular dependency
  @ManyToOne('Role', (role: Role) => role.users, { eager: true })
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @ManyToMany(() => Permission, { eager: true })
  @JoinTable({
    name: 'user_permissions',
    joinColumn: { name: 'user_id' },
    inverseJoinColumn: { name: 'permission_id' },
  })
  permissions!: Permission[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt!: Date;
}
