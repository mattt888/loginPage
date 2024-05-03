var express = require('express')
var app = express()
var mysql = require('mysql')
var bcrypt = require('bcrypt')

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
