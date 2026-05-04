// DOM Elements
const splashScreen = document.getElementById('splash-screen');
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');
const addTaskBtn = document.getElementById('add-task-btn');
const logoutBtn = document.getElementById('logout-btn');
const addTaskModal = document.getElementById('add-task-modal');
const closeModal = document.querySelector('.close');
const taskForm = document.getElementById('task-form');
const tasksList = document.getElementById('tasks-list');
const priorityFilter = document.getElementById('priority-filter');
const statusFilter = document.getElementById('status-filter');
const helpBtn = document.getElementById('help-btn');
const suggestionsBtn = document.getElementById('suggestions-btn');
const helpModal = document.getElementById('help-modal');
const suggestionsModal = document.getElementById('suggestions-modal');

// API URL
const API_URL = 'http://localhost:5002/api';

// Token Management
let token = localStorage.getItem('token');

// Helper to get headers (FIXED: Uses x-auth-token to match backend auth.js)
const getHeaders = () => {
    return {
        'Content-Type': 'application/json',
        'x-auth-token': localStorage.getItem('token')
    };
};

// Show/Hide Auth Forms
showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.auth-box').forEach(box => box.style.display = 'none');
    document.querySelectorAll('.auth-box')[1].style.display = 'block';
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.auth-box').forEach(box => box.style.display = 'none');
    document.querySelectorAll('.auth-box')[0].style.display = 'block';
});

// Authentication Functions
async function register(username, email, password) {
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            token = data.token; // Update local variable
            showApp();
        } else {
            alert(data.msg || 'Registration failed');
        }
    } catch (err) {
        console.error('Registration error:', err);
        alert('Registration failed');
    }
}

async function login(email, password) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            token = data.token; // Update local variable
            showApp();
        } else {
            alert(data.msg || 'Login failed');
        }
    } catch (err) {
        console.error('Login error:', err);
        alert('Login failed');
    }
}

// Form Submissions
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    register(username, email, password);
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
});

// Task Management Functions
async function fetchTasks() {
    try {
        const response = await fetch(`${API_URL}/tasks`, {
            headers: getHeaders()
        });

        if (response.ok) {
            const tasks = await response.json();
            displayTasks(tasks);
            updateTaskStats(tasks);
        } else {
            // If unauthorized, redirect to login
            if (response.status === 401) {
                logout();
            }
            throw new Error('Failed to fetch tasks');
        }
    } catch (err) {
        console.error('Error fetching tasks:', err);
    }
}

function displayTasks(tasks) {
    tasksList.innerHTML = '';
    tasks.forEach(task => {
        const taskElement = createTaskElement(task);
        tasksList.appendChild(taskElement);
    });
}

function createTaskElement(task) {
    const div = document.createElement('div');
    div.className = `task-item priority-${task.priority}`;
    
    let nextStatus, statusIcon;
    switch(task.status) {
        case 'pending':
            nextStatus = 'in-progress';
            statusIcon = 'fa-spinner';
            break;
        case 'in-progress':
            nextStatus = 'completed';
            statusIcon = 'fa-check';
            break;
        case 'completed':
            nextStatus = 'pending';
            statusIcon = 'fa-undo';
            break;
        default:
            nextStatus = 'in-progress';
            statusIcon = 'fa-spinner';
    }

    div.innerHTML = `
        <div class="task-header">
            <h3>${task.title}</h3>
            <div class="task-actions">
                <button onclick="updateTaskStatus('${task._id}', '${nextStatus}')" class="btn-secondary">
                    <i class="fas ${statusIcon}"></i>
                </button>
                <button onclick="deleteTask('${task._id}')" class="btn-secondary">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <p>${task.description || 'No description'}</p>
        <div class="task-meta">
            <span class="priority">Priority: ${task.priority}</span>
            <span class="deadline">Deadline: ${new Date(task.deadline).toLocaleString()}</span>
            <span class="status">Status: ${task.status}</span>
        </div>
    `;
    return div;
}

async function addTask(taskData) {
    try {
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(taskData)
        });

        if (response.ok) {
            fetchTasks();
            closeTaskModal();
        } else {
            const data = await response.json();
            alert(data.errors ? data.errors.map(e => e.msg).join('\n') : (data.msg || 'Failed to add task'));
        }
    } catch (err) {
        console.error('Error adding task:', err);
        alert('Failed to add task');
    }
}

