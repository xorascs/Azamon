import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  avatar: string;

  @Column({ unique: true })
  login: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'text' })
  password: string;

  @Column()
  role: string;

  @Column("simple-array", { nullable: true })
  products: string[];

  @Column("simple-array", { nullable: true })
  cart: string[];

  @CreateDateColumn()  // Auto-generated timestamp for createdAt
  createdAt: Date;

  @UpdateDateColumn()  // Auto-generated timestamp for updatedAt
  updatedAt: Date;

  @Column({ nullable: true })
  refreshToken: string;
}
