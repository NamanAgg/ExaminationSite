require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const http = require("http");
const mongoose = require("mongoose");
const session= require("express-session");
const passport=require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
mongoose.connect("mongodb://localhost:27017/authDB", { useNewUrlParser: true , useUnifiedTopology: true });
mongoose.set("useCreateIndex",true);
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User=new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.route("/")
.get((req,res)=>{
        res.render("home");
});


app.route("/login")
.get((req,res)=>{
    res.render("login");
})
.post((req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, (err) => {
        if (err) {
            console.log(err);
        }
        else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/dashboard");

            })
        }
    })
});


app.route("/register")
.get((req,res)=>{
    res.render("register");
})
.post((req, res) => {
    User.register({ username: req.body.username }, req.body.password, (err, user) => {
        if (err) {
            console.log(err);
            res.redirect("/register");
        }
        else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/dashboard");

            })
        }
    })
});

app.get("/dashboard", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("dashboard");
    }
    else {
        res.redirect("/login");
    }
});

app.get("/logout",(req,res)=>{
    req.logout();
    res.redirect("/");
})
app.route("/changePass")
.get((req,res)=>{
    res.render("changePass");
})
.post((req,res)=>{
    if (req.isAuthenticated()) {
    User.findById(req.user._id)
        // I assume you already have authentication and the req.user is generated
        .then(foundUser => {
            foundUser.changePassword(req.body.old, req.body.new)
                .then(() => {
                    console.log('password changed');
                    res.redirect("/");
                })
                .catch((error) => {
                    console.log(error);
                })
        })
        .catch((error) => {
            console.log(error);
        });
    }
    else {
        res.redirect("/");
    }
});

const port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log("Server started on port ",port);
});