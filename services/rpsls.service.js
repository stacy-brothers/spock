let {Pool} = require('pg');

let connStr = process.env.DATABASE_URL;
if (!connStr|| connStr.trim().length == 0) connStr = 'postgres://orchodnqabmuxa:6cc21d8484c582ba0e7482fba75887c5e3ee645502a1086a7e9fadb8fd7fc74c@ec2-54-163-230-178.compute-1.amazonaws.com:5432/d1escplvri91ri';
const pool = new Pool({
    connectionString: connStr,
    ssl: true
});

// QueueStore must be a singleton...
const queue = [];
const QueueStore = {
    add: item => queue.push(item),
    get: username => queue.length>0?queue.find(q => q.username === username):null,
    shft: () => queue.shift(),
    rem: username => {
        for ( let i = 0; i < queue.length; i++ ) {
            if ( queue[i].username === username ) {
                queue.splice(i,1);
                break;
            }
        }
        console.debug(JSON.stringify(queue));
    }
};
Object.freeze(QueueStore);

let seq = 0;

pool.query('select max(id) from rpsls_results')
    .then( rslt => {
        seq = (rslt.rows[0].max) + 1;
        console.debug('next seq: ' + seq );
    })
    .catch( error => {
        console.error( error );
    });

const SeqStore = {
    next: () => {
        seq++;
        return seq;
    }
};
Object.freeze(SeqStore);

let games = [];

function RPSLSService() {
};

RPSLSService.prototype.start = function ( username, type ) {
    if ( type === 'player' ) {
        if ( queue.length > 0  ) {
            let opponent = QueueStore.shft();
            console.debug("queue should be empty! " + JSON.stringify(queue));
            return startGame( username, opponent.username );
        } else {
            return {error: 'no players'};
        }
    } else {
        return startGame( username, 'computer' );
    }
};

RPSLSService.prototype.wait = function ( username ) {
    console.debug("player: " + username + " is checking waiting queue...");
    // see if they got placed
    let game = games.find(g => g.player2 === username);
    if ( !game ) game = games.find(g => g.player1 === username);
    if ( game && game.complete != true ) {
        // they are in a game, return the start info.
        return game;
    } else {
        // am I in the queue?
        userQueue = QueueStore.get(username);
        if (!userQueue) {
            // check to see if someone slipped into the queue since I started...
            if ( queue.length > 0 ) {
                // they did, start a game
                let opponent = QueueStore.shft();
                console.debug("queue should be empty! " + JSON.stringify(queue));
                return startGame( username, opponent.username );
            } else {
                // nope,  add me to the queue...
                userQueue = {
                    username: username,
                    count: 0,
                    last: (new Date()).getTime()
                };
                QueueStore.add(userQueue);
            }
        } else {
            if ( userQueue.count === 5 ) {
                QueueStore.rem(username);
                return {status:'waited too long'};
            } else {
                userQueue.count++;
                userQueue.last = (new Date()).getTime();
            }
        }
        console.debug(JSON.stringify(queue));
        return {status:'still waiting'};
    }
};

RPSLSService.prototype.choose = function ( gameId, username, roundNum, choice ) {
    let game = games.find(g => g.gameId === Number(gameId));
    console.debug("gameId: " + gameId + " - game:" + JSON.stringify(game));
    let round = game.rounds.find(r => r.roundNum === Number(roundNum));
    console.debug("roundNum:" + roundNum + " - round:" + JSON.stringify(round));
    console.debug("username: " + username + " - choice: " + choice);
    if ( !round ) {
        round = {
            roundNum: Number(roundNum),
            answer1: "NONE",
            answer2: "NONE",
            winner: "NONE"
        };
        game.rounds.push(round);
    } else {
        if ( round.winner != "NONE" ) return {error:'round complete'};
    }
    if ( game.player1 === username ) {
        round.answer1 = choice;
    } else if (game.player2 === username) {
        round.answer2 = choice;
    } else  {
        return {error:'invalid gameId'};
    }
    if ( game.player2 === 'computer') {
        let choices = ['ROCK', 'PAPER', 'SCISSORS', 'LIZARD', 'SPOCK'];
        let i = Math.floor(Math.random() * 4);
        round.answer2 = choices[i];
    }
    return {status:'await results'};
};

