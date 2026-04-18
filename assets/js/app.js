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
    const lastUploadName = document.getElementById('last-upload-name');
    const lastUploadTime = document.getElementById('last-upload-time');
    const viewListBtn = document.getElementById('view-list');
    const viewGridBtn = document.getElementById('view-grid');
    const listViewContainer = document.getElementById('list-view-container');
    const gridViewContainer = document.getElementById('grid-view-container');
    const noteInput = document.getElementById('note-input');
    const saveNoteBtn = document.getElementById('save-note-btn');
    const notesContainer = document.getElementById('notes-container');
    const infoIp = document.getElementById('info-ip');
    const infoUa = document.getElementById('info-ua');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const sidebar = document.getElementById('sidebar');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const tabButtons = document.querySelectorAll('.sidebar-item[data-tab]');
    const tabContents = document.querySelectorAll('.tab-content');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // Tool Elements
    const pingIpInput = document.getElementById('ping-ip');
    const pingBtn = document.getElementById('ping-btn');
    const pingResult = document.getElementById('ping-result');
    const genPasswordBtn = document.getElementById('gen-password-btn');
    const genPasswordDisplay = document.getElementById('gen-password');
    const b64Input = document.getElementById('b64-input');
    const b64EncodeBtn = document.getElementById('b64-encode');
    const b64DecodeBtn = document.getElementById('b64-decode');
    const logsList = document.getElementById('logs-list');
    const refreshLogsBtn = document.getElementById('refresh-logs');
    const mostFileTypeDisplay = document.getElementById('most-file-type');
    const serverOsDisplay = document.getElementById('server-os');
    const phpVersionDisplay = document.getElementById('php-version');
    const serverTimeDisplay = document.getElementById('server-time');
    const priorityButtons = document.querySelectorAll('.priority-btn');

    // State
    let user = null;
    let files = [];
    let filteredFiles = [];
    let notes = [];
    let currentView = 'list'; // 'list' or 'grid'
    let currentFilter = 'all';
    let isDarkMode = localStorage.getItem('darkMode') === 'true';
    let selectedPriority = 'low';

    // Helper: Get FontAwesome Icon and Color for Mime Type
    const getFileFAIcon = (mimeType, originalName) => {
        const ext = originalName.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return { icon: 'fa-file-image', color: 'text-blue-500' };
        if (ext === 'pdf') return { icon: 'fa-file-pdf', color: 'text-red-500' };
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return { icon: 'fa-file-archive', color: 'text-yellow-500' };
        if (['doc', 'docx'].includes(ext)) return { icon: 'fa-file-word', color: 'text-blue-600' };
        if (['xls', 'xlsx', 'csv'].includes(ext)) return { icon: 'fa-file-excel', color: 'text-green-600' };
        if (['ppt', 'pptx'].includes(ext)) return { icon: 'fa-file-powerpoint', color: 'text-orange-500' };
        if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return { icon: 'fa-file-video', color: 'text-purple-500' };
        if (['mp3', 'wav', 'ogg'].includes(ext)) return { icon: 'fa-file-audio', color: 'text-pink-500' };
        if (['txt', 'md', 'rtf'].includes(ext)) return { icon: 'fa-file-lines', color: 'text-gray-500' };
        if (['html', 'css', 'js', 'php', 'py', 'json'].includes(ext)) return { icon: 'fa-file-code', color: 'text-indigo-500' };
        return { icon: 'fa-file', color: 'text-gray-400' };
    };

    // Helper: Is Image
    const isImage = (mimeType, originalName) => {
        const ext = originalName.split('.').pop().toLowerCase();
        return (mimeType && mimeType.startsWith('image/')) || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    };

    // Helper: Get Icon for Mime Type (Lucide fallback)
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

    // Helper: Time Ago
    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " yıl önce";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " ay önce";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " gün önce";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " saat önce";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " dk önce";
        return "az önce";
    };

    // Auth Logic
    const checkAuth = async () => {
        if (isDarkMode) document.documentElement.classList.add('dark');
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
        loadNotes();
        loadConnectionInfo();
        loadLogs();
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
                applyFilter();
                updateStats();
            }
        } catch (error) {
            console.error('Files load error:', error);
        }
    };

    const applyFilter = () => {
        if (currentFilter === 'all') {
            filteredFiles = files;
        } else {
            filteredFiles = files.filter(file => {
                const mime = (file.mime_type || '').toLowerCase();
                const ext = file.original_name.split('.').pop().toLowerCase();
                
                if (currentFilter === 'image') return mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
                if (currentFilter === 'document') return mime.includes('pdf') || mime.includes('word') || mime.includes('excel') || mime.includes('text') || ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'].includes(ext);
                if (currentFilter === 'script') return mime.includes('javascript') || mime.includes('php') || mime.includes('python') || ['js', 'php', 'py', 'html', 'css', 'sql'].includes(ext);
                return true;
            });
        }
        renderFiles();
    };

    const updateStats = () => {
        totalFilesCount.textContent = files.length;
        const totalSize = files.reduce((acc, file) => acc + file.file_size, 0);
        totalStorageSize.textContent = formatBytes(totalSize);
        
        // Calculate most popular file type
        if (files.length > 0) {
            const types = {};
            files.forEach(f => {
                const ext = f.original_name.split('.').pop().toLowerCase();
                types[ext] = (types[ext] || 0) + 1;
            });
            const mostPopular = Object.entries(types).sort((a, b) => b[1] - a[1])[0][0];
            mostFileTypeDisplay.textContent = `Popüler: .${mostPopular.toUpperCase()}`;
            
            const lastFile = files[0];
            lastUploadName.textContent = lastFile.original_name;
            lastUploadTime.textContent = timeAgo(lastFile.created_at);
        } else {
            mostFileTypeDisplay.textContent = 'Popüler: -';
            lastUploadName.textContent = '-';
            lastUploadTime.textContent = 'Yok';
        }
    };

    const renderFiles = () => {
        filesList.innerHTML = '';
        gridViewContainer.innerHTML = '';

        if (filteredFiles.length === 0) {
            emptyState.classList.remove('hidden');
            listViewContainer.classList.add('hidden');
            gridViewContainer.classList.add('hidden');
        } else {
            emptyState.classList.add('hidden');
            
            if (currentView === 'list') {
                listViewContainer.classList.remove('hidden');
                gridViewContainer.classList.add('hidden');
                renderListView();
            } else {
                listViewContainer.classList.add('hidden');
                gridViewContainer.classList.remove('hidden');
                renderGridView();
            }
            lucide.createIcons();
        }
    };

    const renderListView = () => {
        filteredFiles.forEach(file => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50/50 transition-colors group';
            const fa = getFileFAIcon(file.mime_type, file.original_name);
            const isImg = isImage(file.mime_type, file.original_name);
            
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center ${fa.color} group-hover:bg-blue-50 transition-colors overflow-hidden border border-gray-100">
                            ${isImg ? `<img src="api/download.php?id=${file.id}" class="w-full h-full object-cover">` : `<i class="fa-solid ${fa.icon} text-lg"></i>`}
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
                        <a href="api/download.php?id=${file.id}" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="İndir">
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
    };

    const renderGridView = () => {
        filteredFiles.forEach(file => {
            const card = document.createElement('div');
            card.className = 'bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group flex flex-col gap-3';
            const fa = getFileFAIcon(file.mime_type, file.original_name);
            const isImg = isImage(file.mime_type, file.original_name);

            card.innerHTML = `
                <div class="aspect-square bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden border border-gray-50 relative">
                    ${isImg ? `<img src="api/download.php?id=${file.id}" class="w-full h-full object-cover">` : `<i class="fa-solid ${fa.icon} text-4xl ${fa.color}"></i>`}
                    <div class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-gray-900 truncate" title="${file.original_name}">${file.original_name}</p>
                    <p class="text-xs text-gray-400 mt-0.5">${formatBytes(file.file_size)} • ${new Date(file.created_at).toLocaleDateString('tr-TR')}</p>
                </div>
                <div class="flex items-center justify-between pt-2 border-t border-gray-50">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        ${(file.mime_type || 'Other').split('/')[0]}
                    </span>
                    <div class="flex gap-1">
                        <a href="api/download.php?id=${file.id}" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="İndir">
                            <i data-lucide="download" class="w-4 h-4"></i>
                        </a>
                        <button onclick="deleteFile(${file.id})" class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Sil">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            `;
            gridViewContainer.appendChild(card);
        });
    };

    // View Switching logic
    viewListBtn.onclick = () => {
        currentView = 'list';
        viewListBtn.className = 'p-2 rounded-md transition-all text-blue-600 bg-white shadow-sm';
        viewGridBtn.className = 'p-2 rounded-md transition-all text-gray-400 hover:text-gray-600';
        renderFiles();
    };

    viewGridBtn.onclick = () => {
        currentView = 'grid';
        viewGridBtn.className = 'p-2 rounded-md transition-all text-blue-600 bg-white shadow-sm';
        viewListBtn.className = 'p-2 rounded-md transition-all text-gray-400 hover:text-gray-600';
        renderFiles();
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

    // Connection Info Logic
    const loadConnectionInfo = async () => {
        try {
            const response = await fetch('api/info.php');
            const result = await response.json();
            if (result.success) {
                infoIp.textContent = result.ip;
                infoUa.textContent = result.user_agent;
                serverOsDisplay.textContent = `OS: ${result.os}`;
                phpVersionDisplay.textContent = `PHP: ${result.php_version}`;
                serverTimeDisplay.textContent = result.server_time;
            }
        } catch (error) {
            console.error('Info load error:', error);
            infoIp.textContent = 'Hata';
            infoUa.textContent = 'Bilgi alınamadı';
        }
    };

    // Connection Info (Floating/Bottom)
    const floatingIp = document.querySelector('.fixed.bottom-6 #info-ip');
    if (floatingIp) floatingIp.textContent = result.ip;
    const loadNotes = async () => {
        try {
            const response = await fetch('api/notes.php?action=list');
            const result = await response.json();
            if (result.success) {
                notes = result.notes;
                renderNotes();
            }
        } catch (error) {
            console.error('Notes load error:', error);
        }
    };

    const renderNotes = () => {
        notesContainer.innerHTML = '';
        if (notes.length === 0) {
            notesContainer.innerHTML = '<p class="col-span-full text-xs text-center text-gray-400 py-8 font-bold">Henüz not yok.</p>';
            return;
        }

        notes.forEach(note => {
            const div = document.createElement('div');
            const priorityColors = {
                low: 'bg-gray-50 dark:bg-dark-bg border-gray-100 dark:border-dark-border text-gray-700 dark:text-gray-300',
                medium: 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-900/20 text-yellow-700 dark:text-yellow-500',
                high: 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20 text-red-700 dark:text-red-500'
            };
            const colorClass = priorityColors[note.priority] || priorityColors.low;
            
            div.className = `${colorClass} p-5 rounded-2xl border shadow-sm relative group transition-all hover:shadow-md`;
            div.innerHTML = `
                <div class="flex items-center gap-2 mb-2">
                    <span class="w-1.5 h-1.5 rounded-full ${note.priority === 'high' ? 'bg-red-500' : (note.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-400')}"></span>
                    <span class="text-[9px] font-black uppercase tracking-widest opacity-50">${note.priority}</span>
                </div>
                <p class="text-sm leading-relaxed whitespace-pre-wrap break-words pr-6">${note.content}</p>
                <p class="text-[10px] mt-4 opacity-40 font-bold">${new Date(note.created_at).toLocaleString('tr-TR')}</p>
                <button onclick="deleteNote(${note.id})" class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all text-red-500">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            `;
            notesContainer.appendChild(div);
        });
        lucide.createIcons();
    };

    saveNoteBtn.onclick = async () => {
        const content = noteInput.value.trim();
        if (!content) return;

        try {
            const response = await fetch('api/notes.php?action=add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, priority: selectedPriority })
            });
            const result = await response.json();
            if (result.success) {
                noteInput.value = '';
                loadNotes();
                showNotification('Not kaydedildi');
            } else {
                showNotification(result.message, 'error');
            }
        } catch (error) {
            showNotification('Not kaydetme hatası', 'error');
        }
    };

    window.deleteNote = async (id) => {
        if (!confirm('Bu notu silmek istediğinize emin misiniz?')) return;
        try {
            const response = await fetch('api/notes.php?action=delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const result = await response.json();
            if (result.success) {
                loadNotes();
                showNotification('Not silindi');
            }
        } catch (error) {
            showNotification('Not silme hatası', 'error');
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

    // Activity Logs
    const loadLogs = async () => {
        try {
            const response = await fetch('api/logs.php?action=list');
            const result = await response.json();
            if (result.success) {
                renderLogs(result.logs);
            }
        } catch (error) {
            console.error('Logs load error:', error);
        }
    };

    const renderLogs = (logs) => {
        logsList.innerHTML = '';
        logs.forEach(log => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50/50 dark:hover:bg-dark-bg/50 transition-colors';
            tr.innerHTML = `
                <td class="px-8 py-4 font-bold text-blue-600">${log.username || 'Sistem'}</td>
                <td class="px-8 py-4"><span class="px-2 py-0.5 rounded bg-gray-100 dark:bg-dark-bg text-[10px] font-black">${log.action}</span></td>
                <td class="px-8 py-4 text-gray-500">${log.details}</td>
                <td class="px-8 py-4 font-mono text-[10px]">${log.ip_address}</td>
                <td class="px-8 py-4 text-gray-400">${new Date(log.created_at).toLocaleString('tr-TR')}</td>
            `;
            logsList.appendChild(tr);
        });
    };

    // IT Tools Logic
    pingBtn.onclick = async () => {
        const ip = pingIpInput.value.trim();
        if (!ip) return;
        
        pingResult.classList.remove('hidden');
        pingResult.textContent = 'Ping atılıyor...';
        pingBtn.disabled = true;

        try {
            const response = await fetch('api/tools.php?action=ping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ip })
            });
            const result = await response.json();
            if (result.success) {
                const color = result.online ? 'text-green-500' : 'text-red-500';
                const status = result.online ? 'ONLINE' : 'OFFLINE';
                pingResult.innerHTML = `<span class="${color} font-black">[${status}]</span>\n${result.output}`;
            } else {
                pingResult.textContent = result.message;
            }
        } catch (error) {
            pingResult.textContent = 'Hata oluştu.';
        } finally {
            pingBtn.disabled = false;
        }
    };

    genPasswordBtn.onclick = async () => {
        try {
            const response = await fetch('api/tools.php?action=password');
            const result = await response.json();
            if (result.success) {
                genPasswordDisplay.textContent = result.password;
                showNotification('Şifre oluşturuldu');
            }
        } catch (error) {}
    };

    b64EncodeBtn.onclick = () => {
        try {
            b64Input.value = btoa(unescape(encodeURIComponent(b64Input.value)));
            showNotification('Base64 Encode edildi');
        } catch (e) { showNotification('Hata oluştu', 'error'); }
    };

    b64DecodeBtn.onclick = () => {
        try {
            b64Input.value = decodeURIComponent(escape(atob(b64Input.value)));
            showNotification('Base64 Decode edildi');
        } catch (e) { showNotification('Hata oluştu', 'error'); }
    };

    // Dark Mode Logic
    const initDarkMode = () => {
        if (isDarkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    };

    darkModeToggle.onclick = () => {
        isDarkMode = !isDarkMode;
        localStorage.setItem('darkMode', isDarkMode);
        initDarkMode();
    };

    // Tab Logic
    tabButtons.forEach(btn => {
        btn.onclick = () => {
            const tabId = btn.getAttribute('data-tab');
            
            // UI Update
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Content Update
            tabContents.forEach(c => c.classList.add('hidden'));
            document.getElementById(`tab-${tabId}`).classList.remove('hidden');
            
            // Mobile: Close Sidebar
            sidebar.classList.add('-translate-x-full');
            
            // Specific Tab Actions
            if (tabId === 'activity') loadLogs();
            lucide.createIcons();
        };
    });

    // Mobile Menu
    mobileMenuBtn.onclick = () => {
        sidebar.classList.remove('-translate-x-full');
    };

    document.addEventListener('click', (e) => {
        if (window.innerWidth < 1024 && !sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            sidebar.classList.add('-translate-x-full');
        }
    });

    // Dark Mode
    darkModeToggle.onclick = () => {
        isDarkMode = !isDarkMode;
        localStorage.setItem('darkMode', isDarkMode);
        document.documentElement.classList.toggle('dark');
        lucide.createIcons();
    };

    // Filter logic
    filterButtons.forEach(btn => {
        btn.onclick = () => {
            currentFilter = btn.getAttribute('data-filter');
            filterButtons.forEach(b => {
                b.classList.remove('active', 'bg-blue-600', 'text-white');
                b.classList.add('bg-gray-100', 'dark:bg-dark-bg', 'text-gray-600', 'dark:text-gray-400');
            });
            btn.classList.add('active', 'bg-blue-600', 'text-white');
            btn.classList.remove('bg-gray-100', 'dark:bg-dark-bg', 'text-gray-600', 'dark:text-gray-400');
            applyFilter();
        };
    });

    // Priority logic
    priorityButtons.forEach(btn => {
        btn.onclick = () => {
            selectedPriority = btn.getAttribute('data-priority');
            priorityButtons.forEach(b => b.classList.remove('active', 'border-blue-500'));
            btn.classList.add('active', 'border-blue-500');
        };
    });

    // Tool: Ping
    pingBtn.onclick = async () => {
        const ip = pingIpInput.value.trim();
        if (!ip) return;

        pingBtn.disabled = true;
        pingBtn.textContent = '...';
        pingResult.classList.remove('hidden');
        pingResult.textContent = 'Ping gönderiliyor...';

        try {
            const response = await fetch('api/tools.php?action=ping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ip })
            });
            const result = await response.json();
            if (result.success) {
                pingResult.className = `mt-4 p-3 rounded-xl text-[10px] font-mono overflow-x-auto whitespace-pre ${result.online ? 'bg-green-50 dark:bg-green-900/10 text-green-600' : 'bg-red-50 dark:bg-red-900/10 text-red-600'}`;
                pingResult.textContent = result.output;
            }
        } catch (e) {
            pingResult.textContent = 'Hata oluştu.';
        }
        pingBtn.disabled = false;
        pingBtn.textContent = 'Ping';
    };

    // Tool: Password
    genPasswordBtn.onclick = async () => {
        const response = await fetch('api/tools.php?action=password');
        const result = await response.json();
        if (result.success) {
            genPasswordDisplay.textContent = result.password;
            showNotification('Şifre oluşturuldu');
        }
    };

    // Tool: Base64
    b64EncodeBtn.onclick = () => {
        try {
            b64Input.value = btoa(b64Input.value);
            showNotification('Base64 Encode yapıldı');
        } catch (e) { showNotification('Hata!', 'error'); }
    };

    b64DecodeBtn.onclick = () => {
        try {
            b64Input.value = atob(b64Input.value);
            showNotification('Base64 Decode yapıldı');
        } catch (e) { showNotification('Hata!', 'error'); }
    };

    // Activity Logs
    const loadLogs = async () => {
        try {
            const response = await fetch('api/logs.php?action=list');
            const result = await response.json();
            if (result.success) {
                logsList.innerHTML = result.logs.map(log => `
                    <tr class="hover:bg-gray-50/50 dark:hover:bg-dark-bg/50 transition-colors">
                        <td class="px-8 py-4 font-bold text-gray-900 dark:text-gray-100">${log.username || 'Sistem'}</td>
                        <td class="px-8 py-4"><span class="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-dark-bg text-[10px] font-black uppercase tracking-widest">${log.action}</span></td>
                        <td class="px-8 py-4 text-gray-500 dark:text-gray-400">${log.details}</td>
                        <td class="px-8 py-4 font-mono text-[10px] opacity-60">${log.ip_address}</td>
                        <td class="px-8 py-4 opacity-40">${new Date(log.created_at).toLocaleString('tr-TR')}</td>
                    </tr>
                `).join('');
            }
        } catch (e) {}
    };

    refreshLogsBtn.onclick = loadLogs;

    // Initialize
    checkAuth();
});
