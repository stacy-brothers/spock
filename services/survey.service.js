var {Pool} = require('pg');

var connStr = process.env.DATABASE_URL;
if (!connStr|| connStr.trim().length == 0) connStr = 'postgres://orchodnqabmuxa:6cc21d8484c582ba0e7482fba75887c5e3ee645502a1086a7e9fadb8fd7fc74c@ec2-54-163-230-178.compute-1.amazonaws.com:5432/d1escplvri91ri';
const pool = new Pool({
    connectionString: connStr,
    ssl: true
});

const surveysDone = [];

function SurveyService() {

};

SurveyService.prototype.getNextSurvey = function ( username ) {
    return new Promise((resolve, reject) => {
        getSurveysDone(username)
            .then( done => {
                if ( done.length === 0 ) done = [-1];
                pool.query( 'select id, descr from survey where not id = ANY($1::int[]) limit 1', [done] )
                    .then( rslt => {
                        console.debug("available survey: " + JSON.stringify(rslt));
                        if ( rslt && rslt.rowCount > 0 ) {
                            var rows = rslt.rows;
                            var newSurvey = {
                                id: rows[0].id,
                                descr: rows[0].descr,
                                questions: []
                            };
                            pool.query( 'select id, value from survey_question where survey_id = $1', [newSurvey.id])
                                .then(sqRslt => {
                                    if ( sqRslt.rowCount > 0 ) {
                                        sqRows = sqRslt.rows;
                                        sqIds = [];
                                        for ( var sqi = 0; sqi < sqRows.length; sqi++) {
                                            var newQ = {
                                                id: sqRows[sqi].id,
                                                question: sqRows[sqi].value,
                                                answers: []
                                            };
                                            sqIds.push(Number(sqRows[sqi].id));
                                            newSurvey.questions.push(newQ);
                                        }
                                        console.debug("sqIds: " + JSON.stringify(sqIds));
                                        pool.query(' select id, question_id, value from survey_answer where question_id = ANY($1::int[])', [sqIds])
                                            .then( saRslt => {
                                                if ( saRslt.rowCount > 0 ) {
                                                    saRows = saRslt.rows;
                                                    for ( var sai = 0; sai < saRows.length; sai++ ) {
                                                        var newAns = {
                                                            id: saRows[sai].id,
                                                            answer: saRows[sai].value
                                                        };
                                                        for (  var sqi = 0; sqi < newSurvey.questions.length; sqi++) {
                                                            if ( newSurvey.questions[sqi].id === saRows[sai].question_id) {
                                                                newSurvey.questions[sqi].answers.push(newAns);
                                                                break;
                                                            }
                                                        }
                                                    }
                                                    resolve(newSurvey);
                                                } else {
                                                    reject("bad question: no answers");
                                                }
                                            });
                                    } else {
                                        reject("bad survey: no questions");
                                    }
                                })
                                .catch( error => {
                                    reject("bad survey: " + JSON.stringify(error));
                                });
                        } else {
                            reject("no surveys left");
                        }
                    })
                    .catch( error => {
                        console.error("error getting next survey for " + username + ".  error: " + error);
                        reject(error);
                    });
            })
            .catch( error => {
                reject(error);
            })

    });
};

SurveyService.prototype.saveSurvey = function( survey, username ) {
    return new Promise((resolve, reject) => {
        console.debug("survey responses: " + JSON.stringify(survey));
        let surveyId = survey.surveyId;
        let questions = [];
        let answers = [];
        for ( let i = 0; i < survey.questions.length; i++) {
            questions.push(survey.questions[i].questionId);
            answers.push(survey.questions[i].answerId);
        }
        console.debug("survey: " + surveyId);
        console.debug("questions: " + JSON.stringify(questions));
        console.debug("answers: " + JSON.stringify(answers));
        pool.query("INSERT INTO user_answer (username, survey_id, survey_question_id, survey_answer_id) SELECT $1, $2, t.b, t.c FROM unnest($3::int[], $4::int[]) AS t(b,c);", [username, surveyId, questions, answers])
            .then( rslt => {
                console.debug(JSON.stringify(rslt));
                surveysDone[username].push(surveyId);
                resolve("success");
            })
            .catch( error => {
                console.error("error inserting user answers: " + JSON.stringify(survey) + " error:" + error);
                reject(error);
            });
    });
};


