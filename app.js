const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));

const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");

const passport = require("passport");
const LocalStrategy = require("passport-local");

const bcrypt = require("bcrypt");


app.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  next();
});

/////////////////////////////////////////////////////////

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

/////////////////////////////////////////////////////////

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected");
});

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const User = mongoose.model("User", userSchema);

/////////////////////////////////////////////////////////

app.use(
  session({
    secret: "I'm a freaking good coder!",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(
  new LocalStrategy((username, password, done) => {
    User.findOne({ username: username }, (err, user) => {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false, { msg: "Incorrect username" });
      }
      if (
        bcrypt.compare(password, user.password, (err, res) => {
          if (res) {
            // passwords match! log user in
            return done(null, user);
          } else {
            // passwords do not match!
            return done(null, false, { msg: "Incorrect password" });
          }
        })
      ) {
        return done(null, false, { msg: "Incorrect password" });
      }
      return done(null, user);
    });
  })
);

/////////////////////////////////////////////////////////

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", function (req, res) {
  bcrypt.hash(req.body.password, 10, function (err, hash) {
    User.create(
      {
        username: req.body.username,
        password: hash,
      },
      function (err, user) {
        if (err) {
          console.log(err);
        } else {
          res.render("home");
        }
      }
    );
  });

});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/register"
  })
);

/////////////////////////////////////////////////////////

app.listen(3000, () => {
  console.log("Listening on port 3000");
});
