let survey = {
    id: 0,
    descr: "",
    questions: []
};

let question = {
    id: 0,
    question: "",
    answers: []
};

let answer = {
    id: 0,
    answer: ""
};

let request = {
    surveyId: 0,
    questions: []
};

let questionsLeft = -1;

let token = localStorage.getItem("token");

document.getElementsByTagName("body")[0].onload = function() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'survey');
    xhr.setRequestHeader("Content-Type","application/json");
    xhr.setRequestHeader("token",token);
    xhr.onload = function() {
        if (xhr.status === 200) {
            console.log(xhr.responseText);
            survey = JSON.parse(xhr.responseText);
            if ( survey.error ) {
                document.getElementById("surveyTitle").innerText = 'No surveys left! Just play a game...';
                let questionList = document.getElementById('questionList');
                let okBtn = document.createElement('DIV');
                okBtn.innerText = 'OK';
                okBtn.className = 'okBtn spockBtn';
                okBtn.onclick = function() {
                    window.location = "rpsls.html";
                }
                questionList.appendChild(okBtn);
            } else {
                document.getElementById("surveyTitle").innerText = survey.descr;
                request.surveyId = survey.id;
                questionsLeft = survey.questions.length;
                console.log(survey.questions.length + " questions!");
                let questionList = document.getElementById('questionList');
                for (let i = 0; i < survey.questions.length; i++) {
                    question = survey.questions[i];
                    console.log("question " + question.id + " - " + question.question);
                    newQ = document.createElement('DIV');
                    newQ.className = "questionDiv";
                    newQ.id = "quest" + question.id;
                    let qc = "<span class='questionHdr'>" + question.id + " - " + question.question + "</span><div class='answerRow' id='answerRow'>"
                    for (let j = 0; j < question.answers.length; j++) {
                        answer = question.answers[j];
                        qc = qc + "<div class='answerBtn spockBtn' onclick='selectAns(" + question.id + "," + answer.id + ");'>" + answer.answer + "</div>";
                    }
                    qc = qc + "</div>";
                    newQ.innerHTML = qc;
                    questionList.appendChild(newQ);
                }
            }
        } else {
            alert('Request failed.  Returned status of ' + xhr.status);
        }
    };
    xhr.send();
};

function selectAns( q, a ) {
    let ans = {
        "questionId": q,
        "answerId": a
    }
    request.questions.push(ans);
    let qDiv = document.getElementById('quest' + q);
    qDiv.style.display = 'none';
    questionsLeft--;
    if ( questionsLeft === 0) submitSurvey();
}

function submitSurvey() {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'survey');
    xhr.setRequestHeader("Content-Type","application/json");
    xhr.setRequestHeader("token",token);
    xhr.onload = function() {
        if (xhr.status === 200) {
            alert(xhr.responseText);
            window.location = "rpsls.html";
        } else {
            alert('Request failed.  Returned status of ' + xhr.status);
        }
    };
    xhr.send(JSON.stringify(request));
}

