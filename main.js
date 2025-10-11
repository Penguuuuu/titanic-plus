// ==UserScript==
// @name         Titanic+
// @version      1.7.1
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
    const popupClosed = await GM.getValue('popupClosed', true);

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

    setWallpaper();

    if (url.includes('/account/settings/')) setSettings();
    const [
        checkboxClears,
        checkboxPPV1,
        checkboxPercent,
        checkboxLeftPanel,
        checkboxHitsPerPlay,
        checkboxScorePerPlay,
        checkboxRanksPercent,
        checkboxLogoPulse
    ] = await Promise.all([
        GM.getValue('checkboxClears', true),
        GM.getValue('checkboxPPV1', true),
        GM.getValue('checkboxPercent', true),
        GM.getValue('checkboxLeftPanel', true),
        GM.getValue('checkboxHitsPerPlay', true),
        GM.getValue('checkboxScorePerPlay', true),
        GM.getValue('checkboxRanksPercent', true),
        GM.getValue('checkboxLogoPulse', true)
    ]);
    if (checkboxLogoPulse) logoPulse();
    if (url.includes('/rankings/osu/clears') && checkboxPercent) setclearsPercentData();
    if (checkboxClears || checkboxPPV1) await getUserData();
    if (checkboxClears) await getMapData();
    if (url.includes('/u/')) {
        if (checkboxClears) setClearsData();
        if (checkboxPPV1) setPPV1Data();
        if (checkboxHitsPerPlay) setHitsPerPlayData();
        if (checkboxScorePerPlay) setScorePerPlayData();
        if (checkboxRanksPercent) setRanksPercentData();
        if (checkboxLeftPanel) setPlaystyleContainer();
        setLevelBar();
    }
})();

function displayPopup() {
    const popup = document.createElement('div');
    popup.style.maxWidth = '400px';
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
        <b>Version:</b> ${versionText}<br>
        <b>Updated:</b> ${new Date().toLocaleDateString()}<br>
        <b>Notes:</b><br>
        <ul style="margin-left: 12px;">
            <li>- Added Notes to the update popup</li>
            <li>- Simplified score per play</li>
        </ul>
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
    button.onmouseover = () => button.style.textDecoration = 'underline';
    button.onmouseout = () => button.style.textDecoration = 'none';
    button.onclick = async () => {
        await GM.setValue('popupClosed', true);
        popup.remove();
    };

    const link = document.createElement('a');
    link.href = 'https://github.com/Penguuuuu/titanic-plus/commits/main';
    link.textContent = 'Source';
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
    catch { return cachedMapData };
}

