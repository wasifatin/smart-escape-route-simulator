/* ================================================================
   SMART ESCAPE — Application Logic
   ================================================================
   Contains: JSON loading & validation, graph construction,
   Dijkstra's shortest-path algorithm, SVG rendering, hazard
   controls, bilingual support, and all user interaction logic.
   ================================================================ */

// ================================================================
// 1. APPLICATION STATE
// ================================================================

/** Parsed building JSON data (nodes, edges, initial_state) */
let buildingData = null;

/** Adjacency list: graph[nodeId] = [{ neighbor, edgeId, cost }] */
let graph = {};

/** Quick lookup: nodeMap[id] = node object */
let nodeMap = {};

/** Quick lookup: edgeMap[id] = edge object */
let edgeMap = {};

/** Lookup for edge ID between two nodes: edgeBetween["A|B"] = edgeId */
let edgeBetween = {};

/** Currently selected starting node ID */
let selectedStart = null;

/** Current active language: 'en' or 'bn' */
let currentLang = 'en';

/** Live hazard state (may differ from original after user changes) */
let currentState = {
    blockedNodes: new Set(),
    blockedEdges: new Set(),
    closedExits: new Set()
};

/** Original hazard state from the imported JSON (used by Reset) */
let originalState = {
    blockedNodes: new Set(),
    blockedEdges: new Set(),
    closedExits: new Set()
};

// ================================================================
// 2. TRANSLATIONS (English / বাংলা)
// ================================================================

const translations = {
    en: {
        subtitle: "Interactive Evacuation Route Simulator",
        reset: "Reset",
        importTitle: "Import Building Data",
        selectFile: "Select JSON File",
        startLocation: "Start Location",
        selectStart: "— Select Starting Point —",
        hazardControls: "Hazard Controls",
        rooms: "Rooms",
        junctions: "Junctions",
        corridors: "Corridors",
        exits: "Exits",
        buildingMap: "Building Map",
        routeInfo: "Route Information",
        startLabel: "Start:",
        exitLabel: "Exit:",
        routeLabel: "Route:",
        costLabel: "Total Cost:",
        statusLabel: "Status:",
        legend: "Legend",
        instructions: "Instructions",
        legendRoom: "Room",
        legendJunction: "Junction",
        legendExit: "Exit",
        legendSelected: "Selected Start",
        legendBlocked: "Blocked Node",
        legendBlockedCorridor: "Blocked Corridor",
        legendClosed: "Closed Exit",
        legendRoute: "Active Route",
        block: "Block",
        unblock: "Unblock",
        close: "Close",
        reopen: "Reopen",
        blocked: "Blocked",
        closed: "Closed",
        routeAvailable: "Route available",
        noRoute: "No route available",
        startBlocked: "Starting location blocked",
        buildingLoaded: "Building loaded",
        noFileSelected: "No file selected.",
        invalidJSON: "Invalid JSON file.",
        selectStartPrompt: "Click a room or junction on the map, or select from the dropdown.",
        startingAt: "Starting Location",
        footerText: "Educational Evacuation Simulator",
        instruction1: "Import a building JSON file.",
        instruction2: "Select a room or junction as your starting point.",
        instruction3: "The application calculates the lowest-cost route to an open exit.",
        instruction4: "Block rooms, junctions or corridors to simulate hazards.",
        instruction5: "Close exits to simulate unavailable exits.",
        instruction6: "The route is recalculated automatically.",
        instruction7: "Use Reset to restore the original condition."
    },
    bn: {
        subtitle: "ইন্টারেক্টিভ ইভ্যাকুয়েশন রুট সিমুলেটর",
        reset: "রিসেট",
        importTitle: "বিল্ডিং ডেটা আমদানি",
        selectFile: "JSON ফাইল নির্বাচন করুন",
        startLocation: "শুরুর অবস্থান",
        selectStart: "— শুরুর পয়েন্ট নির্বাচন করুন —",
        hazardControls: "বিপদ নিয়ন্ত্রণ",
        rooms: "কক্ষসমূহ",
        junctions: "সংযোগস্থলসমূহ",
        corridors: "করিডোরসমূহ",
        exits: "বহির্গমনসমূহ",
        buildingMap: "বিল্ডিং ম্যাপ",
        routeInfo: "রুট তথ্য",
        startLabel: "শুরু:",
        exitLabel: "বহির্গমন:",
        routeLabel: "রুট:",
        costLabel: "মোট খরচ:",
        statusLabel: "অবস্থা:",
        legend: "চিহ্নের বিবরণ",
        instructions: "নির্দেশনা",
        legendRoom: "কক্ষ",
        legendJunction: "সংযোগস্থল",
        legendExit: "বহির্গমন",
        legendSelected: "নির্বাচিত শুরু",
        legendBlocked: "ব্লক করা নোড",
        legendBlockedCorridor: "ব্লক করা করিডোর",
        legendClosed: "বন্ধ বহির্গমন",
        legendRoute: "সক্রিয় রুট",
        block: "ব্লক",
        unblock: "আনব্লক",
        close: "বন্ধ",
        reopen: "খুলুন",
        blocked: "ব্লক",
        closed: "বন্ধ",
        routeAvailable: "রুট পাওয়া গেছে",
        noRoute: "কোনো রুট পাওয়া যায়নি",
        startBlocked: "শুরুর অবস্থান ব্লক করা হয়েছে",
        buildingLoaded: "বিল্ডিং লোড হয়েছে",
        noFileSelected: "কোনো ফাইল নির্বাচন করা হয়নি।",
        invalidJSON: "অবৈধ JSON ফাইল।",
        selectStartPrompt: "ম্যাপে একটি কক্ষ বা সংযোগস্থলে ক্লিক করুন, অথবা ড্রপডাউন থেকে নির্বাচন করুন।",
        startingAt: "শুরুর অবস্থান",
        footerText: "শিক্ষামূলক ইভ্যাকুয়েশন সিমুলেটর",
        instruction1: "একটি বিল্ডিং JSON ফাইল আমদানি করুন।",
        instruction2: "আপনার শুরুর পয়েন্ট হিসেবে একটি কক্ষ বা সংযোগস্থল নির্বাচন করুন।",
        instruction3: "অ্যাপ্লিকেশনটি একটি খোলা বহির্গমনে সর্বনিম্ন-খরচের রুট গণনা করে।",
        instruction4: "বিপদ অনুকরণ করতে কক্ষ, সংযোগস্থল বা করিডোর ব্লক করুন।",
        instruction5: "অনুপলব্ধ বহির্গমন অনুকরণ করতে বহির্গমন বন্ধ করুন।",
        instruction6: "রুট স্বয়ংক্রিয়ভাবে পুনঃগণনা করা হয়।",
        instruction7: "মূল অবস্থা পুনরুদ্ধার করতে রিসেট ব্যবহার করুন।"
    }
};

