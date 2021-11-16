const mysql = require('mysql2');
const fs = require('fs');
const bcrypt = require('bcrypt');

// Load .env variables
require("dotenv").config({ path: __dirname + '/../.env' });

// Read SQL Seed Query
const seedQuery = fs.readFileSync(__dirname + "/seed.sql", {encoding: "utf-8",});


const dbConnection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    multipleStatements: true

});
  
dbConnection.connect(function(err) {

    if (err) {

        console.log("Seeder Connection to Database error!");

    } else {

        console.log("Seeder Connected to Database Successfuly!");
        console.log("Running SQL Seed...");

        dbConnection.query(seedQuery, (err, results, fields) => {

            if (err) {
                
                console.log("SQL Seed Error!");

            } else {

                // console.log(results);

            }

            console.log("SQL Seed Completed!");

            dbConnection.end();

        });
    }
    
});