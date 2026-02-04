<script>
    import { onMount } from "svelte";

    export let events = [];
    export let filterType = "all";
    export let currentMatch = null;

    let canvas;

    const pitchConfig = {
        width: 120, // StatsBomb units
        height: 80, // StatsBomb units
        scale: 7, // Pixels per unit
        padding: 20,
        colors: {
            pitch: "#0f172a",
            lines: "#1e293b",
            Pass: "#3b82f6",
            Shot: "#ef4444",
            Dribble: "#f59e0b",
            Interception: "#10b981",
            default: "#64748b",
        },
    };

    function drawPitch(ctx) {
        const w = pitchConfig.width * pitchConfig.scale;
        const h = pitchConfig.height * pitchConfig.scale;
        const p = pitchConfig.padding;

        canvas.width = w + p * 2;
        canvas.height = h + p * 2;

        ctx.fillStyle = pitchConfig.colors.pitch;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

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

    function plotEvents() {
        if (!canvas || !currentMatch) return;
        const ctx = canvas.getContext("2d");
        const p = pitchConfig.padding;
        const s = pitchConfig.scale;

        drawPitch(ctx);

        let filtered = events;
        if (filterType !== "all") {
            filtered = events.filter(
                (e) =>
                    e.type === filterType ||
                    (filterType === "Interception" &&
                        ["Interception", "Ball Recovery", "Duel"].includes(
                            e.type,
                        )),
            );
        }

        filtered.forEach((event) => {
            if (!event.location) return;

            let [x, y] = event.location;

            const isAwayTeam = event.team === currentMatch.away_team;
            if (isAwayTeam) {
                x = pitchConfig.width - x;
                y = pitchConfig.height - y;
            }

            const markerColor =
                pitchConfig.colors[event.type] || pitchConfig.colors.default;

            ctx.fillStyle = markerColor;
            ctx.shadowBlur = 8;
            ctx.shadowColor = markerColor;

            ctx.beginPath();
            const radius = event.type === "Shot" ? 6 : 3.5;
            ctx.arc(x * s + p, y * s + p, radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.strokeStyle = isAwayTeam ? "#ffffff" : "#000000";
            ctx.lineWidth = 1;
            ctx.stroke();

            if (
                event.type === "Pass" &&
                event.pass &&
                event.pass.end_location
            ) {
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

    $: if (canvas && events && filterType && currentMatch) {
        plotEvents();
    }

    onMount(() => {
        plotEvents();
    });
</script>

<canvas bind:this={canvas} id="pitch-canvas"></canvas>

<style>
    canvas {
        max-width: 100%;
        height: auto;
        border-radius: 5px;
    }
</style>