/** Return the translation for a given key in the current language */
function t(key) {
    return (translations[currentLang] && translations[currentLang][key]) || key;
}

// ================================================================
// 3. LANGUAGE SWITCHING
// ================================================================

/**
 * Switch the interface language without reloading the page.
 * Updates all elements that carry a data-i18n attribute and
 * refreshes hazard control labels.
 */
function setLanguage(lang) {
    currentLang = lang;

    // Update language buttons
    document.getElementById('btn-lang-en').classList.toggle('active', lang === 'en');
    document.getElementById('btn-lang-bn').classList.toggle('active', lang === 'bn');
    document.getElementById('btn-lang-en').setAttribute('aria-pressed', lang === 'en');
    document.getElementById('btn-lang-bn').setAttribute('aria-pressed', lang === 'bn');
    document.documentElement.lang = lang;

    // Update all data-i18n elements
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
        var key = el.getAttribute('data-i18n');
        if (translations[lang][key] !== undefined) {
            el.textContent = translations[lang][key];
        }
    });

    // Refresh dynamically generated controls if building is loaded
    if (buildingData) {
        populateHazardControls();
        populateStartDropdown();
        updateRouteDisplay();
    }
}

// ================================================================
// 4. FILE IMPORT & LOADING
// ================================================================

/**
 * Handle the file input change event.
 * Reads the selected JSON file, parses it, and triggers loading.
 */
function handleFileImport(event) {
    var file = event.target.files[0];
    if (!file) {
        showStatus(t('noFileSelected'), 'error');
        return;
    }

    var reader = new FileReader();
    reader.onload = function (e) {
        try {
            var data = JSON.parse(e.target.result);
            loadBuilding(data);
        } catch (err) {
            showStatus(t('invalidJSON') + ' ' + err.message, 'error');
        }
    };
    reader.onerror = function () {
        showStatus(t('invalidJSON'), 'error');
    };
    reader.readAsText(file);
}

/**
 * Main entry point after JSON is parsed.
 * Validates, builds the graph, renders the map, and sets up controls.
 */
function loadBuilding(data) {
    // Validate the imported data
    var errors = validateBuilding(data);
    if (errors.length > 0) {
        showStatus(errors.join('\n'), 'error');
        return;
    }

    // Store building data and build lookup tables
    buildingData = data;
    nodeMap = {};
    edgeMap = {};
    edgeBetween = {};

    for (var i = 0; i < data.nodes.length; i++) {
        nodeMap[data.nodes[i].id] = data.nodes[i];
    }
    for (var i = 0; i < data.edges.length; i++) {
        edgeMap[data.edges[i].id] = data.edges[i];
    }

    // Store the original hazard state for Reset
    originalState = {
        blockedNodes: new Set(data.initial_state.blocked_nodes || []),
        blockedEdges: new Set(data.initial_state.blocked_edges || []),
        closedExits: new Set(data.initial_state.closed_exits || [])
    };

    // Clone original state into current state
    currentState = {
        blockedNodes: new Set(originalState.blockedNodes),
        blockedEdges: new Set(originalState.blockedEdges),
        closedExits: new Set(originalState.closedExits)
    };

    // Reset selection
    selectedStart = null;

    // Build the graph adjacency list
    buildGraph();

    // Render the SVG map
    renderMap();

    // Populate UI controls
    populateStartDropdown();
    populateHazardControls();

    // Apply initial visual states
    updateMapVisuals();

    // Show the hidden sections
    document.getElementById('main-content').classList.remove('hidden');
    document.getElementById('main-content').classList.add('fade-in');
    document.getElementById('route-section').classList.remove('hidden');
    document.getElementById('route-section').classList.add('fade-in');
    document.getElementById('legend-section').classList.remove('hidden');
    document.getElementById('legend-section').classList.add('fade-in');
    document.getElementById('instructions-section').classList.remove('hidden');
    document.getElementById('instructions-section').classList.add('fade-in');

    // Enable the Reset button
    document.getElementById('btn-reset').disabled = false;

    // Clear route display
    clearRouteDisplay();

    // Show success
    showStatus(t('buildingLoaded') + ': ' + data.building, 'success');
}

// ================================================================
// 5. JSON VALIDATION
// ================================================================

/**
 * Validates the building JSON structure and returns an array of
 * error messages. An empty array means the data is valid.
 */
