function doLogin() {
    let user = document.getElementById('username').value;
    let pass = document.getElementById('pass').value;
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'login');
    xhr.setRequestHeader("Content-Type","application/json");
    let body = {
        username: user,
        pass: pass
    };
    xhr.onload = function() {
        if (xhr.status === 200) {
            var resp = JSON.parse(xhr.responseText);
            localStorage.setItem("token", resp.token);
            localStorage.setItem('username', user);
            window.location = "landing.html";
        } else {
            alert('Request failed.  Returned status of ' + xhr.status);
        }
    };
    xhr.send(JSON.stringify(body));
}