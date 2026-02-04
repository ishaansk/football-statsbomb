const API_BASE = '/api';

const selectors = {
    competition: document.getElementById('competition-select'),
    season: document.getElementById('season-select'),
    matchesGrid: document.getElementById('matches-grid'),
    eventsSection: document.getElementById('events-section'),
    matchesSection: document.getElementById('matches-section'),
    eventsBody: document.getElementById('events-body'),
    eventSearch: document.getElementById('event-search'),
    backToMatches: document.getElementById('back-to-matches'),
    matchTitle: document.getElementById('match-title'),
    loader: document.getElementById('loading-overlay'),
    toggleViz: document.getElementById('toggle-viz'),
    vizContainer: document.getElementById('viz-container'),
    canvas: document.getElementById('pitch-canvas'),
    filterBtns: document.querySelectorAll('.filter-btn'),
    totalEventsCount: document.getElementById('total-events-count'),
    activeFilterType: document.getElementById('active-filter-type')
};

let allCompetitions = [];
let allEvents = [];
let currentMatch = null;

// Initialize
async function init() {
    showLoader();
    try {
        const response = await fetch(`${API_BASE}/competitions`);
        allCompetitions = await response.json();

        // Group competitions by name
        const uniqueComps = [...new Set(allCompetitions.map(c => c.competition_name))].sort();

        uniqueComps.forEach(compName => {
            const option = document.createElement('option');
            option.value = compName;
            option.textContent = compName;
            selectors.competition.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading competitions:', error);
    } finally {
        hideLoader();
    }
}

selectors.competition.addEventListener('change', (e) => {
    const compName = e.target.value;
    const seasons = allCompetitions.filter(c => c.competition_name === compName);

    selectors.season.innerHTML = '<option value="" disabled selected>Select Season</option>';
    seasons.sort((a, b) => b.season_name.localeCompare(a.season_name)).forEach(s => {
        const option = document.createElement('option');
        option.value = JSON.stringify({ compId: s.competition_id, seasonId: s.season_id });
        option.textContent = s.season_name;
        selectors.season.appendChild(option);
    });

    selectors.season.disabled = false;
});

selectors.season.addEventListener('change', async (e) => {
    const { compId, seasonId } = JSON.parse(e.target.value);
    showLoader();
    try {
        const response = await fetch(`${API_BASE}/matches/${compId}/${seasonId}`);
        const matches = await response.json();
        renderMatches(matches);
    } catch (error) {
        console.error('Error loading matches:', error);
    } finally {
        hideLoader();
    }
});

function renderMatches(matches) {
    selectors.matchesGrid.innerHTML = '';

    if (matches.length === 0) {
        selectors.matchesGrid.innerHTML = '<div class="placeholder-text">No matches found for this season.</div>';
        return;
    }

    matches.forEach(match => {
        const card = document.createElement('div');
        card.className = 'match-card';
        card.innerHTML = `
            <span class="match-date">${match.match_date}</span>
            <div class="match-teams">${match.home_team} vs ${match.away_team}</div>
            <div class="match-score">${match.home_score} - ${match.away_score}</div>
        `;
        card.addEventListener('click', () => loadEvents(match));
        selectors.matchesGrid.appendChild(card);
    });
}

async function loadEvents(match) {
    showLoader();
    currentMatch = match; // Store match details
    selectors.matchTitle.textContent = `${match.home_team} vs ${match.away_team} (${match.match_date})`;
    try {
        const response = await fetch(`${API_BASE}/events/${match.match_id}`);
        allEvents = await response.json();
        renderEvents(allEvents);

        selectors.matchesSection.classList.add('hidden');
        selectors.eventsSection.classList.remove('hidden');
    } catch (error) {
        console.error('Error loading events:', error);
    } finally {
        hideLoader();
    }
}

function renderEvents(events) {
    selectors.eventsBody.innerHTML = '';
    events.forEach(event => {
        const tr = document.createElement('tr');
        // Extracting meaningful details based on event type
        let detail = event.type || '';
        if (event.shot) detail = `Shot: ${event.shot.outcome.name}`;
        else if (event.pass) detail = `Pass: ${event.pass.outcome ? event.pass.outcome.name : 'Complete'}`;
        else if (event.substitution) detail = `Sub: ${event.substitution.outcome.name}`;

        tr.innerHTML = `
            <td>${event.minute}:${event.second.toString().padStart(2, '0')}</td>
            <td>${event.team || ''}</td>
            <td>${event.player || ''}</td>
            <td>${event.type || ''}</td>
            <td>${detail}</td>
        `;
        selectors.eventsBody.appendChild(tr);
    });
}

selectors.eventSearch.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = allEvents.filter(event =>
        (event.player && event.player.toLowerCase().includes(query)) ||
        (event.team && event.team.toLowerCase().includes(query)) ||
        (event.type && event.type.toLowerCase().includes(query))
    );
    renderEvents(filtered);
});

