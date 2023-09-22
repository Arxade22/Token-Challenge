const aws = require('aws-sdk');
const express = require('express');
const serverless = require('serverless-http');
const pg = require('pg');
const uuid = require('uuid');

const app = express();
const router = express.Router();

const { PG_HOST, PG_USER, PG_PASSWORD, PG_DATABASE, S3_BUCKET } = process.env;

const s3 = new aws.S3();

const pgPool = new pg.Pool({
    host: PG_HOST,
    user: PG_USER,
    password: PG_PASSWORD,
    database: PG_DATABASE,
    port: 5432,
});

router.post('/create-token', async (req, res) => {
    try {
        // Validar y procesar la solicitud aquí

        // Generar un token único
        const token = uuid.v4();

        // Almacenar los datos en S3
        await s3.putObject({
            Bucket: S3_BUCKET,
            Key: `${token}.json`, // Usar el token como nombre de archivo
            Body: JSON.stringify(req.body),
        }).promise();

        // Responder con el token generado
        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.use(express.json());
app.use('/.netlify/functions/app', router); // Ruta base de la función Lambda

module.exports.handler = serverless(app);