function validateBuilding(data) {
    var errors = [];

    // ---- Building name ----
    if (!data.building || typeof data.building !== 'string' || data.building.trim() === '') {
        errors.push('Invalid JSON: "building" must be a non-empty string.');
    }

    // ---- Nodes ----
    if (!data.nodes || !Array.isArray(data.nodes)) {
        errors.push('Invalid JSON: "nodes" must be an array.');
        return errors; // can't continue without nodes
    }
    if (data.nodes.length < 2) {
        errors.push('Invalid JSON: Must have at least 2 nodes.');
    }
    if (data.nodes.length > 60) {
        errors.push('Invalid JSON: Cannot exceed 60 nodes.');
    }

    var validTypes = { room: true, junction: true, exit: true };
    var nodeIds = {};
    for (var i = 0; i < data.nodes.length; i++) {
        var n = data.nodes[i];
        if (!n.id || typeof n.id !== 'string') {
            errors.push('Invalid JSON: Node at index ' + i + ' has an invalid ID.');
            continue;
        }
        if (nodeIds[n.id]) {
            errors.push('Invalid JSON: Duplicate node ID "' + n.id + '".');
        }
        nodeIds[n.id] = true;

        if (!n.label || typeof n.label !== 'string' || n.label.trim() === '') {
            errors.push('Invalid JSON: Node ' + n.id + ' has an invalid label.');
        }
        if (!validTypes[n.type]) {
            errors.push('Invalid JSON: Node ' + n.id + ' has an invalid type "' + n.type + '".');
        }
        if (typeof n.x !== 'number' || isNaN(n.x)) {
            errors.push('Invalid JSON: Node ' + n.id + ' has a non-numeric x coordinate.');
        }
        if (typeof n.y !== 'number' || isNaN(n.y)) {
            errors.push('Invalid JSON: Node ' + n.id + ' has a non-numeric y coordinate.');
        }
    }

    // ---- Edges ----
    if (!data.edges || !Array.isArray(data.edges)) {
        errors.push('Invalid JSON: "edges" must be an array.');
        return errors;
    }
    if (data.edges.length > 150) {
        errors.push('Invalid JSON: Cannot exceed 150 edges.');
    }

    var edgeIds = {};
    var pairSet = {};
    for (var i = 0; i < data.edges.length; i++) {
        var e = data.edges[i];
        if (!e.id || typeof e.id !== 'string') {
            errors.push('Invalid JSON: Edge at index ' + i + ' has an invalid ID.');
            continue;
        }
        if (edgeIds[e.id]) {
            errors.push('Invalid JSON: Duplicate edge ID "' + e.id + '".');
        }
        edgeIds[e.id] = true;

        if (!e.from || !nodeIds[e.from]) {
            errors.push('Invalid JSON: Edge ' + e.id + ' references an unknown node "' + e.from + '".');
        }
        if (!e.to || !nodeIds[e.to]) {
            errors.push('Invalid JSON: Edge ' + e.id + ' references an unknown node "' + e.to + '".');
        }
        if (e.from && e.to && e.from === e.to) {
            errors.push('Invalid JSON: Edge ' + e.id + ' is a self-loop.');
        }
        if (typeof e.cost !== 'number' || !Number.isInteger(e.cost) || e.cost < 1) {
            errors.push('Invalid JSON: Edge ' + e.id + ' has an invalid cost (must be a positive integer).');
        }

        // Check for duplicate node pairs (undirected)
        if (e.from && e.to) {
            var pairKey = [e.from, e.to].sort().join('|');
            if (pairSet[pairKey]) {
                errors.push('Invalid JSON: Duplicate edge between ' + e.from + ' and ' + e.to + '.');
            }
            pairSet[pairKey] = true;
        }
    }

    // ---- Initial state ----
    if (!data.initial_state || typeof data.initial_state !== 'object') {
        errors.push('Invalid JSON: "initial_state" must be an object.');
    } else {
        var is = data.initial_state;
        if (is.blocked_nodes) {
            for (var i = 0; i < is.blocked_nodes.length; i++) {
                var nid = is.blocked_nodes[i];
                if (!nodeIds[nid]) {
                    errors.push('Invalid JSON: initial_state.blocked_nodes references unknown node "' + nid + '".');
                } else {
                    var nodeObj = data.nodes.find(function (nd) { return nd.id === nid; });
                    if (nodeObj && nodeObj.type === 'exit') {
                        errors.push('Invalid JSON: initial_state.blocked_nodes contains exit "' + nid + '". Use closed_exits instead.');
                    }
                }
            }
        }
        if (is.blocked_edges) {
            for (var i = 0; i < is.blocked_edges.length; i++) {
                if (!edgeIds[is.blocked_edges[i]]) {
                    errors.push('Invalid JSON: initial_state.blocked_edges references unknown edge "' + is.blocked_edges[i] + '".');
                }
            }
        }
        if (is.closed_exits) {
            for (var i = 0; i < is.closed_exits.length; i++) {
                var eid = is.closed_exits[i];
                if (!nodeIds[eid]) {
                    errors.push('Invalid JSON: initial_state.closed_exits references unknown node "' + eid + '".');
                } else {
                    var nodeObj = data.nodes.find(function (nd) { return nd.id === eid; });
                    if (nodeObj && nodeObj.type !== 'exit') {
                        errors.push('Invalid JSON: initial_state.closed_exits contains non-exit node "' + eid + '".');
                    }
                }
            }
        }
    }

    return errors;
}

// ================================================================
// 6. GRAPH CONSTRUCTION
// ================================================================

/**
 * Build an undirected weighted adjacency list from the building data.
 * Also creates the edgeBetween lookup for quick edge identification
 * when highlighting routes.
 */
function buildGraph() {
    graph = {};
    edgeBetween = {};

    // Initialize empty adjacency lists
    for (var i = 0; i < buildingData.nodes.length; i++) {
        graph[buildingData.nodes[i].id] = [];
    }

    // Add edges (undirected: each edge added to both endpoints)
    for (var i = 0; i < buildingData.edges.length; i++) {
        var e = buildingData.edges[i];
        graph[e.from].push({ neighbor: e.to, edgeId: e.id, cost: e.cost });
        graph[e.to].push({ neighbor: e.from, edgeId: e.id, cost: e.cost });

        // Store lookup for edge between two nodes (both orderings)
        var key1 = e.from + '|' + e.to;
        var key2 = e.to + '|' + e.from;
        edgeBetween[key1] = e.id;
        edgeBetween[key2] = e.id;
    }
}

// ================================================================
// 7. SVG MAP RENDERING
// ================================================================

/**
 * Calculate the SVG viewBox dynamically based on node coordinates.
 * Returns a string suitable for the viewBox attribute.
 */
function calculateViewBox() {
    if (!buildingData || buildingData.nodes.length === 0) {
        return '0 0 800 500';
    }

    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (var i = 0; i < buildingData.nodes.length; i++) {
        var n = buildingData.nodes[i];
        if (n.x < minX) minX = n.x;
        if (n.y < minY) minY = n.y;
        if (n.x > maxX) maxX = n.x;
        if (n.y > maxY) maxY = n.y;
    }

    var padX = 100;
    var padY = 80;
    return (minX - padX) + ' ' + (minY - padY) + ' ' + (maxX - minX + padX * 2) + ' ' + (maxY - minY + padY * 2);
}

