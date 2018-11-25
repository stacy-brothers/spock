const express = require('express');
const path = require('path');
const userSrvc = require('./services/spockuser.service');
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 5000;

let app = express();

app.set('views', path.join(__dirname, 'views'));

app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/static'));

app.use(bodyParser.json()); // support json encoded bodies

app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.get('/', (req, res) => {
    res.sendFile('index.html');
});

app.post('/user', (req, res) => {
    var username = req.body.username;
    var pass = req.body.pass;
    userSrvc.resisterUser(username, pass)
        .then( token => {
            res.end("{'token':'" + token + "'}");
        })
        .catch( error => {
            res.end("{'error':'" + error + "'}");
        });
});

app.post('/login', (req, res) => {
    var username = req.body.username;
    var pass = req.body.pass;
    userSrvc.login(username, pass)
        .then( token => {
            res.end("{'token':'" + token + "'}");
        })
        .catch( error => {
            res.end("{'error':'" + error + "'}");
        });
});

app.post('/logout', (req, res) => {
    var token = req.get('token');
    var resp = userSrvc.logout(token);
    return success;
});

app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
