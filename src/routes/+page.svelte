<script>
    import { onMount } from "svelte";
    import Pitch from "$lib/components/Pitch.svelte";

    const API_BASE = "/api";

    let allCompetitions = [];
    let selectedCompName = "";
    let availableSeasons = [];
    let selectedSeasonValue = "";

    let matches = [];
    let loading = false;
    let error = null;

    let currentMatch = null;
    let events = [];
    let searchQuery = "";
    let view = "matches"; // 'matches' or 'events'

    let showViz = false;
    let activeFilter = "all";

    $: uniqueCompNames = [
        ...new Set(allCompetitions.map((c) => c.competition_name)),
    ].sort();

    $: if (selectedCompName) {
        availableSeasons = allCompetitions
            .filter((c) => c.competition_name === selectedCompName)
            .sort((a, b) => b.season_name.localeCompare(a.season_name));
        selectedSeasonValue = "";
        matches = [];
    }

    $: filteredEvents = events.filter(
        (event) =>
            (event.player &&
                event.player
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())) ||
            (event.team &&
                event.team.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (event.type &&
                event.type.toLowerCase().includes(searchQuery.toLowerCase())),
    );

    async function fetchCompetitions() {
        loading = true;
        try {
            const response = await fetch(`${API_BASE}/competitions`);
            allCompetitions = await response.json();
        } catch (e) {
            error = "Failed to load competitions";
            console.error(e);
        } finally {
            loading = false;
        }
    }

    async function handleSeasonChange() {
        if (!selectedSeasonValue) return;
        const { compId, seasonId } = JSON.parse(selectedSeasonValue);
        loading = true;
        try {
            const response = await fetch(
                `${API_BASE}/matches/${compId}/${seasonId}`,
            );
            matches = await response.json();
            view = "matches";
        } catch (e) {
            error = "Failed to load matches";
            console.error(e);
        } finally {
            loading = false;
        }
    }

    async function loadEvents(match) {
        loading = true;
        currentMatch = match;
        try {
            const response = await fetch(
                `${API_BASE}/events/${match.match_id}`,
            );
            events = await response.json();
            view = "events";
        } catch (e) {
            error = "Failed to load events";
            console.error(e);
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        fetchCompetitions();
    });
</script>

