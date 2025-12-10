# Task-Sync — Smart Task, Notes & Goals Manager

Welcome to **Task-Sync**, a modern, offline-first **Productivity Web App** designed to manage your **daily tasks, personal notes, and long-term goals** in one clean, responsive dashboard.  
The entire system runs **locally inside your browser** using SQLite (via SQL.js) and LocalStorage — giving you **full ownership** of your data.


Task Manager | Notes Vault | Goal Tracker | Offline-First Productivity Tool

---

## Live Demo

Live App:
[https://roshan-z89.github.io/Task-Manager/](https://roshan-z89.github.io/Task-Manager/)

---

## Why I Made This?

This project was built to meet my **personal requirements for scheduling and managing tasks efficiently**, without relying on any third-party platforms or external services.

The primary motivation behind building this task manager was:

* To have a **custom scheduling system tailored to my daily workflow**
* To avoid dependency on:

  * Cloud-based task managers
  * Third-party SaaS tools
  * Data-sync platforms that require accounts or subscriptions
* To ensure:

  * **Full ownership and control of my data**
  * **Offline accessibility**
  * **Complete transparency in how the system works**

The intention was to create a **self-owned, fully local productivity system** that I can extend and modify as my needs evolve, without being limited by platform restrictions.

---

## Tech Stack

* **HTML5** — semantic layout and structure
* **CSS3** — glassmorphism UI and dark theme design
* **Vanilla JavaScript (ES6+)** — full application logic
* **SQL.js (SQLite in Browser)** — offline task and notes database
* **LocalStorage** — long-term goal persistence
* **No Backend | No Hosting | No APIs | Fully Local**

---

## Project Structure

```
root
│
├── index.html     # App layout and views
├── style.css      # Complete UI styling and animations
├── script.js      # Tasks, notes, goals, and database logic
└── README.md      # Project documentation
```

---

## Core Features

### Task Manager

* Add tasks with **title, start time, end time, and description**
* Tasks automatically move to **History** when time expires
* Completion checkbox with strike-through effect
* One-click delete
* Real-time **auto-expiry checker every 30 seconds**

### Notes System (SQLite Powered)

* Secure **local notes database**
* Auto-saved and timestamped
* Inline editing support
* Instant deletion
* Fully offline

### Targets and Goals Tracker

* Set **long-term goals with deadlines**
* Live countdown timer (days and hours)
* Animated progress bar
* Goals persist using **LocalStorage**

### Multi-View Navigation

* Tasks
* History
* Notes
* Targets
* Smooth view switching with active state management

---

## Smart Logic Highlights

| Feature                | Purpose                                        |
| ---------------------- | ---------------------------------------------- |
| `checkTaskExpiry()`    | Automatically moves expired tasks to History   |
| `sql.js`               | Runs a full SQLite database in the browser     |
| `Intersection-Free UI` | Maintains smooth performance with large data   |
| `LocalStorage Goals`   | Preserves long-term goals without database use |
| `Time-based Filtering` | Tasks are filtered using the real-time clock   |

---

## UI and UX Design

* Glassmorphism-inspired dark interface
* Subtle hover animations
* Live progress indicators
* Terminal-style typography
* Fully responsive layout
* Smooth transitions without frameworks

---

## Data Handling and Security

* Tasks and Notes stored in **in-browser SQLite**
* Goals stored in **LocalStorage**
* No servers involved
* No tracking
* No cookies
* No third-party analytics

All data stays inside the user’s browser.

---

## Customization Tips

* Rename **TaskSync** directly from `index.html`
* UI color variables are defined inside `:root` in `style.css`
* Task expiry logic is handled here:

  ```js
  function isTaskExpired(endTimeStr) { ... }
  ```
* Cloud sync can be added later using Firebase or Supabase if required

---

## Use Cases

* Students managing daily routines
* Developers planning tasks and sprints
* Medical students tracking schedules
* Anyone who prefers a distraction-free productivity system

---

## License

This project is built for **personal and educational use**.
You are free to **fork, modify, and extend it**, but do not resell it as-is.

---

Designed and developed by **ROSHAN**
Built for real-world use, not just demonstration.
