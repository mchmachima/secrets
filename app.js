/////////////////////////////////////////////////////// Setting ///////////////////////////////////////////////////////
//jshint esversion:6
// require("dotenv").config();
// console.log(process.env);
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
  session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

/////////////////////////////////////////////////////// Database ///////////////////////////////////////////////////////
// An object is created by smongoose class
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User", userSchema);
// Add below after created model
// Use passport-local-mongoose to create local login
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
/////////////////////////////////////////////////////// Home route ///////////////////////////////////////////////////////
app.route("/").get((req, res) => {
  res.render("home");
});

/////////////////////////////////////////////////////// Register route ///////////////////////////////////////////////////////
app
  .route("/register")
  .get((req, res) => {
    res.render("register");
  })
  .post((req, res) => {
    // Use passport-local-mongoose)
    User.register(
      { username: req.body.username },
      req.body.password,
      (err, user) => {
        if (err) {
          console.log(err);
          res.redirect("/register");
        } else {
          passport.authenticate("local")(req, res, function () {
            res.redirect("/secrets");
          });
        }
      }
    );
  });

/////////////////////////////////////////////////////// Login route ///////////////////////////////////////////////////////
app
  .route("/login")
  .get((req, res) => {
    res.render("login");
  })
  .post((req, res) => {
    const user = new User({
      username: req.body.username,
      password: req.body.password,
    });
    req.login(user, (err) => {
      if (err) {
        console.log(err);
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/secrets");
        });
      }
    });
  });

/////////////////////////////////////////////////////// Secrets route ///////////////////////////////////////////////////////
app.route("/secrets").get((req, res) => {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

/////////////////////////////////////////////////////// Logout route ///////////////////////////////////////////////////////
app.route("/logout").get((req, res) => {
  req.logout((err) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/")
    }
  })
});

/////////////////////////////////////////////////////// Listen route ///////////////////////////////////////////////////////
app.listen(3000, function () {
  console.log("Server started on port 3000");
});
