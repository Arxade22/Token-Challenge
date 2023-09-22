
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as crypto from 'crypto';
import * as redis from 'redis';

// Crea una instancia de cliente Redis
const redisClient = redis.createClient({
    host: 'localhost', // Cambia esto por la dirección de tu servidor Redis si es necesario
    port: 6379, // Puerto predeterminado de Redis
});

// Conexión a Redis
redisClient.on('connect', () => {
    console.log('Conectado a Redis');
}); 

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

        // Almacena los datos en Redis con una expiración de 15 minutos
        redisClient.setex(token, 900, JSON.stringify(requestBody));

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

// Función para generar un token seguro
function generateToken(): string {
    const token = crypto.randomBytes(16).toString('hex');
    return token;
}