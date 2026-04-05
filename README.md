# Seiri - Productivity Dashboard & Job Tracker

Seiri is your ultimate personal productivity dashboard and job application tracker packaged perfectly into a browser extension. Stay on track with daily habits, manage Pomodoro sessions, track job applications directly from LinkedIn, and more!

## 🚀 Features

- **Personalized New Tab Dashboard**: Replaces your default new tab with a focus-driven interface.
- **Pomodoro Timer**: Keep your focus sharp and log your completed focus sessions.
- **Habit Tracker**: Never miss a beat by tracking your daily goals and habits.
- **Job Tracker**: Seamlessly track and manage your job applications (with special LinkedIn support).
- **Widgets & More**: Weather, quotes, bookmarks, and everything you need without context switching.

## 📥 How to Install and Use (For End Users)

You can easily install this extension without putting it on the Chrome Web Store by manually loading it.

1. **Download the Extension**: Go to the [Releases page](../../releases) of this GitHub repository and download the latest `seiri-extension.zip` file.
2. **Extract the ZIP**: Unzip the downloaded file to a permanent folder on your computer (e.g., inside your Documents folder). 
3. **Open Extensions Page**: Open your Chromium-based browser (Chrome, Edge, Brave) and type `chrome://extensions/` (or `edge://extensions/`) in your address bar and press Enter.
4. **Enable Developer Mode**: In the top right corner of the Extensions page, turn on the **Developer mode** toggle.
5. **Load Unpacked Extension**: Click the **Load unpacked** button that appears in the top left.
6. **Select Folder**: Browse to the folder where you extracted the ZIP file (make sure you select the folder containing the `manifest.json` file) and select it.
7. **Done!**: The Seiri extension is now installed! Open a new tab to view your productivity dashboard, or click the extension icon in your toolbar to see the popup.

## 💻 For Developers

If you want to run the project locally or contribute:

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation & Build

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/seiri-dashboard.git
   cd seiri-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run for local development (will start a Vite dev server):
   ```bash
   npm run dev
   ```

4. **Build the extension**:
   ```bash
   npm run build
   ```
   *This will generate a `dist` folder containing the compiled extension files.*

5. **Load the Extension into Chrome**:
   - Go to `chrome://extensions/`
   - Enable **Developer mode**
   - Click **Load unpacked**
   - Select the newly generated `dist` folder.

## 🛠 Tech Stack

- **React** (v19)
- **Vite**
- **Dexie.js** (IndexedDB wrapper for local storage)
- **Tailwind CSS** (for styling)
- **Framer Motion** (for smooth animations)
- **Recharts** (for data visualization)
