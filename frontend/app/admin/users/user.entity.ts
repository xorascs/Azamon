export type User = {
  id: number;
  avatar: string;
  login: string;
  email: string;
  password: string;
  role: string;
  products: any[];
  cart: any[];
  createdAt: string;
  updatedAt: string;
  refreshToken: string;
}
