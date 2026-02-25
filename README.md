# decki.ai 🎴

A modern Japanese flashcard application powered by Sensei AI.

## Features

- **JLPT Flashcards:** Study N5, N4, and N3 kanji.
- **Sensei AI Feedback:** Get real-time feedback on your practice sentences.
- **AI-Powered Deck Creation:** Create custom decks based on any theme with Sensei AI.
- **Mastery Practice:** Track your progress and practice words you've already learned.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/USERNAME/decki.ai.git
   cd decki.ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your API key:
   Create a `.env` file in the root directory and add your Google Generative AI API key:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## GitHub Setup Instructions

1. Create a new repository on GitHub named `decki.ai`.
2. Do not initialize with README, license, or gitignore.
3. In your local terminal, run:
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   git branch -M main
   git remote add origin https://github.com/USERNAME/decki.ai.git
   git push -u origin main
   ```
   *(Replace `USERNAME` with your GitHub username)*
