import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('categories')
export class Category {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    avatar: string;

    @Column({ nullable: true })
    productCount: number;

    @Column({ unique: true })
    name: string;
}