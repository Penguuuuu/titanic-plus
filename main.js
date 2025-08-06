// ==UserScript==
// @name         Titanic Completion
// @version      1.4
// @author       Patchouli
// @match        https://osu.titanic.sh/u/*
// @match        https://osu.titanic.sh/account/settings/*
// @include      https://osu.titanic.sh/rankings/*/clears*
// @grant        GM.setValue
// @grant        GM.getValue
// @updateURL    https://raw.githubusercontent.com/Penguuuuu/titanic-completion/main/main.js
// @downloadURL  https://raw.githubusercontent.com/Penguuuuu/titanic-completion/main/main.js
// ==/UserScript==

const modeIndex = Number(document.querySelector('.gamemode-button.active-mode')?.id?.slice(3));
const url = window.location.href;

(async () => {
    if (url.includes("https://osu.titanic.sh/u/") && await GM.getValue('profileCompletion', true)) {
        setCompletionData();
    }
    if (url.includes("https://osu.titanic.sh/rankings/osu/clears") && await GM.getValue('clearsPercent', true)) {
        setclearsPercentData();
    }
    if (url.includes("https://osu.titanic.sh/account/settings/")) {
        setSettings();
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

async function setCompletionData() {
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
            ranksCount.value = Math.max(0, ranksCount.value);
            completionHeader.innerHTML = `<b>Completion</b>: ${ranksCount.value.toLocaleString()} / ${beatmapsCount.toLocaleString()} (${(ranksCount.value / beatmapsCount * 100).toFixed(3)}%) #${ranksCount.global}`;
            
            if (ranksCount.global <= 100) {
                completionHeader.style.color = '#0e3062';
            }
        }
    }
}

async function setclearsPercentData() {
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
}

async function setSettings() {
    const target = document.querySelector('.sidebar');

    if (target) {
        const sidebar = document.createElement('div');
        sidebar.className = 'sidebar-section settings-panel';
        sidebar.innerHTML = '<a>Completion</a>';
        target.append(sidebar);

        sidebar.addEventListener('click', async () => {
            document.querySelector('.sidebar-section.selected-sidebar').classList.remove('selected-sidebar');
            sidebar.classList.add('selected-sidebar');

            let target;

            if (url.includes("https://osu.titanic.sh/account/settings/friends")) {
                document.querySelector('.friends-heading').remove();

                target = document.querySelector('.friends');
                target.className = 'main-settings';
                target.innerHTML = '';
            }
            else {
                target = document.querySelector('.main-settings');
                target.innerHTML = '';
            }

            let h1 = document.querySelector('h1');

            if (!h1) {
                h1 = document.createElement('h1');
                target.append(h1);
            }

            h1.textContent = 'Completion';

            const section = document.createElement('div');
            section.id = 'completion';
            section.className = 'section';

            const container = document.createElement('div');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = 'checkbox';
            checkbox.checked = await GM.getValue('profileCompletion', true);

            const label = document.createElement('label');
            label.style.color = '#536482';
            label.textContent = ' Show completion on profile';

            const container1 = document.createElement('div');
            const checkbox1 = document.createElement('input');
            checkbox1.type = 'checkbox';
            checkbox1.id = 'checkbox1';
            checkbox1.checked = await GM.getValue('clearsPercent', true);

            const label1 = document.createElement('label');
            label1.style.color = '#536482';
            label1.textContent = ' Show percentage for clears leaderboard';

            container.append(checkbox, label);
            container1.append(checkbox1, label1);
            section.append(container, container1);
            target.append(section);

            checkbox.addEventListener('change', () => {
                GM.setValue('profileCompletion', checkbox.checked);
            });

            checkbox1.addEventListener('change', () => {
                GM.setValue('clearsPercent', checkbox1.checked);
            });
        });
    }
}
