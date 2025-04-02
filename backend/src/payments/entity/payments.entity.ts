import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsNotEmpty, IsNumber, IsOptional, IsPhoneNumber, IsPostalCode, IsString, ValidateNested } from 'class-validator';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne } from 'typeorm';

export type PrivateCart = {
  id: number;
  userId: number;
  total: number;
  status: string;
  deliveryType: string;
  promo: string;
  createdAt: Date;
  updatedAt: Date;
  cartItems: PrivateCartItem[];
}
type PrivateCartItem = {
  id: number;
  cartId: number;
  productId: string;
  name: string;
  price: number | string;
  avatar: string;
  quantity: number | string;
  completed: string;
  received: string;
}

export type UserCart = {
  userId: number; 
  deliveryType: string; 
  promo?: string; 
  cartItemsIds: { productId: string; quantity: number }[]; 
};

export class UserCartDto {
  @IsNumber()
  userId: number;

  @IsString()
  deliveryType: string;

  @IsOptional()
  @IsString()
  promo?: string;

  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CartItem)
  cartItemsIds: CartItem[];
}
export class UserCartConfirmDto {
  @IsNotEmpty()
  phone: string;

  @IsNotEmpty()
  address: string;

  @IsNotEmpty()
  city: string;

  @IsNotEmpty()
  state: string;

  @IsNotEmpty()
  @IsPostalCode('any') // Validates postal code format
  postalCode: string;

  @IsNotEmpty()
  country: string;
}
export class ConfirmPaymentDto {
  @IsString()
  @IsNotEmpty()
  paymentIntentId: string;

  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;

  @ValidateNested()
  @Type(() => UserCartConfirmDto)
  customerDetails: UserCartConfirmDto;
}
class CartItem {
  @IsString()
  productId: string;

  @IsNumber()
  quantity: number;
}

@Entity('carts')
export class CartDatabase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column()
  status: string;

  @Column()
  deliveryType: string;

  @Column({ nullable: true })
  promo: string;

  @Column() 
  phone: string;

  @Column() 
  address: string;

  @Column()
  city: string;

  @Column()
  state: string;

  @Column() 
  postalCode: string;

  @Column() 
  country: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => CartItemDatabase, (cartItem) => cartItem.cart, { cascade: true })
  cartItems: CartItemDatabase[];
}

@Entity('cart_items')
export class CartItemDatabase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  cartId: number; 

  @Column()
  productId: string; 

  @Column()
  name: string; 

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number; 

  @Column({ nullable: true })
  avatar: string; 

  @Column({ default: 1 })
  quantity: number; 

  @Column({ nullable: true })
  completed: string;

  @Column({ nullable: true })
  received: string;

  @ManyToOne(() => CartDatabase, (cart) => cart.cartItems)
  cart: CartDatabase; 
}