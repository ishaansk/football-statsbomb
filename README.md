# ⚽ StatsBomb Football Event Explorer

A premium, interactive web application to visualize and explore open-access football data provided by **StatsBomb**. This tool allows users to browse competitions, matches, and visualize event-level data (passes, shots, dribbles, etc.) on an interactive pitch.

🔗 **Live Demo: [footballviz-ishaansk.vercel.app](https://footballviz-ishaansk.vercel.app)**

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Python: 3.9+](https://img.shields.io/badge/Python-3.9+-blue.svg)
![Framework: Flask](https://img.shields.io/badge/Framework-Flask-lightgrey.svg)
![Deployment: Vercel](https://img.shields.io/badge/Deployment-Vercel-black.svg)

## ✨ Features

- **Match Browser**: Navigate through different leagues (La Liga, Champions League, etc.) and seasons.
- **Event Visualization**: Interactive 2D pitch visualization of match events.
- **Smart Filtering**: Filter events by type: Passes, Shots, Dribbles, or Defensive actions.
- **Team-Specific Perspectives**: Automatically flips coordinates for the away team to provide a realistic match view.
- **Searchable Event Logs**: Real-time search/filter through full match event logs.
- **Modern UI**: Dark-themed, glassmorphic design built for a premium feel.

## 🛠️ Tech Stack

- **Backend**: Flask (Python)
- **Frontend**: Vanilla JavaScript, CSS3 (Glassmorphism), HTML5 Canvas
- **Data Source**: `statsbombpy` (StatsBomb Open Data)
- **Deployment**: Configured for Vercel Serverless Functions

## 🚀 Getting Started

### Prerequisites

- Python 3.9 or higher
- A virtual environment (recommended)

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ishaansk/football-visualiser.git
   cd football-visualiser
   ```

2. **Set up virtual environment**:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**:
   ```bash
   python api/index.py
   ```
   The app will be available at `http://localhost:5000`.

## 🌍 Deployment

The project is live at: **[footballviz-ishaansk.vercel.app](https://footballviz-ishaansk.vercel.app)**

This project is optimized for **Vercel**. 

- The backend is located in `api/index.py` (Serverless Function).
- The frontend is served as high-performance static files.
- Configuration is handled in `vercel.json`.

Simply connect your GitHub repository to Vercel and it will deploy automatically.


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Developed for football analytics enthusiasts.*
