// ==UserScript==
// @name         Titanic+
// @version      1.4.7
// @author       Patchouli
// @match        https://osu.titanic.sh/u/*
// @match        https://osu.titanic.sh/account/settings/*
// @include      https://osu.titanic.sh/rankings/*/clears*
// @grant        GM_xmlhttpRequest
// @grant        GM.setValue
// @grant        GM.getValue
// @updateURL    https://raw.githubusercontent.com/Penguuuuu/titanic-plus/main/main.js
// @downloadURL  https://raw.githubusercontent.com/Penguuuuu/titanic-plus/main/main.js
// ==/UserScript==

const modeIndex = Number(document.querySelector('.gamemode-button.active-mode')?.id.slice(3));
const url = window.location.href;
const general = document.getElementById('general');

let cachedMapData = null;
let cachedUserData = null;
let rankedScoreIndex = 1;
let totalScoreIndex = 5;

(async () => {
    const [
        checkboxClears,
        checkboxAutopilot,
        checkboxRelax,
        checkboxPPV1,
        checkboxRankedScore,
        checkboxTotalScore,
        checkboxPercent
    ] = await Promise.all([
        GM.getValue('checkboxClears', true),
        GM.getValue('checkboxAutopilot', false),
        GM.getValue('checkboxRelax', false),
        GM.getValue('checkboxPPV1', true),
        GM.getValue('checkboxRankedScore', true),
        GM.getValue('checkboxTotalScore', true),
        GM.getValue('checkboxPercent', true),
    ]);
    if (url.includes("https://osu.titanic.sh/u/")) {
        if (checkboxClears) {
            rankedScoreIndex += 1;
            totalScoreIndex += 1;
            setClearsData();
        }
        if (checkboxAutopilot) {
            setAutopilotData();
        }
        if (checkboxRelax) {
            setRelaxData();
        }
        if (checkboxPPV1) {
            setPPV1Data();
        }
        if (checkboxRankedScore) {
            setRankedScoreData();
        }
        if (checkboxTotalScore) {
            setTotalScoreData();
        }
    }
    if (url.includes("https://osu.titanic.sh/rankings/osu/clears") && checkboxPercent) {
        setclearsPercentData();
    }
    if (url.includes("https://osu.titanic.sh/account/settings/")) {
        setSettings();
    }
})();

async function getMapData() {
    if (cachedMapData) return cachedMapData;

    try {
        const response = await fetch(`https://api.titanic.sh/stats`);
        const data = await response.json();

        const modeData = data.beatmap_modes[modeIndex];
        const standardData = data.beatmap_modes[0];
        if (modeIndex !== 0) {
            return cachedMapData = modeData.count_qualified + modeData.count_approved + modeData.count_ranked + modeData.count_loved + standardData.count_qualified + standardData.count_approved + standardData.count_ranked + standardData.count_loved;
        }
        else {
            return cachedMapData = standardData.count_qualified + standardData.count_approved + standardData.count_ranked + standardData.count_loved;
        }
    }
    catch {
        return cachedMapData;
    }
}

async function getUserData() {
    if (cachedUserData) return cachedUserData;

    try {
        const userId = Number(window.location.pathname.match(/\/u\/(\d+)/)?.[1]);
        const response = await fetch(`https://api.titanic.sh/users/${userId}`);

        return cachedUserData = response.json();
    }
    catch {
        return cachedUserData;
    }
}

async function setClearsData() {
    const target = document.querySelector('.profile-detailed-stats h3.profile-stats-header');
    if (!target) return;

    general.style.height = `${parseInt(general.style.height) + 35}px`;

    const header = document.createElement('h4');
    header.className = 'profile-stats-element';
    header.title = 'All qualified, approved, ranked, and loved maps. Converts are included for non-standard modes.';
    header.innerHTML = `<b>Clears</b>: Loading...`;
    target.after(header, document.createElement('br'));

    const [userData, mapData] = await Promise.all([getUserData(), getMapData()]);
    if (!userData || !mapData) {
        header.innerHTML = `<b>Clears</b>: Failed to fetch`;
    }

    const clears = userData.rankings[modeIndex].clears;
    clears.value = Math.max(0, userData.rankings[modeIndex].clears.value);
    header.innerHTML = `<b>Clears</b>: ${clears.value.toLocaleString()} / ${mapData.toLocaleString()} (${(clears.value / mapData * 100).toFixed(3)}%) #${clears.global}`;

    if (clears.global <= 100) {
        header.style.color = '#0e3062';
    }
}

