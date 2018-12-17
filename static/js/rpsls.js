
let token = localStorage.getItem("token");

document.getElementsByTagName("body")[0].onload = function() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'rpsls?start=player');
    xhr.setRequestHeader("Content-Type","application/json");
    xhr.setRequestHeader("token",token);
    xhr.onload = function() {
        if (xhr.status === 200) {
            console.log(xhr.responseText);
            resp = JSON.parse(xhr.responseText);
            if ( resp.error ) {
                if ( resp.error === 'no players') {
                    // if no players, ask them if they want to wait or play against the computer
                    document.getElementById('waitDiv').className = 'showingDiv';
                    document.getElementById('checkingDiv').className = 'hiddenDiv';
                }
            }
        } else {
            alert('Request failed.  Returned status of ' + xhr.status);
        }
    };
    xhr.send();
};

let waitTimer;

let dotsStr = ".";

function waitAwhile() {
    document.getElementById('waitDiv').className = 'hiddenDiv';
    document.getElementById('waitingDiv').className = 'showingDiv';
    dotsStr = ".";
    document.getElementById('dots').innerHTML = dotsStr;
    doWaitCheck();
}

function doWaitCheck() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'rpsls');
    xhr.setRequestHeader("Content-Type","application/json");
    xhr.setRequestHeader("token",token);
    xhr.onload = function() {
        if (xhr.status === 200) {
            console.log(xhr.responseText);
            resp = JSON.parse(xhr.responseText);
            if ( resp.status ) {
                if ( resp.status === 'still waiting') {
                    // wait a while longer...
                    dotsStr = dotsStr + ".";
                    document.getElementById('dots').innerHTML = dotsStr;
                    waitTimer = setTimeout( doWaitCheck, 5000);
                } else if ( resp.status === 'waited too long') {
                    // if no players, ask them if they want to wait or play against the computer
                    document.getElementById('waitDiv').className = 'showingDiv';
                    document.getElementById('waitDesc').innerText = 'There are still no other players.';
                    document.getElementById('waitingDiv').className = 'hiddenDiv';
                }
            } else {
                startIt(resp);
            }
        } else {
            alert('Request failed.  Returned status of ' + xhr.status);
        }
    };
    xhr.send();
};

function playC() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'rpsls?start=computer');
    xhr.setRequestHeader("Content-Type","application/json");
    xhr.setRequestHeader("token",token);
    xhr.onload = function() {
        if (xhr.status === 200) {
            console.log(xhr.responseText);
            resp = JSON.parse(xhr.responseText);
            if ( resp.error ) {
                alert("there was an error: " + resp.error);
            } else {
                startIt(resp);
            }
        } else {
            alert('Request failed.  Returned status of ' + xhr.status);
        }
    };
    xhr.send();
};

let compeditor = "";
let game = {
    gameId: 0,
    player1: "",
    player2: "",
    rounds: []
};

let roundNum = 1;
let username = "";

function startIt( newGame ) {
    game = newGame;
    console.log(JSON.stringify(game));
    document.getElementById('waitDiv').className = 'hiddenDiv';
    document.getElementById('waitingDiv').className = 'hiddenDiv';
    document.getElementById('playDiv').className = 'showingDiv';
    username = localStorage.getItem('username');
    if ( game.player1 === username ) {
        compeditor = game.player2;
    } else {
        compeditor = game.player1;
    }
    document.getElementById('comp').innerText = compeditor;
    roundNum = 1;
};

function choose( choice ) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'rpsls/' + game.gameId + "/" + roundNum);
    xhr.setRequestHeader("Content-Type","application/json");
    xhr.setRequestHeader("token",token);
    let request = {
        choice: choice
    };
    xhr.onload = function() {
        if (xhr.status === 200) {
            console.log(xhr.responseText);
            resp = JSON.parse(xhr.responseText);
            if ( resp.status && resp.status === 'await results' ) {
                getResults();
            } else {
                // there was a problem...
            }
        } else {
            alert('Request failed.  Returned status of ' + xhr.status);
        }
    };
    xhr.send(JSON.stringify(request));
}

function getResults() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'rpsls/' + game.gameId + "/" + roundNum);
    xhr.setRequestHeader("Content-Type","application/json");
    xhr.setRequestHeader("token",token);
    xhr.onload = function() {
        if (xhr.status === 200) {
            console.log(xhr.responseText);
            resp = JSON.parse(xhr.responseText);
            if ( resp.status && resp.status === 'await results' ) {
                console.log("waiting for round results...");
                waitTimer = setTimeout( getResults, 2000 );
                document.getElementById('playDiv').className = 'hiddenDiv';
                document.getElementById('waitingDiv').className = 'showingDiv';
                dotsStr = ".";
                document.getElementById('dots').innerHTML = dotsStr;
            } else {
                // have a winner...
                if ( resp.finalWinner && resp.finalWinner != 'NONE' ) {
                    if ( resp.finalWinner === username ) {
                        document.getElementById('winnerText').innerText = 'You are a winner!';
                        document.getElementById('resultsBtn').innerText = 'Yeah Hooo!';
                    } else {
                        document.getElementById('winnerText').innerText = 'You lose.';
                        document.getElementById('resultsBtn').innerText = 'I\'ll be back...!';
                    }
                    document.getElementById('playDiv').className = 'hiddenDiv';
                    document.getElementById('waitingDiv').className = 'hiddenDiv';
                    document.getElementById('resultsDiv').className = 'showingDiv';
                    document.getElementById('resultsBtn').onclick = function() {
                        window.location = 'landing.html';
                    }
                } else {
                    document.getElementById('playDiv').className = 'hiddenDiv';
                    document.getElementById('waitingDiv').className = 'hiddenDiv';
                    document.getElementById('resultsDiv').className = 'showingDiv';
                    document.getElementById('resultsBtn').innerText = 'Next Round';
                    console.log("winner is " + resp.winner);
                    if (resp.winner === 'Cat') {
                        document.getElementById('winnerText').innerHTML = 'Both chose ' + resp.answer1;
                        document.getElementById('winnerExplain').innerHTML = 'Try to be a little more original...';
                    } else {
                        if (resp.winner === username) {
                            document.getElementById('winnerText').innerHTML = 'You Win! (this round...)';
                        } else {
                            document.getElementById('winnerText').innerHTML = 'You Lose... (there are still more rounds...)';
                        }
                    }
                    document.getElementById('resultsBtn').onclick = function() {
                        nextRound();
                    }
                }
                if (resp.player1 === resp.winner) {
                    document.getElementById('winnerExplain').innerHTML = resp.answer1 + ' ' + resp.verb + ' ' + resp.answer2;
                } else if (resp.winner != 'Cat') {
                    document.getElementById('winnerExplain').innerHTML = resp.answer2 + ' ' + resp.verb + ' ' + resp.answer1;
                }
            }
        } else {
            alert('Request failed.  Returned status of ' + xhr.status);
        }
    };
    xhr.send();
}

function nextRound() {
    document.getElementById('playDiv').className = 'showingDiv';
    document.getElementById('waitingDiv').className = 'hiddenDiv';
    document.getElementById('resultsDiv').className = 'hiddenDiv';
    roundNum++;
}