async function updateTaskStatus(taskId, newStatus) {
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            fetchTasks();
        } else {
            throw new Error('Failed to update task');
        }
    } catch (err) {
        console.error('Error updating task:', err);
    }
}

async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        if (response.ok) {
            fetchTasks();
        } else {
            throw new Error('Failed to delete task');
        }
    } catch (err) {
        console.error('Error deleting task:', err);
    }
}

// UI Functions
function showApp() {
    authContainer.style.display = 'none';
    appContainer.style.display = 'block';
    fetchTasks();
}

function logout() {
    localStorage.removeItem('token');
    location.reload();
}

function showTaskModal() {
    addTaskModal.style.display = 'block';
}

function closeTaskModal() {
    addTaskModal.style.display = 'none';
    taskForm.reset();
}

function updateTaskStats(tasks) {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
    const pendingTasks = tasks.filter(task => task.status === 'pending').length;

    document.getElementById('total-tasks').textContent = totalTasks;
    document.getElementById('completed-tasks').textContent = completedTasks;
    document.getElementById('pending-tasks').textContent = pendingTasks;
    
    // FIXED: Ensure ID matches index.html (Check if HTML is "in-progress-tasks" or "in-progress-task")
    const inProgressElement = document.getElementById('in-progress-tasks');
    if (inProgressElement) {
        inProgressElement.textContent = inProgressTasks;
    }
}

// Event Listeners
addTaskBtn.addEventListener('click', showTaskModal);
closeModal.addEventListener('click', closeTaskModal);
logoutBtn.addEventListener('click', logout);

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const taskData = {
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-description').value,
        priority: parseInt(document.getElementById('task-priority').value),
        deadline: new Date(document.getElementById('task-deadline').value).toISOString()
    };
    addTask(taskData);
});

priorityFilter.addEventListener('change', () => {
    filterTasks(priorityFilter.value, statusFilter.value);
});

statusFilter.addEventListener('change', () => {
    filterTasks(priorityFilter.value, statusFilter.value);
});

function filterTasks(priority, status) {
    const tasks = document.querySelectorAll('.task-item');
    tasks.forEach(task => {
        const taskPriority = task.classList[1].split('-')[1];
        const taskStatus = task.querySelector('.status').textContent.split(': ')[1];
        
        const priorityMatch = priority === 'all' || taskPriority === priority;
        const statusMatch = status === 'all' || taskStatus === status;
        
        task.style.display = priorityMatch && statusMatch ? 'block' : 'none';
    });
}

// Help and Suggestions
helpBtn.addEventListener('click', () => helpModal.style.display = 'block');
suggestionsBtn.addEventListener('click', () => suggestionsModal.style.display = 'block');

const closeButtons = document.querySelectorAll('.close');
closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        helpModal.style.display = 'none';
        suggestionsModal.style.display = 'none';
        addTaskModal.style.display = 'none';
    });
});

function useSuggestion(title, description, priority) {
    document.getElementById('task-title').value = title;
    document.getElementById('task-description').value = description;
    document.getElementById('task-priority').value = priority;
    suggestionsModal.style.display = 'none';
    showTaskModal();
}

// Global window functions for inline onclick attributes
window.updateTaskStatus = updateTaskStatus;
window.deleteTask = deleteTask;
window.useSuggestion = useSuggestion;

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'n') { e.preventDefault(); showTaskModal(); }
    if (e.ctrlKey && e.key === 'f') { e.preventDefault(); priorityFilter.focus(); }
    if (e.key === 'Escape') {
        closeTaskModal();
        helpModal.style.display = 'none';
        suggestionsModal.style.display = 'none';
    }
});

// Initialize
setTimeout(() => {
    splashScreen.style.display = 'none';
    if (token) {
        showApp();
    } else {
        authContainer.style.display = 'block';
    }
}, 3000);

window.addEventListener('click', (e) => {
    if (e.target === addTaskModal) closeTaskModal();
    if (e.target === helpModal) helpModal.style.display = 'none';
    if (e.target === suggestionsModal) suggestionsModal.style.display = 'none';
});