selectors.backToMatches.addEventListener('click', () => {
    selectors.eventsSection.classList.add('hidden');
    selectors.matchesSection.classList.remove('hidden');
});

function showLoader() {
    selectors.loader.classList.remove('hidden');
}

function hideLoader() {
    selectors.loader.classList.add('hidden');
}

// Pitch Visualization Logic
const pitchConfig = {
    width: 120, // StatsBomb units
    height: 80, // StatsBomb units
    scale: 7,   // Pixels per unit
    padding: 20,
    colors: {
        pitch: '#0f172a',
        lines: '#1e293b',
        Pass: '#3b82f6',
        Shot: '#ef4444',
        Dribble: '#f59e0b',
        Interception: '#10b981',
        default: '#64748b'
    }
};

function drawPitch() {
    const ctx = selectors.canvas.getContext('2d');
    const w = pitchConfig.width * pitchConfig.scale;
    const h = pitchConfig.height * pitchConfig.scale;
    const p = pitchConfig.padding;

    selectors.canvas.width = w + (p * 2);
    selectors.canvas.height = h + (p * 2);

    ctx.fillStyle = pitchConfig.colors.pitch;
    ctx.fillRect(0, 0, selectors.canvas.width, selectors.canvas.height);

    ctx.strokeStyle = pitchConfig.colors.lines;
    ctx.lineWidth = 2;

    // Outer boundary
    ctx.strokeRect(p, p, w, h);

    // Halfway line
    ctx.beginPath();
    ctx.moveTo(w / 2 + p, p);
    ctx.lineTo(w / 2 + p, h + p);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(w / 2 + p, h / 2 + p, 9.15 * pitchConfig.scale, 0, Math.PI * 2);
    ctx.stroke();

    // Penalty areas
    const penW = 16.5 * pitchConfig.scale;
    const penH = 40.3 * pitchConfig.scale;
    ctx.strokeRect(p, (h - penH) / 2 + p, penW, penH);
    ctx.strokeRect(w - penW + p, (h - penH) / 2 + p, penW, penH);

    // Goal areas
    const goalW = 5.5 * pitchConfig.scale;
    const goalH = 18.3 * pitchConfig.scale;
    ctx.strokeRect(p, (h - goalH) / 2 + p, goalW, goalH);
    ctx.strokeRect(w - goalW + p, (h - goalH) / 2 + p, goalW, goalH);
}

function plotEvents(events, filterType = 'all') {
    drawPitch();
    const ctx = selectors.canvas.getContext('2d');
    const p = pitchConfig.padding;
    const s = pitchConfig.scale;

    let filtered = events;
    if (filterType !== 'all') {
        filtered = events.filter(e => e.type === filterType || (filterType === 'Interception' && ['Interception', 'Ball Recovery', 'Duel'].includes(e.type)));
    }

    selectors.totalEventsCount.textContent = filtered.length;
    selectors.activeFilterType.textContent = filterType === 'all' ? 'All Events' : filterType;

    filtered.forEach(event => {
        if (!event.location) return;

        let [x, y] = event.location;

        // StatsBomb data has both teams attacking left-to-right (0 to 120).
        // To show a realistic match view, we flip the away team's coordinates
        // so they attack right-to-left.
        const isAwayTeam = event.team === currentMatch.away_team;
        if (isAwayTeam) {
            x = pitchConfig.width - x;
            y = pitchConfig.height - y;
        }

        const markerColor = pitchConfig.colors[event.type] || pitchConfig.colors.default;

        ctx.fillStyle = markerColor;
        ctx.shadowBlur = 8;
        ctx.shadowColor = markerColor;

        ctx.beginPath();
        const radius = event.type === 'Shot' ? 6 : 3.5;
        ctx.arc(x * s + p, y * s + p, radius, 0, Math.PI * 2);
        ctx.fill();

        // Add a small border to differentiate teams
        ctx.shadowBlur = 0;
        ctx.strokeStyle = isAwayTeam ? '#ffffff' : '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw pass lines
        if (event.type === 'Pass' && event.pass && event.pass.end_location) {
            let [ex, ey] = event.pass.end_location;
            if (isAwayTeam) {
                ex = pitchConfig.width - ex;
                ey = pitchConfig.height - ey;
            }
            ctx.strokeStyle = markerColor;
            ctx.globalAlpha = 0.4;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x * s + p, y * s + p);
            ctx.lineTo(ex * s + p, ey * s + p);
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }
    });
}

selectors.toggleViz.addEventListener('click', () => {
    selectors.vizContainer.classList.toggle('hidden');
    if (!selectors.vizContainer.classList.contains('hidden')) {
        plotEvents(allEvents);
    }
});

selectors.filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        selectors.filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        plotEvents(allEvents, btn.dataset.type);
    });
});

init();
