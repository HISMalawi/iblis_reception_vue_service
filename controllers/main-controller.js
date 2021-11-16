const bcrypt = require("bcrypt");

module.exports = (app, dbConnection) => {
  app.post('/users/authenticate', (req, res) => {

    let username = req.body.username;
    let password = req.body.password;

    if (!username) {

        res.status(418).send({
            "code": "418",
            "message": "Username is required!",
            "data": []
        });
        
    } else if (!password) {

        res.status(418).send({
            "code": "418",
            "message": "User password is required!",
            "data": []
        });
        
    } else {

        // execute will internally call prepare and query
        dbConnection.execute(
            'SELECT * FROM `users` WHERE `email` = ? OR `username` = ?',
            [`${username}`, `${username}`],
            (err, results, fields) => {

                if(err) {

                    res.status(418).send({
                        "code": "418",
                        "message": "Database user fetching error!",
                        "data": []
                    });

                } else {

                    if (results.length > 0) {

                        let user = {

                            "username": results[0].username,
                            "email": results[0].email,
                            "name": results[0].name,
                            "role": results[0].designation

                        }

                        // Load hash from your password DB.
                        res.status(200).send({
                          "code": "200",
                          "message": "Authentication Successful!",
                          "data": [user]
                      });

                        
                        
                    } else {


                        res.status(418).send({"message": ""});
                        res.status(418).send({
                            "code": "418",
                            "message": "Authentication Unsuccessful!",
                            "data": []
                        });
                        
                    }

                    


                }
            
            }
        );

    }

});
};
