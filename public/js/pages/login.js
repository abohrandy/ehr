/**
 * Login Page
 */
const LoginPage = (() => {
    function init() {
        const form = document.getElementById('login-form');
        const errorEl = document.getElementById('login-error');
        const btn = document.getElementById('login-btn');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorEl.textContent = '';
            btn.disabled = true;
            btn.textContent = 'Signing in...';

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            const res = await Auth.login(email, password);

            if (res.success) {
                document.getElementById('login-screen').classList.add('hidden');
                document.getElementById('app-shell').classList.remove('hidden');
                Auth.updateUI();
                const user = Auth.getUser();
                if (user.role === 'client') {
                    window.location.hash = '#/portal';
                } else {
                    window.location.hash = '#/dashboard';
                }
            } else {
                errorEl.textContent = res.error || 'Login failed. Please try again.';
            }

            btn.disabled = false;
            btn.textContent = 'Sign In';
        });
    }

    return { init };
})();
