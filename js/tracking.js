(function () {
    // Initialize stats in localStorage if not present
    const initStats = () => {
        if (!localStorage.getItem('italia_stats')) {
            const stats = {
                total_visits: 0,
                category_clicks: {},
                daily_visits: {},
                session_durations: [],
                last_visit: null
            };
            localStorage.setItem('italia_stats', JSON.stringify(stats));
        }
    };

    const getStats = () => JSON.parse(localStorage.getItem('italia_stats'));
    const saveStats = (stats) => localStorage.setItem('italia_stats', JSON.stringify(stats));

    const trackVisit = () => {
        const stats = getStats();
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        // Increment total visits
        stats.total_visits++;

        // Track daily visits
        stats.daily_visits[today] = (stats.daily_visits[today] || 0) + 1;

        // Session tracking
        const sessionStart = Date.now();
        sessionStorage.setItem('session_start', sessionStart);

        stats.last_visit = now.toISOString();
        saveStats(stats);
    };

    const trackCategoryClick = (categoryName) => {
        const stats = getStats();
        stats.category_clicks[categoryName] = (stats.category_clicks[categoryName] || 0) + 1;
        saveStats(stats);
    };

    // Initialize and track
    initStats();
    trackVisit();

    // Track category clicks on the category bar
    document.addEventListener('DOMContentLoaded', () => {
        const categoryBar = document.querySelector('.category-bar');
        if (categoryBar) {
            categoryBar.addEventListener('click', (e) => {
                const categoryBtn = e.target.closest('.category');
                if (categoryBtn) {
                    const categoryName = categoryBtn.getAttribute('data-category-name');
                    if (categoryName) {
                        trackCategoryClick(categoryName);
                    }
                }
            });
        }

        // Track session duration on page unload
        window.addEventListener('beforeunload', () => {
            const start = sessionStorage.getItem('session_start');
            if (start) {
                const duration = (Date.now() - parseInt(start)) / 1000 / 60; // in minutes
                const stats = getStats();
                stats.session_durations.push(parseFloat(duration.toFixed(2)));
                // Keep only last 50 durations
                if (stats.session_durations.length > 50) stats.session_durations.shift();
                saveStats(stats);
            }
        });
    });
})();
