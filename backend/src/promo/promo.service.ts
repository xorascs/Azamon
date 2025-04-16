import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { CustomResponse } from 'config';
import { CreatePromoDto } from './dto/create-promo.dto';

const ALL_PROMOCODES = 'promo:*';

@Injectable()
export class PromoService {
    constructor(
        private readonly redisService: RedisService,
    ) {}

    async getAllPromoCodes(): Promise<any[]> {
        const promoCodeKeys = await this.redisService.keys(ALL_PROMOCODES);
        if (!promoCodeKeys || promoCodeKeys.length === 0) {
            return [];
        }

        // Retrieve the data for each promo code
        const results = await Promise.all(
            promoCodeKeys.map(async (key) => {
                const promoCodeData = await this.redisService.hgetall(key);
                return {
                    name: promoCodeData.name,
                    fee: parseFloat(promoCodeData.fee),
                    activeUntil: promoCodeData.activeUntil,
                    status: promoCodeData.status,
                    amount: parseFloat(promoCodeData.amount),
                };
            })
        );

        return results;
    }

    async getPromoCodeByName(name: string): Promise<any | null> {
        const key = `promo:${name}`;
        const promoCodeData = await this.redisService.hgetall(key);

        if (promoCodeData.name === undefined) return null;

        return {
            name: promoCodeData.name,
            fee: parseFloat(promoCodeData.fee),
            activeUntil: promoCodeData.activeUntil,
            status: promoCodeData.status,
            amount: parseFloat(promoCodeData.amount),
        };
    }

    async createPromoCode(promoCodeData: CreatePromoDto): Promise<CustomResponse> {
        const { name, fee, activeUntil, amount } = promoCodeData;

        // Check if a promo code with the same name already exists
        const existingPromo = await this.getPromoCodeByName(name);
        if (existingPromo) return { response: "A promo code with this name already exists.", status: "error" };

        // Validate input data
        const activeUntilDate = new Date(activeUntil);
        const now = new Date();
        const ttlInSeconds = Math.floor((activeUntilDate.getTime() - now.getTime()) / 1000);

        if (ttlInSeconds <= 0) return { response: "Invalid date. It must be in the future.", status: "error" };
        if (amount < 1) return { response: "Invalid amount.", status: "error" };
        if (fee < 1 || fee > 100) return { response: "Invalid fee.", status: "error" };

        // Save the promo code in Redis using `promo:${name}`
        const key = `promo:${name}`;
        await this.redisService.hmset(key, {
            name,
            fee: fee.toString(),
            activeUntil,
            status: "active",
            amount: amount.toString(),
        });

        // Set expiration time for the promo code
        await this.redisService.expireAt(key, Math.floor(activeUntilDate.getTime() / 1000));

        return { response: "Promo code successfully created!", status: "success" };
    }

    async usePromoCode(name: string): Promise<any> {
        const promo = await this.getPromoCodeByName(name);
        if (!promo) {
            return { response: "Promo code not found!", status: "error" };
        }

        if (promo.amount > 1) {
            await this.redisService.hmset(`promo:${name}`, {
                amount: (parseFloat(promo.amount) - 1).toString(),
            });
        } else {
            await this.redisService.hmset(`promo:${name}`, {
                status: "used",
            });
        }

        return { response: "Promo code successfully used!", status: "success" };
    }

    async checkPromoCode(name: string): Promise<any> {
        const promo = await this.getPromoCodeByName(name);
        if (!promo) return { response: "Promo code not found!", status: "error" };

        if (promo.status === "used") return { response: "Promo code has already been used!", status: "error" };

        return { response: `Promo code for ${promo.fee}% discount!`, status: "success", fee: promo.fee, name: promo.name };
    }

    async deletePromoCode(name: string): Promise<CustomResponse> {
        const key = `promo:${name}`;
        const exists = await this.redisService.exists(key); // Check if the key exists

        if (!exists) return { response: "Promo code not found!", status: "error" };

        await this.redisService.del(key); // Delete the promo code from Redis
        return { response: "Promo code successfully deleted!", status: "success" };
    }
}