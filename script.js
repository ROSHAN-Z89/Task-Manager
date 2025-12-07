// Utility helpers
function selector(sel) {
    return document.querySelector(sel);
}

function createCell(text) {
    const td = document.createElement('td');
    td.textContent = text;
    return td;
}

// Helper to check if time string (HH:MM) is in the past relative to now
function isTaskExpired(endTimeStr) {
    if (!endTimeStr) return false;
    
    const now = new Date();
    const [h, m] = endTimeStr.split(':').map(Number);
    
    // Create date object for today with the task's end time
    const taskEnd = new Date();
    taskEnd.setHours(h, m, 0, 0);
    
    // If we want tasks to expire strictly when time passes:
    return now >= taskEnd;
}

// DOM References
const navButtons = document.querySelectorAll('.nav-btn');
const views = document.querySelectorAll('.view');

// Tasks DOM
const titleInput = selector('#task-title');
const startInput = selector('#task-start');
const endInput = selector('#task-end');
const descInput = selector('#task-desc');
const addTaskBtn = selector('#add-task-btn');
const taskTbody = selector('#task-tbody');
const completedTbody = selector('#completed-tbody');
const activeCountLabel = selector('#active-count-label');
const completedCountLabel = selector('#completed-count-label');

// Notes DOM
const notesArea = selector('#notes-area');
const addNoteBtn = selector('#add-note-btn');
const notesContainer = selector('#notes-grid-container');
const notesStatus = selector('#notes-status');

// Targets DOM
const targetTitleInput = selector('#target-title-input');
const targetDateInput = selector('#target-date-input');
const addTargetBtn = selector('#add-target-btn');
const targetsContainer = selector('#targets-container');

// SQLite Database Setup
let db = null;

async function initDatabase() {
    try {
        const SQL = await initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
        });
        db = new SQL.Database();
        
        // Create tasks table
        db.run(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                start_time TEXT,
                end_time TEXT,
                description TEXT,
                completed INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create notes table
        db.run(`
            CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Database initialized');
        await loadTasks();
        await loadNotesFromDB();
        loadGoals(); 
        
        // Start the expiration checker loop
        setInterval(checkTaskExpiry, 30000); // Check every 30 seconds

    } catch (error) {
        console.error('Database init failed:', error);
    }
}

// === TASKS FUNCTIONS ===

async function saveTaskToDB(task, isCompleted = false) {
    if (!db) return;
    db.run(`INSERT INTO tasks (title, start_time, end_time, description, completed) VALUES (?, ?, ?, ?, ?)`, 
        [task.title, task.start || '', task.end || '', task.description || '', isCompleted ? 1 : 0]);
}

async function updateTaskCompletion(id, completed) {
    if (!db) return;
    db.run('UPDATE tasks SET completed = ? WHERE id = ?', [completed ? 1 : 0, id]);
}

async function deleteTaskFromDB(id) {
    if (!db) return;
    db.run('DELETE FROM tasks WHERE id = ?', [id]);
}

// UPDATED: Logic to separate tasks based on Time Expiry
async function loadTasks() {
    if (!db) return;
    const res = db.exec('SELECT * FROM tasks ORDER BY start_time ASC');
    
    // Map results if any exist
    const tasks = res[0]?.values?.map(row => ({
        id: row[0],
        title: row[1],
        start: row[2] || '',
        end: row[3] || '',
        description: row[4] || '',
        completed: row[5] === 1
    })) || [];

    taskTbody.innerHTML = '';
    completedTbody.innerHTML = '';

    // Filter Logic:
    // Active Table = NOT Expired (regardless of checked/unchecked)
    // History Table = Expired (regardless of checked/unchecked)
    const activeTasks = tasks.filter(t => !isTaskExpired(t.end));
    const expiredTasks = tasks.filter(t => isTaskExpired(t.end));

    activeTasks.forEach(t => taskTbody.appendChild(buildTaskRow(t)));
    expiredTasks.forEach(t => completedTbody.appendChild(buildTaskRow(t)));
    
    updateCounts(activeTasks.length, expiredTasks.length);
}

// Timer function to auto-move tasks
function checkTaskExpiry() {
    console.log('Checking for expired tasks...');
    loadTasks(); // Simply reloading will re-filter based on current time
}

function buildTaskRow(task) {
    const tr = document.createElement('tr');
    tr.dataset.taskId = task.id;
    
    // If completed, add special class for visual strikethrough (even in active list)
    if (task.completed) {
        tr.classList.add('completed-active');
    }

    // Checkbox
    const checkTd = document.createElement('td');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    
    checkbox.addEventListener('change', async () => {
        // Just update DB and reload to show visual strikethrough
        // It will NOT move tables unless time is also expired
        await updateTaskCompletion(task.id, checkbox.checked);
        loadTasks(); 
    });
    
    checkTd.appendChild(checkbox);

    // Delete Button
    const delTd = document.createElement('td');
    const delBtn = document.createElement('button');
    delBtn.textContent = 'REMOVE';
    delBtn.className = 'delete-btn';
    delBtn.onclick = () => {
        deleteTaskFromDB(task.id);
        loadTasks();
    };
    delTd.appendChild(delBtn);

    tr.append(checkTd, createCell(task.title), createCell(task.start), createCell(task.end), createCell(task.description), delTd);
    return tr;
}

function updateCounts(active, history) {
    activeCountLabel.textContent = `${active} Active`;
    completedCountLabel.textContent = `${history} Records`;
}

async function addTaskFromInputs() {
    const title = titleInput.value.trim();
    if (!title) {
        titleInput.focus();
        return;
    }

    // Default to current time if empty
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    const task = {
        title,
        start: startInput.value || currentTime,
        end: endInput.value || '23:59', // Default end of day
        description: descInput.value.trim()
    };

    saveTaskToDB(task);
    await loadTasks();
    
    titleInput.value = '';
    descInput.value = '';
    titleInput.focus();
}

// === NOTES FUNCTIONS ===

async function saveNoteToDB(content) {
    if (!db) return;
    db.run(`INSERT INTO notes (content) VALUES (?)`, [content]);
}

async function deleteNoteFromDB(id) {
    if (!db) return;
    db.run('DELETE FROM notes WHERE id = ?', [id]);
}

async function updateNoteInDB(id, content) {
    if (!db) return;
    db.run(`UPDATE notes SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [content, id]);
}

