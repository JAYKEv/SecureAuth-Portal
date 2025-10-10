import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, Index, CreateDateColumn } from "typeorm";
import { User } from "../user/user.entity";

/**
 * Audit Log entity for tracking authentication events
 */
@Entity()
@Index(["userId", "event"])
@Index(["timestamp"])
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  public id: string;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  public user: User;

  @Column({ nullable: true })
  public userId: string;

  @Column()
  public event: string; // login, logout, refresh_token, failed_login, etc.

  @Column({ nullable: true })
  public ipAddress: string;

  @Column({ type: "text", nullable: true })
  public userAgent: string;

  @Column({ type: "jsonb", nullable: true })
  public metadata: any;

  @CreateDateColumn()
  public timestamp: Date;
}

