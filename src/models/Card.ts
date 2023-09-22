// Card.ts

export interface Card {
    cardNumber: string;
    cvv: string;
    expirationMonth: number;
    expirationYear: number;
    email: string;
    token: string;
    createdAt: Date;
    updatedAt: Date;
    expirationTime: Date;
  }
  
  export const createCard = (
    cardNumber: string,
    cvv: string,
    expirationMonth: number,
    expirationYear: number,
    email: string,
    token: string,
    createdAt: Date,
    updatedAt: Date,
    expirationTime: Date
  ): Card => ({
    cardNumber,
    cvv,
    expirationMonth,
    expirationYear,
    email,
    token,
    createdAt,
    updatedAt,
    expirationTime,
  });
  
//   Ejemplo de uso:
//   const card = 
//   createCard('1234567890123456',
//    '123',
//     12, 
//     2025, 
//     'example@gmail.com', 
//     '0ae8dW2FpEAZlxlz',
//      new Date(), 
//      new Date(), 
//      new Date());
  