async function loadNotesFromDB() {
    if (!db) return;
    const res = db.exec('SELECT * FROM notes ORDER BY updated_at DESC');
    const notes = res[0]?.values?.map(row => ({
        id: row[0],
        content: row[1],
        created_at: row[2],
        updated_at: row[3]
    })) || [];

    notesContainer.innerHTML = '';
    notes.forEach(note => {
        notesContainer.appendChild(createNoteCard(note));
    });
}

function createNoteCard(note) {
    const card = document.createElement('div');
    card.className = 'note-card';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'note-card-content';
    contentDiv.textContent = note.content;
    
    const footer = document.createElement('div');
    footer.className = 'note-card-footer';
    
    const dateSpan = document.createElement('span');
    dateSpan.className = 'note-date';
    dateSpan.textContent = new Date(note.updated_at).toLocaleDateString();
    
    const actions = document.createElement('div');
    actions.className = 'note-actions';
    
    const editBtn = document.createElement('button');
    editBtn.textContent = 'EDIT';
    editBtn.className = 'btn-edit';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'REMOVE';
    deleteBtn.className = 'btn-delete';
    
    // Edit Logic
    let isEditing = false;
    editBtn.onclick = async () => {
        if (!isEditing) {
            isEditing = true;
            const textarea = document.createElement('textarea');
            textarea.value = note.content;
            textarea.className = 'field-textarea';
            textarea.style.height = '100px';
            contentDiv.innerHTML = '';
            contentDiv.appendChild(textarea);
            editBtn.textContent = 'SAVE';
        } else {
            const newContent = contentDiv.querySelector('textarea').value;
            await updateNoteInDB(note.id, newContent);
            note.content = newContent;
            isEditing = false;
            loadNotesFromDB();
        }
    };

    deleteBtn.onclick = async () => {
        if(confirm('Delete this note?')) {
            await deleteNoteFromDB(note.id);
            await loadNotesFromDB();
        }
    };
    
    actions.append(editBtn, deleteBtn);
    footer.append(dateSpan, actions);
    card.append(contentDiv, footer);
    
    return card;
}

