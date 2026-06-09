import { Permission } from 'src/permissions/entities/permission.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToMany, ManyToMany, JoinTable, CreateDateColumn,
} from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('increment')
    id!: number;

  @Column({ unique: true, length: 80 })
    nom!: string;   // slug : "super_admin", "admin", etc.

  @Column({ length: 100 })
    label!: string; // lisible : "Super Admin", "Admin Société"

  @Column({ type: 'text', nullable: true })
    description!: string;

  @OneToMany(() => User, (user) => user.role)
    users!: User[];

  // Permissions par défaut du rôle
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