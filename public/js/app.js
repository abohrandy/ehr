/**
 * App — Main router and initialization.
 */
const App = (() => {
    const routes = {
        '/dashboard': { page: DashboardPage, title: 'Dashboard', subtitle: 'Overview of your practice' },
        '/clients': { page: ClientsPage, title: 'Clients', subtitle: 'Manage your client roster' },
        '/calendar': { page: CalendarPage, title: 'Calendar', subtitle: 'Schedule and manage appointments' },
        '/notes': { page: NotesPage, title: 'Session Notes', subtitle: 'Clinical documentation' },
        '/plans': { page: PlansPage, title: 'Treatment Plans', subtitle: 'Goal tracking and progress' },
        '/billing': { page: BillingPage, title: 'Billing', subtitle: 'Invoices and revenue' },
        '/portal': { page: PortalPage, title: 'My Portal', subtitle: 'Your therapy dashboard' },
        '/portal/appointments': { page: PortalPage, title: 'My Appointments', subtitle: 'View your sessions' },
        '/portal/messages': { page: PortalPage, title: 'Messages', subtitle: 'Secure communication' },
    };

    function init() {
        // Login form
        LoginPage.init();

        // Check auth state
        if (Auth.isLoggedIn()) {
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('app-shell').classList.remove('hidden');
            Auth.updateUI();
        } else {
            document.getElementById('login-screen').classList.remove('hidden');
            document.getElementById('app-shell').classList.add('hidden');
        }

        // Router
        window.addEventListener('hashchange', navigate);
        navigate();

        // Logout button
        document.getElementById('logout-btn').addEventListener('click', Auth.logout);

        // Mobile menu toggle
        const menuBtn = document.getElementById('mobile-menu-btn');
        const sidebar = document.getElementById('sidebar');
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        // Close sidebar on nav click (mobile)
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => sidebar.classList.remove('open'));
        });

        // Close sidebar on content click (mobile)
        document.querySelector('.main-content').addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
    }

    function navigate() {
        if (!Auth.isLoggedIn()) return;

        const hash = window.location.hash.split('?')[0] || '';
        const path = hash.replace('#', '') || '/dashboard';

        // Find matching route
        let route = routes[path];
        if (!route) {
            // Try prefix match (e.g. /clients/uuid)
            const basePath = '/' + path.split('/').filter(Boolean)[0];
            route = routes[basePath];
        }

        if (!route) {
            // Default based on role
            const user = Auth.getUser();
            if (user?.role === 'client') {
                window.location.hash = '#/portal';
            } else {
                window.location.hash = '#/dashboard';
            }
            return;
        }

        // Update topbar
        document.getElementById('page-title').textContent = route.title;
        document.getElementById('page-subtitle').textContent = route.subtitle;

        // Update active nav
        document.querySelectorAll('.nav-link').forEach(link => {
            const linkPage = link.dataset.page;
            const isActive = path.includes(linkPage);
            link.classList.toggle('active', isActive);
        });

        // Render page
        route.page.render();
    }

    // Start when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return { init, navigate };
})();
