const express = require("express");
const path = require('path');
const mysql = require("mysql");
const dotenv = require('dotenv');
const cookieparser = require("cookie-parser");
const session = require('express-session');

const axios = require('axios');
dotenv.config({ path: './.env'});

const app = express();

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));


/*DB CONNECTIONS*/
const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE,
    insecureAuth : true

});


const publicDirectory = path.join(__dirname, './public');
app.use(express.static(publicDirectory));

app.use(express.urlencoded({extended:false}));
app.use(express.json());
app.use(cookieparser());


app.set('view engine', 'hbs');


db.connect((error)=>{
    if(error)
    {
        console.log(error);
    }
    else{
        console.log("MYSQL connected");
    }
})

//Define Routes

app.use('/',require('./routes/pages'));
app.use('/auth',require('./routes/auth'));


/*app.get("/",(req,res)=>{
    // res.send("<h1> Home Page</h1>")
    res.render("index")
})


app.get("/register",(req,res)=>{
    // res.send("<h1> Home Page</h1>")
    res.render("register")
})
*/
app.listen(5012, ()=>{
console.log('Started on 5012')
})