const bcrypt = require("bcrypt");

module.exports = (app, dbConnection) => {
  app.post("/users/authenticate", (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    if (!username) {
      res.status(418).send({
        code: "418",
        message: "Username is required!",
        data: [],
      });
    } else if (!password) {
      res.status(418).send({
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
            res.status(418).send({
              code: "418",
              message: "Database user fetching error!",
              data: [],
            });
          } else {
            if (results.length > 0) {
              // Load hash from your password DB.
              bcrypt.compare(
                password,
                results[0].password,
                function (err, result) {
                  if (result) {
                    res.status(200).send({
                      code: "200",
                      message: "Authentication Successful!",
                      data: [{ token: token }],
                    });
                  } else {
                    res.status(418).send({
                      code: "418",
                      message: "Authentication Unsuccessful!",
                      data: [],
                    });
                  }
                }
              );
            } else {
              res.status(418).send({ message: "" });
              res.status(418).send({
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
};
