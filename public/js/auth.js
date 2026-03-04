/**
 * Auth — Login/logout state management.
 */
const Auth = (() => {
    function isLoggedIn() {
        return !!localStorage.getItem('access_token');
    }

    function getUser() {
        const u = localStorage.getItem('user');
        return u ? JSON.parse(u) : null;
    }

    function getRole() {
        const user = getUser();
        return user ? user.role : null;
    }

    async function login(email, password) {
        const res = await API.post('/auth/login', { email, password });
        if (res.success) {
            localStorage.setItem('access_token', res.data.access_token);
            localStorage.setItem('refresh_token', res.data.refresh_token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
        }
        return res;
    }

    function logout() {
        API.post('/auth/logout').catch(() => { });
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.hash = '#/login';
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('app-shell').classList.add('hidden');
    }

    function updateUI() {
        const user = getUser();
        if (!user) return;

        const initials = (user.first_name?.[0] || '') + (user.last_name?.[0] || '');
        document.getElementById('user-avatar').textContent = initials.toUpperCase();
        document.getElementById('user-name').textContent = `${user.first_name} ${user.last_name}`;
        document.getElementById('user-role').textContent = user.role;

        // Show/hide nav sections based on role
        const therapistNav = document.getElementById('nav-therapist');
        const clientNav = document.getElementById('nav-client');

        if (user.role === 'client') {
            therapistNav.classList.add('hidden');
            clientNav.classList.remove('hidden');
        } else {
            therapistNav.classList.remove('hidden');
            clientNav.classList.add('hidden');

            // Show/hide admin-only links
            const usersLink = document.getElementById('nav-users-link');
            const settingsLink = document.getElementById('nav-settings-link');
            if (usersLink) usersLink.classList.toggle('hidden', user.role !== 'admin');
            if (settingsLink) settingsLink.classList.toggle('hidden', user.role !== 'admin');
        }
    }

    return { isLoggedIn, getUser, getRole, login, logout, updateUI };
})();