/**
 * Render the complete SVG map: edges, edge labels, and nodes.
 * Clears any previous rendering before drawing.
 */
function renderMap() {
    var svg = document.getElementById('building-svg');
    svg.setAttribute('viewBox', calculateViewBox());

    // Clear existing layers
    document.getElementById('edges-layer').innerHTML = '';
    document.getElementById('edge-labels-layer').innerHTML = '';
    document.getElementById('route-layer').innerHTML = '';
    document.getElementById('nodes-layer').innerHTML = '';

    renderEdges();
    renderNodes();
}

/**
 * Render all corridor edges and their cost labels.
 */
function renderEdges() {
    var edgesLayer = document.getElementById('edges-layer');
    var labelsLayer = document.getElementById('edge-labels-layer');
    var svgNS = 'http://www.w3.org/2000/svg';

    for (var i = 0; i < buildingData.edges.length; i++) {
        var e = buildingData.edges[i];
        var fromNode = nodeMap[e.from];
        var toNode = nodeMap[e.to];

        // Draw the edge line
        var line = document.createElementNS(svgNS, 'line');
        line.setAttribute('id', 'edge-' + e.id);
        line.setAttribute('class', 'svg-edge');
        line.setAttribute('x1', fromNode.x);
        line.setAttribute('y1', fromNode.y);
        line.setAttribute('x2', toNode.x);
        line.setAttribute('y2', toNode.y);
        edgesLayer.appendChild(line);

        // Draw the cost label at the midpoint
        var midX = (fromNode.x + toNode.x) / 2;
        var midY = (fromNode.y + toNode.y) / 2;

        // Offset the label perpendicular to the edge for readability
        var dx = toNode.x - fromNode.x;
        var dy = toNode.y - fromNode.y;
        var len = Math.sqrt(dx * dx + dy * dy) || 1;
        var offsetX = (-dy / len) * 14;
        var offsetY = (dx / len) * 14;

        var labelGroup = document.createElementNS(svgNS, 'g');
        labelGroup.setAttribute('id', 'edge-label-' + e.id);
        labelGroup.setAttribute('class', 'edge-label-group');

        var bg = document.createElementNS(svgNS, 'rect');
        bg.setAttribute('class', 'edge-cost-bg');
        bg.setAttribute('x', midX + offsetX - 12);
        bg.setAttribute('y', midY + offsetY - 8);
        bg.setAttribute('width', 24);
        bg.setAttribute('height', 16);
        labelGroup.appendChild(bg);

        var text = document.createElementNS(svgNS, 'text');
        text.setAttribute('class', 'edge-cost-text');
        text.setAttribute('x', midX + offsetX);
        text.setAttribute('y', midY + offsetY);
        text.textContent = e.cost;
        labelGroup.appendChild(text);

        labelsLayer.appendChild(labelGroup);
    }
}

/**
 * Render all nodes (rooms, junctions, exits) as SVG shapes.
 */
function renderNodes() {
    var nodesLayer = document.getElementById('nodes-layer');
    var svgNS = 'http://www.w3.org/2000/svg';

    for (var i = 0; i < buildingData.nodes.length; i++) {
        var n = buildingData.nodes[i];
        var g = document.createElementNS(svgNS, 'g');
        g.setAttribute('id', 'node-' + n.id);
        g.setAttribute('class', 'svg-node node-' + n.type);
        g.setAttribute('data-node-id', n.id);

        if (n.type === 'junction') {
            // Junction: circle shape
            var circle = document.createElementNS(svgNS, 'circle');
            circle.setAttribute('class', 'node-shape');
            circle.setAttribute('cx', n.x);
            circle.setAttribute('cy', n.y);
            circle.setAttribute('r', 24);
            g.appendChild(circle);

            // Label inside circle
            var label = document.createElementNS(svgNS, 'text');
            label.setAttribute('class', 'node-label');
            label.setAttribute('x', n.x);
            label.setAttribute('y', n.y - 3);
            label.textContent = n.label;
            g.appendChild(label);

            // ID below label
            var idText = document.createElementNS(svgNS, 'text');
            idText.setAttribute('class', 'node-id');
            idText.setAttribute('x', n.x);
            idText.setAttribute('y', n.y + 10);
            idText.textContent = n.id;
            g.appendChild(idText);
        } else {
            // Room or Exit: rounded rectangle
            var rectW = 104;
            var rectH = 44;
            var rect = document.createElementNS(svgNS, 'rect');
            rect.setAttribute('class', 'node-shape');
            rect.setAttribute('x', n.x - rectW / 2);
            rect.setAttribute('y', n.y - rectH / 2);
            rect.setAttribute('width', rectW);
            rect.setAttribute('height', rectH);
            rect.setAttribute('rx', 10);
            g.appendChild(rect);

            // Label
            var label = document.createElementNS(svgNS, 'text');
            label.setAttribute('class', 'node-label');
            label.setAttribute('x', n.x);
            label.setAttribute('y', n.y - 3);
            label.textContent = n.label;
            g.appendChild(label);

            // ID
            var idText = document.createElementNS(svgNS, 'text');
            idText.setAttribute('class', 'node-id');
            idText.setAttribute('x', n.x);
            idText.setAttribute('y', n.y + 12);
            idText.textContent = n.id;
            g.appendChild(idText);

            // Exit icon (small arrow)
            if (n.type === 'exit') {
                var arrow = document.createElementNS(svgNS, 'text');
                arrow.setAttribute('class', 'node-label');
                arrow.setAttribute('x', n.x + rectW / 2 - 14);
                arrow.setAttribute('y', n.y + 2);
                arrow.setAttribute('font-size', '14');
                arrow.textContent = '→';
                g.appendChild(arrow);
            }
        }

        // Click handler for node selection
        g.addEventListener('click', (function (nodeId) {
            return function () { selectStart(nodeId); };
        })(n.id));

        nodesLayer.appendChild(g);
    }
}