addNoteBtn.addEventListener('click', async () => {
    const content = notesArea.value.trim();
    if (!content) return;
    
    await saveNoteToDB(content);
    notesArea.value = '';
    loadNotesFromDB();
    notesStatus.textContent = 'Saved Successfully';
    setTimeout(() => notesStatus.textContent = 'Ready', 2000);
});

// === TARGETS / GOALS ===

function createGoalCard(goal) {
    const card = document.createElement('div');
    card.className = 'goal-card';
    
    const header = document.createElement('div');
    header.className = 'goal-header';
    header.innerHTML = `<span class="goal-title">${goal.title}</span>`;
    
    const delBtn = document.createElement('button');
    delBtn.textContent = 'REMOVE';
    delBtn.className = 'delete-btn';
    delBtn.onclick = () => {
        card.remove();
        saveGoalsToLocal();
    };
    header.appendChild(delBtn);

    const timerDiv = document.createElement('div');
    timerDiv.className = 'goal-timer';
    
    const progressTrack = document.createElement('div');
    progressTrack.className = 'progress-track';
    const progressFill = document.createElement('div');
    progressFill.className = 'progress-fill';
    progressTrack.appendChild(progressFill);
    
    const footer = document.createElement('div');
    footer.className = 'goal-footer';
    footer.innerHTML = `<span>Start: ${new Date(goal.startDate).toLocaleDateString()}</span><span>Target: ${new Date(goal.endDate).toLocaleDateString()}</span>`;
    
    card.append(header, timerDiv, progressTrack, footer);
    
    // Timer Logic
    const updateTimer = () => {
        const now = new Date().getTime();
        const end = new Date(goal.endDate).getTime();
        const start = new Date(goal.startDate).getTime();
        const total = end - start;
        const left = end - now;

        if (left <= 0) {
            timerDiv.textContent = 'STATUS: ACCOMPLISHED';
            timerDiv.style.color = '#20c997';
            progressFill.style.width = '100%';
            return;
        }

        const days = Math.floor(left / (1000 * 60 * 60 * 24));
        const hours = Math.floor((left / (1000 * 60 * 60)) % 24);
        timerDiv.textContent = `${days}d ${hours}h LEFT`;
        
        const elapsed = now - start;
        const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
        progressFill.style.width = `${pct}%`;
    };

    setInterval(updateTimer, 60000); // Update every minute
    updateTimer();
    
    card.goalData = goal;
    targetsContainer.appendChild(card);
}

function saveGoalsToLocal() {
    const goals = Array.from(targetsContainer.querySelectorAll('.goal-card'))
        .map(card => card.goalData);
    localStorage.setItem('medsync_goals', JSON.stringify(goals));
}

function loadGoals() {
    const stored = localStorage.getItem('medsync_goals');
    if (stored) {
        JSON.parse(stored).forEach(g => createGoalCard(g));
    }
}

addTargetBtn.addEventListener('click', () => {
    const title = targetTitleInput.value.trim();
    const dateVal = targetDateInput.value;
    
    if (!title || !dateVal) {
        alert('Please enter title and date');
        return;
    }
    
    const goal = {
        title,
        startDate: new Date().toISOString(),
        endDate: new Date(dateVal + 'T23:59:59').toISOString()
    };
    
    createGoalCard(goal);
    saveGoalsToLocal();
    targetTitleInput.value = '';
    targetDateInput.value = '';
});

// === INITIALIZATION & EVENTS ===
addTaskBtn.addEventListener('click', addTaskFromInputs);

titleInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addTaskFromInputs();
    }
});

// Navigation Logic
navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Update Buttons
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update Views
        const targetId = btn.getAttribute('data-view');
        views.forEach(v => {
            if (v.id === targetId) v.classList.add('active-view');
            else v.classList.remove('active-view');
        });
    });
});

// Init
window.addEventListener('DOMContentLoaded', initDatabase);
