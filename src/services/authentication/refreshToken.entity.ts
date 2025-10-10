import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, Index, CreateDateColumn } from "typeorm";
import { User } from "../user/user.entity";

/**
 * Refresh Token entity for token rotation
 */
@Entity()
@Index(["token"], { unique: true })
export class RefreshToken {
  @PrimaryGeneratedColumn("uuid")
  public id: string;

  @Column({ type: "text", unique: true })
  public token: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  public user: User;

  @Column()
  public userId: string;

  @Column({ type: "timestamp" })
  public expiresAt: Date;

  @CreateDateColumn()
  public createdAt: Date;

  @Column({ default: false })
  public revoked: boolean;
}

