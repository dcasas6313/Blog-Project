const bcrypt = require("bcryptjs")
const dotenv = require('dotenv')
const express = require('express');
const mysql = require("mysql2")
const path = require("path")

dotenv.config({ path: './.env'})

const app = express();

// Establishing Database Connection
const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
})

// Express Setup
const publicDir = path.join(__dirname, './public')

app.use(express.static(publicDir))
app.use(express.urlencoded({extended: 'false'}))
app.use(express.json())

app.set('view engine', 'hbs')

// Connect to DB
db.connect((error) => {
    if(error) {
        console.log(error)
    } else {
        console.log("Connected to DB")
    }
})

// Import pages
app.get("/", (req, res) => {
    res.render("index")
})

app.get("/register", (req, res) => {
    res.render("register")
})

app.get("/login", (req, res) => {
    res.render("login")
})

app.get("/dashboard", (req, res) => {
    res.render("dashboard")
})

// Button logic for registration page
app.post("/auth/register", (req, res) => {    
    const { username, password, password_confirm } = req.body

    // Validate form entries
    db.query('SELECT username FROM users WHERE username = ?', [username], async (error, result) => {
        // Catch errors to console
        if(error){
            console.log(error)
        } else {
            // Validate username and password matching
            // Displays a prompt if unsuccessful
            if( result.length > 0 ) {
                return res.render('register', {
                    prompt: 'This username is already in use!'
                })
            } else if(password !== password_confirm) {
                return res.render('register', {
                    prompt: 'The passwords do not match!'
                })
            }

            // Hash password for DB storage
            let hashedPassword = await bcrypt.hash(password, 8)

            // Insert new user into DB
            // Displays a prompt if successful
            db.query('INSERT INTO users SET?', {username: username, password: hashedPassword}, (err, result) => {
                if(error) {
                    console.log(error)
                } else {
                    return res.render('register', {
                        success: 'Success!'
                    })
                }
            })
        }        
    })
})

// Login Button Login
app.post("/auth/login", (req, res) => {    
    const { name, password } = req.body

    // Retrieve data from DB to validate login credentials
    db.query('SELECT username, password FROM users where username =?', [name], function(error, results, fields) {
        // Compare hashed passwords
        bcrypt.compare(req.body.password, results[0].password, function(err, results) {
            if(results) {
                return res.render('dashboard',)
            } else {
                return res.render('login', {
                    prompt: 'Passwords do not match!'
                })
            }
        })    
    })
})

// Post creation Logic
app.post("/dashboard/post", (req, res) => {    
    const { title, message } = req.body

    db.query('INSERT INTO posts SET?', {title: title, message, message}, (err, results) => {
        if(err) {
            console.log(error)
        } else {
            return res.render('dashboard', {
                success: 'Success!'
            })
        }
    })
})

// Start listener
app.listen(5000, ()=> {
    console.log("server started on port 5000")
})