async function setPPV1Data() {
    const target = document.querySelector('.profile-performance');
    if (!target) return;

    general.style.height = `${parseInt(general.style.height) + 22}px`;

    const header = document.createElement('div');
    header.className = 'profile-performance';
    header.innerHTML = `<b>Performance (PPv1)</b>: Loading...`;
    target.after(header);

    const data = await getUserData();
    if (!data) {
        header.innerHTML = `<b>Performance (PPv1)</b>: Failed to fetch`;
    }

    const ppv1 = data.rankings[modeIndex].ppv1;
    header.innerHTML = `<b>Performance (PPv1): ${Math.max(0, ppv1.value).toLocaleString()}pp</b> #${ppv1.global}`;
}

async function setRelaxData() {
    const target = document.querySelector('.profile-performance');
    if (!target) return;

    general.style.height = `${parseInt(general.style.height) + 22}px`;

    const header = document.createElement('div');
    header.className = 'profile-performance';
    header.innerHTML = `<b>Performance (RX)</b>: Loading...`;
    target.after(header);

    const data = await getUserData();
    if (!data) {
        header.innerHTML = `<b>Performance (RX)</b>: Failed to fetch`;
    }

    const pprx = data.rankings[modeIndex].pprx;
    header.innerHTML = `<b>Performance (RX): ${Math.max(0, pprx.value).toLocaleString()}pp</b> #${pprx.global}`;
}

async function setAutopilotData() {
    const target = document.querySelector('.profile-performance');
    if (!target) return;

    general.style.height = `${parseInt(general.style.height) + 22}px`;

    const header = document.createElement('div');
    header.className = 'profile-performance';
    header.innerHTML = `<b>Performance (AP)</b>: Loading...`;
    target.after(header);

    const data = await getUserData();
    if (!data) {
        header.innerHTML = `<b>Performance (AP)</b>: Failed to fetch`;
    }

    const ppap = data.rankings[modeIndex].ppap;
    header.innerHTML = `<b>Performance (AP): ${Math.max(0, ppap.value).toLocaleString()}pp</b> #${ppap.global}`;
}

async function setRankedScoreData() {
    const target = document.querySelector(`.profile-detailed-stats > h4:nth-of-type(${rankedScoreIndex})`);
    if (!target) return;

    const data = await getUserData();
    target.innerHTML += ` #${data.rankings[modeIndex].rscore.global}`;
}

async function setTotalScoreData() {
    const target = document.querySelector(`.profile-detailed-stats > h4:nth-of-type(${totalScoreIndex})`);
    if (!target) return;

    const { rankings } = await getUserData();
    target.innerHTML += ` #${rankings[modeIndex].tscore.global}`;
}

async function setclearsPercentData() {
    const target = document.querySelectorAll('table.player-listing tbody tr');
    if (!target) return;

    target.forEach(row => {
        const cell = row.cells[4];
        const text = cell.textContent.trim();
        const match = text.match(/([\d,]+)\s*\/\s*([\d,]+)/);

        const [, c, t] = match;
        const count = Number(c.replace(/,/g, ''));
        const total = Number(t.replace(/,/g, ''));

        const percent = ((count / total) * 100).toFixed(3);
        cell.innerHTML = `<b>${text} (${percent}%)</b>`;
    });
}

async function setSettings() {
    const target = document.querySelector('.sidebar');
    if (!target) return;

    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar-section settings-panel';
    sidebar.innerHTML = '<a>Titanic+</a>';
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

        h1.textContent = 'Titanic+';

        function createSection(title, id) {
            const box = document.createElement('div');
            box.id = id;

            const heading = document.createElement('h2');
            heading.textContent = title;

            const section = document.createElement('div');
            section.className = 'section';

            box.append(heading, section);
            return {box, section};
        }

        async function createCheckbox(id, text) {
        const container = document.createElement('div');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = id;
        checkbox.checked = await GM.getValue(id, true);

        checkbox.addEventListener('change', () => GM.setValue(id, checkbox.checked));

        const label = document.createElement('label');
        label.style.color = '#536482';
        label.textContent = ` ${text}`;

        container.append(checkbox, label);
        return container;
        }

        const profileBox = createSection('Profile', 'profile-box');
        profileBox.section.append (
            await createCheckbox('checkboxClears', 'Show clears on profile'),
            await createCheckbox('checkboxPPV1', 'Show PPv1 on profile'),
            await createCheckbox('checkboxRelax', 'Show relax PP on profile'),
            await createCheckbox('checkboxAutopilot', 'Show autopilot PP on profile'),
            await createCheckbox('checkboxRankedScore', 'Show rank for ranked score on profile'),
            await createCheckbox('checkboxTotalScore', 'Show rank for total score on profile')
        );

        const otherBox = createSection('Other', 'other-box');
        otherBox.section.append (
            await createCheckbox('checkboxPercent', 'Show percent values for clears leaderboard')
        );

        target.append(profileBox.box, otherBox.box);
    });
}