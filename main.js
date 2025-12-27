// ==UserScript==
// @name         Titanic+
// @version      1.7.9
// @author       Patchouli
// @match        https://osu.titanic.sh/*
// @grant        GM_xmlhttpRequest
// @grant        GM.setValue
// @grant        GM.getValue
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/Penguuuuu/titanic-plus/main/main.js
// @downloadURL  https://raw.githubusercontent.com/Penguuuuu/titanic-plus/main/main.js
// ==/UserScript==

const url = window.location.href;
let general;
let modeIndex;

let cachedMapData;
let cachedUserData;
let versionText;
let titleText;

(async () => {
    await preload();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ready);
        return;
    }

    await ready();
})();

async function preload() {
    const checkboxPeppyStyle = await GM.getValue('checkboxPeppyStyle', false);

    if (checkboxPeppyStyle) setPeppyStyle();

    setWallpaper();
}

async function ready() {
    general = document.getElementById('general');
    modeIndex = Number(document.querySelector('.gamemode-button.active-mode')?.id.slice(3));

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
    }

    setWallpaper();

    const [
        checkboxClears,
        checkboxPPV1,
        checkboxPercent,
        checkboxHitsPerPlay,
        checkboxScorePerPlay,
        checkboxRanksPercent,
        checkboxMapDetails,
        checkboxLogoPulse,
        // checkboxCustomCursor
    ] = await Promise.all([
        GM.getValue('checkboxClears', true),
        GM.getValue('checkboxPPV1', true),
        GM.getValue('checkboxPercent', true),
        GM.getValue('checkboxHitsPerPlay', true),
        GM.getValue('checkboxScorePerPlay', true),
        GM.getValue('checkboxRanksPercent', true),
        GM.getValue('checkboxMapDetails', false),
        GM.getValue('checkboxLogoPulse', true),
        // GM.getValue('checkboxCustomCursor', false)
    ]);

    if (checkboxLogoPulse) logoPulse();
    // if (checkboxCustomCursor) setCustomCursor();
    if (url.includes('/account')) setSettings();
    if (url.includes('/clears') && checkboxPercent) setclearsPercentData();
    if (url.includes('/country')) setCountryData();
    if (url.includes('/u/')) {
        if (checkboxClears) await getMapData();
        if (checkboxClears || checkboxPPV1) await getUserData();
        if (checkboxClears) setClearsData();
        if (checkboxPPV1) setPPV1Data();
        if (checkboxHitsPerPlay) setHitsPerPlayData();
        if (checkboxScorePerPlay) setScorePerPlayData();
        if (checkboxRanksPercent) setRanksPercentData();
        setLevelBar();
    }
    if (url.includes('/b/')) {
        if (checkboxMapDetails) await getMapLeaderboardData();
    }
}

function displayPopup() {
    const style = document.createElement('style');
    style.textContent = `
        .popup-titanic-plus {
            max-width: 400px;
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 15px;
            background-color: #f0ecfa;
            color: #000;
            border: solid 2px #5c559c;
            border-radius: 5px;
            font-size: 13.7914px;
        }
        .button-popup-titanic-plus {
            margin-top: 5px;
            padding: 4px 8px;
            color: #fff;
            background-color: #5c559c;
            border-radius: 5px;
        }
        .button-popup-titanic-plus:hover {
            text-decoration: underline;
        }
        .link-popup-titanic-plus {
            margin-top: 5px;
            margin-left: 5px;
            color: #3843a6;
        }
        .link-popup-titanic-plus:hover {
            text-decoration: underline;
        }
    `;
    document.head.appendChild(style);

    const popup = document.createElement('div');
    popup.classList.add('popup-titanic-plus');
    popup.innerHTML = `
        <b>${titleText}</b><br>
        <b>Version:</b> ${versionText}<br>
        <b>Updated:</b> ${new Date().toLocaleDateString()}<br>
        <b>Notes:</b><br>
        <ul style="margin-left: 12px; list-style: none;">
            <li>- Remove Kamui cursor (for now)</li>
            <li>- Fix DOM issues</li>
        </ul>
    `;

    const button = document.createElement('button');
    button.classList.add('button-popup-titanic-plus');
    button.textContent = 'Close';
    button.onclick = async () => {
        await GM.setValue('popupClosed', true);
        await GM.setValue('oldVersion', GM_info.script.version);
        popup.remove();
    };

    const link = document.createElement('a');
    link.classList.add('link-popup-titanic-plus');
    link.href = 'https://github.com/Penguuuuu/titanic-plus/commits/main';
    link.textContent = 'Source';
    link.target = '_blank';

    popup.append(button, link);
    document.body.appendChild(popup);
}

