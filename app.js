/////////////////////////////////////////////////////// Setting ///////////////////////////////////////////////////////
//jshint esversion:6
require("dotenv").config();
// console.log(process.env);
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

// Using bcrypt
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
mongoose.connect("mongodb://127.0.0.1:27017/userDB");

/////////////////////////////////////////////////////// Database ///////////////////////////////////////////////////////
// An object is created by smongoose class
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

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
    const username = req.body.username;
    const password = req.body.password;
    // Find exist email in database
    User.findOne({ email: username })
      .then((foundUser) => {
        // Check password from database (foundUser) match to password from login route
        if (foundUser) {
          // Load hash from your password DB (foundUser.password) and compare with plain text (password from login page)
          bcrypt.compare(password, foundUser.password, function (err, result) {
            // change callback function to result. Avoid use 'req' to confuse when render ejs
            if (result === true) {
              console.log("Password match!");
              res.render("secrets");
            }
          });
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
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
      const newUser = new User({
        email: req.body.username,
        password: hash, // Turn into a irreverible hash
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
  });

/////////////////////////////////////////////////////// Listen route ///////////////////////////////////////////////////////
app.listen(3000, function () {
  console.log("Server started on port 3000");
});
