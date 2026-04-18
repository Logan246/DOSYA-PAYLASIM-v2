document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const authContainer = document.getElementById('auth-container');
    const dashboardContainer = document.getElementById('dashboard-container');
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const logoutBtn = document.getElementById('logout-btn');
    const filesList = document.getElementById('files-list');
    const emptyState = document.getElementById('empty-state');
    const currentUsername = document.getElementById('current-username');
    const userAvatar = document.getElementById('user-avatar');
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const toast = document.getElementById('toast');

    // State
    let user = null;
    let files = [];

    // Helper: Show Notification
    const showNotification = (message, type = 'success') => {
        toast.textContent = message;
        toast.className = `fixed bottom-4 right-4 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`;
        toast.classList.remove('translate-y-20', 'opacity-0');
        setTimeout(() => {
            toast.classList.add('translate-y-20', 'opacity-0');
        }, 3000);
    };

    // Helper: Format Bytes
    const formatBytes = (bytes, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    // Auth Logic
    const checkAuth = async () => {
        try {
            const response = await fetch('api/auth.php?action=check');
            const data = await response.json();
            if (data.logged_in) {
                user = { username: data.username };
                showDashboard();
            } else {
                showAuth();
            }
        } catch (error) {
            console.error('Auth check error:', error);
            showAuth();
        }
    };

    const showAuth = () => {
        authContainer.classList.remove('hidden');
        dashboardContainer.classList.add('hidden');
        lucide.createIcons();
    };

    const showDashboard = () => {
        authContainer.classList.add('hidden');
        dashboardContainer.classList.remove('hidden');
        currentUsername.textContent = user.username;
        userAvatar.textContent = user.username.charAt(0).toUpperCase();
        loadFiles();
        lucide.createIcons();
    };

    // Event Listeners: Auth Switching
    showRegister.onclick = (e) => {
        e.preventDefault();
        loginView.classList.add('hidden');
        registerView.classList.remove('hidden');
    };

    showLogin.onclick = (e) => {
        e.preventDefault();
        registerView.classList.add('hidden');
        loginView.classList.remove('hidden');
    };

    // Event Listeners: Auth Forms
    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(loginForm);
        const data = Object.fromEntries(formData.entries());
        try {
            const response = await fetch('api/auth.php?action=login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (result.success) {
                user = { username: result.username };
                showNotification('Giriş başarılı');
                showDashboard();
            } else {
                showNotification(result.message, 'error');
            }
        } catch (error) {
            showNotification('Giriş hatası', 'error');
        }
    };

    registerForm.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(registerForm);
        const data = Object.fromEntries(formData.entries());
        try {
            const response = await fetch('api/auth.php?action=register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (result.success) {
                showNotification('Kayıt başarılı, giriş yapabilirsiniz');
                registerView.classList.add('hidden');
                loginView.classList.remove('hidden');
            } else {
                showNotification(result.message, 'error');
            }
        } catch (error) {
            showNotification('Kayıt hatası', 'error');
        }
    };

    logoutBtn.onclick = async () => {
        await fetch('api/auth.php?action=logout', { method: 'POST' });
        user = null;
        showAuth();
    };

    // File Logic
    const loadFiles = async () => {
        try {
            const response = await fetch('api/files.php?action=list');
            const result = await response.json();
            if (result.success) {
                files = result.files;
                renderFiles();
            }
        } catch (error) {
            console.error('Files load error:', error);
        }
    };

    const renderFiles = () => {
        filesList.innerHTML = '';
        if (files.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            files.forEach(file => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center gap-3">
                            <i data-lucide="file" class="w-5 h-5 text-blue-400"></i>
                            <span class="text-sm font-medium text-gray-900">${file.original_name}</span>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${formatBytes(file.file_size)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${file.mime_type || 'Unknown'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${new Date(file.created_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div class="flex items-center justify-end gap-3">
                            <a href="api/files.php?action=download&id=${file.id}" class="text-blue-600 hover:text-blue-900" title="İndir">
                                <i data-lucide="download" class="w-4 h-4"></i>
                            </a>
                            <button onclick="deleteFile(${file.id})" class="text-red-600 hover:text-red-900" title="Sil">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </td>
                `;
                filesList.appendChild(tr);
            });
            lucide.createIcons();
        }
    };

    window.deleteFile = async (id) => {
        if (!confirm('Bu dosyayı silmek istediğinize emin misiniz?')) return;
        try {
            const response = await fetch('api/files.php?action=delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const result = await response.json();
            if (result.success) {
                showNotification('Dosya silindi');
                loadFiles();
            } else {
                showNotification(result.message, 'error');
            }
        } catch (error) {
            showNotification('Silme hatası', 'error');
        }
    };

    const uploadFile = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await fetch('api/files.php?action=upload', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (result.success) {
                showNotification('Dosya yüklendi');
                loadFiles();
            } else {
                showNotification(result.message, 'error');
            }
        } catch (error) {
            showNotification('Yükleme hatası', 'error');
        }
    };

    // Event Listeners: File Upload
    fileInput.onchange = (e) => {
        if (e.target.files.length > 0) {
            uploadFile(e.target.files[0]);
            fileInput.value = '';
        }
    };

    // Drag & Drop
    dropZone.onclick = () => fileInput.click();
    
    dropZone.ondragover = (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    };

    dropZone.ondragleave = () => {
        dropZone.classList.remove('dragover');
    };

    dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            uploadFile(e.dataTransfer.files[0]);
        }
    };

    // Initialize
    checkAuth();
});
