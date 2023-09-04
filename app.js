//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyparser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();
app.use(bodyparser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/userDB");
}

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

userSchema.plugin(findOrCreate);
userSchema.plugin(passportMongoose);
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});
app.get("/secrets", (req, res) => {
  console.log(req.isAuthenticated());
  if (req.isAuthenticated()) {
    console.log("Logged in");
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});
app.post("/register", async (req, res) => {
  User.register(
    { username: req.body.username, active: false },
    req.body.password,
    function (err, user) {
      if (err) {
      }

      const authenticate = User.authenticate();
      authenticate(
        req.body.username,
        req.body.password,
        function (err, result) {
          if (err) {
          }
          if (result) {
            res.redirect("/login");
          }
          // Value 'result' is set to false. The user could not be authenticated since the user is not active
        }
      );
    }
  );
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/secrets",
    failureRedirect: "/login",
  })
);

app.get("/logout", (req, res) => {
  req.logout(function (err, r) {
    console.log("Logged Out");
  });
  res.redirect("/");
});

//listen port
app.listen(3000, () => {
  console.log("Server is listening on PORT 3000");
});
