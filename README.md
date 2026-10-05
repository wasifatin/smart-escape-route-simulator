# 🏢 Smart Escape — Interactive Evacuation Route Simulator

A professional, frontend-only web application that simulates building evacuations using graph theory and Dijkstra's shortest-path algorithm.

## 📁 Project Structure

```
Smart-Escape/
├── index.html      → HTML structure and UI
├── style.css       → All styling, animations, responsive design
├── script.js       → Application logic, Dijkstra, graph processing
├── building.json   → Sample building data for testing
└── README.md       → This file
```

## 🚀 How to Run

1. Place all files in the same folder.
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari).
3. Click **Select JSON File** and import `building.json`.
4. Select a starting room or junction on the map or from the dropdown.
5. Simulate hazards using the control panel.
6. The route recalculates automatically.

> **No server, no build step, no dependencies.** Just open the HTML file directly.

## ✨ Features

- **Dynamic SVG Map** — Generated from imported JSON coordinates
- **Dijkstra's Algorithm** — Manual implementation with proper tie-breaking
- **Real-time Recalculation** — Route updates instantly on every hazard change
- **Bilingual UI** — English / বাংলা language switching
- **Hazard Controls** — Block rooms, junctions, corridors; close exits
- **JSON Validation** — Comprehensive input validation with clear error messages
- **Responsive Design** — Works on desktop, tablet, and mobile
- **Reset Function** — Restores the original state without re-importing
- **Accessible** — Keyboard-friendly, ARIA labels, clear visual states

## 🧪 Official Test Cases

| Test | Start | Hazard | Expected Route | Cost |
|------|-------|--------|---------------|------|
| 1 | R1 | None | R1 → C1 → C2 → E1 | 7 |
| 2 | R1 | Block C2 | R1 → C1 → C3 → C4 → E2 | 11 |
| 3 | R1 | Close E1 & E2 | No route available | — |
| 4 | R2 | None | R2 → C3 → C4 → E2 | 7 |
| 5 | R1 | Block R1 | Starting location blocked | — |

## 📊 Building JSON Schema

```json
{
  "building": "Building Name",
  "nodes": [
    { "id": "R1", "label": "Room 1", "type": "room", "x": 100, "y": 150 }
  ],
  "edges": [
    { "id": "CR1", "from": "R1", "to": "C1", "cost": 5 }
  ],
  "initial_state": {
    "blocked_nodes": [],
    "blocked_edges": [],
    "closed_exits": []
  }
}
```

## 📝 License

Educational project — free to use and modify.