// ================================================================
// 8. MAP VISUAL STATE UPDATES
// ================================================================

/**
 * Update all SVG elements to reflect the current hazard state
 * (blocked nodes, blocked edges, closed exits, selected start,
 * and route highlighting).
 */
function updateMapVisuals() {
    // ---- Update node visuals ----
    for (var i = 0; i < buildingData.nodes.length; i++) {
        var n = buildingData.nodes[i];
        var g = document.getElementById('node-' + n.id);
        if (!g) continue;

        // Remove all state classes
        g.classList.remove('selected', 'blocked', 'closed', 'on-route', 'no-click');

        // Remove existing overlay X marks
        var oldX = g.querySelectorAll('.blocked-x, .closed-x');
        oldX.forEach(function (el) { el.remove(); });

        // Apply current state classes
        if (currentState.blockedNodes.has(n.id)) {
            g.classList.add('blocked', 'no-click');
            addXOverlay(g, n, 'blocked-x');
        } else if (n.type === 'exit' && currentState.closedExits.has(n.id)) {
            g.classList.add('closed', 'no-click');
            addXOverlay(g, n, 'closed-x');
        } else if (n.id === selectedStart) {
            g.classList.add('selected');
        }

        // Exits are never selectable as start
        if (n.type === 'exit') {
            g.classList.add('no-click');
        }
    }

    // ---- Update edge visuals ----
    for (var i = 0; i < buildingData.edges.length; i++) {
        var e = buildingData.edges[i];
        var line = document.getElementById('edge-' + e.id);
        var labelGroup = document.getElementById('edge-label-' + e.id);
        if (!line) continue;

        line.classList.remove('blocked-edge', 'implicitly-blocked');
        if (labelGroup) labelGroup.classList.remove('blocked-label');

        if (currentState.blockedEdges.has(e.id)) {
            // Explicitly blocked corridor
            line.classList.add('blocked-edge');
            if (labelGroup) labelGroup.classList.add('blocked-label');
        } else if (currentState.blockedNodes.has(e.from) || currentState.blockedNodes.has(e.to)) {
            // Implicitly blocked (attached to a blocked node)
            line.classList.add('implicitly-blocked');
            if (labelGroup) labelGroup.classList.add('blocked-label');
        }
    }
}

/**
 * Add an X overlay on a node to indicate it is blocked or closed.
 */
function addXOverlay(group, node, cssClass) {
    var svgNS = 'http://www.w3.org/2000/svg';
    var size = node.type === 'junction' ? 12 : 16;

    var line1 = document.createElementNS(svgNS, 'line');
    line1.setAttribute('class', cssClass);
    line1.setAttribute('x1', node.x - size);
    line1.setAttribute('y1', node.y - size);
    line1.setAttribute('x2', node.x + size);
    line1.setAttribute('y2', node.y + size);
    group.appendChild(line1);

    var line2 = document.createElementNS(svgNS, 'line');
    line2.setAttribute('class', cssClass);
    line2.setAttribute('x1', node.x + size);
    line2.setAttribute('y1', node.y - size);
    line2.setAttribute('x2', node.x - size);
    line2.setAttribute('y2', node.y + size);
    group.appendChild(line2);
}

// ================================================================
// 9. ROUTE HIGHLIGHTING ON MAP
// ================================================================

/**
 * Highlight the calculated route on the SVG map.
 * Draws bright animated lines on the route layer and marks
 * on-route nodes.
 */
function highlightRoute(path) {
    var routeLayer = document.getElementById('route-layer');
    routeLayer.innerHTML = '';

    // Remove 'on-route' from all nodes first
    document.querySelectorAll('.svg-node.on-route').forEach(function (el) {
        el.classList.remove('on-route');
    });

    if (!path || path.length < 2) return;

    var svgNS = 'http://www.w3.org/2000/svg';

    // Draw route edge highlights
    for (var i = 0; i < path.length - 1; i++) {
        var fromNode = nodeMap[path[i]];
        var toNode = nodeMap[path[i + 1]];

        var line = document.createElementNS(svgNS, 'line');
        line.setAttribute('class', 'route-edge-highlight');
        line.setAttribute('x1', fromNode.x);
        line.setAttribute('y1', fromNode.y);
        line.setAttribute('x2', toNode.x);
        line.setAttribute('y2', toNode.y);
        routeLayer.appendChild(line);
    }

    // Mark nodes on the route
    for (var i = 0; i < path.length; i++) {
        var nodeEl = document.getElementById('node-' + path[i]);
        if (nodeEl && !nodeEl.classList.contains('blocked') && !nodeEl.classList.contains('closed')) {
            nodeEl.classList.add('on-route');
        }
    }
}

/**
 * Clear all route highlights from the map.
 */
function clearRouteHighlight() {
    var routeLayer = document.getElementById('route-layer');
    if (routeLayer) routeLayer.innerHTML = '';

    document.querySelectorAll('.svg-node.on-route').forEach(function (el) {
        el.classList.remove('on-route');
    });
}

// ================================================================
// 10. START LOCATION SELECTION
// ================================================================

/**
 * Select a node as the starting location.
 * Only rooms and junctions that are not blocked can be selected.
 */
function selectStart(nodeId) {
    var node = nodeMap[nodeId];
    if (!node) return;

    // Exits cannot be selected as start
    if (node.type === 'exit') return;

    // Blocked nodes cannot be selected as start
    if (currentState.blockedNodes.has(nodeId)) return;

    selectedStart = nodeId;

    // Update dropdown to match
    var select = document.getElementById('start-select');
    select.value = nodeId;

    // Update info text
    document.getElementById('start-info').textContent = t('startingAt') + ': ' + node.label + ' (' + nodeId + ')';

    // Update visuals and calculate route
    updateMapVisuals();
    calculateRoute();
}

/**
 * Handle dropdown change for start selection.
 */
