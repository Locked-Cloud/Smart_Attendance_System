// darkMode.js
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
    toggleButton.textContent = isDarkMode ? '☀️' : '🌙';
}

function applySavedMode() {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'enabled') {
        document.body.classList.add('dark-mode');
        toggleButton.textContent = '☀️';
    } else {
        toggleButton.textContent = '🌙';
    }
}

window.onload = applySavedMode;

// Adding event listener to the toggle button
document.getElementById('toggleButton').addEventListener('click', toggleDarkMode);
