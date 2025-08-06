// ==UserScript==
// @name         Titanic Completion
// @version      1.4
// @author       Patchouli
// @match        https://osu.titanic.sh/u/*
// @match        https://osu.titanic.sh/account/settings/*
// @include      https://osu.titanic.sh/rankings/*/clears*
// @grant        GM_xmlhttpRequest
// @grant        GM.setValue
// @grant        GM.getValue
// @updateURL    https://raw.githubusercontent.com/Penguuuuu/titanic-completion/main/main.js
// @downloadURL  https://raw.githubusercontent.com/Penguuuuu/titanic-completion/main/main.js
// ==/UserScript==

GM_xmlhttpRequest({
    method: "GET",
    url: "https://raw.githubusercontent.com/Penguuuuu/titanic-completion/refs/heads/main/main.js",
    onload: function(response) {
        eval(response.responseText);
    }
});
