import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToMany, ManyToMany, JoinTable, CreateDateColumn,
} from 'typeorm';
import type { User } from '../../users/entities/user.entity';
import { Permission } from '../../permissions/entities/permission.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ unique: true, length: 80 })
  nom!: string;

  @Column({ length: 100 })
  label!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  // Lazy reference to User via string to break circular dependency
  @OneToMany('User', (user: User) => user.role)
  users!: User[];

  @ManyToMany(() => Permission, { eager: true })
  @JoinTable({
    name: 'role_permission',
    joinColumn: { name: 'role_id' },
    inverseJoinColumn: { name: 'permission_id' },
  })
  permissions!: Permission[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
