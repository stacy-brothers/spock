var { Pool } = require('pg');

var connStr = process.env.DATABASE_URL;
if (!connStr|| connStr.trim().length == 0) connStr = 'postgres://orchodnqabmuxa:6cc21d8484c582ba0e7482fba75887c5e3ee645502a1086a7e9fadb8fd7fc74c@ec2-54-163-230-178.compute-1.amazonaws.com:5432/d1escplvri91ri';
const pool = new Pool({
    connectionString: connStr,
    ssl: true
});

function PersonService() {
};

PersonService.prototype.getPersonById = function( id ) {
    return pool.query('select id, first, last, dob from person where id = $1', [id]);
};

PersonService.prototype.getParentsByPersonId = function( id ) {
    return pool.query('select id, first, last, dob from person where id in ( select parent_id from person_xref where child_id = $1 )', [id]);
};


var personService = new PersonService();

module.exports = personService;