const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const userSrvc = require('./services/spockuser.service');
const surveySrvc = require('./services/survey.service');
const rpslsSrvc = require('./services/rpsls.service');
const PORT = process.env.PORT || 5000;

let app = express();

// app.use(require('morgan')('dev'));
// var session = require('express-session');
// var FileStore = require('session-file-store')(session);
//
// app.use(session({
//     name: 'spock.sid',
//     secret: 'whatever',
//     saveUninitialized: true,
//     resave: true,
//     store: new FileStore(),
//     cookie: {
//         maxAge: 300000
//     }
// }));

app.set('views', path.join(__dirname, 'views'));

app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/static'));

app.use(bodyParser.json()); // support json encoded bodies

app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.get('/', (req, res) => {
    res.sendFile('index.html');
});

app.post('/login', (req, res) => {
    var username = req.body.username;
    var pass = req.body.pass;
    res.type('application/json');
    userSrvc.login(username, pass)
        .then( token => {
            res.end(JSON.stringify({token:token}));
        })
        .catch( error => {
            if (error === 'invalid login') {
                res.status(401).send(JSON.stringify({error:error}));
            } else {
                res.status(400).send(JSON.stringify({error:error}));
            }
        });
});

app.post('/user', (req, res) => {
    var username = req.body.username;
    var pass = req.body.pass;
    userSrvc.resisterUser(username, pass)
        .then( token => {
            console.log("token:" + token);
            res.end(JSON.stringify({token:token}));
        })
        .catch( error => {
            res.status(400).send(JSON.stringify({error:error}));
        });
});

app.use( (req, res, next) => {
    var token = req.get('token');
    try {
        var username = userSrvc.validLogin(token);
        req.username = username;
        console.debug("username in use: " + username);
        next();
    } catch (e) {
        res.end(JSON.stringify({ error: e.message }));
    }
});

app.post('/logout', (req, res) => {
    var token = req.get('token');
    var resp = userSrvc.logout(token);
    res.end(resp);
});

app.get('/info', (req, res) => {
    res.end(JSON.stringify(userSrvc.userList()));
});

app.get('/survey', (req, res) => {
    surveySrvc.getNextSurvey(req.username)
        .then( nextSurvey => {
            res.end(JSON.stringify(nextSurvey));
        })
        .catch( error => {
            res.end(JSON.stringify({"error": error }));
        })
});

app.post('/survey', (req, res) => {
    surveySrvc.saveSurvey(req.body, req.username)
        .then( rslt => {
            res.end(JSON.stringify( rslt ));
        })
        .catch( error => {
            res.end(JSON.stringify({error:error}));
        });
});

app.get('/survey/stats', (req, res) => {
    surveySrvc.getStats(req.username)
        .then( rslt => {
            res.end(JSON.stringify( rslt ));
        })
        .catch( error => {
            res.end(JSON.stringify({error:error}));
        });
});

 app.use(function (req, res, next) {
     rpslsSrvc.dumpInfo();
     next();
 });

app.get('/rpsls', (req, res)=> {
    let start = req.query.start;
    let rtn = {};
    if ( start && start.trim().length > 0 ) {
        rtn = rpslsSrvc.start(req.username, start);
    } else {
        // if there is no start then it is a wait request
        rtn = rpslsSrvc.wait(req.username);
    }
    res.end(JSON.stringify(rtn));
});

app.get('/rpsls/:gameId/:roundNum', (req, res)=> {
    let gameId = req.params.gameId;
    let roundNum = req.params.roundNum;
    let rtn = rpslsSrvc.getResult(gameId, roundNum);
    res.end(JSON.stringify(rtn));
});

app.post('/rpsls/:gameId/:roundNum', (req, res)=> {
    let gameId = req.params.gameId;
    let roundNum = req.params.roundNum;
    let choice = req.body.choice;
    let rtn = rpslsSrvc.choose(gameId,req.username,roundNum,choice);
    res.end(JSON.stringify(rtn));

});



