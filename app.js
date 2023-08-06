/////////////////////////////////////////////////////// Setting ///////////////////////////////////////////////////////
//jshint esversion:6
require("dotenv").config();
// console.log(process.env);
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

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
  googleId: String,
  secret: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

// Add below after created model
// Use passport-local-mongoose to create local login
passport.use(User.createStrategy());

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, {
      id: user.id,
      username: user.username,
    });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});
// Should add below serialize and deserialize
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);
/////////////////////////////////////////////////////// Home route ///////////////////////////////////////////////////////
app.route("/").get((req, res) => {
  res.render("home");
});

/////////////////////////////////////////////////////// Google route ///////////////////////////////////////////////////////
app
  .route("/auth/google")
  .get(passport.authenticate("google", { scope: ["profile"] })); // Profile is user id on Google to identify

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect secrets route.
    res.redirect("/secrets");
  }
);
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
  User.find({ secret: { $ne: null } })    // Find all data have secrets
    .then(foundUser => {
      if (foundUser) {
        res.render("secrets", {userWithSecrets: foundUser})
      } else {
        console.log(err);
      }
    });
});

/////////////////////////////////////////////////////// Logout route ///////////////////////////////////////////////////////
app.route("/logout").get((req, res) => {
  req.logout((err) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/");
    }
  });
});

/////////////////////////////////////////////////////// Submit route ///////////////////////////////////////////////////////
app
  .route("/submit")
  .get((req, res) => {
    if (req.isAuthenticated()) {
      res.render("submit");
    } else {
      res.redirect("/login");
    }
  })
  .post((req, res) => {
    if (req.isAuthenticated()) {
      const submittedSecret = req.body.secret;
      User.findById(req.user.id).then((foundUser) => {
        if (foundUser) {
          foundUser.secret = submittedSecret;
          foundUser.save().then(() => {
            console.log("Successfully add secrets!");
            res.redirect("/secrets");
          });
        } else {
          console.log(err);
        }
      });
    }
  });
/////////////////////////////////////////////////////// Listen route ///////////////////////////////////////////////////////
app.listen(3000, function () {
  console.log("Server started on port 3000");
});