// function setCustomCursor() {
//     // Will add the option for custom cursors eventually
//     // Need to add live reload
//     const style = document.createElement('style');
//     style.textContent = `
//         * {
//             cursor: none !important;
//         }
//         .cursor-titanic-plus, .cursor-trail-titanic-plus {
//             position: fixed;
//             background-position: center;
//             background-repeat: no-repeat;
//             background-size: contain;
//             transform: translate(-50%, -50%);
//             pointer-events: none;
//         }
//         .cursor-titanic-plus {
//             width: 50px;
//             height: 50px;
//             background-image: url('https://patchouli.s-ul.eu/9tGZvBtp');
//             transition: transform 100ms ease-out;
//             z-index: 100;
//         }
//         .cursor-trail-titanic-plus {
//             width: 40px;
//             height: 40px;
//             background-image: url('https://patchouli.s-ul.eu/jretE5u2');
//             transition: opacity 200ms linear;
//         }
//     `;
//     document.head.appendChild(style);

//     const cursor = document.createElement('div');
//     cursor.classList.add('cursor-titanic-plus');
//     document.body.append(cursor);

//     let lastTime = 0;

//     document.addEventListener('mousemove', e => {
//         cursor.style.left = e.clientX + 'px';
//         cursor.style.top = e.clientY + 'px';

//         if (performance.now() - lastTime >= 20) {
//             lastTime = performance.now();

//             const trail = document.createElement('div');
//             trail.classList.add('cursor-trail-titanic-plus');
//             trail.style.left = e.clientX + 'px';
//             trail.style.top = e.clientY + 'px';
//             document.body.append(trail);

//             requestAnimationFrame(() => trail.style.opacity = '0');
//             setTimeout(() => trail.remove(), 200);
//         }
//     });

//     document.addEventListener('mousedown', () => {
//         cursor.style.transform = 'translate(-50%, -50%) scale(1.3)';
//     });

//     document.addEventListener('mouseup', () => {
//         cursor.style.transform = 'translate(-50%, -50%)';
//     });
// }

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

async function setCountryData() {
    const centered = document.querySelector('.centered');

    const checkboxContainer = await createCheckbox('checkboxCountryRankedScore', `Ranked Score Sorting`, false);
    checkboxContainer.style.padding = '5px';

    const label = checkboxContainer.querySelector('label');
    label.style.color = '#000';
    label.style.fontSize = '80%';

    centered.insertAdjacentElement('afterend', checkboxContainer);

    const checkbox = checkboxContainer.querySelector('input[type="checkbox"]');
    if (checkbox.checked) await setTable('total_rscore');
    checkbox.addEventListener('change', async () => { await setTable(checkbox.checked ? 'total_rscore' : 'total_performance') });

    async function setTable(sort) {
        const target = document.querySelector('.country-listing tbody');
        target.innerHTML = '';

        const modeSplit = window.location.pathname.split('/');
        const mode = modeSplit[2];

        let data;
        try {
            const response = await fetch(`https://api.titanic.sh/rankings/country/${mode}`);
            data = await response.json();
        }
        catch { return };

        const pageSplit = url.split('?page=')[1];
        const pageNumber = pageSplit ? Number(pageSplit) : 1;

        data.sort((a, b) => b.stats[sort] - a.stats[sort]);
        data = data.slice((pageNumber - 1) * 50, pageNumber * 50);

        data.forEach((country, index) => {
            const rank = (pageNumber - 1) * 50 + index + 1;

            const row = document.createElement('tr');
            row.style.backgroundColor = index % 2 ? '#e7e4fc' : '#dad7fb';
            row.innerHTML = `
                <td><b>#${rank}</b></td>
                <td>
                    <img src="/images/flags/${country.country_acronym}.gif" class="flag" alt="${country.country_acronym} Flag">
                    <a href="/rankings/osu/performance?country=${country.country_acronym}">${country.country_name}</a>
                </td>
                <td>${country.stats.total_users.toLocaleString()}</td>
                <td ${sort === 'total_rscore' ? 'style="font-weight:bold;"' : ''}>${country.stats.total_rscore.toLocaleString()}</td>
                <td>${country.stats.total_tscore.toLocaleString()}</td>
                <td ${sort === 'total_performance' ? 'style="font-weight:bold;"' : ''}>${Math.round(country.stats.total_performance).toLocaleString()}pp</td>
                <td>${Math.round(country.stats.average_performance).toLocaleString()}pp</td>
            `;

            target.appendChild(row);
        });
    }
}

