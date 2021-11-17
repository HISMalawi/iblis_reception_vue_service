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
                token: ""
              };

              // Create token
              const token = jwt.sign(
                { user_id: user.email, username },
                process.env.TOKEN_KEY,
                {
                  expiresIn: "2h",
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

  app.post("/welcome", auth, (req, res) => {
    res.status(200).send("Welcome 🙌 ");
  });
};