RPSLSService.prototype.getResult = function ( gameId, roundNum ) {
    let game = games.find(g => g.gameId === Number(gameId));
    console.debug("gameId: " + gameId + " - game:" + JSON.stringify(game));
    let round = game.rounds.find(r => r.roundNum === Number(roundNum));
    console.debug("roundNum:" + roundNum + " - round:" + JSON.stringify(round));
    if ( round.answer1 != 'NONE' && round.answer2 != 'NONE' ) {
        let winnerNum = getWinner( round.answer1, round.answer2 );
        winner = 'Cat';
        if ( winnerNum === 1 ) winner = game.player1;
        else if ( winnerNum === 2 ) winner = game.player2;
        console.debug("winnerNum: " + winnerNum + " - " + winner);
        result = {
            roundNum: Number(roundNum),
            player1: game.player1,
            answer1: round.answer1,
            player2: game.player2,
            answer2: round.answer2,
            winner: winner
        };
        round.winner = winner;
        // need to see if there is a final winner
        score1 = 0;
        score2 = 0;
        for ( let i = 0; i < game.rounds.length; i++ ) {
            console.debug("round " + i + " winner:" + game.rounds[i].winner);
            if ( game.rounds[i].winner === game.player1 ) score1++;
            else if ( game.rounds[i].winner === game.player2 ) score2++;
            let loser = "";
            if ( score1 === 2 ) {
                result.finalWinner = game.player1;
                loser = game.player2;
            } else if ( score2 === 2 ) {
                result.finalWinner = game.player2;
                loser = game.player1;
            }
            if ( score1 === 2 || score2 === 2 ) {
                console.debug("we have a winner: " + result.finalWinner);
                pool.query("insert into rpsls_results ( id, winner, loser ) values ( $1, $2, $3 )", [game.gameId, result.finalWinner, loser])
                    .then( rslt => {
                        // ignore this...
                        console.debug(JSON.stringify(rslt));
                    })
                    .catch( error => {
                        // ignore this too...
                        console.debug(error);
                    });
                // mark the game as complete
                game.complete = true;
            }
        }
        console.debug("score: " + score1 + " to " + score2);
        return result;
    } else {
        return {status:'await results'};
    }
};

RPSLSService.prototype.dumpInfo = function () {
    console.debug("-----------------------------------------");
    console.debug("queue: " + JSON.stringify(queue) + " ");
    console.debug("seq: " + seq  + " ");
    console.debug("games: " + JSON.stringify(games) + " ");
    console.debug("-----------------------------------------");
};

/**
 * Scissors cuts paper, paper covers rock, rock crushes lizard, lizard poisons Spock, Spock smashes scissors, scissors decapitates lizard, lizard eats paper, paper disproves Spock, Spock vaporizes rock, and as it always has, rock crushes scissors.
 */
function getWinner( one, two ) {
    let winner = 0;
    if ( one === 'SCISSORS' ) {
        if ( two === 'PAPER' ) winner = 1;
        else if ( two === 'LIZARD') winner = 1;
        else if ( two === 'SPOCK' ) winner = 2;
        else if ( two === 'ROCK' ) winner = 2;
    }
    else if ( one === 'PAPER' ) {
        if ( two === 'ROCK' ) winner = 1;
        else if ( two === 'SPOCK') winner = 1;
        else if ( two === 'SCISSORS' ) winner = 2;
        else if ( two === 'LIZARD' ) winner = 2;
    }
    else if ( one === 'LIZARD' ) {
        if ( two === 'SPOCK' ) winner = 1;
        else if ( two === 'PAPER') winner = 1;
        else if ( two === 'SCISSORS' ) winner = 2;
        else if ( two === 'ROCK' ) winner = 2;
    }
    else if ( one === 'SPOCK' ) {
        if ( two === 'SCISSORS' ) winner = 1;
        else if ( two === 'ROCK') winner = 1;
        else if ( two === 'LIZARD' ) winner = 2;
        else if ( two === 'PAPER' ) winner = 2;
    }
    else if ( one === 'ROCK' ) {
        if ( two === 'SCISSORS' ) winner = 1;
        else if ( two === 'LIZARD') winner = 1;
        else if ( two === 'SPOCK' ) winner = 2;
        else if ( two === 'PAPER' ) winner = 2;
    }
    console.debug(one + " vs " + two + " - winner is " + (winner===1?one:two));
    return winner;
}

function startGame( player1, player2 ) {
    let gameId = SeqStore.next();
    let newGame = {
        gameId: gameId,
        player1: player1,
        player2: player2,
        rounds: [{
            roundNum: 1,
            answer1: "NONE",
            answer2: "NONE",
            winner: "NONE"
        }]
    };
    games.push(newGame);
    return newGame;
}

let rpslsService = new RPSLSService();

module.exports = rpslsService;