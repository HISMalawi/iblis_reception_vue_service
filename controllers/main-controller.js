const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
// Load .env variables
require("dotenv").config({ path: __dirname + "/../.env" });

module.exports = (app, dbConnection, FACILITY_CODE) => {
  function padLeadingZeros(num, size) {
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
  }

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
        [`${patient_id}`, `${patient_id}`],
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

  app.post("/all_wards", (req, res) => {
    dbConnection.query(
      "SELECT  `id`, `name` FROM `wards`",
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
              message: "Location fetching Successful!",
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

  app.post("/ward/orders", auth, (req, res) => {
    let ward = req.body.ward;

    let fromDate = new Date(req.body.from)
    .toISOString()
    .replace(/T/, " ") // replace T with a space
    .replace(/\..+/, "");

    let toDateBefore = new Date(req.body.to)
    
    toDateBefore.setDate(toDateBefore.getDate() + 1);

    let toDate = new Date(toDateBefore)
    .toISOString()
    .replace(/T/, " ") // replace T with a space
    .replace(/\..+/, "");

    let visit_ids = [];

    let tests = [];

    let tests_with_results = [];

    let tests_with_details = [];

    let specimens = [];

    let specimen_ids = [];

    let patients = [];

    dbConnection.query(
      "SELECT  `id`, `patient_id` FROM `visits` WHERE `ward_or_location` = ? AND `created_at` BETWEEN ? AND ?",
      [`${ward}`, `${fromDate}`, `${toDate}`],
      (err, results, fields) => {
        if (err) {
          res.status(200).send({
            code: "418",
            message: "Database visit fetching error!",
            data: [],
          });
        } else {
          if (results.length > 0) {

            for (let index = 0; index < results.length; index++) {
             let element = results[index];

              visit_ids.push(element.id);

              let patient_details = {
                "id": element.patient_id,
                "visit_id": element.id
              }

              patients.push(patient_details);

              if (index + 1 == results.length) {

                // console.log("visits: "+ visit_ids.length);

                GetTests();
                
              } 
             
            }

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

    function GetTests() {

      for (let index = 0; index < visit_ids.length; index++) {
        const element = visit_ids[index];
       
        dbConnection.query(
          "SELECT * FROM `tests` WHERE `visit_id` = ?",
          [
            `${element}`
          ],
          (err, results, fields) => {
            if (err) {
  
              res.status(200).send({
                code: "418",
                message: "Database tests fetching error!",
                data: [],
              });
            } else {

              for (let index = 0; index < results.length; index++) {

                

                tests.push(results[index]);

                if (!specimen_ids.includes(results[index].specimen_id)) {
                  
                  specimen_ids.push(results[index].specimen_id);

                } 

                patients.forEach(patient => {

                  if (patient.visit_id == results[index].visit_id) {
                    patient.specimen_id = results[index].specimen_id;
                  }
                  
                });
                
              }

              if (index + 1 == visit_ids.length) {


                GetPatient();  

              }  
  
            }
          }
        );
        
      }
  
    }

    function GetPatient() {

      patients.forEach((patient, index) => {

        dbConnection.query(
          "SELECT * FROM `patients` WHERE `id` = ?",
          [`${patient.id}`],
          (err, results, fields) => {
            if (err) {
              

            } else {

              if (results.length > 0) {

                patient.name = results[0].name;

                patient.gender = results[0].gender;

                if (index + 1 == results.length) {

                  GetTestsWithResults();
                  
                }
  
              }

            }
          }
        );


        
      });  
      
    }

    function GetTestsWithResults() {

      for (let index = 0; index < tests.length; index++) {
        const element = tests[index].id;

        dbConnection.query(
          "SELECT `test_results`.`id`, `test_results`.`measure_id` AS `specimen_id`, `measures`.`name` AS `measure_name`, `test_results`.`result`,`test_results`.`device_name`, `test_results`.`time_entered` FROM `test_results`, `measures` WHERE `test_results`.`test_id` = ? AND `measures`.`id` = `test_results`.`measure_id` AND `test_results`.`result` <> '' ",
          [
            `${element}`
          ],
          (err, results, fields) => {
            if (err) {
  
              res.status(200).send({
                code: "418",
                message: "Database tests fetching error!",
                data: [],
              });
            } else {

              if (results.length > 0) {

                tests_with_results.push(tests[index]);
                
              }

              if (index + 1 == tests.length) {

                
                // console.log("tests with results: "+ tests_with_results.length);

                GetTestsWithDetails();
                
              }  
  
            }
          }
        );
        
      }
  
    }
    function GetTestsWithDetails() {

      for (let index = 0; index < specimen_ids.length; index++) {
        const element = specimen_ids[index];
       
        dbConnection.query(
          "SELECT `tests`.`id`,`test_types`.`short_name` , `test_types`.`name` AS `test_name`,`tests`.`visit_id`, `tests`.`test_type_id`, `tests`.`specimen_id`, `tests`.`interpretation`, `tests`.`test_status_id`, `tests`.`created_by`, `tests`.`tested_by`, `tests`.`verified_by`, `tests`.`requested_by`, `tests`.`time_created`, `tests`.`time_started`, `tests`.`time_completed`, `tests`.`time_verified`, `tests`.`panel_id`, `tests`.`time_sent`, `tests`.`external_id`, `tests`.`not_done_reasons`, `tests`.`person_talked_to_for_not_done` FROM `tests`, `test_types` WHERE `specimen_id` = ? AND `tests`.`test_type_id` = `test_types`.`id`",
          [
            `${element}`
          ],
          (err, results, fields) => {
            if (err) {
  
              res.status(200).send({
                code: "418",
                message: "Database tests fetching error!",
                data: [],
              });
            } else {

              for (let index = 0; index < results.length; index++) {

                

                tests_with_details.push(results[index]);
                
              }

              if (index + 1 == specimen_ids.length) {


                GetSpecimes(); 

              }  
  
            }
          }
        );
        
      }
      
    }

    function GetSpecimes() {

      tests.sort().reverse();
      specimen_ids.sort().reverse();

      for (let index = 0; index < specimen_ids.length; index++) {
        const element = specimen_ids[index];
        
        dbConnection.query(
          "SELECT `specimens`.`id`, `specimen_types`.`name` AS `specimen_type`, `specimens`.`accession_number`, `specimens`.`tracking_number`, `specimens`.`priority` , `specimens`.`drawn_by_id`, `specimens`.`drawn_by_name`, `specimens`.`specimen_status_id` , `specimens`.`rejected_by`, `specimens`.`rejection_reason_id`, `specimens`.`reject_explained_to`, `specimens`.`referral_id`, `specimens`.`time_accepted`, `specimens`.`time_rejected`, `specimens`.`date_of_collection` FROM `specimens`, `specimen_types` WHERE `specimens`.`id` = ? AND `specimen_types`.`id` = `specimens`.`specimen_type_id`",
          [
            `${element}`
          ],
          (err, results, fields) => {
            if (err) {
  
              res.status(200).send({
                code: "418",
                message: "Database specimens fetching error!",
                data: [],
              });
            } else {
              
              if (results.length > 0) {

                specimens.push(results[0]);
                
              }

              if (index + 1 == specimen_ids.length) {

                // console.log("specimens: "+ specimen_ids.length);

                let data = {
                  "specimens":specimens,
                  "tests_with_results": tests_with_results,
                  "tests_with_details":tests_with_details,
                  "patients":patients
                }

                res.status(200).send({
                  code: "200",
                  message: "Order fetch successful!",
                  data: data,
                });
                
              }  
  
            }
          }
        );
        
      }
      

    }
  });
  app.post("/patient/orders", auth, (req, res) => {

    let id = req.body.patient_id;

    let visit_ids = [];

    let tests = [];

    let tests_with_results = [];

    let specimens = [];

    let specimen_ids = [];

    dbConnection.query(
      "SELECT  `id` FROM `visits` WHERE `patient_id` = ?",
      [`${id}`],
      (err, results, fields) => {
        if (err) {
          res.status(200).send({
            code: "418",
            message: "Database visit fetching error!",
            data: [],
          });
        } else {
          if (results.length > 0) {

            for (let index = 0; index < results.length; index++) {
             let element = results[index];

              visit_ids.push(element.id);

              if (index + 1 == results.length) {

                // console.log("visits: "+ visit_ids.length);

                GetTests();
                
              } 
             
            }

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

    function GetTests() {

      for (let index = 0; index < visit_ids.length; index++) {
        const element = visit_ids[index];
       
        dbConnection.query(
          "SELECT * FROM `tests` WHERE `visit_id` = ?",
          [
            `${element}`
          ],
          (err, results, fields) => {
            if (err) {
  
              res.status(200).send({
                code: "418",
                message: "Database tests fetching error!",
                data: [],
              });
            } else {

              for (let index = 0; index < results.length; index++) {

                

                tests.push(results[index]);

                if (!specimen_ids.includes(results[index].specimen_id)) {
                  
                  specimen_ids.push(results[index].specimen_id);

                }
                
              }

              if (index + 1 == visit_ids.length) {


                GetTestsWithResults();  

              }  
  
            }
          }
        );
        
      }
  
    }

    function GetTestsWithResults() {

      for (let index = 0; index < tests.length; index++) {
        const element = tests[index].id;

        dbConnection.query(
          "SELECT `test_results`.`id`, `test_results`.`measure_id` AS `specimen_id`, `measures`.`name` AS `measure_name`, `test_results`.`result`,`test_results`.`device_name`, `test_results`.`time_entered` FROM `test_results`, `measures` WHERE `test_results`.`test_id` = ? AND `measures`.`id` = `test_results`.`measure_id` AND `test_results`.`result` <> '' ",
          [
            `${element}`
          ],
          (err, results, fields) => {
            if (err) {
  
              res.status(200).send({
                code: "418",
                message: "Database tests fetching error!",
                data: [],
              });
            } else {

              if (results.length > 0) {

                tests_with_results.push(tests[index]);
                
              }

              if (index + 1 == tests.length) {

                GetSpecimes(); 
                
              }  
  
            }
          }
        );
        
      }
  
    }

    function GetSpecimes() {

      tests.sort().reverse();
      specimen_ids.sort().reverse();

      for (let index = 0; index < specimen_ids.length; index++) {
        const element = specimen_ids[index];
        
        dbConnection.query(
          "SELECT `specimens`.`id`, `specimen_types`.`name` AS `specimen_type`, `specimens`.`accession_number`, `specimens`.`tracking_number`, `specimens`.`priority` , `specimens`.`drawn_by_id`, `specimens`.`drawn_by_name`, `specimens`.`specimen_status_id` , `specimens`.`rejected_by`, `specimens`.`rejection_reason_id`, `specimens`.`reject_explained_to`, `specimens`.`referral_id`, `specimens`.`time_accepted`, `specimens`.`time_rejected`, `specimens`.`date_of_collection` FROM `specimens`, `specimen_types` WHERE `specimens`.`id` = ? AND `specimen_types`.`id` = `specimens`.`specimen_type_id`",
          [
            `${element}`
          ],
          (err, results, fields) => {
            if (err) {
  
              res.status(200).send({
                code: "418",
                message: "Database specimens fetching error!",
                data: [],
              });
            } else {
              
              if (results.length > 0) {

                specimens.push(results[0]);
                
              }

              if (index + 1 == specimen_ids.length) {

                // console.log("specimens: "+ specimen_ids.length);

                let data = {
                  "specimens":specimens,
                  "tests_with_results": tests_with_results
                }

                res.status(200).send({
                  code: "200",
                  message: "Order fetch successful!",
                  data: data,
                });
                
              }  
  
            }
          }
        );
        
      }
      

    }
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

    let date = new Date();

    let year = date.getFullYear().toString().substring(2);

    let record;
    let max_acc_num;
    let sentinel = 99999999;

    let order = req.body.order;

    let visit_type = order.visit_type;
    let requesting_location = order.requesting_location;
    let requesting_physician = order.requesting_physician;
    let specimen_type_id = order.specimen_type_id;
    let tests = order.tests;
    let patient = order.patient;
    let user = order.user;

    let accession_number = "";

    dbConnection.query(
      "SELECT * FROM `specimens`  WHERE `accession_number` IS NOT NULL ORDER BY `id` DESC LIMIT 1",
      (err, results, fields) => {
        if (err) {
        } else {
          if (results.length > 0) {
            record = results[0];

            max_acc_num = Number(
              record.accession_number.substring(
                record.accession_number.length - 8
              )
            );

            if (max_acc_num < sentinel) {
              max_acc_num += 1;
            } else {
              max_acc_num = 1;
            }
          } else {
            max_acc_num = 1;
          }

          accession_number =
            FACILITY_CODE + year + padLeadingZeros(max_acc_num, 8);

          InsertVisit();
        }
      }
    );

    function InsertVisit() {
      dbConnection.query(
        "INSERT INTO `visits` (`patient_id`, `visit_type`, `ward_or_location`, `created_at`, `updated_at`) VALUES (?,?,?,?,?)",
        [
          `${patient.id}`,
          `${visit_type.name}`,
          `${requesting_location.name}`,
          `${now}`,
          `${now}`,
        ],
        (err, results, fields) => {
          if (err) {
            res.status(200).send({
              code: "418",
              message: "Database Visit insert error!",
              data: [],
            });
          } else {
            IsertSpecimen(results.insertId);
          }
        }
      );
    }

    function IsertSpecimen(visit_id) {
      dbConnection.query(
        "INSERT INTO `specimens` (`specimen_type_id`, `accession_number`, `tracking_number`, `priority`, `specimen_status_id`, `accepted_by`, `rejected_by`, `date_of_collection`) VALUES (?,?,?,?,?,?,?,?)",
        [
          `${specimen_type_id}`,
          `${accession_number}`,
          `X${accession_number}`,
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
            InsertTests(visit_id, results.insertId);
          }
        }
      );
    }

    function InsertTests(visit_id, specimen_id) {
      let orders = [];
      let zplTestNames = [];
      tests.forEach((test) => {
        if (test.short_name == ''){
          testname = test.name;
        }
        else{
          testname = test.short_name;
        }
        zplTestNames.push(testname);

        orders.push([
          `${visit_id}`,
          `${test.id}`,
          `${specimen_id}`,
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
      let sql =
        "INSERT INTO `tests` (`visit_id`, `test_type_id`, `specimen_id`, `test_status_id`, `created_by`, `tested_by`, `verified_by`, `requested_by`, `time_created`, `not_done_reasons`, `person_talked_to_for_not_done`) VALUES ?";

      dbConnection.query(sql, [orders], (err, results, fields) => {
        if (err) {
          console.log(err);

          res.status(200).send({
            code: "418",
            message: "Database Test insert error!",
            data: [],
          });
        } else {
          let data = {
            accessionNumber: accession_number,
            zplTestNames: zplTestNames
          };
          res.status(200).send({
            code: "200",
            message:
              "Order added Successfuly! Accession Number : " +
              `${accession_number}`,
            data: data,
          });
        }
      });
    }

  });

  app.post("/orders/search", auth, (req, res) => {
    let tracking_number = req.body.tracking_number;

    let specimen_id;
    let specimen_type;
    let location;
    let visit_id;
    let visit_type;
    let requesting_physician;
    let tests = [];
    let patient_id;
    let patient;
    let users = [];

    dbConnection.query(
      "SELECT `specimens`.`id`, `specimen_types`.`name` AS `specimen_type`, `specimens`.`accession_number`, `specimens`.`tracking_number`, `specimens`.`priority` , `specimens`.`drawn_by_id`, `specimens`.`drawn_by_name`, `specimens`.`specimen_status_id` , `specimens`.`rejected_by`, `specimens`.`rejection_reason_id`, `specimens`.`reject_explained_to`, `specimens`.`referral_id`, `specimens`.`time_accepted`, `specimens`.`time_rejected`, `specimens`.`date_of_collection` FROM `specimens`, `specimen_types` WHERE (`specimens`.`tracking_number` = ? OR `specimens`.`accession_number` = ?) AND `specimen_types`.`id` = `specimens`.`specimen_type_id`",
      [`${tracking_number}`, `${tracking_number}`],
      (err, results, fields) => {
        if (err) {
          res.status(200).send({
            code: "418",
            message: "Database Order fetching error!",
            data: [],
          });
        } else {
          if (results.length > 0) {
            let data = results[0];

            specimen_id = data.id;

            specimen_type = data.specimen_type;

            GetTests();
            GetUsers();
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

    function GetTests() {
      dbConnection.query(
        "SELECT `tests`.`id`, `test_types`.`name` AS `test_name`,`tests`.`visit_id`, `tests`.`test_type_id`, `tests`.`specimen_id`, `tests`.`interpretation`, `tests`.`test_status_id`, `tests`.`created_by`, `tests`.`tested_by`, `tests`.`verified_by`, `tests`.`requested_by`, `tests`.`time_created`, `tests`.`time_started`, `tests`.`time_completed`, `tests`.`time_verified`, `tests`.`panel_id`, `tests`.`time_sent`, `tests`.`external_id`, `tests`.`not_done_reasons`, `tests`.`person_talked_to_for_not_done` FROM `tests`, `test_types` WHERE `specimen_id` = ? AND `tests`.`test_type_id` = `test_types`.`id`",
        [`${specimen_id}`],
        (err, results, fields) => {
          if (err) {
            console.log(err);

            res.status(200).send({
              code: "418",
              message: "Database Order fetching error!",
              data: [],
            });
          } else {
            if (results.length > 0) {
              visit_id = results[0].visit_id;

              requesting_physician = results[0].requested_by;

              tests = results;

              GetVisitInfo();
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
    }

    function GetVisitInfo() {
      dbConnection.query(
        "SELECT * FROM `visits` WHERE `id` = ?",
        [`${visit_id}`],
        (err, results, fields) => {
          if (err) {
            res.status(200).send({
              code: "418",
              message: "Database Order fetching error!",
              data: [],
            });
          } else {
            if (results.length > 0) {
              location = results[0].ward_or_location;
              visit_type = results[0].visit_type;
              patient_id = results[0].patient_id;

              GetPatient();
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
    }
    
    function GetUsers(){
      dbConnection.query(
        "SELECT `users`.`id`, `users`.`name` AS `lab_technician` FROM `users`",
        (err, results, fields) => {
          if (err) {
            console.log(err);
          } else {
            if (results.length > 0) {
              users = results;
            }
          }
        }
      );
    }
    function GetPatient() {
      dbConnection.query(
        "SELECT * FROM `patients` WHERE `id` = ?",
        [`${patient_id}`],
        (err, results, fields) => {
          if (err) {
            res.status(200).send({
              code: "418",
              message: "Database patient fetching error!",
              data: [],
            });
          } else {
            if (results.length > 0) {
              patient = results;
              SendResponse();
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
    }

    function SendResponse() {
      let orders = [{
        id: specimen_id,
        specimen_type: specimen_type,
        tracking_number: tracking_number,
        location: location,
        tests: tests,
        patient: patient,
        visit_type: visit_type,
        requesting_physician: requesting_physician,
      }];

      let data = {
        orders:orders,
        tests:tests,
        users:users
      };
      res.status(200).send({
        code: "200",
        message: "Order fetch successful!",
        data: data,
      });
    }
  });

  app.post("/test/results", auth, (req, res) => {
    let test_id = req.body.test_id;

    dbConnection.query(
      "SELECT `test_results`.`id`, `test_results`.`measure_id`,`test_results`.`test_id`, `measures`.`name` AS `measure_name`, `test_results`.`result`,`test_results`.`device_name`, `test_results`.`time_entered` FROM `test_results`, `measures` WHERE `test_results`.`test_id` = ? AND `measures`.`id` = `test_results`.`measure_id` AND `test_results`.`result` <> '' ",
      [`${test_id}`],
      (err, results, fields) => {
        if (err) {
          console.log(err);
          res.status(200).send({
            code: "418",
            message: "Database Test Results fetching error!",
            data: [],
          });
        } else {
          if (results.length > 0) {
            res.status(200).send({
              code: "200",
              message: "Test Results fetching Successful!",
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

  // app.post("/tests/results", auth, (req, res) => {
    
  //   let tests = req.body.tests;

  //   let tests_results = []

  //   for (let index = 0; index < tests.length; index++) {

  //     let test = tests[index];

  //     dbConnection.query(
  //       "SELECT `test_results`.`id`,`test_results`.`test_id`, `test_results`.`measure_id`, `measures`.`name` AS `measure_name`, `test_results`.`result`,`test_results`.`device_name`, `test_results`.`time_entered` FROM `test_results`, `measures` WHERE `test_results`.`test_id` = ? AND `measures`.`id` = `test_results`.`measure_id` AND `test_results`.`result` <> '' ",
  //       [`${test.id}`],
  //       (err, results, fields) => {
  //         if (err) {
  //           console.log(err);
  //           res.status(200).send({
  //             code: "418",
  //             message: "Database Test Results fetching error!",
  //             data: [],
  //           });
  //         } else {
  //           if (results.length > 0) {

  //               results.forEach(result => {

  //                 tests_results.push(result);
                  
  //               });

  //               if (index + 1 == tests.length) {

  //                 res.status(200).send({
  //                   code: "200",
  //                   message: "Test Results fetching Successful!",
  //                   data: tests_results,
  //                 });
                  
  //               }  
  //           } else {

  //             if (index + 1 == tests.length) {

  //               res.status(200).send({
  //                 code: "200",
  //                 message: "Test Results fetching Successful!",
  //                 data: tests_results,
  //               });
                
  //             } 

  //           }
  //         }
  //       }
  //     );
      
  //   }

  // });

  app.post("/tests/results", auth, (req, res) => {
    
    let tests = req.body.tests;

    let tests_results = [];

    let tests_statuses = [];

    let statuses = [];

    for (let index = 0; index < tests.length; index++) {

      let test = tests[index];

      dbConnection.query(
        "SELECT `test_results`.`id`,`test_results`.`test_id`, `test_results`.`measure_id`, `measures`.`name` AS `measure_name`, `test_results`.`result`,`test_results`.`device_name`, `test_results`.`time_entered` FROM `test_results`, `measures` WHERE `test_results`.`test_id` = ? AND `measures`.`id` = `test_results`.`measure_id` AND `test_results`.`result` <> '' ",
        [`${test.id}`],
        (err, results, fields) => {
          if (err) {

            res.status(200).send({
              code: "418",
              message: "Database Test Results fetching error!",
              data: [],
            });
          } else {

            if (results.length > 0) {

                results.forEach(result => {

                  tests_results.push(result);
                  
                });

                if (index + 1 == tests.length) {

                  GetTestsStatusIDs()
                  
                }  
            } else {

              if (index + 1 == tests.length) {

                GetTestsStatusIDs()
                
                
              } 

            }
          }
        }
      );
      
    }

    function GetTestsStatusIDs() {

      for (let index = 0; index < tests.length; index++) {

        let test = tests[index];
  
        dbConnection.query(
          "SELECT `id`, `test_status_id` FROM `tests` WHERE `id` = ?",
          [`${test.id}`],
          (err, results) => {
        
              if (results.length > 0) {
  
                  results.forEach(result => {
  
                    tests_statuses.push(result);
                    
                  });
  
                  if (index + 1 == tests.length) {
  
                    GetTestsStatus();
                    
                  } 

              } else {

                if (index + 1 == tests.length) {
  
                  GetTestsStatus();
                  
                } 

              }
            
          }
        );
        
      }
      
    }

    function GetTestsStatus() {

      for (let index = 0; index < tests_statuses.length; index++) {

        let test = tests_statuses[index];
  
        dbConnection.query(
          "SELECT `name` FROM `test_statuses` WHERE `id` = ?",
          [`${test.test_status_id}`],
          (err, results) => {
  
              if (results.length > 0) {

                results.forEach(element => {

                  let state = element['name'];

                  statuses.push({
                    "id": test.id,
                    "status": state
                  });
                  
                });
  
                if (index + 1 == tests_statuses.length) {

                  let data = {
                    "tests_results":tests_results,
                    "statuses": statuses
                  }

                  res.status(200).send({
                    code: "200",
                    message: "Test Results fetching Successful!",
                    data: data,
                  });
                  
                }  

              } 
            
          }
        );
        
      }
      
    }

  });

};
