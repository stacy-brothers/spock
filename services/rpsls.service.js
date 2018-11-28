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
    // see if they got placed
    let game = games.find(g => g.player2 === username);
    if ( game && game.complete != true ) {
        // they are in a game, return the start info.
        return game;
    } else {
        userQueue = QueueStore.get(username);
        if (!userQueue) {
            userQueue = {
                username: username,
                count: 0,
                last: (new Date()).getTime()
            };
            QueueStore.add(userQueue);
        } else {
            if ( userQueue.count === 10 ) {
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
    let game = games.find(g => g.gameId === gameId);
    let round = game.rounds.find(r => r.roundNum === roundNum);
    if ( !round ) {
        round = {
            roundNum: roundNum,
            answer1: "NONE",
            answer2: "NONE",
            winner: "NONE"
        };
        game.rounds.push(round);
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
    let game = games.find(g => g.gameId === gameId);
    let round = game.rounds.find(r => r.roundNum === roundNum);
    if ( round.answer1 != 'NONE' && round.answer2 != 'NONE' ) {
        let winnerNum = getWinner( round.answer1, round.answer2 );
        winner = 'Cat';
        if ( winnerNum === 1 ) winner = game.player1;
        else if ( winnerNum === 2 ) winner = game.player2;
        result = {
            roundNum: roundNum,
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

/**
 * Scissors cuts paper, paper covers rock, rock crushes lizard, lizard poisons Spock, Spock smashes scissors, scissors decapitates lizard, lizard eats paper, paper disproves Spock, Spock vaporizes rock, and as it always has, rock crushes scissors.
 */
function getWinner( one, two ) {
    if ( one === 'SCISSORS' ) {
        if ( two === 'SCISSORS' ) return 0;
        if ( two === 'PAPER' ) return 1;
        if ( two === 'LIZARD') return 1;
        if ( two === 'SPOCK' ) return 2;
        if ( two === 'ROCK' ) return 2;
    }
    if ( one === 'PAPER' ) {
        if ( two === 'PAPER' ) return 0;
        if ( two === 'SCISSORS' ) return 1;
        if ( two === 'SPOCK') return 1;
        if ( two === 'SCISSORS' ) return 2;
        if ( two === 'LIZARD' ) return 2;
    }
    if ( one === 'LIZARD' ) {
        if ( two === 'LIZARD' ) return 0;
        if ( two === 'SPOCK' ) return 1;
        if ( two === 'PAPER') return 1;
        if ( two === 'SCISSORS' ) return 2;
        if ( two === 'SCISSORS' ) return 2;
    }
    if ( one === 'SPOCK' ) {
        if ( two === 'SPOCK' ) return 0;
        if ( two === 'SCISSORS' ) return 1;
        if ( two === 'ROCK') return 1;
        if ( two === 'LIZARD' ) return 2;
        if ( two === 'PAPER' ) return 2;
    }
    if ( one === 'ROCK' ) {
        if ( two === 'ROCK' ) return 0;
        if ( two === 'SCISSORS' ) return 1;
        if ( two === 'LIZARD') return 1;
        if ( two === 'SPOCK' ) return 2;
        if ( two === 'PAPER' ) return 2;
    }
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
    if ( player2 === 'computer') {
        let choices = ['ROCK','PAPER','SCISSORS','LIZARD','SPOCK'];
        let i = Math.floor(Math.random() * 4 );
        newGame.rounds[0].answer2 = choices[i];
    }
    games.push(newGame);
    return newGame;
}

let rpslsService = new RPSLSService();

module.exports = rpslsService;