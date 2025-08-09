// ==UserScript==
// @name         Titanic+
// @version      1.5.3
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

let cachedMapData;
let cachedUserData;

(async () => {
    if (url.includes('/account/settings/')) {
        setSettings();
    }
    const [
        checkboxClears,
        checkboxAutopilot,
        checkboxRelax,
        checkboxPPV1,
        checkboxPercent,
        checkboxLeftPanel
    ] = await Promise.all([
        GM.getValue('checkboxClears', true),
        GM.getValue('checkboxAutopilot', false),
        GM.getValue('checkboxRelax', false),
        GM.getValue('checkboxPPV1', true),
        GM.getValue('checkboxPercent', true),
        GM.getValue('checkboxLeftPanel', true)
    ]);
    if (url.includes('/u/') && checkboxLeftPanel) {
        setPlaystyleContainer();
    }
    if (url.includes('/rankings/osu/clears') && checkboxPercent) {
        setclearsPercentData();
    }
    if (checkboxClears || checkboxAutopilot || checkboxRelax || checkboxPPV1) {
        await getUserData();
    }
    if (checkboxClears) {
        await getMapData();
    }
    if (url.includes('/u/')) {
        if (checkboxClears) {
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

        return cachedUserData = await response.json();
    }
    catch {
        return cachedUserData;
    }
}

function setClearsData() {
    const target = document.querySelector('.profile-detailed-stats h3.profile-stats-header');
    if (!target) return;

    general.style.height = `${parseInt(general.style.height) + 35}px`;

    const header = document.createElement('h4');
    header.className = 'profile-stats-element';
    header.title = 'All qualified, approved, ranked, and loved maps. Converts are included for non-standard modes.';
    target.after(header, document.createElement('br'));

    if (!cachedUserData || !cachedMapData) {
        header.innerHTML = `<b>Clears</b>: Failed to fetch`;
    }

    const clears = cachedUserData.rankings[modeIndex].clears;
    clears.value = Math.max(0, cachedUserData.rankings[modeIndex].clears.value);
    header.innerHTML = `<b>Clears</b>: ${clears.value.toLocaleString()} / ${cachedMapData.toLocaleString()} | ${(clears.value / cachedMapData * 100).toFixed(3)}% (#${clears.global})`;

    if (clears.global <= 100) {
        header.style.color = '#0e3062';
    }
}

function setPPV1Data() {
    const target = document.querySelector('.profile-performance');
    if (!target) return;

    general.style.height = `${parseInt(general.style.height) + 22}px`;

    const header = document.createElement('div');
    header.className = 'profile-performance';
    target.after(header);

    if (!cachedUserData) {
        header.innerHTML = `<b>PPv1:</b> Failed to fetch`;
    }

    const ppv1 = cachedUserData.rankings[modeIndex].ppv1;
    header.innerHTML = `<b>PPv1: ${Math.max(0, ppv1.value).toLocaleString()}pp (#${ppv1.global})</b>`;
}

function setRelaxData() {
    const target = document.querySelector('.profile-performance');
    if (!target) return;

    general.style.height = `${parseInt(general.style.height) + 22}px`;

    const header = document.createElement('div');
    header.className = 'profile-performance';
    target.after(header);

    if (!cachedUserData) {
        header.innerHTML = `<b>RX:</b> Failed to fetch`;
    }

    const pprx = cachedUserData.rankings[modeIndex].pprx;
    header.innerHTML = `<b>RX: ${Math.max(0, pprx.value).toLocaleString()}pp (#${pprx.global})</b>`;
}

function setAutopilotData() {
    const target = document.querySelector('.profile-performance');
    if (!target) return;

    general.style.height = `${parseInt(general.style.height) + 22}px`;

    const header = document.createElement('div');
    header.className = 'profile-performance';
    target.after(header);

    if (!cachedUserData) {
        header.innerHTML = `<b>AP:</b> Failed to fetch`;
    }

    const ppap = cachedUserData.rankings[modeIndex].ppap;
    header.innerHTML = `<b>AP: ${Math.max(0, ppap.value).toLocaleString()}pp (#${ppap.global})</b>`;
}

function setclearsPercentData() {
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

function setPlaystyleContainer() {

    const target = document.querySelector('.profile-left');
    if (!target) return;

    target.style.float = 'none';

    
    const wrapper = document.createElement('div');
    wrapper.className = 'profile-left-wrapper';
    wrapper.style.position = 'sticky';
    wrapper.style.float = 'left';
    wrapper.style.top = 0;

    const leftBottom = document.querySelector('.left-bottom')
    leftBottom.style.margin = '10px 10px 0 10px';

    const playstyle = document.querySelector('.playstyle-container')
    playstyle.style.display = 'flex';
    playstyle.style.justifyContent = 'center';
    playstyle.style.alignItems = 'center';
    playstyle.style.background = '#dad7fb';
    playstyle.style.padding = '5px';
    playstyle.style.gap = '5px';
    playstyle.style.margin = 0;
    playstyle.style.marginTop = '15px';
    
    target.parentNode.insertBefore(wrapper, target);
    wrapper.append(target, playstyle);
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

        function createSection(id, text) {
            const box = document.createElement('div');
            box.id = id;

            const heading = document.createElement('h2');
            heading.textContent = text;

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

        const profileBox = createSection('profile-box', 'Profile');
        profileBox.section.append (
            await createCheckbox('checkboxClears', 'Show clears on profile'),
            await createCheckbox('checkboxPPV1', 'Show PPv1 on profile'),
            await createCheckbox('checkboxRelax', 'Show relax PP on profile'),
            await createCheckbox('checkboxAutopilot', 'Show autopilot PP on profile'),
        );

        const otherBox = createSection('other-box', 'Other');
        otherBox.section.append (
            await createCheckbox('checkboxPercent', 'Show percent values for clears leaderboard'),
            await createCheckbox('checkboxLeftPanel', 'Use altered left panel on user profile')
        );

        target.append(profileBox.box, otherBox.box);
    });
}