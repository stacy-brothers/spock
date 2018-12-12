
let token = localStorage.getItem("token");

document.getElementsByTagName("body")[0].onload = function() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'survey/stats');
    xhr.setRequestHeader("Content-Type","application/json");
    xhr.setRequestHeader("token",token);
    xhr.onload = function() {
        if (xhr.status === 200) {
            console.log(xhr.responseText);
            let surveyList =  JSON.parse(xhr.responseText);
            // TODO: if list is empty then tell them to go play a game
            let parent = document.getElementById('surveyList');
            surveyList.forEach( survey => {
                let title = document.createElement('div');
                title.innerText = "Survey: " + survey.descr;
                title.className = 'surveyTitle';
                parent.appendChild(title);
                let i = 1;
                survey.questions.forEach( question => {
                    let qDiv = document.createElement('div');
                    qDiv.innerText = "Question " + i + ": " + question.value;
                    qDiv.className = 'qDiv';
                    parent.appendChild(qDiv);
                    i++;
                    question.answers.forEach( answer => {
                        let aDiv = document.createElement('div');
                        aDiv.innerText = answer.value + " - " + answer.count;
                        aDiv.className = 'aDiv';
                        parent.appendChild(aDiv);
                    });
                });
            });
        } else {
            alert('Request failed.  Returned status of ' + xhr.status);
        }
    };
    xhr.send();
};

