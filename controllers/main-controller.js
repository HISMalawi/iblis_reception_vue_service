const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
// Load .env variables
require("dotenv").config({ path: __dirname + "/../.env" });

module.exports = (app, dbConnection) => {
  app.post("/users/authenticate", (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    if (!username) {
      res.status(200).send({
        code: "418",
        message: "Username is required!",
        data: [],
      });
    } else if (!password) {
      res.status(200).send({
        code: "418",
        message: "User password is required!",
        data: [],
      });
    } else {
      // execute will internally call prepare and query
      dbConnection.execute(
        "SELECT * FROM `users` WHERE `email` = ? OR `username` = ?",
        [`${username}`, `${username}`],
        (err, results, fields) => {
          if (err) {
            res.status(200).send({
              code: "418",
              message: "Database user fetching error!",
              data: [],
            });
          } else {
            if (results.length > 0) {
              let user = {
                username: results[0].username,
                email: results[0].email,
                name: results[0].name,
                role: results[0].designation,
                token: "",
              };

              // Create token
              const token = jwt.sign(
                { user_id: user.email, username },
                process.env.TOKEN_KEY,
                {
                  expiresIn: process.env.TOKEN_EXPIRATION_PERIOD,
                }
              );

              user.token = token;

              // Load hash from your password DB.
              res.status(200).send({
                code: "200",
                message: "Authentication Successful!",
                data: [user],
              });
            } else {
              res.status(200).send({
                code: "418",
                message: "Authentication Unsuccessful!",
                data: [],
              });
            }
          }
        }
      );
    }
  });

  app.post("/patients/search", auth, (req, res) => {

    let searchString = req.body.value;

    dbConnection.execute(
      "SELECT * FROM `patients` WHERE `name` LIKE '%" + searchString + "%'",
      (err, results, fields) => {
        if (err) {
          res.status(200).send({
            code: "418",
            message: "Database patient fetching error!",
            data: [],
          });
        } else {
          if (results.length > 0) {
            
            res.status(200).send({
              code: "200",
              message: "Patient fetching Successful!",
              data: [results],
            });
          } else {
            res.status(200).send({
              code: "418",
              message: "No data available!",
              data: [],
            });
          }
        }
      }
    );
  });

  app.put("/patients/register", auth, (req, res) => {

    let date = new Date(); 

    let patient = req.body.patient;

    let dob_estimated = 0;

    if (patient.dob == '') {
      let yearOfBirth = date.getFullYear() - patient.age;
      patient.dob = `${yearOfBirth}` + '-06-01'; 

      dob_estimated = 1;
    }

    dbConnection.execute(
      "INSERT INTO `patients` (`patient_number`, `name`, `dob`, `dob_estimated`, `gender`, `email`, `address`, `phone_number`, `external_patient_number`) VALUES ('0', ?, ?, ?, ?, ?, ?, ?,?)",[`${patient.firstname}` + " " + `${patient.lastname}`, `${patient.dob}`, `${dob_estimated}`, `${patient.gender}`, `${patient.email}`, `${patient.physicalAddress}`, `${patient.phoneNumber}`, `${patient.externalPatientNumber}`],
      (err, results, fields) => {
        if (err) {
          
          res.status(200).send({
            code: "418",
            message: "Database patient insert error!",
            data: [],
          });
        } else {
       
            
            res.status(200).send({
              code: "200",
              message: "Patient Registered Successful!",
              data: [results],
            });
          
        }
      }
    );
  
  });

  app.post("/visit_types", auth, (req, res) => {

    dbConnection.execute(
      "SELECT * FROM `visit_types`",
      (err, results, fields) => {
        if (err) {
          res.status(200).send({
            code: "418",
            message: "Database visit types fetching error!",
            data: [],
          });
        } else {
          if (results.length > 0) {
            
            // Load hash from your password DB.
            res.status(200).send({
              code: "200",
              message: "Visit types fetching Successful!",
              data: [results],
            });
          } else {
            res.status(200).send({
              code: "418",
              message: "No data available!",
              data: [],
            });
          }
        }
      }
    );
  });

  app.post("/wards", auth, (req, res) => {

    let ward_id = req.body.id;

    dbConnection.execute(
      "SELECT  `wards`.`id`, `wards`.`name` FROM `wards` INNER JOIN `visittype_wards` ON `visittype_wards`.`ward_id` = `wards`.`id` WHERE `visittype_wards`.`visit_type_id` = ?",
      [`${ward_id}`],(err, results, fields) => {
        if (err) {
          res.status(200).send({
            code: "418",
            message: "Database patient fetching error!",
            data: [],
          });
        } else {
          if (results.length > 0) {
            
            // Load hash from your password DB.
            res.status(200).send({
              code: "200",
              message: "Patient fetching Successful!",
              data: [results],
            });
          } else {
            res.status(200).send({
              code: "418",
              message: "No data available!",
              data: [],
            });
          }
        }
      }
    );
  });

  app.post("/specimen_types", auth, (req, res) => {

    dbConnection.execute(
      "SELECT * FROM `specimen_types`",
      (err, results, fields) => {
        if (err) {
          res.status(200).send({
            code: "418",
            message: "Database specimen types fetching error!",
            data: [],
          });
        } else {
          if (results.length > 0) {
            
            // Load hash from your password DB.
            res.status(200).send({
              code: "200",
              message: "Specimen types fetching Successful!",
              data: [results],
            });
          } else {
            res.status(200).send({
              code: "418",
              message: "No data available!",
              data: [],
            });
          }
        }
      }
    );
  });

  app.post("/tests", auth, (req, res) => {

    let specimen_type_id = req.body.specimen_type_id;

    dbConnection.execute(
      "SELECT `test_types`.`id`, `test_types`.`name`, `test_types`.`short_name`,`test_types`.`description`,`test_types`.`test_category_id`,`test_types`.`targetTAT`, `test_types`.`orderable_test`, `test_types`.`prevalence_threshold`, `test_types`.`accredited`, `test_types`.`print_device` FROM `test_types` INNER JOIN `testtype_specimentypes` ON `test_types`.`id` = `testtype_specimentypes`.`test_type_id` WHERE `testtype_specimentypes`.`specimen_type_id` = ?",
      [`${specimen_type_id}`],(err, results, fields) => {
        if (err) {
          res.status(200).send({
            code: "418",
            message: "Database patient fetching error!",
            data: [],
          });
        } else {
          if (results.length > 0) {
            
            // Load hash from your password DB.
            res.status(200).send({
              code: "200",
              message: "Patient fetching Successful!",
              data: [results],
            });
          } else {
            res.status(200).send({
              code: "418",
              message: "No data available!",
              data: [],
            });
          }
        }
      }
    );
  });

};