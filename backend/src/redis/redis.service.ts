import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService {
    private redis: Redis;

    constructor(private readonly configService: ConfigService) {
        this.redis = new Redis({
            host: this.configService.get<string>('REDIS_HOST') as string,
            port: this.configService.get<number>('REDIS_PORT') as number,
        });
    }

    // Set a value by key
    async set(key: string, value: string | Record<any, any>): Promise<void> {
        if (typeof value === "object") {
            // Convert object to JSON string before saving
            await this.redis.set(key, JSON.stringify(value));
        } else {
            await this.redis.set(key, value);
        }
    }    

    // Get a value by key
    async get(key: string): Promise<string | null> {
        return await this.redis.get(key);
    }

    // Delete a key-value pair
    async del(key: string): Promise<void> {
        await this.redis.del(key);
    }

    // Check if a key exists
    async exists(key: string): Promise<boolean> {
        const result = await this.redis.exists(key);
        return result === 1;
    }

    // Set a key with an expiration time (in seconds)
    async setex(key: string, seconds: number, value: string | Record<any, any>): Promise<void> {
        if (typeof value === "object") {
            // Convert object to JSON string before saving
            await this.redis.setex(key, seconds, JSON.stringify(value));
        } else {
            await this.redis.setex(key, seconds, value);
        }
    }

    async expire(key: string, seconds: number): Promise<void> {
        await this.redis.expire(key, seconds);
    }

    async expireAt(key: string, time: number): Promise<void> {
        await this.redis.expireat(key, time);
    }

    // Increment a value by 1 (useful for counters)
    async incr(key: string): Promise<number> {
        return await this.redis.incr(key);
    }

    // Decrement a value by 1
    async decr(key: string): Promise<number> {
        return await this.redis.decr(key);
    }

    // Get the time to live (TTL) of a key (in seconds)
    async ttl(key: string): Promise<number> {
        return await this.redis.ttl(key);
    }

    // Set multiple key-value pairs in a single operation
    async mset(data: Record<string, string>): Promise<void> {
        const args = Object.entries(data).flat();
        await this.redis.mset(...args);
    }

    // Get multiple values by keys
    async mget(keys: string[]): Promise<(string | null)[]> {
        return await this.redis.mget(...keys);
    }

    // Get all keys matching a pattern
    async keys(pattern: string): Promise<string[]> {
        return await this.redis.keys(pattern);
    }

    // Append a value to an existing key's value (useful for strings)
    async append(key: string, value: string): Promise<number> {
        return await this.redis.append(key, value);
    }

    // Push a value to a list (LPUSH or RPUSH depending on your use case)
    async lpush(key: string, value: string): Promise<number> {
        return await this.redis.lpush(key, value);
    }

    // Get a list of values by key (LRANGE)
    async lrange(key: string, start: number, stop: number): Promise<string[]> {
        return await this.redis.lrange(key, start, stop);
    }

    // Get the length of a list (LLEN)
    async llen(key: string): Promise<number> {
        return await this.redis.llen(key);
    }

    // Remove a value from a list (LREM)
    async lrem(key: string, count: number, value: string): Promise<number> {
        return await this.redis.lrem(key, count, value);
    }

    // Add a member to a set
    async sadd(key: string, value: string): Promise<number> {
        return await this.redis.sadd(key, value);
    }

    // Get all members of a set
    async smembers(key: string): Promise<string[]> {
        return await this.redis.smembers(key);
    }

    // Remove a member from a set
    async srem(key: string, value: string): Promise<number> {
        return await this.redis.srem(key, value);
    }

    // Check if a member exists in a set
    async sismember(key: string, value: string): Promise<boolean> {
        const result = await this.redis.sismember(key, value);
        return result === 1;
    }

    // Get the length of a set
    async scard(key: string): Promise<number> {
        return await this.redis.scard(key);
    }

    // Set a field in a hash
    async hset(key: string, field: string, value: string): Promise<void> {
        await this.redis.hset(key, field, value);
    }
    
    // Set a field in a hash
    async hmset(key: string, data: Record<string, any>): Promise<void> {
        // Convert the data object into an array of alternating field-value pairs
        const flattenedData = Object.entries(data).flat();
        await this.redis.hmset(key, ...flattenedData);
    }

    // Get a field from a hash
    async hget(key: string, field: string): Promise<string | null> {
        return await this.redis.hget(key, field);
    }

    // Get all fields and values from a hash
    async hgetall(key: string): Promise<Record<string, string>> {
        return await this.redis.hgetall(key);
    }

    // Delete a field from a hash
    async hdel(key: string, field: string): Promise<void> {
        await this.redis.hdel(key, field);
    }

    // Check if a field exists in a hash
    async hexists(key: string, field: string): Promise<boolean> {
        const exists = await this.redis.hexists(key, field);
        return exists === 1;
    }

    // Increment a field value in a hash
    async hincrby(key: string, field: string, increment: number): Promise<number> {
        return await this.redis.hincrby(key, field, increment);
    }

    // Get all fields from a hash
    async hkeys(key: string): Promise<string[]> {
        return await this.redis.hkeys(key);
    }

    // Get all values from a hash
    async hvals(key: string): Promise<string[]> {
        return await this.redis.hvals(key);
    }

    // Scan a hash incrementally
    async hscan(key: string, cursor: string, pattern: string, count: number): Promise<[string, string[]]> {
        return await this.redis.hscan(key, cursor, 'MATCH', pattern, 'COUNT', count);
    }

    // Get the length of a field in a hash
    async hstrlen(key: string, field: string): Promise<number> {
        return await this.redis.hstrlen(key, field);
    }

    // Publish a message to a channel
    async publish(channel: string, message: string): Promise<number> {
        return await this.redis.publish(channel, message);
    }

    // Subscribe to a channel
    async subscribe(channel: string): Promise<void> {
        await this.redis.subscribe(channel);
    }

    // Unsubscribe from a channel
    async unsubscribe(channel: string): Promise<void> {
        await this.redis.unsubscribe(channel);
    }
}
