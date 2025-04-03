import * as jsonwebtoken from 'jsonwebtoken';

declare module 'jsonwebtoken' {
  export interface JwtPayload {
    id: string;
    [key: string]: any;
  }
} 