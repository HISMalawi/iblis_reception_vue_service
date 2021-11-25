const jwt = require("jsonwebtoken");

// Load .env variables
require("dotenv").config({ path: __dirname + "/../.env" });

const verifyToken = (req, res, next) => {
  
const token = req.body.token || req.query.token || req.headers["x-access-token"];

  if (!token) {
    return res.status(200).send("A token is required for authentication");
  }
  try {
    const decoded = jwt.verify(token, process.env.TOKEN_KEY);
    req.user = decoded;
  } catch (err) {
    return res.status(200).send("Invalid Token");
  }
  return next();
};


module.exports = verifyToken;