function handleStartDropdownChange(event) {
    var val = event.target.value;
    if (val) {
        selectStart(val);
    } else {
        selectedStart = null;
        clearRouteDisplay();
        clearRouteHighlight();
        updateMapVisuals();
        document.getElementById('start-info').textContent = t('selectStartPrompt');
    }
}

// ================================================================
// 11. DIJKSTRA'S SHORTEST-PATH ALGORITHM
// ================================================================

/**
 * Compare two path arrays lexicographically.
 * Returns negative if pathA < pathB, positive if pathA > pathB,
 * zero if equal.
 *
 * Lexicographic comparison: compare element by element using
 * standard string comparison. Shorter path wins if all preceding
 * elements are equal.
 */
function comparePathsLex(pathA, pathB) {
    var minLen = Math.min(pathA.length, pathB.length);
    for (var i = 0; i < minLen; i++) {
        if (pathA[i] < pathB[i]) return -1;
        if (pathA[i] > pathB[i]) return 1;
    }
    return pathA.length - pathB.length;
}

/**
 * Dijkstra's algorithm finds the minimum-cost path from the
 * selected starting node to every reachable node in the graph.
 *
 * How it works:
 * 1. Set the distance to the start node as 0, all others as Infinity.
 * 2. Repeatedly pick the unvisited node with the smallest distance.
 * 3. For each neighbor of that node, check if going through the
 *    current node gives a shorter path. If yes, update the distance.
 * 4. If the distance is equal, keep the lexicographically smaller path
 *    (this implements tie-breaking as required by the specification).
 * 5. Mark the current node as visited and repeat.
 *
 * The algorithm skips:
 * - Blocked nodes (they cannot be entered or crossed)
 * - Blocked edges (those specific corridors are unavailable)
 * - Edges connected to blocked nodes (they become unusable)
 * - Closed exits (they cannot be used as intermediate or destination)
 *
 * @param {string} startId - The ID of the starting node.
 * @returns {object} An object with dist (distances) and paths (full paths).
 */
function dijkstra(startId) {
    var dist = {};   // dist[nodeId] = minimum cost to reach this node
    var paths = {};  // paths[nodeId] = array of node IDs forming the path
    var visited = {};

    // Step 1: Initialize all distances to Infinity
    for (var i = 0; i < buildingData.nodes.length; i++) {
        var nid = buildingData.nodes[i].id;
        dist[nid] = Infinity;
        paths[nid] = null;
    }

    // The start node has distance 0
    dist[startId] = 0;
    paths[startId] = [startId];

    // Step 2: Process nodes one by one
    while (true) {
        // Find the unvisited node with the smallest distance
        var current = null;
        var currentDist = Infinity;

        for (var nid in dist) {
            if (!visited[nid] && dist[nid] < currentDist) {
                currentDist = dist[nid];
                current = nid;
            } else if (!visited[nid] && dist[nid] === currentDist && current !== null) {
                // Among nodes with equal distance, prefer lexicographically smaller ID
                // (this ensures consistent processing order)
                if (nid < current) {
                    current = nid;
                }
            }
        }

        // If no reachable unvisited node remains, we are done
        if (current === null || currentDist === Infinity) break;

        // Mark as visited
        visited[current] = true;

        // Skip blocked nodes (except the start node itself, which is handled elsewhere)
        if (currentState.blockedNodes.has(current)) continue;

        // Skip closed exits (they cannot be traversed)
        if (currentState.closedExits.has(current)) continue;

        // Step 3: Relax all edges from the current node
        var neighbors = graph[current] || [];
        for (var j = 0; j < neighbors.length; j++) {
            var edge = neighbors[j];
            var neighbor = edge.neighbor;

            // Skip if the neighbor node is blocked
            if (currentState.blockedNodes.has(neighbor)) continue;

            // Skip if this specific corridor is blocked
            if (currentState.blockedEdges.has(edge.edgeId)) continue;

            // Skip if the neighbor is a closed exit
            if (currentState.closedExits.has(neighbor)) continue;

            // Calculate the new distance through the current node
            var newDist = dist[current] + edge.cost;
            var newPath = paths[current].concat([neighbor]);

            if (newDist < dist[neighbor]) {
                // Found a shorter path — update
                dist[neighbor] = newDist;
                paths[neighbor] = newPath;
            } else if (newDist === dist[neighbor] && paths[neighbor] !== null) {
                // Step 4: Equal cost — keep the lexicographically smaller path
                if (comparePathsLex(newPath, paths[neighbor]) < 0) {
                    paths[neighbor] = newPath;
                }
            }
        }
    }

    return { dist: dist, paths: paths };
}

// ================================================================
// 12. ROUTE CALCULATION & DISPLAY
// ================================================================

/**
 * Calculate the optimal evacuation route from the selected start
 * to the best reachable open exit.
 *
 * Exit selection rules:
 * 1. Among all reachable open exits, choose the one with minimum cost.
 * 2. If multiple exits share the same minimum cost, choose the one
 *    with the lexicographically smallest exit ID.
 */
function calculateRoute() {
    if (!buildingData || !selectedStart) return;

    // Check if the starting location is blocked
    if (currentState.blockedNodes.has(selectedStart)) {
        clearRouteHighlight();
        showRouteBlocked();
        return;
    }

    // Run Dijkstra from the selected start
    var result = dijkstra(selectedStart);

    // Find the best reachable open exit
    var bestExit = null;
    var bestCost = Infinity;

    for (var i = 0; i < buildingData.nodes.length; i++) {
        var n = buildingData.nodes[i];

        // Only consider open (not closed) exit nodes
        if (n.type !== 'exit') continue;
        if (currentState.closedExits.has(n.id)) continue;

        var exitCost = result.dist[n.id];
        if (exitCost === Infinity) continue; // unreachable

        if (exitCost < bestCost) {
            bestCost = exitCost;
            bestExit = n.id;
        } else if (exitCost === bestCost && bestExit !== null) {
            // Tie-breaking: choose lexicographically smallest exit ID
            if (n.id < bestExit) {
                bestExit = n.id;
            }
        }
    }

    // Display the result
    if (bestExit === null) {
        // No reachable open exit
        clearRouteHighlight();
        showRouteNoRoute();
    } else {
        var path = result.paths[bestExit];
        highlightRoute(path);
        showRouteSuccess(selectedStart, bestExit, path, bestCost);
    }
}

