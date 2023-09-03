//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyparser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const bcrypt = require("bcrypt");
const saltRounds = 10;

main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/userDB");
}

const app = express();
app.use(bodyparser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

const User = new mongoose.model("User", userSchema);

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  bcrypt.hash(req.body.password, saltRounds, async function (err, hash) {
    // Store hash in your password DB.
    const user = new User({
      email: req.body.email,
      password: hash,
    });
    const saveUser = await user.save();
    console.log(user, saveUser);
    if (saveUser === user) {
      res.render("secrets");
    } else {
      res.send(saveUser);
    }
  });
});

app.post("/login", async (req, res) => {
  const email = req.body.email;
  const pwd = req.body.password;
  const mail = await User.findOne({ email: email });
  if (mail) {
    bcrypt.compare(pwd, mail.password, function (err, result) {
      // result == true
      if (result === true) {
        res.render("secrets");
      } else {
        res.send("Wrong Password" + err);
      }
    });
  } else {
    res.send("Wrong Email");
  }
});

//listen port
app.listen(3000, () => {
  console.log("Server is listening on PORT 3000");
});
