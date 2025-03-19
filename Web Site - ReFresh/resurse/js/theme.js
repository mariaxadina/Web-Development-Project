document.addEventListener('DOMContentLoaded', (event) => {
    const themeSelector = document.getElementById('theme-selector');
    const savedTheme = localStorage.getItem('selectedTheme');

    if (savedTheme) {
        document.body.classList.add(`${savedTheme}-mode`);
        themeSelector.value = savedTheme;
    } else {
        document.body.classList.add('default-mode');
    }

    themeSelector.addEventListener('change', (event) => {
        const selectedTheme = event.target.value;

        // Remove any previously applied theme class
        document.body.className = '';
        document.body.classList.add(`${selectedTheme}-mode`);

        // Save the selected theme in localStorage
        localStorage.setItem('selectedTheme', selectedTheme);
    });
});