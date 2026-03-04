/**
 * Modal — Reusable modal component.
 */
const Modal = (() => {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('modal');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    const footerEl = document.getElementById('modal-footer');
    const closeBtn = document.getElementById('modal-close');

    function open({ title, body, footer, large }) {
        titleEl.textContent = title || '';
        bodyEl.innerHTML = typeof body === 'string' ? body : '';
        footerEl.innerHTML = typeof footer === 'string' ? footer : '';
        if (body && typeof body === 'object' && body.nodeType) {
            bodyEl.innerHTML = '';
            bodyEl.appendChild(body);
        }
        modal.classList.toggle('modal-lg', !!large);
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function show(title, body, footer, options = {}) {
        open({ title, body, footer, ...options });
    }

    function close() {
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
        bodyEl.innerHTML = '';
        footerEl.innerHTML = '';
    }

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

    return { open, show, close };
})();
