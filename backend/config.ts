import { randomBytes } from "crypto";

export interface CustomResponse {
    status: string;
    response: string;
}

export function generateRandomId(): string {
    return randomBytes(16).toString('hex');
}