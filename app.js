const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const mainController = require('./controllers/main-controller');

// Load .env variables
require("dotenv").config({ path: __dirname + '/./.env' });

const app = express();
const PORT = process.env.APP_PORT;

app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const dbConnection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    timezone : 'IST',

});
  
dbConnection.connect(function(err) {
    if (err) {

        console.log("Database connection error!");

    } else {

        console.log("Connected to Database!");
    }
    
});

mainController(app, dbConnection);

app.listen(PORT, () => console.log(`It's alive on http://localhost:${PORT}`));