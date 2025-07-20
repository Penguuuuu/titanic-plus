// ==UserScript==
// @name         Titanic Completion
// @version      1.1
// @author       Patchouli
// @match        https://osu.titanic.sh/u/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/Penguuuuu/titanic-completion/main/main.js
// @downloadURL  https://raw.githubusercontent.com/Penguuuuu/titanic-completion/main/main.js
// ==/UserScript==

(async function () {
    const target = document.querySelector('.profile-detailed-stats h3.profile-stats-header');
    const general = document.getElementById('general');

    if (target && general) {
        general.style.height = '943px';

        const completionHeader = document.createElement('h4');
        completionHeader.className = 'profile-stats-element';
        completionHeader.title = 'For modes other than standard, all maps for the selected mode and converts are summed';
        completionHeader.innerHTML = `<b>Completion</b>: Loading...`;
        target.insertAdjacentElement('afterend', completionHeader);
        completionHeader.insertAdjacentElement('afterend', document.createElement('br'));

        const [ranksCount, mapsCount] = await Promise.all([getRanksData(), getBeatmapsData()]);
        if (ranksCount === null || mapsCount === null) {
            completionHeader.innerHTML = `<b>Completion</b>: Failed to fetch`;
        }
        else {
            completionHeader.innerHTML = `<b>Completion</b>: ${ranksCount.toLocaleString()} / ${mapsCount.toLocaleString()} (${(ranksCount / mapsCount * 100).toFixed(3)}%)`;
        }
    }
})();

async function getBeatmapsData() {
    try {
        const response = await fetch(`https://api.titanic.sh/stats`);
        const data = await response.json();

        const modeIndex = parseInt(document.querySelector('.gamemode-button.active-mode')?.id?.slice(3) || '0', 10);
        const modeData = data.beatmap_modes[modeIndex];
        const standardData = data.beatmap_modes[0];
        if (modeIndex !== 0){
            return modeData.count_approved + modeData.count_qualified + modeData.count_ranked + modeData.count_loved + standardData.count_approved + standardData.count_qualified + standardData.count_ranked + standardData.count_loved;
        }
        else {
            return standardData.count_approved + standardData.count_qualified + standardData.count_ranked + standardData.count_loved;
        }
    }
    catch {
        return null;
    }
}

async function getRanksData() {
    try {
        const userId = parseInt(window.location.pathname.match(/\/u\/(\d+)/)?.[1] || '', 10);
        const response = await fetch(`https://api.titanic.sh/users/${userId}`);
        const data = await response.json();

        const modeIndex = parseInt(document.querySelector('.gamemode-button.active-mode')?.id?.slice(3) || '0', 10);
        const modeData = data.stats.find(stat => stat.mode === modeIndex);
        return ( modeData.xh_count + modeData.x_count + modeData.sh_count + modeData.s_count + modeData.a_count + modeData.b_count + modeData.c_count + modeData.d_count );
    }
    catch {
        return null;
    }
}