async function getUserData() {
    if (cachedUserData) return cachedUserData;

    try {
        const userId = Number(window.location.pathname.split('/u/')[1]);
        const response = await fetch(`https://api.titanic.sh/users/${userId}`);

        return cachedUserData = await response.json();
    }
    catch { return cachedUserData };
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
    const target = document.querySelector(`.profile-stats-element[title='Total notes hit.']`);
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

function setScorePerPlayData() {
    const stats = [
        {
            targetName: 'Ranked Score',
            name: 'Ranked',
            apiName: 'rscore',
        },
        {
            targetName: 'Total points',
            name: 'Total',
            apiName: 'tscore',
        },
    ];

    stats.forEach(({ name, targetName, apiName }) => {
        const target = document.querySelector(`h4.profile-stats-element[title^='${targetName}']`);
        if (!target) return;

        general.style.height = `${parseInt(general.style.height) + 35}px`;

        const header = document.createElement('h4');
        header.className = 'profile-stats-element';
        header.title = `Average ${name.toLowerCase()} score achieved per play`;
        target.after(document.createElement('br'), header);

        if (!cachedUserData) return header.innerHTML = `<b>${name} Score Per Play</b>: Failed to fetch`;
        else {
            const scorePerPlay = Math.round(cachedUserData.stats[modeIndex][apiName] / cachedUserData.stats[modeIndex].playcount);
            header.innerHTML = `<b>${name} Score Per Play</b>: ${scorePerPlay.toLocaleString()}`;
        }
    });
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

function setRanksPercentData() {
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

async function setLevelBar() {
    const target = document.querySelector('.level-bar');
    if (!target) return;

    const hue = await GM.getValue('levelBarHue', 0);
    target.style.filter = `hue-rotate(${hue}deg)`;
}

function logoPulse() {
    const target = document.querySelector('a[aria-label="Home"]');
    const logo = document.querySelector('.logo');
    if (!target  || !logo) return;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1) rotate(-2.5deg); opacity: 1; }
            1% { transform: scale(1.05) rotate(-2.5deg); opacity: 1; }
            100% { transform: scale(1) rotate(-2.5deg); opacity: 1; }
        }
        .pulse {
            animation: pulse .8s infinite ease-out;
            display: inline-block;
            z-index: 100;
        }

        @keyframes shadowPulse {
            0% { transform: scale(1) rotate(-2.5deg); opacity: 1; }
            50% { transform: scale(1.2) rotate(-2.5deg); opacity: 0; }
            100% { opacity: 0; }
        }
        .shadowPulse {
            animation: shadowPulse .8s infinite ease-out;
            display: inline-block;
            z-index: 99;
        }
    `;
    document.head.appendChild(style);

    const logoShadow = logo.cloneNode(true);
    logoShadow.classList.add('shadowPulse');
    logo.classList.add('pulse');

    target.appendChild(logoShadow)
}

async function setWallpaper() {
    const checkbox = await GM.getValue('checkboxWallpaper', false);
    const url = await GM.getValue('wallpaperUrl', '');
    const repeat = await GM.getValue('checkboxRepeat', false);
    const attachment = await GM.getValue('wallpaperAttachment', 'scroll');
    const size = await GM.getValue('wallpaperSize', 'auto');

    if (checkbox && url) {
        document.documentElement.style.backgroundImage = `url('${url}')`;
        document.documentElement.style.backgroundRepeat = repeat ? 'repeat' : 'no-repeat';
        document.documentElement.style.backgroundAttachment = attachment;
        document.documentElement.style.backgroundSize = size;
    }
    else {
        document.documentElement.style.backgroundImage = '';
        document.documentElement.style.backgroundRepeat = '';
        document.documentElement.style.backgroundAttachment = '';
        document.documentElement.style.backgroundSize = '';
    }
}

async function setSettings() {
    const target = document.querySelector('.sidebar');
    if (!target) return;

    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar-section settings-panel';
    sidebar.innerHTML = '<a>Titanic+</a>';
    target.appendChild(sidebar);

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
            target.appendChild(h1);
        }

        h1.textContent = 'Titanic+';

        function createSection(gmId, text) {
            const box = document.createElement('div');
            box.id = gmId;

            const heading = document.createElement('h2');
            heading.textContent = text;

            const section = document.createElement('div');
            section.className = 'section';

            box.append(heading, section);
            return { box, section };
        }

        async function createCheckbox(gmId, text, defaultValue = true) {
        const container = document.createElement('div');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = gmId;
        checkbox.checked = await GM.getValue(gmId, defaultValue);

        checkbox.addEventListener('change', async () => {
            await GM.setValue(gmId, checkbox.checked);

            if (gmId === 'checkboxWallpaper' || gmId === 'checkboxRepeat') setWallpaper();
            if (gmId === 'checkboxLogoPulse') {
                const logo = document.querySelector('.logo');
                const logoShadow = document.querySelector('.shadowPulse');

                if (checkbox.checked && !logo.classList.contains('pulse')) logoPulse();
                else {
                    logo.classList.remove('pulse');
                    logoShadow.remove();
                }
            }
        });

        const label = document.createElement('label');
        label.style.color = '#536482';
        label.textContent = ` ${text}`;

        if (gmId === 'checkboxLogoPulse') label.title = "Inspired by osu's 2007 pulsing logo";
        if (gmId === 'checkboxLeftPanel') label.title = "Inspired by osu's 2014 left panel design";

        container.append(checkbox, label);
        return container;
        }

        async function createDropdown({ text, options, gmId, defaultValue }) {
            const container = document.createElement('div');
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.gap = '5px';

            const label = document.createElement('label');
            label.style.color = '#536482';
            label.textContent = text;

            const select = document.createElement('select');
            options.forEach(o => {
                const option = document.createElement('option');
                option.value = o;
                option.textContent = o;
                select.append(option);
            });
            select.value = await GM.getValue(gmId, defaultValue);
            select.addEventListener('change', async () => {
                await GM.setValue(gmId, select.value);
                setWallpaper();
            });

            container.append(label, select);
            return container;
        }

        async function createLevelBar() {
            const container = document.createElement('div');
            container.style.marginTop = '30px';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '5px';
            container.style.alignItems = 'left';

            const title = document.createElement('h2');
            title.textContent = 'Level Bar Color';
            title.style.zIndex = 100;

            const levelBar = document.createElement('table');
            levelBar.style.height = '20px';
            levelBar.style.width = '300px';
            levelBar.style.border = 'solid 2px #ffa10d';
            levelBar.style.borderRadius = '2px';
            levelBar.style.padding = '0';

            const tr = document.createElement('tr');

            const td1 = document.createElement('td');
            td1.style.width = '100px';
            td1.style.backgroundColor = '#eacd5b';
            td1.style.fontWeight = 'bold';
            td1.style.boxShadow = '0 0 40px 5px #ffda00';
            td1.style.borderRight = '2px solid #ffa10d';
            td1.style.textAlign = 'right';
            td1.textContent = 'Example';

            const td2 = document.createElement('td');
            td2.style.backgroundColor = 'white';

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.style.width = '300px';
            slider.min = 0;
            slider.max = 359;
            slider.value = await GM.getValue('levelBarHue', 0);
            levelBar.style.filter = `hue-rotate(${slider.value}deg)`;
            slider.addEventListener('input', async () => {
                levelBar.style.filter = `hue-rotate(${slider.value}deg)`;
                await GM.setValue('levelBarHue', slider.value);
                await GM.setValue('', false);
            });
            slider.style.zIndex = 100;
            slider.style.boxShadow = 'none';

            tr.append(td1, td2);
            levelBar.appendChild(tr);
            container.append(title, levelBar, slider);
            return container;
        }

        async function createWallpapersection() {
            const container = document.createElement('div');
            container.style.marginTop = '30px';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '5px';

            const title = document.createElement('h2');
            title.textContent = 'Wallpaper';

            const checkboxWallpaper = await createCheckbox('checkboxWallpaper', 'Display wallpaper', false);

            const inputUrl = document.createElement('input');
            inputUrl.type = 'text';
            inputUrl.style.width = '300px';
            inputUrl.id = 'inputWallpaper';
            inputUrl.value = await GM.getValue('wallpaperUrl', '');
            inputUrl.addEventListener('input', async () => {
                await GM.setValue('wallpaperUrl', inputUrl.value);
                setWallpaper();
            });

            const checkboxRepeat = await createCheckbox('checkboxRepeat', 'Repeat', false);

            const attachmentDropdown = await createDropdown({
                text: 'Attachment:',
                options: ['fixed', 'scroll'],
                gmId: 'wallpaperAttachment',
                defaultValue: 'fixed'
            });

            const sizeDropdown = await createDropdown({
                text: 'Size:',
                options: ['auto', 'cover', 'contain'],
                gmId: 'wallpaperSize',
                defaultValue: 'auto'
            });

            container.append(title, checkboxWallpaper, inputUrl, attachmentDropdown, sizeDropdown, checkboxRepeat);
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
            await createCheckbox('checkboxLogoPulse', `Pulsing Titanic logo`),
            await createCheckbox('checkboxPercent', 'Show percent values for clears leaderboard'),
            await createCheckbox('checkboxLeftPanel', 'Use altered left panel on user profile'),
            await createLevelBar(),
            await createWallpapersection()
        );

        target.append(profileBox.box, otherBox.box);
    });
}