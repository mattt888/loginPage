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

function onlyUsers (req, res, next) {
    if ( typeof req.session.authUserId ==='undefined' || !req.session.authUserId ) {
        console.log('typeof req.session.authUserId === undefined:', typeof req.session.authUserId ==='undefined')
        console.log('!req.session.authUserId:', !req.session.authUserId)
        // ha nem vagy bejelentkezve akkor nem tudod megtekinteni a profilodat
        // ha nem vagy bejelentkezve akkor kilépni sem tudsz hiszen nincs honnan kilépni
        // res.end('Nem vagy belépve!')
        req.flash('error', 'Az oldal belépés nélkül nem látogatható!')
        res.redirect('/login')
        return
    }
    next()
}

function onlyGuests (req, res, next) {
    if ( typeof req.session.authUserId !=='undefined') {
        console.log('typeof req.session.authUserId !== undefined:', typeof req.session.authUserId !=='undefined')
        // ha nem vagy bejelentkezve akkor kilépni sem tudsz hiszen nincs honnan kilépni
        // res.end('Nem vagy belépve!')
        req.flash('error', 'Az oldal belépett állapotban nem látogatható!')
        res.redirect('/profile')
        return
    }
    next()
}

connection.connect( err => {
    if (err) return console.error('Hiba a kapcsolatban')

app.get('/', (req,res) => {
    connection.query("select * from users", (err, results) => {
        // console.log("results:", results);
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

.get('/register', onlyGuests, (req,res)=> {
        res.render('register')
})

.post('/register-process', onlyGuests, (req, res) => {
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

.get('/login', onlyGuests, (req,res) => {
    // ez a 2 sor kikommentelve kell h maradjon:
    // console.log("req.flash('error'):", req.flash('error'));
    // console.log("req.flash('email'):", req.flash('email'));
    res.render('login', { errors: req.flash('error'), email: req.flash('email'), success: req.flash('success') })
})

.post("/login-process", onlyGuests, (req,res) => {
    res.set('Content-Type', 'text/html; charset=utf-8');
    // res.json( req.body )
    const {email, password} = req.body
    connection.query("select * from users where email = ?", [req.body.email], (err, results) => {
       if ( results.length === 0 ) {
            console.log("req.body:", req.body);
            console.log('email:', email);
            console.log('password:', password);
            // console.log("results= eredménytábla:", results);
            console.log("---------------------------------------------------------------------------------");
            req.flash('error', "Nincs ilyen email cím az adatbázisban!")
            req.flash('email', email)
            // res.end("Nincs ilyen email cím az adatbázisban!")
            return res.redirect('back')
       } else {
            bcrypt.compare( req.body.password, results[0].password, (err, compareResults) => {
                if (compareResults) {
                    console.log("POST login-process kezdete---------------------------------------------");
                    console.log("req.body.password:", req.body.password);
                    console.log("results[0].password:", results[0].password);
                    console.log("compareResults:", compareResults);
                   req.session.authUserId = results[0].id
                //    console.log("results= eredménytábla:", results);
                //    console.log('results[0]:', results[0]);
                   console.log('results[0].id:', results[0].id);
                   console.log("POST login-process VÉGE---------------------------------------------");
                   return res.redirect('/profile')
                } else {
                    console.log("req.body.password:", req.body.password);
                    console.log("results[0].password:", results[0].password);
                    console.log("compareResults:", compareResults);
                    console.log("------------------------------------------------------------------------------");
                    req.flash('error', "Hibás jelszó!")
                    req.flash('email', email)
                    return res.redirect('back')
                }
            })
        }
    })
})

.get('/profile', onlyUsers, (req,res) => {
    res.set('Content-Type', 'text/html; charset=utf-8');
    connection.query("select * from users where id = ?", [req.session.authUserId], (err, results) => {
        res.render('profile', {authUser: results[0], errors: req.flash('error'), success: req.flash('success') })
        console.log('GET /profile KEZDETE: ---------------------------------------')
        console.log('results[0]:', results[0])
        console.log('GET /profile VÉGE: ---------------------------------------')
   })
})

.post('/profile-process', onlyUsers, (req, res) => {
    console.log('POST /profile KEZDETE: ---------------------------------------')

    const {name, email} = req.body
    connection.query("select id from users where email = ? and id != ? ", [email, req.session.authUserId ], (err, results) => {
        if (results.length > 0) {  // ha a results.length nagyobb mint 0 akkor az azt jelenti hogy van ilyen felhasználó aki már használja ezt az emailt
            req.flash('error', 'Az email cím már használatban van!')
            console.log('req.body:', req.body)	
            console.log('results post /profile-process:', results)
            console.log('results[0]:', results[0])
            console.log('POST /profile VÉGE: ---------------------------------------')
            return res.render('profile', {authUser: req.body, errors: req.flash('error') })

        } else {
            connection.query("update users set name = ?, email = ? where id = ?", [name, email, req.session.authUserId], (err, results) => {
                if ( err ) {
                    return res.json(err.stack)
                }
                req.flash('success', 'Sikeres módosítás!')
                // return res.redirect('back')
                console.log('POST /profile VÉGE: ---------------------------------------')
                return res.render('profile', {authUser: req.body, errors: req.flash('error'), success: req.flash('success') })
            })
        }
    })
})

.get('/logout', onlyUsers, (req,res) => {
    console.log('typeof req.session.authUserId === undefined:', typeof req.session.authUserId ==='undefined')
    console.log('!req.session.authUserId:', !req.session.authUserId)
    delete req.session.authUserId
    req.flash('success', 'Sikeresen kiléptél!')
    return res.redirect('/login')
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
