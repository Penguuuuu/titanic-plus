// ==UserScript==
// @name         Titanic Completion
// @version      1.0
// @author       Patchouli
// @match        https://osu.titanic.sh/u/*
// @grant        none
// ==/UserScript==

(async function () {
    const generalDiv = document.getElementById('general');
    if (generalDiv) {
        generalDiv.style.height = `943px`;
    }

    const target = document.querySelector('.profile-stats-element-rscore');
    if (!target) return;

    const h4 = document.createElement('h4');
    h4.className = 'profile-stats-element';
    h4.title = 'For modes other than standard, all maps for the selected mode and converts are summed';
    h4.innerHTML = `<b>Completion</b>: Loading...`;

    const br = document.createElement('br');
    target.parentNode.insertBefore(h4, target);
    target.parentNode.insertBefore(br, target);

    const ranksCount = await getRanksData();
    const mapsCount = await getBeatmapData();
    h4.innerHTML = `<b>Completion</b>: ${ranksCount.toLocaleString()} / ${mapsCount.toLocaleString()} (${(ranksCount / mapsCount * 100).toFixed(3)}%)`;
})();

async function getBeatmapData() {
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
    catch (error) {
        console.error(error);
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
    catch (error) {
        console.error(error);
    }
}
