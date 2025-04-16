import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import Stripe from 'stripe';
import { In, Repository } from 'typeorm';
import { CartDatabase, CartItemDatabase, UserCart, PrivateCart, UserCartConfirmDto } from './entity/payments.entity';
import { UsersService } from 'src/users/users.service';
import { ProductsService } from 'src/products/products.service';
import { CustomResponse } from 'config';
import { PromoService } from 'src/promo/promo.service';
import { Roles } from 'src/users/dto/create-user.dto';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class PaymentsService {
    private stripe: Stripe;

    constructor(
        private configService: ConfigService,
        private readonly redisService: RedisService,
        @InjectRepository(CartDatabase)
        private readonly cartRepository: Repository<CartDatabase>,
        @InjectRepository(CartItemDatabase)
        private readonly cartItemRepository: Repository<CartItemDatabase>,
        private readonly usersService: UsersService,
        private readonly productsService: ProductsService,
        private readonly promoService: PromoService,
    ) {
        this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET') as string);
    }

    private async saveCartAfterPayment(payment: any): Promise<CartDatabase> {
        payment.cartItems = JSON.parse(payment.cartItems);

        const savedCart = await this.cartRepository.save(this.cartRepository.create({
            userId: payment.userId,
            total: payment.total,
            status: 'paid',
            deliveryType: payment.deliveryType,
            promo: payment.promo,
            phone: payment.phone,
            address: payment.address,
            city: payment.city,
            state: payment.state,
            postalCode: payment.postalCode,
            country: payment.country,
        }));
    
        const savedCartItems = await Promise.all(
            payment.cartItems.map((item: any) =>
                this.cartItemRepository.save(
                    this.cartItemRepository.create({
                        cartId: savedCart.id,
                        productId: item.productId,
                        name: item.name,
                        price: item.price,
                        avatar: item.avatar,
                        quantity: item.quantity,
                    }),
                ),
            ),
        );
    
        savedCart.cartItems = savedCartItems;

        // Cache the new cart in Redis with a TTL of 10 minutes
        const redisKey = `carts:${savedCart.userId}`;
        await this.redisService.del(redisKey);

        let deletedIds: string[] = [];
        for (const cartItem of savedCart.cartItems) {
            if (!deletedIds.includes(cartItem.productId)) {
                const product = await this.productsService.findOne(cartItem.productId);
                await this.redisService.del(`privateCarts:${product._source.userId}`);
                deletedIds.push(cartItem.productId);
            }
        }

        return savedCart;
    }

    async createPaymentIntent(amount: number) {
        return await this.stripe.paymentIntents.create({
            amount: amount * 100,
            currency: 'eur',
            payment_method_types: ['card'],
        });
    }

    async confirmPayment(paymentIntentId: string, paymentMethodId: string, customerDetails: UserCartConfirmDto): Promise<CustomResponse> {
        const redisPayment = await this.redisService.get(`uncompletedPaymentIntent${paymentIntentId}`);
        if (redisPayment === null) { return { status: 'error', response: "Cart data is missing." } }

        // Confirm the payment with Stripe
        const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, {
            payment_method: paymentMethodId,
        });

        if (paymentIntent.status === 'succeeded') {
            // Save the cart and its items to the database
            let payment: Record<string, any> = JSON.parse(redisPayment);
            payment = {
                ...payment,
                phone: customerDetails.phone,
                address: customerDetails.address,
                city: customerDetails.city,
                state: customerDetails.state,
                postalCode: customerDetails.postalCode,
                country: customerDetails.country,
            }
            if (payment) {
                const savedCart = await this.saveCartAfterPayment(payment);

                // Apply promo code and clear the user's cart
                if (payment.promo) {
                    await this.promoService.usePromoCode(payment.promo);
                }

                const user = await this.usersService.findOne(savedCart.userId);
                if (user) {
                    user.cart = [];
                    await this.usersService.saveUserWithRedis(user);
                }

                await this.redisService.del(`uncompletedPaymentIntent${paymentIntentId}`);
                return {
                    status: 'success',
                    response: "Payment successful!",
                };
            }

            return {
                status: 'error',
                response: "Payment succeeded, but cart data is missing.",
            };
        }

        return {
            status: 'error',
            response: "Payment error!",
        };
    }

    // Get all carts from Redis or database
    async getCarts(jwt: string, userId?: number): Promise<any> {
        const owner = await this.usersService.getUserFromJWT(jwt);
        if (userId === null && owner!.role !== Roles.ADMIN) return null;
        if (userId !== null && owner!.id !== userId && owner!.role !== Roles.ADMIN) return null;

        const redisKey = `carts:${userId || 'all'}`;

        // Step 1: Check Redis for cached carts
        if (await this.redisService.exists(redisKey)) {
            const cachedCarts = await this.redisService.get(redisKey);
            console.log(`Carts for user ${userId || 'all'} found in Redis cache.`);
            return cachedCarts; // Parse the cached JSON data
        }

        // Step 2: Fetch carts from the database
        const carts = userId
            ? await this.cartRepository.find({ where: { userId }, relations: ['cartItems'] })
            : await this.cartRepository.find({ relations: ['cartItems'] });

        // Step 3: Cache the carts in Redis with a TTL of 10 minutes
        await this.redisService.setex(redisKey, 600, carts);

        return carts;
    }

    // Get private carts from Redis or database
    async getPrivateCarts(jwt: string, userId: number): Promise<any> {
        const owner = await this.usersService.getUserFromJWT(jwt);
        const user = await this.usersService.findOne(userId);
        if (user === null || owner === null) return null;
        if (owner!.id !== userId && owner!.role !== Roles.ADMIN) return null;

        const redisKey = `privateCarts:${user.id}`;

        // Step 1: Check Redis for cached private carts
        if (await this.redisService.exists(redisKey)) {
            const cachedPrivateCarts = await this.redisService.get(redisKey);
            console.log(`Private carts for user ${user.id} found in Redis cache.`);
            return cachedPrivateCarts; // Parse the cached JSON data
        }

        // Step 2: Fetch private carts from the database
        const productIds = user.products;
        if (!productIds || productIds.length === 0) return [];

        const cartsWithProducts = await this.cartItemRepository.find({
            where: { productId: In(productIds) },
            relations: ['cart'],
        });

        const uniqueCarts = new Map<number, PrivateCart>();
        for (const cartItem of cartsWithProducts) {
            if (!uniqueCarts.has(cartItem.cart.id)) {
                uniqueCarts.set(cartItem.cart.id, cartItem.cart);
            }
        }

        const privateCarts: PrivateCart[] = [];
        for (const cart of uniqueCarts.values()) {
            const sanitizedCart: PrivateCart = {
                id: cart.id,
                userId: cart.userId,
                total: cart.total,
                status: cart.status,
                deliveryType: cart.deliveryType,
                promo: '...',
                createdAt: cart.createdAt,
                updatedAt: cart.updatedAt,
                cartItems: [],
            };

            const cartItems = await this.cartItemRepository.find({
                where: { cartId: cart.id },
            });

            for (const cartItem of cartItems) {
                if (productIds.includes(cartItem.productId)) {
                    sanitizedCart.cartItems.push({
                        id: cartItem.id,
                        cartId: cartItem.cartId,
                        productId: cartItem.productId,
                        name: cartItem.name,
                        price: cartItem.price,
                        avatar: cartItem.avatar,
                        quantity: cartItem.quantity,
                        completed: cartItem.completed,
                        received: cartItem.received,
                    });
                } else {
                    sanitizedCart.cartItems.push({
                        id: cartItem.id,
                        cartId: cartItem.cartId,
                        productId: '...',
                        name: '...',
                        price: '...',
                        avatar: '',
                        quantity: '...',
                        completed: cartItem.completed,
                        received: cartItem.received,
                    });
                }
            }

            privateCarts.push(sanitizedCart);
        }

        await this.redisService.setex(redisKey, 600, privateCarts);

        return privateCarts;
    }

    async getSuccessAndFailedOrders(userId: number): Promise<any> {
        const redisKey = `ordersData:${userId}`;
        if (await this.redisService.exists(redisKey)) {
            const cachedOrders = await this.redisService.get(redisKey);
            return this.filterSuccessAndFailedOrders(JSON.parse(cachedOrders!));
        }
    
        const products = await this.usersService.getUserItems("", userId, "products");
        if (!products || products.length === 0) {
            return { successfulOrders: 0, failedOrders: 0 }; 
        }
    
        const productIds = products.map((product: any) => product._id);
    
        const cartItems = await this.cartItemRepository.find({
            where: { productId: In(productIds) }, 
            relations: ['cart'], 
        });
    
        const uniqueCarts = new Map<number, any>();
        for (const cartItem of cartItems) {
            if (!uniqueCarts.has(cartItem.cart.id)) {
                uniqueCarts.set(cartItem.cart.id, cartItem.cart);
            }
        }
    
        const carts = Array.from(uniqueCarts.values());
    
        await this.redisService.setex(redisKey, 600, JSON.stringify(carts));
    
        return this.filterSuccessAndFailedOrders(carts);
    }
    
    private filterSuccessAndFailedOrders(carts: any[]): { successfulOrders: number; failedOrders: number } {
        // Filter successful orders (status = "received")
        const successfulOrders = carts.filter((cart: any) => cart.status === "received").length;
    
        // Filter failed orders (status = "cancelled", "lost", or "partially_lost")
        const failedOrders = carts.filter((cart: any) =>
            ["cancelled", "lost", "partially_lost"].includes(cart.status)
        ).length;
    
        return { successfulOrders, failedOrders };
    }

    async createCart(cart: UserCart): Promise<any> {
        const userExists = await this.usersService.findOne(cart.userId);
        if (!userExists) throw new Error('User does not exist');
    
        // Fetch product details for cart items
        const cartItemsData = await Promise.all(
            cart.cartItemsIds.map(async (item) => {
                const product = await this.productsService.findOne(item.productId);
                if (!product) throw new Error(`Product with ID ${item.productId} does not exist`);
                return {
                    productId: product._id,
                    name: product._source.name,
                    price: product._source.price,
                    avatar: product._source.avatar || '',
                    quantity: item.quantity,
                    completed: null,
                };
            }),
        );
    
        // Calculate total cost
        const promo = cart.promo ? await this.promoService.getPromoCodeByName(cart.promo) : undefined;
        const deliveryPrice = cart.deliveryType === "standart" ? 5 : 10;
        const allItemsCost = cartItemsData.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const total = promo && promo.status === "active"
            ? allItemsCost - (allItemsCost * promo.fee / 100) + deliveryPrice
            : allItemsCost + deliveryPrice;
    
        // Create the cart object in memory
        const newCart = {
            userId: cart.userId,
            total,
            status: 'pending',
            deliveryType: cart.deliveryType,
            promo: cart.promo,
            cartItems: JSON.stringify(cartItemsData), 
        };
    
        return newCart;
    }

    async updateCartStatusSender(jwt: string, id: number, status: "cancelled" | "sent"): Promise<{ status: string, response: string, data?: any }> {
        const user = await this.usersService.getUserFromJWT(jwt);
        if (!user) {return { status: "fail", response: "Unauthorized: Invalid or missing token." } }
    
        const cart = await this.cartRepository.findOne({
            where: { id },
            relations: ['cartItems'],
        });
    
        if (!cart) { return { status: "fail", response: "Order not found." }; }
        if (cart.status !== "paid") { return { status: 'fail', response: 'Order has already been completed!' } }

        const productIds = cart.cartItems.map(item => item.productId);
        const products: any[] = await this.productsService.findAll({ index: 'products', field: '_id', valueArray: productIds, searchType: 'terms' });
        const ownersIds: number[] = products.map(item => item._source.userId);

        if (!ownersIds.includes(user.id)) { return { status: 'error', response: 'You can not change state of order because you are not owner of any product!' } };
    
        const productMap = new Map(products.map(product => [product._id, product]));
        let deletedIds: string[] = [];
        await this.cartRepository.manager.transaction(async (transactionalEntityManager) => {
            for (const cartItem of cart.cartItems) {
                const product = productMap.get(cartItem.productId);
                if (!product || product._source.userId !== user.id || cartItem.completed !== null) {
                    continue;
                }
            
                if (!deletedIds.includes(product._source.userId)) {
                    await this.redisService.del(`privateCarts:${product._source.userId}`);
                    deletedIds.push(product._source.userId);
                }
            
                cartItem.completed = status;
                await transactionalEntityManager.save(cartItem);
            }
        });
        
        // Invalidate or update the Redis cache
        const redisKey = `carts:${cart.userId}`;

        // Invalidate the user-specific cart cache
        await this.redisService.del(redisKey);
    
        return {
            status: "success",
            response: "Order status updated successfully!",
            data: {
              cartId: cart.id,
              cartItems: cart.cartItems.map((item) => ({
                id: item.id,
                completed: item.completed,
              })),
            },
        };
    }

    async updateCartStatusReceiver(jwt: string, cartItemId: number, status: "lost" | "received") {
        const user = await this.usersService.getUserFromJWT(jwt);
        if (!user) {
            return { status: "fail", response: "Unauthorized: Invalid or missing token." };
        }
    
        const cartItem = await this.cartItemRepository.findOne({ where: { id: cartItemId } });
        if (!cartItem || cartItem.received !== null || cartItem.completed === "cancelled") {
            return { status: "fail", response: "Order item not found or its status has already been set." };
        }
    
        const cart = await this.cartRepository.findOne({
            where: { id: cartItem.cartId },
            relations: ['cartItems'], // Include related cart items
        });
        if (!cart || cart.userId !== user.id) {
            return { status: "fail", response: "Order not found or you are not its owner." };
        }

        let newStatus = cart.status;

        await this.cartRepository.manager.transaction(async (transactionalEntityManager) => {
            cartItem.received = status;
            await transactionalEntityManager.save(cartItem);

            const updatedCartItems = cart.cartItems.map((item) =>
                item.id === cartItem.id ? { ...item, received: status } : item
            );
            cart.cartItems = updatedCartItems;

            const hasCancelledItem = cart.cartItems.some((item) => item.completed === "cancelled");
            const allCompleted = cart.cartItems.every((item) => item.completed === "sent");
            const allCancelled = cart.cartItems.every((item) => item.completed === "cancelled");
            const hasIncompleteItems = cart.cartItems.some((item) => item.completed === null || item.completed === undefined);
        
            const allReceived = cart.cartItems.every((item) => item.received === "received");
            const hasLostItem = cart.cartItems.some((item) => item.received === "lost");
            const allLost = cart.cartItems.every((item) => item.received === "lost");
        
            if (hasIncompleteItems) {
                newStatus = "paid"; 
            } else if (allCancelled) {
                newStatus = "cancelled"; 
            } else if (allCompleted) {
                if (allReceived) {
                    newStatus = "received"; 
                } else if (allLost) {
                    newStatus = "lost"; 
                } else if (hasLostItem) {
                    newStatus = "partially_lost"; 
                } else {
                    newStatus = "partially_received";
                }
            } else if (hasCancelledItem) {
                if (hasLostItem) {
                    newStatus = "partially_lost"; 
                } else {
                    newStatus = "partially_received"; 
                }
            }
          
            if (newStatus !== cart.status) {
              await transactionalEntityManager
                .createQueryBuilder()
                .update(CartDatabase)
                .set({ status: newStatus })
                .where('id = :id', { id: cart.id })
                .execute();
            }
        });

        const productIds = cart.cartItems.map(item => item.productId);
        const products: any[] = await this.productsService.findAll({ index: 'products', field: '_id', valueArray: productIds, searchType: 'terms' });
        for (const product of products) {
            const redisPrivateKey = `privateCarts:${product._source.userId}`;
            await this.redisService.del(redisPrivateKey);
        }
    
        const redisKey = `carts:${cart.userId}`;
        await this.redisService.del(redisKey); 
    
        return {
            status: "success",
            response: "Order item status updated successfully!",
            data: {
                cartId: cart.id,
                cartItem: {
                    id: cartItem.id,
                    received: cartItem.received,
                },
                cartStatus: newStatus,
            },
        };
    }
}
