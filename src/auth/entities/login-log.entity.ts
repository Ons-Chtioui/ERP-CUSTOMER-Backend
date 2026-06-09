import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
export enum LoginStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  BLOCKED = 'blocked',
}

@Entity('login_logs')
export class LoginLog {
  @PrimaryGeneratedColumn('increment')
    id!: number;

  // Nullable car on log même les tentatives avec email inconnu
  @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'user_id' })
    user!: User | null;

  @Column({ length: 191 })
    email!: string;

  @Column({ name: 'ip_address', length: 45 })
    ipAddress!: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
    userAgent!: string;

  @Column({ type: 'enum', enum: LoginStatus })
    status!: LoginStatus;

  @CreateDateColumn({ name: 'logged_at' })
    loggedAt!: Date;
}