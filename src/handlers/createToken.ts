import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import * as crypto from 'crypto';

// Crea una instancia de cliente de AWS S3
const s3 = new AWS.S3();

// Función para generar un token seguro
function generateToken(): string {
    const token = crypto.randomBytes(16).toString('hex');
    return token;
}

// Función para validar el número de tarjeta de crédito
function isValidCardNumber(cardNumber: string): boolean {
    // Eliminar espacios en blanco y guiones (si los hay)
    const cleanedCardNumber = cardNumber.replace(/\s|-/g, '');

    // Verificar si el número tiene entre 13 y 16 dígitos
    if (!/^\d{13,16}$/.test(cleanedCardNumber)) {
        return false;
    }

    // Algoritmo de Luhn (módulo 10)
    let sum = 0;
    let alternate = false;
    for (let i = cleanedCardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cleanedCardNumber.charAt(i), 10);
        if (alternate) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        sum += digit;
        alternate = !alternate;
    }

    return sum % 10 === 0;
}

// Manejador para la creación de tokens
export const createTokenHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    try {
        const requestBody = JSON.parse(event.body || '');

        const { card_number, cvv, expiration_month, expiration_year, email } = requestBody;
        if (!card_number || !cvv || !expiration_month || !expiration_year || !email) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Faltan parámetros requeridos en la solicitud' }),
            };
        }

        // Validaciones de tarjeta, CVV, mes y año de vencimiento aquí
        if (!isValidCardNumber(card_number)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'El número de tarjeta no es válido' }),
            };
        }

        if (cvv !== '123' && cvv !== '4532') {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'El CVV no es válido' }),
            };
        }

        const expirationMonth = parseInt(expiration_month, 10);
        if (isNaN(expirationMonth) || expirationMonth < 1 || expirationMonth > 12) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'El mes de vencimiento no es válido' }),
            };
        }

        const currentYear = new Date().getFullYear();
        const expirationYear = parseInt(expiration_year, 10);
        if (isNaN(expirationYear) || expirationYear < currentYear || expirationYear > currentYear + 5) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'El año de vencimiento no es válido' }),
            };
        }

        const token = generateToken();

        // Almacena los datos en S3 con una expiración de 15 minutos
        await s3
            .putObject({
                Bucket: 'credit-card-tokens-s3',
                Key: token,
                Body: JSON.stringify(requestBody),
                Expires: new Date(Date.now() + 900000), // 900 segundos (15 minutos)
            })
            .promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ token }),
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error interno del servidor' }),
        };
    }
};