/**
 * Display a successful route in the route information panel.
 */
function showRouteSuccess(start, exit, path, cost) {
    document.getElementById('route-start').textContent = start;
    document.getElementById('route-exit').textContent = exit;
    document.getElementById('route-path').textContent = path.join(' → ');
    document.getElementById('route-cost').textContent = cost;

    var statusEl = document.getElementById('route-status');
    statusEl.textContent = t('routeAvailable');
    statusEl.className = 'route-value status-badge route-ok';
}

/**
 * Display "No route available" status.
 */
function showRouteNoRoute() {
    document.getElementById('route-start').textContent = selectedStart || '—';
    document.getElementById('route-exit').textContent = '—';
    document.getElementById('route-path').textContent = '—';
    document.getElementById('route-cost').textContent = '—';

    var statusEl = document.getElementById('route-status');
    statusEl.textContent = t('noRoute');
    statusEl.className = 'route-value status-badge route-fail';
}

/**
 * Display "Starting location blocked" status.
 */
function showRouteBlocked() {
    document.getElementById('route-start').textContent = selectedStart || '—';
    document.getElementById('route-exit').textContent = '—';
    document.getElementById('route-path').textContent = '—';
    document.getElementById('route-cost').textContent = '—';

    var statusEl = document.getElementById('route-status');
    statusEl.textContent = t('startBlocked');
    statusEl.className = 'route-value status-badge route-blocked';
}

/**
 * Clear all route information from the display.
 */
function clearRouteDisplay() {
    document.getElementById('route-start').textContent = '—';
    document.getElementById('route-exit').textContent = '—';
    document.getElementById('route-path').textContent = '—';
    document.getElementById('route-cost').textContent = '—';

    var statusEl = document.getElementById('route-status');
    statusEl.textContent = '—';
    statusEl.className = 'route-value status-badge';
}

/**
 * Re-display route information after a language switch.
 * Keeps the same data but updates the status text.
 */
function updateRouteDisplay() {
    if (!selectedStart) return;

    // Simply recalculate (fast enough for our scale)
    calculateRoute();
}

// ================================================================
// 13. HAZARD CONTROLS
// ================================================================

/**
 * Toggle a room or junction between blocked and unblocked.
 * Immediately recalculates the route.
 */
function toggleNodeBlock(nodeId) {
    if (currentState.blockedNodes.has(nodeId)) {
        currentState.blockedNodes.delete(nodeId);
    } else {
        currentState.blockedNodes.add(nodeId);
    }

    // Update everything
    updateHazardButtonStates();
    populateStartDropdown();
    updateMapVisuals();

    if (selectedStart) {
        calculateRoute();
    }
}

/**
 * Toggle an edge/corridor between blocked and unblocked.
 * Immediately recalculates the route.
 */
function toggleEdgeBlock(edgeId) {
    if (currentState.blockedEdges.has(edgeId)) {
        currentState.blockedEdges.delete(edgeId);
    } else {
        currentState.blockedEdges.add(edgeId);
    }

    updateHazardButtonStates();
    updateMapVisuals();

    if (selectedStart) {
        calculateRoute();
    }
}

/**
 * Toggle an exit between closed and open.
 * Immediately recalculates the route.
 */
function toggleExitClosed(exitId) {
    if (currentState.closedExits.has(exitId)) {
        currentState.closedExits.delete(exitId);
    } else {
        currentState.closedExits.add(exitId);
    }

    updateHazardButtonStates();
    updateMapVisuals();

    if (selectedStart) {
        calculateRoute();
    }
}

/**
 * Generate hazard control buttons dynamically from the building data.
 */
function populateHazardControls() {
    var roomContainer = document.getElementById('room-controls');
    var juncContainer = document.getElementById('junction-controls');
    var corrContainer = document.getElementById('corridor-controls');
    var exitContainer = document.getElementById('exit-controls');

    roomContainer.innerHTML = '';
    juncContainer.innerHTML = '';
    corrContainer.innerHTML = '';
    exitContainer.innerHTML = '';

    // Room and Junction controls
    for (var i = 0; i < buildingData.nodes.length; i++) {
        var n = buildingData.nodes[i];
        if (n.type === 'room' || n.type === 'junction') {
            var container = n.type === 'room' ? roomContainer : juncContainer;
            var isBlocked = currentState.blockedNodes.has(n.id);

            var btn = document.createElement('button');
            btn.className = 'hazard-btn' + (isBlocked ? ' active' : '');
            btn.setAttribute('data-node-id', n.id);
            btn.setAttribute('aria-label', (isBlocked ? t('unblock') : t('block')) + ' ' + n.label);

            btn.innerHTML =
                '<span class="hazard-dot"></span>' +
                '<span class="hazard-name">' + n.label + ' (' + n.id + ')</span>' +
                '<span class="hazard-action">' + (isBlocked ? t('unblock') : t('block')) + '</span>';

            btn.addEventListener('click', (function (id) {
                return function () { toggleNodeBlock(id); };
            })(n.id));

            container.appendChild(btn);
        }
    }

    // Corridor controls
    for (var i = 0; i < buildingData.edges.length; i++) {
        var e = buildingData.edges[i];
        var isBlocked = currentState.blockedEdges.has(e.id);

        var btn = document.createElement('button');
        btn.className = 'hazard-btn' + (isBlocked ? ' active' : '');
        btn.setAttribute('data-edge-id', e.id);
        btn.setAttribute('aria-label', (isBlocked ? t('unblock') : t('block')) + ' ' + e.id);

        btn.innerHTML =
            '<span class="hazard-dot"></span>' +
            '<span class="hazard-name">' + e.id + ' (' + e.from + '↔' + e.to + ', ' + t('costLabel').replace(':', '') + ' ' + e.cost + ')</span>' +
            '<span class="hazard-action">' + (isBlocked ? t('unblock') : t('block')) + '</span>';

        btn.addEventListener('click', (function (id) {
            return function () { toggleEdgeBlock(id); };
        })(e.id));

        corrContainer.appendChild(btn);
    }

    // Exit controls
    for (var i = 0; i < buildingData.nodes.length; i++) {
        var n = buildingData.nodes[i];
        if (n.type !== 'exit') continue;

        var isClosed = currentState.closedExits.has(n.id);

        var btn = document.createElement('button');
        btn.className = 'hazard-btn' + (isClosed ? ' active closed-exit' : '');
        btn.setAttribute('data-exit-id', n.id);
        btn.setAttribute('aria-label', (isClosed ? t('reopen') : t('close')) + ' ' + n.label);

        btn.innerHTML =
            '<span class="hazard-dot"></span>' +
            '<span class="hazard-name">' + n.label + ' (' + n.id + ')</span>' +
            '<span class="hazard-action">' + (isClosed ? t('reopen') : t('close')) + '</span>';

        btn.addEventListener('click', (function (id) {
            return function () { toggleExitClosed(id); };
        })(n.id));

        exitContainer.appendChild(btn);
    }
}

