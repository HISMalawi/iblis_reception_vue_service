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
      dbConnection.query(
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
                id: results[0].id,
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

    dbConnection.query(
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

    if (patient.dob == "") {
      let yearOfBirth = date.getFullYear() - patient.age;
      patient.dob = `${yearOfBirth}` + "-06-01";

      dob_estimated = 1;
    }

    dbConnection.query(
      "INSERT INTO `patients` (`patient_number`, `name`, `dob`, `dob_estimated`, `gender`, `email`, `address`, `phone_number`, `external_patient_number`) VALUES ('0', ?, ?, ?, ?, ?, ?, ?,?)",
      [
        `${patient.firstname}` + " " + `${patient.lastname}`,
        `${patient.dob}`,
        `${dob_estimated}`,
        `${patient.gender}`,
        `${patient.email}`,
        `${patient.physicalAddress}`,
        `${patient.phoneNumber}`,
        `${patient.externalPatientNumber}`,
      ],
      (err, results, fields) => {
        if (err) {
          res.status(200).send({
            code: "418",
            message: "Database patient insert error!",
            data: [],
          });
        } else {

          AddPatientNumber(results.insertId);
          
        }
      }
    );

    function AddPatientNumber(patient_id) {

      dbConnection.query(
        "UPDATE `patients` SET `patient_number` = ? WHERE (`id` = ?)",
        [
          `${patient_id}`,
          `${patient_id}`
        ],
        (err, results, fields) => {
          if (err) {
            res.status(200).send({
              code: "418",
              message: "Database add patient number insert error!",
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
      
    }
  });

  app.post("/visit_types", auth, (req, res) => {
    dbConnection.query(
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

    dbConnection.query(
      "SELECT  `wards`.`id`, `wards`.`name` FROM `wards` INNER JOIN `visittype_wards` ON `visittype_wards`.`ward_id` = `wards`.`id` WHERE `visittype_wards`.`visit_type_id` = ?",
      [`${ward_id}`],
      (err, results, fields) => {
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
    dbConnection.query(
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

    dbConnection.query(
      "SELECT `test_types`.`id`, `test_types`.`name`, `test_types`.`short_name`,`test_types`.`description`,`test_types`.`test_category_id`,`test_types`.`targetTAT`, `test_types`.`orderable_test`, `test_types`.`prevalence_threshold`, `test_types`.`accredited`, `test_types`.`print_device` FROM `test_types` INNER JOIN `testtype_specimentypes` ON `test_types`.`id` = `testtype_specimentypes`.`test_type_id` WHERE `testtype_specimentypes`.`specimen_type_id` = ?",
      [`${specimen_type_id}`],
      (err, results, fields) => {
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

  app.put("/orders/create", auth, (req, res) => {
    let now = new Date()
      .toISOString()
      .replace(/T/, " ") // replace T with a space
      .replace(/\..+/, "");

    let order = req.body.order;

    let visit_type_id = order.visit_type_id;
    let requesting_location_id = order.requesting_location_id;
    let requesting_physician = order.requesting_physician;
    let specimen_type_id = order.specimen_type_id;
    let tests = order.tests;
    let patient = order.patient;
    let user = order.user;

    dbConnection.query(
      "INSERT INTO `specimens` (`specimen_type_id`, `accession_number`, `tracking_number`, `priority`, `specimen_status_id`, `accepted_by`, `rejected_by`, `date_of_collection`) VALUES (?,?,?,?,?,?,?,?)",
      [
        `${specimen_type_id}`,
        "UFC2100000000",
        "XUFC2100000000",
        "Routine",
        1,
        `${user.id}`,
        0,
        `${now}`,
      ],
      (err, results, fields) => {
        if (err) {
          res.status(200).send({
            code: "418",
            message: "Database Specimen insert error!",
            data: [],
          });
        } else {

          InsertTests(results.insertId);

        }
      }
    );

    function InsertVisit(params) {
      
    }

    function InsertTests(visit_id) {

      let orders = [];

     

      tests.forEach(test => {
       
          orders.push([
            `${visit_id}`,
            `${test.id}`,
            `${specimen_type_id}`,
            2,
            `${user.id}`,
            `${user.id}`,
            `${user.id}`,
            `${requesting_physician}`,
            `${now}`,
            "null",
            "null",
          ]);

      });

      
      let sql = 'INSERT INTO `tests` (`visit_id`, `test_type_id`, `specimen_id`, `test_status_id`, `created_by`, `tested_by`, `verified_by`, `requested_by`, `time_created`, `not_done_reasons`, `person_talked_to_for_not_done`) VALUES ?';

      dbConnection.query(
        sql,
        [orders],
        (err, results, fields) => {
          if (err) {

            console.log(err);

            res.status(200).send({
              code: "418",
              message: "Database Test insert error!",
              data: [],
            });    

          } else {

            res.status(200).send({
              code: "200",
              message: "Order added Successful!",
              data: [],
            });

          }
          
        }
      );
      
      
      // tests.forEach(test => {
       

      //   dbConnection.execute(
      //     "INSERT INTO `tests` (`visit_id`, `test_type_id`, `specimen_id`, `test_status_id`, `created_by`, `tested_by`, `verified_by`, `requested_by`, `time_created`, `not_done_reasons`, `person_talked_to_for_not_done`) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
      //     [
      //       `${visit_id}`,
      //       `${test.id}`,
      //       `${specimen_type_id}`,
      //       2,
      //       `${user.id}`,
      //       `${user.id}`,
      //       `${user.id}`,
      //       `${requesting_physician}`,
      //       `${now}`,
      //       "null",
      //       "null",
      //     ],
      //     (err, results, fields) => {
      //       if (err) {

      //         errors = true;
      //         return;

      //         res.status(200).send({
      //           code: "418",
      //           message: "Database Test insert error!",
      //           data: [],
      //         });    

      //       } else {

      //         res.status(200).send({
      //           code: "200",
      //           message: "Order added Successful!",
      //           data: [],
      //         });

      //       }
            
      //     }
      //   );

      //   console.log(errors);

      // });


    }
  });
};