<div class="app-container">
    <header>
        <div class="logo">
            <i class="fas fa-futbol"></i>
            <h1>StatsBomb <span>Explorer</span></h1>
        </div>
        <div class="header-controls">
            <div class="glass-select-wrapper">
                <select bind:value={selectedCompName}>
                    <option value="" disabled selected
                        >Select Competition</option
                    >
                    {#each uniqueCompNames as name}
                        <option value={name}>{name}</option>
                    {/each}
                </select>
            </div>
            <div class="glass-select-wrapper">
                <select
                    bind:value={selectedSeasonValue}
                    disabled={!selectedCompName}
                    on:change={handleSeasonChange}
                >
                    <option value="" disabled selected>Select Season</option>
                    {#each availableSeasons as s}
                        <option
                            value={JSON.stringify({
                                compId: s.competition_id,
                                seasonId: s.season_id,
                            })}
                        >
                            {s.season_name}
                        </option>
                    {/each}
                </select>
            </div>
        </div>
    </header>

    <main>
        {#if error}
            <div
                class="panel"
                style="border-color: var(--secondary); margin-bottom: 2rem;"
            >
                <p style="color: var(--secondary); font-weight: 600;">
                    <i class="fas fa-exclamation-triangle"></i>
                    {error}
                </p>
                <p
                    style="margin-top: 1rem; font-size: 0.9rem; color: var(--text-muted);"
                >
                    Make sure your Python backend is running at <code
                        >http://localhost:5000</code
                    >.
                </p>
                <button
                    class="btn-primary"
                    style="margin-top: 1.5rem;"
                    on:click={fetchCompetitions}>Retry Connection</button
                >
            </div>
        {/if}

        {#if view === "matches"}
            <section id="matches-section" class="panel">
                <div class="panel-header">
                    <h2>Available Matches</h2>
                </div>
                <div id="matches-grid" class="matches-grid">
                    {#if matches.length > 0}
                        {#each matches as match}
                            <button
                                class="match-card"
                                on:click={() => loadEvents(match)}
                            >
                                <span class="match-date"
                                    >{match.match_date}</span
                                >
                                <div class="match-teams">
                                    {match.home_team} vs {match.away_team}
                                </div>
                                <div class="match-score">
                                    {match.home_score} - {match.away_score}
                                </div>
                            </button>
                        {/each}
                    {:else}
                        <div class="placeholder-text">
                            {selectedCompName && selectedSeasonValue
                                ? "No matches found."
                                : "Select a competition and season to view matches."}
                        </div>
                    {/if}
                </div>
            </section>
        {:else if view === "events" && currentMatch}
            <section id="events-section" class="panel">
                <div class="panel-header">
                    <button
                        class="btn-icon"
                        on:click={() => (view = "matches")}
                        aria-label="Back to matches"
                    >
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h2>
                        {currentMatch.home_team} vs {currentMatch.away_team} ({currentMatch.match_date})
                    </h2>
                    <div class="header-actions">
                        <div class="search-wrapper">
                            <i class="fas fa-search"></i>
                            <input
                                type="text"
                                bind:value={searchQuery}
                                placeholder="Search events..."
                            />
                        </div>
                        <button
                            class="btn-primary"
                            on:click={() => (showViz = !showViz)}
                            >Toggle Pitch View</button
                        >
                    </div>
                </div>

                {#if showViz}
                    <div class="viz-container">
                        <div class="pitch-card">
                            <Pitch
                                {events}
                                filterType={activeFilter}
                                {currentMatch}
                            />
                            <div class="viz-overlay">
                                <div class="viz-stats">
                                    <div class="stat-item">
                                        <span>{events.length}</span> Events shown
                                    </div>
                                    <div class="stat-item">
                                        <span
                                            >{activeFilter === "all"
                                                ? "All"
                                                : activeFilter}</span
                                        >
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="pitch-filters">
                            <h3>Plot Events</h3>
                            <div class="filter-group">
                                <button
                                    class="filter-btn {activeFilter === 'all'
                                        ? 'active'
                                        : ''}"
                                    on:click={() => (activeFilter = "all")}
                                    >All</button
                                >
                                <button
                                    class="filter-btn {activeFilter === 'Pass'
                                        ? 'active'
                                        : ''}"
                                    on:click={() => (activeFilter = "Pass")}
                                    >Passes</button
                                >
                                <button
                                    class="filter-btn {activeFilter === 'Shot'
                                        ? 'active'
                                        : ''}"
                                    on:click={() => (activeFilter = "Shot")}
                                    >Shots</button
                                >
                                <button
                                    class="filter-btn {activeFilter ===
                                    'Dribble'
                                        ? 'active'
                                        : ''}"
                                    on:click={() => (activeFilter = "Dribble")}
                                    >Dribbles</button
                                >
                                <button
                                    class="filter-btn {activeFilter ===
                                    'Interception'
                                        ? 'active'
                                        : ''}"
                                    on:click={() =>
                                        (activeFilter = "Interception")}
                                    >Defensive</button
                                >
                            </div>
                        </div>
                    </div>
                {/if}

                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Minute</th>
                                <th>Team</th>
                                <th>Player</th>
                                <th>Type</th>
                                <th>Detail</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each filteredEvents as event}
                                <tr>
                                    <td
                                        >{event.minute}:{event.second
                                            .toString()
                                            .padStart(2, "0")}</td
                                    >
                                    <td>{event.team || ""}</td>
                                    <td>{event.player || ""}</td>
                                    <td>{event.type || ""}</td>
                                    <td>
                                        {#if event.shot}
                                            Shot: {event.shot.outcome.name}
                                        {:else if event.pass}
                                            Pass: {event.pass.outcome
                                                ? event.pass.outcome.name
                                                : "Complete"}
                                        {:else if event.substitution}
                                            Sub: {event.substitution.outcome
                                                .name}
                                        {:else}
                                            {event.type || ""}
                                        {/if}
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            </section>
        {/if}
    </main>

    {#if loading}
        <div id="loading-overlay">
            <div class="loader"></div>
            <p>Fetching Data...</p>
        </div>
    {/if}
</div>
