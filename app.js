/////////////////////////////////////////////////////// Setting ///////////////////////////////////////////////////////
//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
var encrypt = require("mongoose-encryption");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
mongoose.connect("mongodb://127.0.0.1:27017/userDB");

/////////////////////////////////////////////////////// Database ///////////////////////////////////////////////////////
// An object is created by mongoose class
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});
const secret = "Thisisourlittlesecret.";  // call 'key'
userSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"] });
const User = new mongoose.model("User", userSchema);

/////////////////////////////////////////////////////// Home route ///////////////////////////////////////////////////////
app.route("/").get((req, res) => {
  res.render("home");
});

/////////////////////////////////////////////////////// Login route ///////////////////////////////////////////////////////
app
  .route("/login")
  .get((req, res) => {
    res.render("login");
  })
  .post((req, res) => {
    // Find exist email in database
    User.findOne({ email: req.body.username })
      .then((foundUser) => {
        // Check password from database (foundUser) match to password from login route
        if (foundUser.password === req.body.password) {
          // If pass match, server will render secrets.ejs
          console.log("Password match!");
          res.render("secrets");
        }
      })
      .catch((err) => {
        console.log(err);
      });
  });

/////////////////////////////////////////////////////// Register route ///////////////////////////////////////////////////////
app
  .route("/register")
  .get((req, res) => {
    res.render("register");
  })
  .post((req, res) => {
    const newUser = new User({
      email: req.body.username,
      password: req.body.password,
    });
    newUser
      .save()
      .then(() => {
        console.log("Successfully register!");
        res.render("secrets");
      })
      .catch((err) => {
        console.log(err);
      });
  });

/////////////////////////////////////////////////////// Listen route ///////////////////////////////////////////////////////
app.listen(3000, function () {
  console.log("Server started on port 3000");
});