/**
 * Update only the visual state of existing hazard buttons
 * without recreating them. Used for quick state changes.
 */
function updateHazardButtonStates() {
    // Update room/junction buttons
    document.querySelectorAll('#room-controls .hazard-btn, #junction-controls .hazard-btn').forEach(function (btn) {
        var nodeId = btn.getAttribute('data-node-id');
        var isBlocked = currentState.blockedNodes.has(nodeId);
        btn.classList.toggle('active', isBlocked);
        var action = btn.querySelector('.hazard-action');
        if (action) action.textContent = isBlocked ? t('unblock') : t('block');
    });

    // Update corridor buttons
    document.querySelectorAll('#corridor-controls .hazard-btn').forEach(function (btn) {
        var edgeId = btn.getAttribute('data-edge-id');
        var isBlocked = currentState.blockedEdges.has(edgeId);
        btn.classList.toggle('active', isBlocked);
        var action = btn.querySelector('.hazard-action');
        if (action) action.textContent = isBlocked ? t('unblock') : t('block');
    });

    // Update exit buttons
    document.querySelectorAll('#exit-controls .hazard-btn').forEach(function (btn) {
        var exitId = btn.getAttribute('data-exit-id');
        var isClosed = currentState.closedExits.has(exitId);
        btn.classList.toggle('active', isClosed);
        btn.classList.toggle('closed-exit', isClosed);
        var action = btn.querySelector('.hazard-action');
        if (action) action.textContent = isClosed ? t('reopen') : t('close');
    });
}

// ================================================================
// 14. START LOCATION DROPDOWN
// ================================================================

/**
 * Populate the starting-location dropdown with valid rooms and junctions.
 * Blocked nodes are shown as disabled options.
 */
function populateStartDropdown() {
    var select = document.getElementById('start-select');
    var previousValue = select.value;

    select.innerHTML = '';

    // Default option
    var defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = t('selectStart');
    select.appendChild(defaultOpt);

    // Add rooms and junctions
    for (var i = 0; i < buildingData.nodes.length; i++) {
        var n = buildingData.nodes[i];
        if (n.type === 'exit') continue;

        var opt = document.createElement('option');
        opt.value = n.id;
        opt.textContent = n.label + ' (' + n.id + ')';

        if (currentState.blockedNodes.has(n.id)) {
            opt.disabled = true;
            opt.textContent += ' [' + t('blocked') + ']';
        }

        select.appendChild(opt);
    }

    // Restore previous selection if still valid
    if (selectedStart && !currentState.blockedNodes.has(selectedStart)) {
        select.value = selectedStart;
    } else if (previousValue && !currentState.blockedNodes.has(previousValue)) {
        select.value = previousValue;
    } else {
        select.value = '';
    }
}

// ================================================================
// 15. RESET
// ================================================================

/**
 * Restore the simulation to the original state from the imported JSON.
 * Re-applies the initial blocked nodes, blocked edges, and closed exits.
 * Then recalculates the route if a valid start is selected.
 */
function resetSimulation() {
    if (!buildingData) return;

    // Restore original state
    currentState = {
        blockedNodes: new Set(originalState.blockedNodes),
        blockedEdges: new Set(originalState.blockedEdges),
        closedExits: new Set(originalState.closedExits)
    };

    // Update all UI
    populateHazardControls();
    populateStartDropdown();
    updateMapVisuals();

    // Recalculate if we have a valid start
    if (selectedStart && !currentState.blockedNodes.has(selectedStart)) {
        calculateRoute();
    } else if (selectedStart && currentState.blockedNodes.has(selectedStart)) {
        // Start is blocked after reset (from initial_state)
        clearRouteHighlight();
        showRouteBlocked();
    } else {
        clearRouteDisplay();
        clearRouteHighlight();
    }

    showStatus(t('buildingLoaded') + ': ' + buildingData.building, 'info');
}

// ================================================================
// 16. UI HELPERS
// ================================================================

/**
 * Show a status/error message in the import status area.
 */
function showStatus(message, type) {
    var el = document.getElementById('import-status');
    el.textContent = message;
    el.className = 'status-message ' + (type || '');
}

// ================================================================
// 17. INITIALIZATION
// ================================================================

/**
 * Initialize the application when the DOM is ready.
 * Attaches all event listeners.
 */
function init() {
    // File input
    document.getElementById('file-input').addEventListener('change', handleFileImport);

    // File label keyboard support (Enter/Space)
    var fileLabel = document.querySelector('.file-label');
    fileLabel.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            document.getElementById('file-input').click();
        }
    });

    // Start location dropdown
    document.getElementById('start-select').addEventListener('change', handleStartDropdownChange);

    // Language switcher
    document.getElementById('btn-lang-en').addEventListener('click', function () {
        setLanguage('en');
    });
    document.getElementById('btn-lang-bn').addEventListener('click', function () {
        setLanguage('bn');
    });

    // Reset button
    document.getElementById('btn-reset').addEventListener('click', resetSimulation);

    // Set initial language
    setLanguage('en');
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
