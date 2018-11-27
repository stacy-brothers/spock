const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const userSrvc = require('./services/spockuser.service');
const surveySrvc = require('./services/survey.service');
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
    console.debug("logging out token: " + token );
    var resp = userSrvc.logout(token);
    res.end(resp);
});

app.get('/info', (req, res) => {
    res.end(JSON.stringify(userSrvc.userList()));
})

app.get('/survey', (req, res) => {
    var token = req.get('token');
    var username = userSrvc.validLogin(token);
    surveySrvc.getNextSurvey(username)
        .then( nextSurvey => {
            res.end(JSON.stringify( nextSurvey));
        })
        .catch( error => {
            res.end("{'error':'" + error + "'}");
        })
});

app.post('/survey', (req, res) => {
    var token = req.get('token');
    var username = userSrvc.validLogin(token);
    surveySrvc.saveSurvey(req.body, username)
        .then( rslt => {
            res.end(JSON.stringify( rslt ));
        })
        .catch( error => {
            res.end("{'error':'" + error + "'}");
        })
});

app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
