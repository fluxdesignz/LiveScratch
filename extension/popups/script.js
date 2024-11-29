var version = chrome.runtime.getManifest().version;
document.querySelector('#version').innerHTML = 'v'+version;

document.querySelector("button#projects").addEventListener("click", function () {
    chrome.tabs.create({
        url: "/projects/index.html"
    })
})

document.querySelectorAll("button.credit").forEach(function(credit){
    credit.onclick = () => {
        let username = credit.querySelector(".credit-name").innerText;
        chrome.tabs.create({
            url: `https://scratch.mit.edu/users/${username}`
        });
    }
});   

chrome.runtime.sendMessage({ meta: "getUsernamePlus" }, function (info) {
    let username = info.uname
    let token = info.currentBlToken
    let apiUrl = info.apiUrl

    function setSignedin(info) {

        if (info.signedin) {
            document.querySelector('#loggedout').style.display = 'none'
            document.querySelector('#contents').style.display = 'flex'
            token = info.currentBlToken;
            username = info.uname
        } else {
            document.querySelector('#loggedout').style.display = 'flex'
            document.querySelector('#contents').style.display = 'none'
        }
    }
    setSignedin(info)

    setTimeout(() => { chrome.runtime.sendMessage({ meta: "getUsernamePlus" }, setSignedin) }, 1000)

    let alreadyAdded = {}

    // credit https://stackoverflow.com/questions/2794137/sanitizing-user-input-before-adding-it-to-the-dom-in-javascript
    function sanitize(string) {
        string = String(string)
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            "/": '&#x2F;',
        };
        const reg = /[&<>"'/]/ig;
        return string.replace(reg, (match) => (map[match]));
    }

    function addFriendGUI(name) {
        if (name?.toLowerCase() in alreadyAdded) { return }
        alreadyAdded[name.toLowerCase()] = true

        let item = document.createElement('li')
        item.username = name
        item.innerHTML = `<span class="button">@${sanitize(name)}</span><span class="material-symbols-outlined x button">remove</span>`
        item.onclick = (e) => {
            if (e.target?.classList?.contains('x')) {
                removeFriend(name) 
                document.querySelector('#projects').style.opacity = 1;
            }
            else { chrome.tabs.create({ url: `https://scratch.mit.edu/users/${name}` }); }
        }
        item.onmouseenter = (e) => {
            document.querySelector('#projects').style.opacity = 0.5;
        }
        item.onmouseleave = (e) => {
            document.querySelector('#projects').style.opacity = 1;
        }
        document.querySelector('#friends').appendChild(item)
    }

    function addFriend(name) {
        if (name.toLowerCase() in alreadyAdded) { return }
        if (name.toLowerCase() == username.toLowerCase()) { return }
        if (!name.trim()) { return }
        if (name.includes(' ')) { return }
        document.querySelector('#add').value = ''
        addFriendGUI(name)
        fetch(`${apiUrl}/friends/${username}/${name}`, { method: "POST", headers: { authorization: token } });
    }

    function removeFriend(name) {
        delete alreadyAdded[name.toLowerCase()]
        for (let child of document.querySelector('#friends').children) {
            if (child.username == name) { child.remove(); break; }
        }
        fetch(`${apiUrl}/friends/${username}/${name}`, { method: "DELETE", headers: { authorization: token } });
    }

    document.querySelector('#add').addEventListener("keyup", function (event) {
        if (event.keyCode === 13) {
            addFriend(document.querySelector('#add').value)
        }
    });

    document.querySelector('#submit').onclick = () => { addFriend(document.querySelector('#add').value) }

    if (!info.currentBlToken && !info.verifyBypass) {
        showNoAuthMessage()
    } else {
        fetch(`${apiUrl}/friends/${username}`, { headers: { authorization: token } })
            .then((res) => { document.querySelector('#friends').innerHTML = ''; return res })
            .then(res => res.json().then(list => {
                if (list.noauth) { showNoAuthMessage() }
                else { list.forEach(addFriendGUI) }
            }))
            .catch((e) => {
                document.querySelector('#error').style.display = "inherit";
                document.querySelector('#error-content').innerHTML = e.stack.replace(new RegExp(`chrome-extension://${chrome.runtime.id}/`, 'g'), '');
            })
    }

    {
        (async () => {
            document.querySelector('#privme').checked = await (await fetch(`${apiUrl}/privateMe/${username}`, { headers: { authorization: token } })).json();
        })()
    }

    document.querySelector('#privme').addEventListener('change', (event) => {
        let on = event.currentTarget.checked;

        fetch(`${apiUrl}/privateMe/${username}/${on}`, {method:'put', headers: { authorization: token },  })
    });
});

function showNoAuthMessage() {
    document.querySelector('#not-verified').style.display = 'inherit';
}

document.getElementById('link-uptime').onclick = () => {
    chrome.tabs.create({ url: `https://status.uptime-monitor.io/67497373f98a6334aaea672d` });
}
document.getElementById('link-donate').onclick = () => {
    chrome.tabs.create({ url: `https://buymeacoffee.com/waakul` });
}

(async () => {
    document.querySelector('#notifs').checked = (await chrome.storage.local.get(['notifs']))?.notifs ?? false
})();

document.querySelector('#notifs').addEventListener('change', (event) => {
    let on = event.currentTarget.checked;
    chrome.storage.local.set({ notifs: on })
    // Permissions must be requested from inside a user gesture, like a button's
    // click handler.
    chrome.permissions.request({
        permissions: ['notifications'],
    }, (granted) => {
        // The callback argument will be true if the user granted the permissions.
        console.log(granted)
        if(!granted) {
            chrome.storage.local.set({ notifs: false })
            document.querySelector('#notifs').checked = false;
        }
    });
});

(async () => {
    document.querySelector('#ping-sounds').checked = (await chrome.storage.local.get(['ping']))?.ping ?? false
    document.querySelector('#badges').checked = !((await chrome.storage.local.get(['badges']))?.badges ?? false)
})()

document.querySelector('#ping-sounds').addEventListener('change', (event) => {
    let on = event.currentTarget.checked;
    chrome.storage.local.set({ ping: on })
    // Permissions must be requested from inside a user gesture, like a button's
    // click handler.
});

document.querySelector('#badges').addEventListener('change', (event) => {
    let on = event.currentTarget.checked;
    chrome.storage.local.set({ badges: !on })
});