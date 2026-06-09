import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
@Entity('password_resets')
export class PasswordReset {
  @PrimaryGeneratedColumn('increment')
    id!: number;

  @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user!: User;

  @Column({ unique: true, length: 255 })
    token!: string;  // UUID hashé

  @Column({ name: 'expires_at', type: 'timestamp' })
    expiresAt!: Date;

  @Column({ name: 'used_at', nullable: true, type: 'timestamp' })
    usedAt!: Date | null;

  @Column({ default: 0 })
    attempts!: number;

  @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;
}