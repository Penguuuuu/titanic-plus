// ==UserScript==
// @name         Titanic+
// @version      1.6.4
// @author       Patchouli
// @match        https://osu.titanic.sh/*
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
let versionText;
let titleText;

(async () => {
    const currentVersion = GM_info.script.version;
    const oldVersion = await GM.getValue('oldVersion', 0);
    const popupClosed = await GM.getValue("popupClosed", true);

    if (oldVersion !== currentVersion || !popupClosed) {
        await GM.setValue('popupClosed', false);
        if (!oldVersion) {
            versionText = currentVersion;
            titleText = 'Titanic+ Installed';
        }
        else {
            versionText = `${oldVersion} > ${currentVersion}`;
            titleText = 'Titanic+ Updated';
        }

        displayPopup();
        await GM.setValue('oldVersion', currentVersion);
    }

    if (url.includes('/account/settings/')) setSettings();
    const [
        checkboxClears,
        checkboxPPV1,
        checkboxPercent,
        checkboxLeftPanel,
        checkboxHitsPerPlay,
        checkboxScorePerPlay,
        checkboxRanksPercent
    ] = await Promise.all([
        GM.getValue('checkboxClears', true),
        GM.getValue('checkboxPPV1', true),
        GM.getValue('checkboxPercent', true),
        GM.getValue('checkboxLeftPanel', true),
        GM.getValue('checkboxHitsPerPlay', true),
        GM.getValue('checkboxScorePerPlay', true),
        GM.getValue('checkboxRanksPercent', true)
    ]);
    if (url.includes('/u/') && checkboxLeftPanel) setPlaystyleContainer();
    if (url.includes('/rankings/osu/clears') && checkboxPercent) setclearsPercentData();
    if (checkboxClears || checkboxPPV1) await getUserData();
    if (checkboxClears) await getMapData();
    if (url.includes('/u/')) {
        if (checkboxClears) setClearsData();
        if (checkboxPPV1) setPPV1Data();
        if (checkboxHitsPerPlay) setHitsPerPlayData();
        if (checkboxScorePerPlay) {
            setTotalScorePerPlay();
            setRankedScorePerPlay();
        }
        if (checkboxRanksPercent) setRanksPercent();
    }
})();

function displayPopup() {
    const popup = document.createElement('div');
    popup.style.position = 'fixed';
    popup.style.top = '20px';
    popup.style.right = '20px';
    popup.style.fontSize = '13.7914px';
    popup.style.backgroundColor = '#f0ecfa';
    popup.style.color = '#000000';
    popup.style.padding = '10px 15px';
    popup.style.borderRadius = '5px';
    popup.style.border = 'solid 2px #5c559c';
    popup.innerHTML = `
        <b>${titleText}</b><br>
        Version: ${versionText}<br>
        Updated: ${new Date().toLocaleDateString()}<br>
    `;

    const button = document.createElement('button');
    button.textContent = 'Close';
    button.style.marginTop = '5px';
    button.style.padding = '4px 8px';
    button.style.color = 'white';
    button.style.backgroundColor = '#5c559c';
    button.style.borderRadius = '5px';
    button.style.border = 'none';
    button.style.cursor = 'pointer';
    button.onclick = async () => {
        await GM.setValue('popupClosed', true);
        popup.remove();
    };

    const link = document.createElement('a');
    link.href = 'https://github.com/Penguuuuu/titanic-plus/commits/main';
    link.textContent = 'Notes';
    link.target = '_blank';
    link.style.marginTop = '5px';
    link.style.marginLeft = '5px';
    link.style.color = '#3843a6';
    link.onmouseover = () => link.style.textDecoration = 'underline';
    link.onmouseout = () => link.style.textDecoration = 'none';

    popup.append(button, link);
    document.body.appendChild(popup);
}

async function getMapData() {
    if (cachedMapData) return cachedMapData;

    try {
        const response = await fetch(`https://api.titanic.sh/stats`);
        const data = await response.json();

        const modeData = data.beatmap_modes[modeIndex];
        const standardData = data.beatmap_modes[0];
        if (modeIndex !== 0) return cachedMapData = modeData.count_qualified + modeData.count_approved + modeData.count_ranked + modeData.count_loved + standardData.count_qualified + standardData.count_approved + standardData.count_ranked + standardData.count_loved;
        else return cachedMapData = standardData.count_qualified + standardData.count_approved + standardData.count_ranked + standardData.count_loved;
    }
    catch {return cachedMapData};
}

async function getUserData() {
    if (cachedUserData) return cachedUserData;

    try {
        const userId = Number(window.location.pathname.match(/\/u\/(\d+)/)?.[1]);
        const response = await fetch(`https://api.titanic.sh/users/${userId}`);

        return cachedUserData = await response.json();
    }
    catch {return cachedUserData};
}

function setClearsData() {
    const target = document.querySelector('.profile-detailed-stats h3.profile-stats-header');
    if (!target) return;

    general.style.height = `${parseInt(general.style.height) + 35}px`;

    const header = document.createElement('h4');
    header.className = 'profile-stats-element';
    header.title = 'All qualified, approved, ranked, and loved maps. Converts are included for non-standard modes.';
    target.after(header, document.createElement('br'));

    if (!cachedUserData || !cachedMapData) header.innerHTML = `<b>Clears</b>: Failed to fetch`;

    const clears = cachedUserData.rankings[modeIndex].clears;
    clears.value = Math.max(0, cachedUserData.rankings[modeIndex].clears.value);
    header.innerHTML = `<b>Clears</b>: ${clears.value.toLocaleString()} / ${cachedMapData.toLocaleString()} | ${(clears.value / cachedMapData * 100).toFixed(3)}% (#${clears.global})`;

    if (clears.global <= 100) header.style.color = '#0e3062';
}

