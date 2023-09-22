import * as uuid from 'uuid';
import * as aws from 'aws-sdk';
import * as pg from 'pg';

// Configuración de AWS
const s3 = new aws.S3();
const { S3_BUCKET, PG_HOST, PG_USER, PG_PASSWORD, PG_DATABASE } = process.env;

// Configuración de la base de datos PostgreSQL
const pgPool = new pg.Pool({
  host: PG_HOST,
  user: PG_USER,
  password: PG_PASSWORD,
  database: PG_DATABASE,
  port: 5432,
});

class TokenizationService {
  async createToken(cardData: any): Promise<string> {
    try {
      // Validar y procesar los datos de la tarjeta aquí
      // ...

      // Generar un token único
      const token = uuid.v4();

      // Almacenar los datos en S3
      await s3
        .putObject({
          Bucket: S3_BUCKET,
          Key: `${token}.json`, // Usar el token como nombre de archivo
          Body: JSON.stringify(cardData),
        })
        .promise();

      // Almacenar el token en la base de datos PostgreSQL (opcional)
      await pgPool.query('INSERT INTO tokens (token, card_data) VALUES ($1, $2)', [token, JSON.stringify(cardData)]);

      return token;
    } catch (error) {
      console.error('Error al crear el token:', error);
      throw new Error('Error interno del servidor');
    }
  }

  async getTokenData(token: string): Promise<any> {
    try {
      // Obtener los datos de S3
      const response = await s3.getObject({ Bucket: S3_BUCKET, Key: `${token}.json` }).promise();
      const cardData = JSON.parse(response.Body.toString());

      return cardData;
    } catch (error) {
      console.error('Error al obtener datos del token:', error);
      throw new Error('Token no encontrado o expirado');
    }
  }
}

export default new TokenizationService();