app.get('/rpsls/test', (req, res)=> {
    console.debug("testing wait:" + JSON.stringify(rpslsSrvc.wait('testing')));
    let game = rpslsSrvc.start('testing2','player');
    console.debug("testing2 start:" + JSON.stringify(game));
    console.debug("testing wait:" + JSON.stringify(rpslsSrvc.wait('testing')));
    console.debug("----------- round 1 -------------");
    console.debug("testing answers SPOCK: " + JSON.stringify(rpslsSrvc.choose(game.gameId, 'testing', 1, 'SPOCK')));
    console.debug("get results: " + JSON.stringify(rpslsSrvc.getResult(game.gameId, 1)));
    console.debug("get results again: " + JSON.stringify(rpslsSrvc.getResult(game.gameId, 1)));
    console.debug("testing2 answers LIZARD: " + JSON.stringify(rpslsSrvc.choose(game.gameId, 'testing2', 1, 'LIZARD')));
    console.debug("get results: " + JSON.stringify(rpslsSrvc.getResult(game.gameId, 1)));
    console.debug("----------- round 2 -------------");
    console.debug("testing answers SPOCK: " + JSON.stringify(rpslsSrvc.choose(game.gameId, 'testing', 2, 'SPOCK')));
    console.debug("testing2 answers SPOCK: " + JSON.stringify(rpslsSrvc.choose(game.gameId, 'testing2', 2, 'SPOCK')));
    console.debug("get results: " + JSON.stringify(rpslsSrvc.getResult(game.gameId, 2)));
    console.debug("get again results: " + JSON.stringify(rpslsSrvc.getResult(game.gameId, 2)));
    console.debug("----------- round 3 -------------");
    console.debug("testing answers SCISSORS: " + JSON.stringify(rpslsSrvc.choose(game.gameId, 'testing', 3, 'SPOCK')));
    console.debug("testing2 answers SPOCK: " + JSON.stringify(rpslsSrvc.choose(game.gameId, 'testing2', 3, 'SCISSORS')));
    console.debug("get results: " + JSON.stringify(rpslsSrvc.getResult(game.gameId, 3)));
    console.debug("get again results: " + JSON.stringify(rpslsSrvc.getResult(game.gameId, 3)));
    console.debug("----------- round 4 -------------");
    console.debug("testing answers LIZARD: " + JSON.stringify(rpslsSrvc.choose(game.gameId, 'testing', 4, 'LIZARD')));
    console.debug("testing2 answers LIZARD: " + JSON.stringify(rpslsSrvc.choose(game.gameId, 'testing2', 4, 'LIZARD')));
    console.debug("get results: " + JSON.stringify(rpslsSrvc.getResult(game.gameId, 4)));
    console.debug("get again results: " + JSON.stringify(rpslsSrvc.getResult(game.gameId, 4)));
    console.debug("----------- round 5 -------------");
    console.debug("testing answers SCISSORS: " + JSON.stringify(rpslsSrvc.choose(game.gameId, 'testing', 5, 'SCISSORS')));
    console.debug("testing2 answers SPOCK: " + JSON.stringify(rpslsSrvc.choose(game.gameId, 'testing2', 5, 'SPOCK')));
    console.debug("get results: " + JSON.stringify(rpslsSrvc.getResult(game.gameId, 5)));
    console.debug("get again results: " + JSON.stringify(rpslsSrvc.getResult(game.gameId, 5)));
    console.debug("----------- vs Computer round 1 -------------");
    game = rpslsSrvc.start('testing','computer');
    console.debug("testing start:" + JSON.stringify(game));
    let round = 1;
    console.debug("testing answers SPOCK: " + JSON.stringify(rpslsSrvc.choose(game.gameId, 'testing', 1, 'SPOCK')));
    let rslt = rpslsSrvc.getResult(game.gameId, round);
    console.debug("get results: " + JSON.stringify(rslt));
    while ( !rslt.finalWinner ) {
        round++;
        console.debug("----------- vs Computer round " + round + " -------------");
        console.debug("testing answers SPOCK: " + JSON.stringify(rpslsSrvc.choose(game.gameId, 'testing', round, 'SPOCK')));
        rslt = rpslsSrvc.getResult(game.gameId, round);
        console.debug("get results: " + JSON.stringify(rslt));
    }

    res.end("done");
})

app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