function setHitsPerPlayData() {
    const target = document.querySelector('.profile-stats-element[title="Total notes hit."]');
    if (!target) return;

    general.style.height = `${parseInt(general.style.height) + 35}px`;

    const header = document.createElement('h4');
    header.className = 'profile-stats-element';
    header.title = 'Notes hit per play';
    target.after(document.createElement('br'), header);

    if (!cachedUserData) header.innerHTML = `<b>Hits Per Play</b>: Failed to fetch`;

    const hitsPerPlay = Math.round(cachedUserData.stats[modeIndex].total_hits / cachedUserData.stats[modeIndex].playcount);
    header.innerHTML = `<b>Hits Per Play</b>: ${hitsPerPlay.toLocaleString()}`;
}

function setRankedScorePerPlay() {
    const target = document.querySelector('h4.profile-stats-element[title^="Ranked Score"]');
    if (!target) return;

    general.style.height = `${parseInt(general.style.height) + 35}px`;

    const header = document.createElement('h4');
    header.className = 'profile-stats-element';
    header.title = 'The average ranked score achieved per play';
    target.after(document.createElement('br'), header);

    if (!cachedUserData) header.innerHTML = `<b>Ranked Score Per Play</b>: Failed to fetch`;

    const rankedScorePerPlay = Math.round(cachedUserData.stats[modeIndex].rscore / cachedUserData.stats[modeIndex].playcount);
    header.innerHTML = `<b>Ranked Score Per Play</b>: ${rankedScorePerPlay.toLocaleString()}`;
}

function setTotalScorePerPlay() {
    const target = document.querySelector('h4.profile-stats-element[title^="Total points"]');
    if (!target) return;

    general.style.height = `${parseInt(general.style.height) + 35}px`;

    const header = document.createElement('h4');
    header.className = 'profile-stats-element';
    header.title = 'The average ranked score achieved per play';
    target.after(document.createElement('br'), header);

    if (!cachedUserData) header.innerHTML = `<b>Total Score Per Play</b>: Failed to fetch`;

    const totalScorePerPlay = Math.round(cachedUserData.stats[modeIndex].tscore / cachedUserData.stats[modeIndex].playcount);
    header.innerHTML = `<b>Total Score Per Play</b>: ${totalScorePerPlay.toLocaleString()}`;
}

function setPPV1Data() {
    const target = document.querySelector('.profile-performance');
    if (!target) return;

    general.style.height = `${parseInt(general.style.height) + 22}px`;

    const header = document.createElement('div');
    header.className = 'profile-performance';
    target.after(header);
    if (!cachedUserData) header.innerHTML = '<b>PPv1:</b> Failed to fetch';

    const ppv1 = cachedUserData.rankings[modeIndex].ppv1;
    header.innerHTML = `<b>PPv1: ${Math.max(0, ppv1.value).toLocaleString()}pp (#${ppv1.global})</b>`;
}

function setRanksPercent() {
    const target = document.querySelector('.profile-ranks');
    if (!target) return;

    const tds = target.querySelectorAll('tbody td:nth-child(even)');

    let total = 0;
    tds.forEach(rank => { total += Number(rank.textContent) });
    tds.forEach(td => td.innerHTML += `<br>(${total ? Math.round((Number(td.textContent) / total) * 100) : 0}%)`);
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
    const playstyle = document.querySelector('.playstyle-container')
    if (!target || !playstyle) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'profile-left-wrapper';
    wrapper.style.position = 'sticky';
    wrapper.style.float = 'left';
    wrapper.style.top = 0;

    const leftBottom = document.querySelector('.left-bottom')
    leftBottom.style.margin = '0 10px 0 10px';

    playstyle.style.display = 'flex';
    playstyle.style.justifyContent = 'center';
    playstyle.style.alignItems = 'center';
    playstyle.style.background = '#dad7fb';
    playstyle.style.padding = '5px';
    playstyle.style.gap = '5px';
    playstyle.style.margin = 0;
    playstyle.style.marginTop = '10px';

    const social = document.querySelector('.userpage-social');
    if (social.innerHTML.trim() === '') social.style.paddingBottom = 0;

    if (playstyle) target.style.float = 'none';

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

        if (url.includes('https://osu.titanic.sh/account/settings/friends')) {
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
            await createCheckbox('checkboxHitsPerPlay', 'Show Hits Per Play on profile'),
            await createCheckbox('checkboxScorePerPlay', 'Show Ranked/Total Score Per Play on profile'),
            await createCheckbox('checkboxRanksPercent', 'Display percentages for ranks')
        );

        const otherBox = createSection('other-box', 'Other');
        otherBox.section.append (
            await createCheckbox('checkboxPercent', 'Show percent values for clears leaderboard'),
            await createCheckbox('checkboxLeftPanel', 'Use altered left panel on user profile')
        );

        target.append(profileBox.box, otherBox.box);
    });
}