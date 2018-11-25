var {Pool} = require('pg');
var crypto = require('crypto');

var connStr = process.env.DATABASE_URL;
if (!connStr|| connStr.trim().length == 0) connStr = 'postgres://orchodnqabmuxa:6cc21d8484c582ba0e7482fba75887c5e3ee645502a1086a7e9fadb8fd7fc74c@ec2-54-163-230-178.compute-1.amazonaws.com:5432/d1escplvri91ri';
const pool = new Pool({
    connectionString: connStr,
    ssl: true
});

var userList = {};

function SpockUserService() {

};

SpockUserService.prototype.resisterUser = function ( username, pass ) {
    return new Promise((resolve, reject) => {
        // first check to see if the user already exists.
        spockUserSrvc.userExists(username)
            .then(rslt => {
                var count = rslt.rows[0].count;
                if (count && count > 0) {
                    console.warn("SpockUserService.registerUser: username " + username + " already in use.");
                    reject("invalid username");
                }
                // doesn't exist so add a new user.
                addUser( username, hashIt(pass) )
                    .then( () => {
                        var token = hashIt(username + (new Date()).getTime());
                        userList[token] = username;
                        resolve(token);
                    })
                    .catch( error => {
                        reject("database error");
                    });
            })
            .catch(error => {
                console.error(JSON.stringify(error));
                reject("server error");
            });
    });
};

SpockUserService.prototype.login = function ( username, pass ) {
    return new Promise((resolve, reject) => {
        userWithPassExists(username, hashIt(pass))
            .then(rslt => {
                var count = rslt.rows[0].count;
                if (count && count == 0) {
                    console.warn("SpockUserService.registerUser: username " + username + " - " + pass + " invalid.");
                    reject("invalid login");
                }
                var token = hashIt(username + (new Date()).getTime());
                userList[token] = username;
                resolve(token);
            })
            .catch(error => {
                console.error(JSON.stringify(error));
                reject("server error");
            });
    });
};

SpockUserService.prototype.logout = function ( username ) {
    delete userList[username];
    return "success";
};


SpockUserService.prototype.validLogin = function( token ) {
    if ( userList[token] ) {
        return userList[token];
    } else {
        throw "invalid login";
    }
};

SpockUserService.prototype.userExists = function ( username ) {
    return pool.query('select count(*) from spock_user where username = $1', [username]);
};

SpockUserService.prototype.activeUsers = function () {
    var values = Object.values(userList);
    return values;
}


userWithPassExists = function ( username, pass ) {
    return pool.query('select count(*) from spock_user where username = $1 and pass_hash = $2', [username, pass]);
};

function addUser( username, pass ) {
    return pool.query('insert into spock_user ( username, pass_hash ) values ( $1, $2 )', [username, pass]);
}

function hashIt( value ) {
    var hash = crypto.createHash('sha1');
    data = hash.update(value, 'utf-8');
    gen_hash= data.digest('hex');
    return gen_hash;
}

var spockUserSrvc = new SpockUserService();

module.exports = spockUserSrvc;