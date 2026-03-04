/**
 * Profile Page
 */
const ProfilePage = (() => {
    async function init() {
        const topbarActions = document.getElementById('topbar-actions');
        topbarActions.innerHTML = ''; // No topbar actions for profile

        const user = Auth.getUser();

        let html = `
            <div class="card" style="max-width: 600px; margin: 0 auto;">
                <div class="card-header">
                    <h3>My Profile</h3>
                </div>
                <div class="card-body">
                    <form id="profile-form">
                        <h4 class="mb" style="font-size: 1rem; color: var(--primary-dark);">Personal Information</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="prof-fname">First Name</label>
                                <input type="text" id="prof-fname" class="form-control" value="${user.first_name || ''}" required>
                            </div>
                            <div class="form-group">
                                <label for="prof-lname">Last Name</label>
                                <input type="text" id="prof-lname" class="form-control" value="${user.last_name || ''}" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="prof-email">Email Address</label>
                            <input type="email" id="prof-email" class="form-control" value="${user.email}" disabled title="Email cannot be changed">
                        </div>
                        <div class="form-group">
                            <label for="prof-phone">Phone Number</label>
                            <input type="text" id="prof-phone" class="form-control" value="${user.phone || ''}">
                        </div>

                        <hr style="border:0; border-top:1px solid var(--border-light); margin: 30px 0;">

                        <h4 class="mb" style="font-size: 1rem; color: var(--primary-dark);">Security (Optional)</h4>
                        <p class="text-sm text-muted mb">Leave password fields blank if you do not wish to change your password.</p>
                        
                        <div class="form-group">
                            <label for="prof-pass">New Password</label>
                            <input type="password" id="prof-pass" class="form-control" placeholder="••••••••">
                        </div>
                        <div class="form-group">
                            <label for="prof-pass-confirm">Confirm New Password</label>
                            <input type="password" id="prof-pass-confirm" class="form-control" placeholder="••••••••">
                        </div>
                        
                        <div class="mt-lg">
                            <button type="submit" class="btn btn-primary btn-full" id="prof-save-btn">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('content-area').innerHTML = html;

        document.getElementById('profile-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('prof-save-btn');
            btn.disabled = true;
            btn.textContent = 'Saving...';

            const payload = {
                first_name: document.getElementById('prof-fname').value,
                last_name: document.getElementById('prof-lname').value,
                phone: document.getElementById('prof-phone').value,
            };

            const pass = document.getElementById('prof-pass').value;
            const passConfirm = document.getElementById('prof-pass-confirm').value;

            if (pass) {
                if (pass !== passConfirm) {
                    Toast.show('Passwords do not match.', 'error');
                    btn.disabled = false;
                    btn.textContent = 'Save Changes';
                    return;
                }
                payload.password = pass;
            }

            const res = await API.put('/users/profile', payload);
            if (res.success) {
                Toast.show('Profile updated successfully!', 'success');
                // Updating local storage user object indirectly by calling the me endpoint
                const meRes = await API.get('/auth/me');
                if (meRes.success) {
                    // Overwrite user object in local storage and update UI
                    const currentData = JSON.parse(atob(localStorage.getItem('access_token').split('.')[1]));
                    currentData.first_name = meRes.data.first_name;
                    currentData.last_name = meRes.data.last_name;
                    Auth.updateUI(); // Quick re-render to catch name changes
                }
                document.getElementById('prof-pass').value = '';
                document.getElementById('prof-pass-confirm').value = '';
            } else {
                Toast.show(res.error || 'Failed to update profile.', 'error');
            }

            btn.disabled = false;
            btn.textContent = 'Save Changes';
        });
    }

    return { init };
})();