async function getMapLeaderboardData() {
    // TODO: Clean this function up at some point
    const beatmapId = window.location.pathname.split('/')[2];
    const response = await fetch(`https://api.titanic.sh/beatmaps/${beatmapId}/scores`);
    const data = await response.json();

    const headers = document.querySelectorAll("thead th");

    for (let index = headers.length - 1; index >= 0; index--) {
        if (["Geki", "Katu"].some(headerName => headers[index].textContent.includes(headerName))) {
            headers[index].remove();

            document.querySelectorAll(".scores tbody tr").forEach(row => {
                if (row.children[index]) row.children[index].remove();
            });
        }
    }

    function createHeader(text) {
        const header = document.querySelector('.scores-header tr');
        const th = document.createElement('th');
        th.innerHTML = `<b>${text}</b>`;
        header.insertBefore(th, header.lastElementChild);
    }

    createHeader('Date');

    const rows = document.querySelectorAll('.scores tbody tr');

    rows.forEach((row, index) => {
        const date = document.createElement('td');
        date.textContent = data.scores[index].submitted_at.split('T')[0];
        row.insertBefore(date, row.lastElementChild);

        row.title = `Client: ${data.scores[index].client_string}`;
    });
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
        if (url.includes('https://osu.titanic.sh/account/friends')) {
            document.querySelector('.friends-heading').remove();

            target = document.querySelector('.friends');
            target.className = 'main-settings';
            target.innerHTML = '';
        }
        else if (url.includes('https://osu.titanic.sh/account/chat')) {
            document.querySelector('.heading').remove();

            target = document.querySelector('.chat-container');
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

        async function createWallpaperSection() {
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
            await createCheckbox('checkboxMapDetails', 'Show Date and Client for map leaderboards (Removes Geki and Katu columns)'),
            await createCheckbox('checkboxPeppyStyle', 'Enable old.ppy.sh style (Requires page reload)'),
            // await createCheckbox('checkboxCustomCursor', 'Enable Kamui cursor (Requires page reload)'),
            await createLevelBar(),
            await createWallpaperSection()
        );
        target.append(profileBox.box, otherBox.box);
    });
}

const peppyCss = `
    .logo {
        top: -97px;
        left: -110px;
        width: 175px;
        height: 175px;
        transform: rotate(0deg);
        content: url(https://s.ppy.sh/images/head-logo.png);
    }
    #coolheader {
        position: absolute;
        height: 150px;
        top: -115px;
        z-index: -1;
        right: 219px;
    }

    .top_button {
        position: absolute;
        background: url('https://s.ppy.sh/images/social.png');
        top: -95px;
        width: 61px;
        height: 62px;
        z-index: 10;
        background-position: 0px 0px;
    }

    #top_follow {
        background-position: -61px 0px;
        right: 80px;
    }
    #top_follow:hover {
        background-position: -61px 62px;
    }

    #top_support {
        background-position: -122px 0px;
        right: calc(80px - 60px);
    }
    #top_support:hover {
        background-position: -122px 62px;
    }

    #stats-text-above {
        position: absolute;
        background: url('https://s.ppy.sh/images/head-left-new.png');
        background-position: 0px 0px;
        background-repeat: no-repeat;
        width: 935px;
        height: 72.7px;
        right: -202px;
        top: -72.5px;
        background-size: 80%;
    }

    .right-side img[alt="Download"] {
        content: url(https://osu.titanic.sh/images/buttons/osu-download.png);
    }
    .right-side img[alt="Contribute"] {
        content: url(https://osu.titanic.sh/images/buttons/osu-goodies.png);
    }
    .right-side img[alt="Support"] {
        content: url(https://osu.titanic.sh/images/buttons/osu-support.png);
    }
`;

function setPeppyStyle() {
    const style = document.createElement('style');
    style.id = 'ppy-style';
    style.textContent = peppyCss;
    document.head.appendChild(style);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setPeppyPageChanges);
        return;
    }

    setPeppyPageChanges();
}

function setPeppyPageChanges() {
    const headerElement = document.createElement('img');
    headerElement.id = 'coolheader';
    headerElement.src = "/images/art/pippi_header.png";
    document.querySelector('.main').insertBefore(headerElement, document.querySelector('.main').firstChild);

    const statsHeader = document.createElement('div');
    statsHeader.id = 'stats-text-above';
    document.querySelector('.bancho-stats').appendChild(statsHeader);

    const twitterLink = document.createElement('a');
    twitterLink.id = 'top_follow';
    twitterLink.className = 'top_button';
    twitterLink.href = 'https://twitter.com/osutitanic';
    document.querySelector('.main').insertBefore(twitterLink, headerElement);

    const supportLink = document.createElement('a');
    supportLink.id = 'top_support';
    supportLink.className = 'top_button';
    supportLink.href = 'https://ko-fi.com/lekuru';
    document.querySelector('.main').insertBefore(supportLink, twitterLink);

    const currentPath = window.location.pathname;

    if (currentPath === '/') {
        const aboutHeader = document.getElementById('about-header');
        if (aboutHeader) {
            aboutHeader.innerHTML = "<b>osu!</b> is a <b>free-to-win</b> online rhythm game";
        }
        const blurbText = document.querySelector('.about-wrapper div.blurb-box div.blurb-text');
        if (blurbText) {
            blurbText.textContent = "osu! gameplay is based on a variety of popular commercial rhythm games. While keeping some authentic elements, osu! adds huge customisation via skins/beatmaps/storyboarding, online rankings, multiplayer and boasts a community with over 500,000 active users! Play the way you want to play, with your own music, and share your creations with others.";
        }
    }
}

async function createCheckbox(gmId, text, defaultValue = true) {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.gap = '5px';

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
