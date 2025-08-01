// ==UserScript==
// @name         Titanic Completion
// @version      1.3
// @author       Patchouli
// @match        https://osu.titanic.sh/u/*
// @include      https://osu.titanic.sh/rankings/*/clears*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/Penguuuuu/titanic-completion/main/main.js
// @downloadURL  https://raw.githubusercontent.com/Penguuuuu/titanic-completion/main/main.js
// ==/UserScript==

const modeIndex = Number(document.querySelector('.gamemode-button.active-mode')?.id?.slice(3));

(async () => {
    const target = document.querySelector('.profile-detailed-stats h3.profile-stats-header');
    const general = document.getElementById('general');

    if (target) {
        general.style.height = `${parseInt(general.style.height) + 35}px`;

        const completionHeader = document.createElement('h4');
        completionHeader.className = 'profile-stats-element';
        completionHeader.title = 'All qualified, approved, ranked, and loved maps. Converts are included for non-standard modes.';
        completionHeader.innerHTML = `<b>Completion</b>: Loading...`;
        target.after(completionHeader);
        completionHeader.after(document.createElement('br'));

        const [ranksCount, beatmapsCount] = await Promise.all([getClearsData(), getBeatmapsData()]);
        if (ranksCount === null || beatmapsCount === null) {
            completionHeader.innerHTML = `<b>Completion</b>: Failed to fetch`;
        }
        else {
            completionHeader.innerHTML = `<b>Completion</b>: ${ranksCount.value.toLocaleString()} / ${beatmapsCount.toLocaleString()} (${(ranksCount.value / beatmapsCount * 100).toFixed(3)}%) #${ranksCount.global}`;
        }
    }
})();

async function getBeatmapsData() {
    try {
        const response = await fetch(`https://api.titanic.sh/stats`);
        const data = await response.json();

        const modeData = data.beatmap_modes[modeIndex];
        const standardData = data.beatmap_modes[0];
        if (modeIndex !== 0){
            return modeData.count_qualified + modeData.count_approved + modeData.count_ranked + modeData.count_loved + standardData.count_qualified + standardData.count_approved + standardData.count_ranked + standardData.count_loved;
        }
        else {
            return standardData.count_qualified + standardData.count_approved + standardData.count_ranked + standardData.count_loved;
        }
    }
    catch {
        return null;
    }
}

async function getClearsData() {
    try {
        const userId = Number(window.location.pathname.match(/\/u\/(\d+)/)?.[1]);
        const response = await fetch(`https://api.titanic.sh/users/${userId}`);
        const data = await response.json();

        return data.rankings[modeIndex].clears;
    }
    catch {
        return null;
    }
}

(async () => {
    const target = document.querySelectorAll('table.player-listing tbody tr');

    if (target) {
        target.forEach(row => {
            const cell = row.cells[4];
            const text = cell.textContent.trim();
            const match = text.match(/([\d,]+)\s*\/\s*([\d,]+)/);

            const [, c, t] = match;
            const count = +c.split(',').join('');
            const total = +t.split(',').join('');

            const percent = ((count / total) * 100).toFixed(3);
            cell.innerHTML = `<b>${text} (${percent}%)</b>`;
        });
    }
})();
