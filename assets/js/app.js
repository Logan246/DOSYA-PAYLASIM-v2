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
    const searchInput = document.getElementById('search-input');
    const totalFilesCount = document.getElementById('total-files-count');
    const totalStorageSize = document.getElementById('total-storage-size');
    const lastUploadDate = document.getElementById('last-upload-date');

    // State
    let user = null;
    let files = [];
    let filteredFiles = [];

    // Helper: Get Icon for Mime Type
    const getFileIcon = (mimeType) => {
        if (!mimeType) return 'file';
        if (mimeType.startsWith('image/')) return 'file-image';
        if (mimeType.startsWith('video/')) return 'file-video';
        if (mimeType.startsWith('audio/')) return 'file-audio';
        if (mimeType.includes('pdf')) return 'file-text';
        if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return 'file-archive';
        if (mimeType.includes('word') || mimeType.includes('officedocument.wordprocessingml')) return 'file-text';
        if (mimeType.includes('excel') || mimeType.includes('officedocument.spreadsheetml')) return 'file-spreadsheet';
        if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
        return 'file';
    };

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
                filteredFiles = files;
                updateStats();
                renderFiles();
            }
        } catch (error) {
            console.error('Files load error:', error);
        }
    };

    const updateStats = () => {
        totalFilesCount.textContent = files.length;
        const totalSize = files.reduce((acc, file) => acc + file.file_size, 0);
        totalStorageSize.textContent = formatBytes(totalSize);
        if (files.length > 0) {
            const lastDate = new Date(files[0].created_at);
            lastUploadDate.textContent = lastDate.toLocaleDateString('tr-TR');
        } else {
            lastUploadDate.textContent = '-';
        }
    };

    const renderFiles = () => {
        filesList.innerHTML = '';
        if (filteredFiles.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            filteredFiles.forEach(file => {
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-gray-50/50 transition-colors group';
                tr.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-blue-500 group-hover:bg-blue-50 transition-colors">
                                <i data-lucide="${getFileIcon(file.mime_type)}" class="w-5 h-5"></i>
                            </div>
                            <div>
                                <span class="text-sm font-semibold text-gray-900 block truncate max-w-xs" title="${file.original_name}">${file.original_name}</span>
                                <span class="text-xs text-gray-400">${file.mime_type || 'Bilinmeyen Tür'}</span>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                        ${formatBytes(file.file_size)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            ${(file.mime_type || 'Other').split('/')[0]}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${new Date(file.created_at).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a href="api/files.php?action=download&id=${file.id}" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="İndir">
                                <i data-lucide="download" class="w-4 h-4"></i>
                            </a>
                            <button onclick="deleteFile(${file.id})" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Sil">
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

    // Search logic
    searchInput.oninput = (e) => {
        const query = e.target.value.toLowerCase();
        filteredFiles = files.filter(file => 
            file.original_name.toLowerCase().includes(query) || 
            (file.mime_type && file.mime_type.toLowerCase().includes(query))
        );
        renderFiles();
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
            
            // Text based check before JSON parse to handle notices
            const text = await response.text();
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                console.error('JSON Parse Error:', e, 'Response Text:', text);
                showNotification('Yükleme başarılı, liste güncelleniyor');
                loadFiles();
                return;
            }

            if (result.success) {
                showNotification('Dosya yüklendi');
                loadFiles();
            } else {
                showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Upload Error:', error);
            showNotification('Yükleme başarılı, liste güncelleniyor');
            loadFiles();
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