SurveyService.prototype.getStats = function( username ) {
    return new Promise((resolve, reject) => {
        let stats = [];
        getSurveysDone(username)
            .then( done => {
                if (done.length === 0) resolve(stats);
                pool.query( 'select s.id as survey_id, s.descr as survey, q.id as question_id, ' +
                             '      q.value as question, a.id as answer_id, a.value as answer ' +
                             ' from survey s, survey_question q, survey_answer a ' +
                             'where s.id = q.survey_id ' +
                             '  and q.id = a.question_id ' +
                             '  and s.id = ANY($1::int[])' +
                             'order by q.id, s.id, a.id', [done])
                    .then( rslt => {
                        if (rslt && rslt.rowCount > 0) {
                            var rows = rslt.rows;
                            var curS = {};
                            var curQ = {};
                            rows.forEach( s => {
                               // the query was order so make some assumptions
                                if ( !curS.id || curS.id != s.survey_id ) {
                                    curS = {
                                        id: s.survey_id,
                                        descr: s.survey,
                                        questions: []
                                    };
                                    curQ = [];
                                    stats.push(curS);
                                }
                                if ( !curQ.id || curQ.id != s.question_id ){
                                    curQ = {
                                        id: s.question_id,
                                        value: s.question,
                                        answers: []
                                    }
                                    curS.questions.push(curQ);
                                }
                                let answer = {
                                    id: s.answer_id,
                                    value: s.answer,
                                    count: 0
                                }
                                curQ.answers.push(answer);
                            });
                            pool.query('select u.survey_id, u.survey_question_id, u.survey_answer_id, count(*) as count\n' +
                                '         from user_answer u, survey s, survey_question q, survey_answer a ' +
                                '        where u.survey_id = s.id' +
                                '          and u.survey_question_id = q.id' +
                                '          and u.survey_answer_id = a.id ' +
                                '          and s.id = ANY($1::int[])' +
                                '        group by u.survey_id, u.survey_question_id, u.survey_answer_id ' +
                                '        order by u.survey_id, u.survey_question_id, u.survey_answer_id ', [done])
                                .then( rslt => {
                                    if (rslt && rslt.rowCount > 0) {
                                        counts = rslt.rows;
                                        console.log("counts: " + JSON.stringify(counts));
                                        counts.forEach( count => {
                                            console.log("count.survey_id: " + count.survey_id);
                                            let countId = Number(count.survey_id);
                                            curS = stats.find( s => { return s.id === countId; });
                                            console.log("curS: " + JSON.stringify(curS));
                                            if ( curS ) {
                                                console.log("curS exists! look for question_id: " + count.survey_question_id );
                                                curQ = curS.questions.find( q => { return q.id === count.survey_question_id; });
                                                console.log("question: " + JSON.stringify(curQ));
                                                if ( curQ.id ) {
                                                    let curA = curQ.answers.find( a => { return a.id === count.survey_answer_id; });
                                                    console.log("answer: " + JSON.stringify(curA));
                                                    if ( curA ) {
                                                        console.log("curA exists! assign count = " + count.count);
                                                        curA.count = Number(count.count);
                                                        console.log("curA: " + JSON.stringify(curA));
                                                        console.log("stats: " + JSON.stringify(stats));
                                                    }
                                                }
                                            }
                                        });
                                        console.log("stats at the end...: " + JSON.stringify(stats));
                                    }
                                    resolve(stats);
                                })
                                .catch( error => {
                                    reject(error);
                                });
                        }
                    })
                    .catch( error => {
                        reject(error);
                    });
            })
            .catch( error => {
                reject(error);
            });
    });
};

/**
 * the surveysDone list is a comma separated list of surveys that the user has completed.
 */
function getSurveysDone(username) {
    return new Promise((resolve, reject) => {
        console.debug("getting surveysDone for " + username);
        if ( surveysDone[username] ) {
            console.debug("already have surveysDone for " + username + " - " + JSON.stringify(surveysDone[username]));
            resolve(surveysDone[username]);
        } else {
            console.debug("Starting query to get surveysDone.");
            pool.query('select distinct(survey_id) from user_answer where username = $1', [username])
                .then( rslt => {
                    if ( rslt.rowCount === 0 ) {
                        surveysDone[username] = '';
                        console.debug("Username " + username + " hasn't done any surveys.");
                        resolve('');
                    } else {
                        var rows = rslt.rows;
                        console.debug("These surveys are already done: " + JSON.stringify(rows) + " count: " + rows.length);
                        var comma = "";
                        var list = [];
                        for (var i = 0; i < rows.length; i++) {
                            console.debug("This one is done: " + rows[i].survey_id);
                            list.push(Number(rows[i].survey_id));
                        }
                        console.debug("list: " + list);
                        surveysDone[username] = list;
                        resolve(list);
                    }
                })
                .catch( error => {
                    console.error("error gettting distinct surveys for " + username + " error:" + JSON.stringify(error));
                    reject("db error");
                });
        }
    });
}

const surveySrvc = new SurveyService();

module.exports = surveySrvc;