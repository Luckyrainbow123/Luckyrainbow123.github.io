const resetBtn = document.getElementById("resetBtn");
const svg = document.getElementById("cemeteryMap");

let currentColor = "#00ff00"; // Default selected color

// Handle color button clicks
document.querySelectorAll(".color-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        currentColor = btn.dataset.color;

        // Remove selected class from all buttons
        document.querySelectorAll(".color-btn").forEach(b => 
            b.classList.remove("selected")
        );

        // Add to the clicked one
        btn.classList.add("selected");
    });
    });


/* LOAD SAVED COLORS */
window.addEventListener("DOMContentLoaded", () => {
    const saved = JSON.parse(localStorage.getItem("sectionColors")) || {};

    for (let id in saved) {
        const shape = document.getElementById(id);
        if (shape) {
            shape.style.fill = saved[id];
        }
    }
});

/* APPLY COLOR + SAVE */
svg.addEventListener("click", (e) => {
    const tag = e.target.tagName.toLowerCase();
    if (tag !== "path" && tag !== "polygon") return;

    const id = e.target.id;
    const color = currentColor;

    e.target.style.fill = color;

    const saved = JSON.parse(localStorage.getItem("sectionColors")) || {};
    saved[id] = color;
    localStorage.setItem("sectionColors", JSON.stringify(saved));
});

/* RESET COLORS */
resetBtn.addEventListener("click", () => {
    const shapes = svg.querySelectorAll("path, polygon");

    shapes.forEach(shape => {
        shape.style.fill = "#ffffff";
    });

    localStorage.removeItem("sectionColors");
});


/* ---------------------------------------------------
   ZOOM + PAN WITH PERSISTENCE
--------------------------------------------------- */

// Try to restore saved viewBox
let savedVB = JSON.parse(localStorage.getItem("savedViewBox"));

let viewBox = savedVB || { x: 0, y: 0, w: 1200, h: 800 };

// Apply on load
svg.setAttribute("viewBox", `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);

function saveViewBox() {
    localStorage.setItem("savedViewBox", JSON.stringify(viewBox));
}

// ---- ZOOM LIMITS ----
const MIN_SCALE = 300;     // how far you can zoom IN (smaller = closer)
const MAX_SCALE = 2500;    // how far you can zoom OUT (larger = farther)

svg.addEventListener("wheel", e => {
    e.preventDefault();

    const zoomFactor = 1.1;
    let newW = viewBox.w;
    let newH = viewBox.h;

    if (e.deltaY < 0) {
        // Zoom IN
        newW /= zoomFactor;
        newH /= zoomFactor;
    } else {
        // Zoom OUT
        newW *= zoomFactor;
        newH *= zoomFactor;
    }

    // Apply limits
    if (newW < MIN_SCALE) {
        newW = MIN_SCALE;
        newH = MIN_SCALE * (800 / 1200);
    }

    if (newW > MAX_SCALE) {
        newW = MAX_SCALE;
        newH = MAX_SCALE * (800 / 1200);
    }

    // Update viewbox
    viewBox.w = newW;
    viewBox.h = newH;

    svg.setAttribute("viewBox",
        `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`
    );

    saveViewBox();
});

/* ---------------------------------------------------
   PAN
--------------------------------------------------- */

let isPanning = false;
let start = { x: 0, y: 0 };

svg.addEventListener("mousedown", e => {
    isPanning = true;
    start = { x: e.clientX, y: e.clientY };
});

svg.addEventListener("mousemove", e => {
    if (!isPanning) return;

    const dx = (e.clientX - start.x) * (viewBox.w / svg.clientWidth);
    const dy = (e.clientY - start.y) * (viewBox.h / svg.clientHeight);

    viewBox.x -= dx;
    viewBox.y -= dy;

    svg.setAttribute("viewBox",
        `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`
    );

    saveViewBox();

    start = { x: e.clientX, y: e.clientY };
});

svg.addEventListener("mouseup", () => (isPanning = false));
svg.addEventListener("mouseleave", () => (isPanning = false));

/* ---------------------------------------------------
   DEBUG GRID
--------------------------------------------------- */
function generateGrid() {
    const grid = document.getElementById("debug-grid");
    grid.innerHTML = ""; // clear old grid

    const spacing = 25;
    const width = 1200;
    const height = 800;

    // Vertical lines
    for (let x = 0; x <= width; x += spacing) {
        let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", x);
        line.setAttribute("y1", 0);
        line.setAttribute("x2", x);
        line.setAttribute("y2", height);
        grid.appendChild(line);
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += spacing) {
        let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", 0);
        line.setAttribute("y1", y);
        line.setAttribute("x2", width);
        line.setAttribute("y2", y);
        grid.appendChild(line);
    }

    // X labels
    for (let x = 0; x <= width; x += spacing) {
        let txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
        txt.setAttribute("x", x + 5);
        txt.setAttribute("y", 15);
        txt.textContent = x;
        txt.setAttribute("font-size", "14");
        txt.setAttribute("fill", "#00000055");
        grid.appendChild(txt);
    }

    // Y labels
    for (let y = 0; y <= height; y += spacing) {
        let txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
        txt.setAttribute("x", 5);
        txt.setAttribute("y", y - 5);
        txt.textContent = y;
        txt.setAttribute("font-size", "14");
        txt.setAttribute("fill", "#00000055");
        grid.appendChild(txt);
    }
}

generateGrid();
