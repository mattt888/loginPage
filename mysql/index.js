var express = require('express')
var app = express()
var mysql = require('mysql')
var bcrypt = require('bcrypt')

var session = require('express-session');
var flash = require('express-flash');

app.use(session({
    secret: 'titkos-kulcs-01234',
    resave: false,
    saveUninitialized: true,
  }));

// A flash session middleware hozzáadása
app.use(flash());

app.set("view engine", "ejs")
app.use(express.urlencoded({extended:true}))

var connection = mysql.createConnection({
    host: 'localhost',
    port: '3306',
    database: 'nodejs_1',
    user: 'root',
    password: ''
})

connection.connect( err => {
    if (err) return console.error('Hiba a kapcsolatban')

app.get('/', (req,res)=> {
    connection.query("select * from users", (err, results) => {
        console.log("results:", results);
        res.render('index', {list: results})
    })
})

.post('/', (req, res) => {
    res.set('Content-Type', 'text/html; charset=utf-8');

    console.log("req.body tartalma 11:" , req.body);
    const {name, email, password} = req.body
    console.log("req.body tartalma 22:" , req.body);
    console.log("name:" , name);
    console.log("email:" , email);
    console.log("password:" , password);

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.error('Hashing error:', err);  // Kezeljük a hiba esetét
            return res.end('Hiba a hash-ben: ', err.stack)
        } else {
            // Mentjük el a hash-t az adatbázisban
            console.log('Hashed Password:', hash);
            connection.query("insert into users (name, email, password) values (?,?,?)", [name, email, hash], function(err, results){
                if (err) return res.json(err)
                console.log('----------------------------------------------------------------------------------------');
                console.log('results: ', results);
                console.log('JSON.stringify(results):', JSON.stringify(results));
                console.log('JSON.parse(JSON.stringify(results))):', JSON.parse(JSON.stringify(results)));
                console.log('----------------------------------------------------------------------------------------');
                return res.redirect("back")
            })
        }
    });
})

app.get('/register', (req,res)=> {
        res.render('register')
})

.post('/register-process', (req, res) => {
    res.set('Content-Type', 'text/html; charset=utf-8');
    const {name, email, password} = req.body

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.error('Hashing error:', err);  // Kezeljük a hiba esetét
            return res.end('Hiba a hash-ben: ', err.stack)
        } else {
            connection.query("insert into users (name, email, password) values (?,?,?)", [name, email, hash], function(err, results){
                if (err) return res.json(err)
                return res.redirect("back")
            })
        }
    });
})

.get('/login', (req,res)=> {
    // console.log("req.flash('error'):", req.flash('error'));
    // console.log("req.flash('email'):", req.flash('email'));
    res.render('login', { errors: req.flash('error'), email: req.flash('email') })
})

.post("/login-process", (req,res) => {
    res.set('Content-Type', 'text/html; charset=utf-8');
    // res.json( req.body )
    const {email, password} = req.body
    connection.query("select * from users where email = ?", [req.body.email], (err, results) => {
       if ( results.length === 0 ) {
            console.log("req.body:", req.body);
            console.log('email:', email);
            console.log('password:', password);
            console.log("results:", results);
            console.log("---------------------------------------------------------------------------------");
            req.flash('error', "Nincs ilyen email cím az adatbázisban!")
            req.flash('email', email)
            // res.end("Nincs ilyen email cím az adatbázisban!")
            return res.redirect('back')
       } else {
            bcrypt.compare( req.body.password, results[0].password, (err, result) => {
                if (result) {
                    console.log("req.body.password:", req.body.password);
                    console.log("results[0].password:", results[0].password);
                    console.log("result:", result);
                    console.log("------------------------------------------------------------------------------");
                    res.end('Itt a belépés ideje és helye')
                } else {
                    console.log("req.body.password:", req.body.password);
                    console.log("results[0].password:", results[0].password);
                    console.log("result:", result);
                    console.log("------------------------------------------------------------------------------");
                    req.flash('error', "Hibás jelszó!")
                    req.flash('email', email)
                    return res.redirect('back')
                }
            })
        }
    })
})

.get("/delete/:id", (req, response) => {
    console.log('req.params:', req.params);
    console.log('req.params.id:', req.params.id);
    // res.end( req.params.id)
    connection.query("delete from users where id = ? limit 1", [req.params.id], (err, result) => {
        if (err) return result.json(err)
        // else return response.redirect("back")
        return response.redirect("back")
    })
})

.post("/update/:id", (request, response) => {

    const {name, email} = request.body

    connection.query("update users set name = ?, email = ? where id = ? limit 1", [name, email, request.params.id], (err, result) => {
        if (err) return response.json(err)
        return response.redirect("back")
    })
})

.listen(9000, ()=> console.log("started at: 9000"))
})
