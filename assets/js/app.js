console.log('App.js yüklendi');
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
    const notesList = document.getElementById('notes-list');
    const infoIp = document.getElementById('info-ip');
    const connectionInfo = document.getElementById('connection-info');
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
    const logTableBody = document.getElementById('log-table-body');
    const refreshLogsBtn = document.getElementById('refresh-logs');
    const mostFileTypeDisplay = document.getElementById('most-file-type');
    const serverOsDisplay = document.getElementById('server-os');
    const phpVersionDisplay = document.getElementById('php-version');
    const serverTimeDisplay = document.getElementById('server-time');
    const priorityButtons = document.querySelectorAll('.priority-btn');
    const diskUsagePct = document.getElementById('disk-usage-pct');
    const diskProgress = document.getElementById('disk-progress');
    const diskInfo = document.getElementById('disk-info');
    const systemUptime = document.getElementById('system-uptime');
    const dashboardNotesMini = document.getElementById('dashboard-notes-mini');
    
    // New Tool Elements
    const portHostInput = document.getElementById('port-host');
    const portNumberInput = document.getElementById('port-number');
    const portCheckBtn = document.getElementById('port-check-btn');
    const portResultDisplay = document.getElementById('port-result');
    const ipInfoInput = document.getElementById('ip-info-input');
    const ipInfoBtn = document.getElementById('ip-info-btn');
    const ipInfoResult = document.getElementById('ip-info-result');
    
    // New Modal Elements
    const editModal = document.getElementById('edit-modal');
    const editFilenameDisplay = document.getElementById('edit-filename');
    const editContentTextarea = document.getElementById('edit-content');
    const saveEditBtn = document.getElementById('save-edit-btn');
    
    const tagModal = document.getElementById('tag-modal');
    const customTagInput = document.getElementById('custom-tag-input');
    const saveTagsBtn = document.getElementById('save-tags-btn');
    const popularTagChips = document.querySelectorAll('.tag-chip');

    // Preview Elements
    const actionModal = document.getElementById('action-modal');
    const actionModalContainer = document.getElementById('action-modal-container');
    const actionModalTitle = document.getElementById('action-modal-title');
    const actionModalBody = document.getElementById('action-modal-body');
    const actionModalInfo = document.getElementById('action-modal-info');
    const actionModalButtons = document.getElementById('action-modal-buttons');
    const actionModalIcon = document.getElementById('action-modal-icon');

    const filterSizeSelect = document.getElementById('filter-size');
    const filterCategorySelect = document.getElementById('filter-category');
    const selectAllCheckbox = document.getElementById('select-all');
    const bulkActionsContainer = document.getElementById('bulk-actions');
    const selectedCountDisplay = document.getElementById('selected-count');
    const uploadStatusContainer = document.getElementById('upload-status-container');

    // State
    let user = null;
    let files = [];
    let filteredFiles = [];
    let notes = [];
    let selectedFileIds = new Set();
    let currentView = 'list'; // 'list' or 'grid'
    let currentFilter = 'all';
    let isDarkMode = localStorage.getItem('darkMode') === 'true';
    let selectedPriority = 'normal';
    let currentEditingFileId = null;
    let currentTaggingFileId = null;
    let sortDirection = 'desc'; // 'asc' or 'desc' for date

    // --- LOAD NOTES (Moved to top & Repaired) ---
    const loadNotes = async () => {
        console.log('Notlar yükleniyor...');
        if (!notesList && !dashboardNotesMini) return;

        try {
            const response = await fetch('api/notes.php?action=list');
            const result = await response.json();
            if (result && result.success) {
                notes = Array.isArray(result.notes) ? result.notes : [];
                renderNotes();
                renderMiniNotes();
            }
        } catch (error) {
            console.error('Notes load error:', error);
        }
    };

    const renderNotes = () => {
        if (!notesList) return;
        notesList.innerHTML = '';
        
        if (notes.length === 0) {
            notesList.innerHTML = '<p class="col-span-full text-xs text-center text-gray-400 py-8 font-bold">Henüz not eklenmemiş.</p>';
            return;
        }

        notes.forEach(note => {
            const div = document.createElement('div');
            const priorityColors = {
                normal: 'bg-gray-50 dark:bg-dark-bg border-gray-100 dark:border-dark-border text-gray-700 dark:text-gray-300',
                medium: 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-900/20 text-yellow-700 dark:text-yellow-500',
                high: 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20 text-red-700 dark:text-red-500'
            };
            const colorClass = priorityColors[note.priority] || priorityColors.normal;
            
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
            notesList.appendChild(div);
        });
        if (window.lucide) lucide.createIcons();
    };

    // Helper: Get FontAwesome Icon and Color for Mime Type
    const getFileFAIcon = (mimeType, originalName) => {
        const ext = originalName.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return { icon: 'fa-file-image', color: 'text-rose-500' };
        if (ext === 'pdf') return { icon: 'fa-file-pdf', color: 'text-red-600' };
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return { icon: 'fa-file-archive', color: 'text-amber-500' };
        if (['doc', 'docx'].includes(ext)) return { icon: 'fa-file-word', color: 'text-blue-700' };
        if (['xls', 'xlsx', 'csv'].includes(ext)) return { icon: 'fa-file-excel', color: 'text-emerald-600' };
        if (['ppt', 'pptx'].includes(ext)) return { icon: 'fa-file-powerpoint', color: 'text-orange-600' };
        if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return { icon: 'fa-file-video', color: 'text-indigo-500' };
        if (['mp3', 'wav', 'ogg'].includes(ext)) return { icon: 'fa-file-audio', color: 'text-fuchsia-500' };
        if (['txt', 'md', 'rtf'].includes(ext)) return { icon: 'fa-file-lines', color: 'text-slate-500' };
        if (['html', 'css', 'js', 'php', 'py', 'json', 'sql'].includes(ext)) return { icon: 'fa-file-code', color: 'text-violet-600' };
        return { icon: 'fa-file', color: 'text-gray-400' };
    };

    // Helper: Is Image
    const isImage = (mimeType, originalName) => {
        const ext = originalName.split('.').pop().toLowerCase();
        return (mimeType && mimeType.startsWith('image/')) || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    };

    // Helper: Is Previewable
    const isPreviewable = (mimeType, originalName) => {
        const ext = originalName.split('.').pop().toLowerCase();
        return isImage(mimeType, originalName) || ext === 'pdf';
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
        if (!toast) return;
        toast.textContent = message;
        toast.className = `fixed bottom-4 right-4 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`;
        toast.classList.remove('translate-y-20', 'opacity-0');
        setTimeout(() => {
            if (toast) toast.classList.add('translate-y-20', 'opacity-0');
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
    function timeAgo(date) {
        try {
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
        } catch (e) { return "-"; }
    }

    // Helper: Normalize String for Turkish Search
    function normalizeText(text) {
        if (!text) return '';
        return text
            .toLocaleLowerCase('tr-TR')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, "");
    }

    // Auth Logic
    async function checkAuth() {
        if (isDarkMode && document.documentElement) document.documentElement.classList.add('dark');
        try {
            const response = await fetch('api/auth.php?action=check');
            const data = await response.json();
            if (data && data.logged_in) {
                user = { username: data.username };
                showDashboard();
            } else {
                showAuth();
            }
        } catch (error) {
            console.error('Auth check error:', error);
            showAuth();
        }
    }

    function showAuth() {
        if (authContainer) authContainer.classList.remove('hidden');
        if (dashboardContainer) dashboardContainer.classList.add('hidden');
        if (window.lucide) lucide.createIcons();
    }

    function showDashboard() {
        if (authContainer) authContainer.classList.add('hidden');
        if (dashboardContainer) dashboardContainer.classList.remove('hidden');
        if (currentUsername && user) currentUsername.textContent = user.username;
        if (userAvatar && user) userAvatar.textContent = user.username.charAt(0).toUpperCase();
        
        // Varsayılan sekmeyi (Dashboard) aktif et
        tabContents.forEach(c => c.classList.add('hidden'));
        const dashTab = document.getElementById('tab-dashboard');
        if (dashTab) dashTab.classList.remove('hidden');

        // GLOBAL ERROR CATCH: Bir modül hata verirse diğerleri durmasın
        try { loadFiles(); } catch(e) { console.error("Files fail", e); }
        try { loadNotes(); } catch(e) { console.error("Notes fail", e); }
        try { loadConnectionInfo(); } catch(e) { console.error("Info fail", e); }
        try { loadLogs(); } catch(e) { console.error("Logs fail", e); }
        
        if (window.lucide) lucide.createIcons();
    }

    // Event Listeners: Auth Switching
    if (showRegister) {
        showRegister.onclick = (e) => {
            e.preventDefault();
            if (loginView) loginView.classList.add('hidden');
            if (registerView) registerView.classList.remove('hidden');
        };
    }

    if (showLogin) {
        showLogin.onclick = (e) => {
            e.preventDefault();
            if (registerView) registerView.classList.add('hidden');
            if (loginView) loginView.classList.remove('hidden');
        };
    }

    // Event Listeners: Auth Forms
    if (loginForm) {
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
    }

    if (registerForm) {
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
                    if (registerView) registerView.classList.add('hidden');
                    if (loginView) loginView.classList.remove('hidden');
                } else {
                    showNotification(result.message, 'error');
                }
            } catch (error) {
                showNotification('Kayıt hatası', 'error');
            }
        };
    }

    if (logoutBtn) {
        logoutBtn.onclick = async () => {
            try {
                await fetch('api/auth.php?action=logout', { method: 'POST' });
                user = null;
                showAuth();
            } catch (e) {
                user = null;
                showAuth();
            }
        };
    }

    // File Logic
    async function loadFiles() {
        if (!filesList && !gridViewContainer) return;
        
        try {
            const response = await fetch('api/files.php?action=list');
            const result = await response.json();
            if (result && result.success) {
                files = result.files || [];
                applyFilter();
                updateStats();
            }
        } catch (error) {
            console.error('Files load error:', error);
        }
    }

    function applyFilter() {
        const query = searchInput ? normalizeText(searchInput.value) : '';
        const sizeFilter = filterSizeSelect ? filterSizeSelect.value : 'all';
        const categoryFilter = filterCategorySelect ? filterCategorySelect.value : 'all';

        filteredFiles = files.filter(file => {
            const mime = (file.mime_type || '').toLowerCase();
            const ext = file.original_name.split('.').pop().toLowerCase();
            const name = normalizeText(file.original_name);
            const md5 = normalizeText(file.md5_hash || '');
            const tags = normalizeText(file.tags || '');
            const category = file.category || 'Genel';
            const size = file.file_size;

            // 1. Tab Filter (image, document, script)
            let matchesTab = true;
            if (currentFilter === 'image') matchesTab = mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
            else if (currentFilter === 'document') matchesTab = mime.includes('pdf') || mime.includes('word') || mime.includes('excel') || mime.includes('text') || ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'].includes(ext);
            else if (currentFilter === 'script') matchesTab = mime.includes('javascript') || mime.includes('php') || mime.includes('python') || ['js', 'php', 'py', 'html', 'css', 'sql'].includes(ext);

            // 2. Search Query (name, md5, tags)
            const matchesQuery = !query || name.includes(query) || md5.includes(query) || tags.includes(query);

            // 3. Size Filter
            let matchesSize = true;
            if (sizeFilter === 'small') matchesSize = size < 10 * 1024 * 1024;
            else if (sizeFilter === 'medium') matchesSize = size >= 10 * 1024 * 1024 && size <= 100 * 1024 * 1024;
            else if (sizeFilter === 'large') matchesSize = size > 100 * 1024 * 1024;

            // 4. Category Filter
            const matchesCategory = categoryFilter === 'all' || category === categoryFilter;

            return matchesTab && matchesQuery && matchesSize && matchesCategory;
        });

        renderFiles();
    }

    const updateStats = () => {
        if (totalFilesCount) totalFilesCount.textContent = files.length;
        const totalSize = files.reduce((acc, file) => acc + file.file_size, 0);
        if (totalStorageSize) totalStorageSize.textContent = formatBytes(totalSize);
        
        // Calculate most popular file type
        if (files.length > 0) {
            const types = {};
            files.forEach(f => {
                const ext = f.original_name.split('.').pop().toLowerCase();
                types[ext] = (types[ext] || 0) + 1;
            });
            const mostPopular = Object.entries(types).sort((a, b) => b[1] - a[1])[0][0];
            if (mostFileTypeDisplay) mostFileTypeDisplay.textContent = `Popüler: .${mostPopular.toUpperCase()}`;
            
            const lastFile = files[0];
            if (lastUploadName) lastUploadName.textContent = lastFile.original_name;
            if (lastUploadTime) lastUploadTime.textContent = timeAgo(lastFile.created_at);

            // Most Downloaded
            const mostDownloaded = [...files].sort((a, b) => (b.download_count || 0) - (a.download_count || 0))[0];
            const mostDownloadedName = document.getElementById('most-downloaded-name');
            const mostDownloadedCount = document.getElementById('most-downloaded-count');
            if (mostDownloadedName) mostDownloadedName.textContent = mostDownloaded.original_name;
            if (mostDownloadedCount) mostDownloadedCount.textContent = `${mostDownloaded.download_count || 0} İndirme`;
        } else {
            if (mostFileTypeDisplay) mostFileTypeDisplay.textContent = 'Popüler: -';
            if (lastUploadName) lastUploadName.textContent = '-';
            if (lastUploadTime) lastUploadTime.textContent = 'Yok';
            
            const mostDownloadedName = document.getElementById('most-downloaded-name');
            const mostDownloadedCount = document.getElementById('most-downloaded-count');
            if (mostDownloadedName) mostDownloadedName.textContent = '-';
            if (mostDownloadedCount) mostDownloadedCount.textContent = '0 İndirme';
        }
    };

    const renderFiles = () => {
        if (filesList) filesList.innerHTML = '';
        if (gridViewContainer) gridViewContainer.innerHTML = '';

        if (filteredFiles.length === 0) {
            if (emptyState) emptyState.classList.remove('hidden');
            if (listViewContainer) listViewContainer.classList.add('hidden');
            if (gridViewContainer) gridViewContainer.classList.add('hidden');
        } else {
            if (emptyState) emptyState.classList.add('hidden');
            
            if (currentView === 'list') {
                if (listViewContainer) listViewContainer.classList.remove('hidden');
                if (gridViewContainer) gridViewContainer.classList.add('hidden');
                renderListView();
            } else {
                if (listViewContainer) listViewContainer.classList.add('hidden');
                if (gridViewContainer) gridViewContainer.classList.remove('hidden');
                renderGridView();
            }
            if (window.lucide) lucide.createIcons();
        }
    };

    const renderListView = () => {
        filteredFiles.forEach(file => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50/50 transition-colors group';
            if (selectedFileIds.has(file.id)) tr.classList.add('bg-blue-50/30');

            const fa = getFileFAIcon(file.mime_type, file.original_name);
            const isImg = isImage(file.mime_type, file.original_name);
            const ext = file.original_name.split('.').pop().toLowerCase();
            const canPreview = isPreviewable(file.mime_type, file.original_name);
            const escapedName = file.original_name.replace(/'/g, "\\'");
            
            // Format tags
            const tagHtml = (file.tags || '').split(',').filter(t => t.trim()).map(t => {
                const colors = {
                    'Acil': 'bg-red-50 text-red-600 border-red-100',
                    'Yedek': 'bg-blue-50 text-blue-600 border-blue-100',
                    'Rapor': 'bg-green-50 text-green-600 border-green-100',
                    'Script': 'bg-purple-50 text-purple-600 border-purple-100'
                };
                const colorClass = colors[t.trim()] || 'bg-gray-50 text-gray-500 border-gray-100';
                return `<span class="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${colorClass}">${t.trim()}</span>`;
            }).join('');

            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <input type="checkbox" class="file-checkbox rounded border-gray-300 text-blue-600 focus:ring-blue-500" data-id="${file.id}" ${selectedFileIds.has(file.id) ? 'checked' : ''}>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center ${fa.color} group-hover:bg-blue-50 transition-colors overflow-hidden border border-gray-100">
                            ${isImg ? `<img src="api/download.php?id=${file.id}" class="w-full h-full object-cover">` : `<i class="fa-solid ${fa.icon} text-lg"></i>`}
                        </div>
                        <div class="flex flex-col gap-0.5">
                            <span class="text-sm font-semibold text-gray-900 block truncate max-w-[150px] sm:max-w-xs" title="${file.original_name}">${file.original_name}</span>
                            <span class="text-[9px] font-mono text-gray-400 opacity-70">MD5: ${file.md5_hash || 'N/A'}</span>
                            <div class="flex flex-wrap gap-1 mt-1">${tagHtml}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                    ${formatBytes(file.file_size)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold">
                    <div class="flex items-center gap-1.5">
                        <i data-lucide="download-cloud" class="w-3.5 h-3.5 text-blue-500"></i>
                        <span>${file.download_count || 0}</span>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200">
                        ${file.category || 'Genel'}
                    </span>
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
                    <div class="flex items-center justify-end gap-1 sm:gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="openTagModal(${file.id}, '${(file.tags || '').replace(/'/g, "\\'")}')" class="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Etiketle">
                            <i data-lucide="tag" class="w-4 h-4"></i>
                        </button>
                        ${canPreview ? `
                        <button onclick="openActionModal('preview', ${file.id}, '${escapedName}', '${file.mime_type}', ${file.file_size})" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Önizle">
                            <i data-lucide="eye" class="w-4 h-4"></i>
                        </button>
                        ` : ''}
                        <button onclick="openActionModal('rename', ${file.id}, '${escapedName}')" class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Düzenle">
                            <i data-lucide="edit-3" class="w-4 h-4"></i>
                        </button>
                        <button onclick="shareFile(${file.id})" class="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Paylaş">
                            <i data-lucide="share-2" class="w-4 h-4"></i>
                        </button>
                        <a href="api/download.php?id=${file.id}" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="İndir">
                            <i data-lucide="download" class="w-4 h-4"></i>
                        </a>
                        <button onclick="deleteFile(${file.id})" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Sil">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            `;

            // Checkbox logic
            const checkbox = tr.querySelector('.file-checkbox');
            checkbox.onchange = (e) => {
                if (e.target.checked) {
                    selectedFileIds.add(file.id);
                    tr.classList.add('bg-blue-50/30');
                } else {
                    selectedFileIds.delete(file.id);
                    tr.classList.remove('bg-blue-50/30');
                }
                updateBulkActionsUI();
            };

            filesList.appendChild(tr);
        });
    };

    const updateBulkActionsUI = () => {
        if (!bulkActionsContainer || !selectedCountDisplay) return;
        const count = selectedFileIds.size;
        if (count > 0) {
            bulkActionsContainer.classList.remove('hidden');
            selectedCountDisplay.textContent = `${count} Seçili`;
        } else {
            bulkActionsContainer.classList.add('hidden');
        }
    };

    window.bulkDelete = async () => {
        if (selectedFileIds.size === 0) return;
        if (!confirm(`${selectedFileIds.size} dosyayı toplu silmek istediğinize emin misiniz?`)) return;

        try {
            const response = await fetch('api/files.php?action=bulk_delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: Array.from(selectedFileIds) })
            });
            const result = await response.json();
            if (result.success) {
                showNotification(result.message);
                selectedFileIds.clear();
                if (selectAllCheckbox) selectAllCheckbox.checked = false;
                updateBulkActionsUI();
                loadFiles();
            } else {
                showNotification(result.message, 'error');
            }
        } catch (e) {
            showNotification('Toplu silme hatası', 'error');
        }
    };

    const renderGridView = () => {
        filteredFiles.forEach(file => {
            const card = document.createElement('div');
            card.className = 'bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group flex flex-col gap-3';
            const fa = getFileFAIcon(file.mime_type, file.original_name);
            const isImg = isImage(file.mime_type, file.original_name);
            const ext = file.original_name.split('.').pop().toLowerCase();
            const isEditable = ['txt', 'bat', 'py'].includes(ext);
            const canPreview = isPreviewable(file.mime_type, file.original_name);
            const escapedName = file.original_name.replace(/'/g, "\\'");

            // Format tags for grid
            const tagHtml = (file.tags || '').split(',').filter(t => t.trim()).map(t => {
                const colors = {
                    'Acil': 'bg-red-50 text-red-600 border-red-100',
                    'Yedek': 'bg-blue-50 text-blue-600 border-blue-100',
                    'Rapor': 'bg-green-50 text-green-600 border-green-100',
                    'Script': 'bg-purple-50 text-purple-600 border-purple-100'
                };
                const colorClass = colors[t.trim()] || 'bg-gray-50 text-gray-500 border-gray-100';
                return `<span class="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${colorClass}">${t.trim()}</span>`;
            }).join('');

            card.innerHTML = `
                <div class="aspect-square bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden border border-gray-50 relative">
                    ${isImg ? `<img src="api/download.php?id=${file.id}" class="w-full h-full object-cover">` : `<i class="fa-solid ${fa.icon} text-4xl ${fa.color}"></i>`}
                    <div class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>
                    <div class="absolute top-2 left-2 flex flex-wrap gap-1">${tagHtml}</div>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-gray-900 truncate" title="${file.original_name}">${file.original_name}</p>
                    <div class="flex items-center gap-2 mt-0.5">
                        <p class="text-[10px] text-gray-400 font-medium">${formatBytes(file.file_size)} • ${new Date(file.created_at).toLocaleDateString('tr-TR')}</p>
                        <span class="flex items-center gap-1 text-[10px] text-blue-500 font-black">
                            <i data-lucide="download-cloud" class="w-2.5 h-2.5"></i>
                            ${file.download_count || 0}
                        </span>
                    </div>
                </div>
                <div class="flex items-center justify-between pt-2 border-t border-gray-50">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        ${(file.mime_type || 'Other').split('/')[0]}
                    </span>
                    <div class="flex gap-1">
                        <button onclick="openTagModal(${file.id}, '${(file.tags || '').replace(/'/g, "\\'")}')" class="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Etiketle">
                            <i data-lucide="tag" class="w-4 h-4"></i>
                        </button>
                        ${canPreview ? `
                        <button onclick="openPreviewModal(${file.id}, '${escapedName}', '${file.mime_type}', ${file.file_size})" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Önizle">
                            <i data-lucide="eye" class="w-4 h-4"></i>
                        </button>
                        ` : ''}
                        ${isEditable ? `
                        <button onclick="openEditModal(${file.id}, '${escapedName}')" class="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Düzenle">
                            <i data-lucide="edit-3" class="w-4 h-4"></i>
                        </button>
                        ` : ''}
                        <button onclick="shareFile(${file.id})" class="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Paylaş">
                            <i data-lucide="share-2" class="w-4 h-4"></i>
                        </button>
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

        if (filterSizeSelect) filterSizeSelect.onchange = applyFilter;
        if (filterCategorySelect) filterCategorySelect.onchange = applyFilter;
        if (searchInput) searchInput.oninput = applyFilter;

        if (selectAllCheckbox) {
            selectAllCheckbox.onchange = () => {
                const checkboxes = document.querySelectorAll('.file-checkbox');
                checkboxes.forEach(cb => {
                    cb.checked = selectAllCheckbox.checked;
                    const id = parseInt(cb.dataset.id);
                    if (cb.checked) {
                        selectedFileIds.add(id);
                        cb.closest('tr')?.classList.add('bg-blue-50/30');
                    } else {
                        selectedFileIds.delete(id);
                        cb.closest('tr')?.classList.remove('bg-blue-50/30');
                    }
                });
                updateBulkActionsUI();
            };
        }

    // View Switching logic
    if (viewListBtn) {
        viewListBtn.onclick = () => {
            currentView = 'list';
            viewListBtn.className = 'p-2 rounded-md transition-all text-blue-600 bg-white shadow-sm';
            if (viewGridBtn) viewGridBtn.className = 'p-2 rounded-md transition-all text-gray-400 hover:text-gray-600';
            renderFiles();
        };
    }

    if (viewGridBtn) {
        viewGridBtn.onclick = () => {
            currentView = 'grid';
            viewGridBtn.className = 'p-2 rounded-md transition-all text-blue-600 bg-white shadow-sm';
            if (viewListBtn) viewListBtn.className = 'p-2 rounded-md transition-all text-gray-400 hover:text-gray-600';
            renderFiles();
        };
    }

    // Connection Info (Floating/Bottom)
    const loadConnectionInfo = async () => {
        if (!connectionInfo && !infoIp) return;
        
        try {
            const response = await fetch('api/info.php');
            const result = await response.json();
            if (result && result.success) {
                if (connectionInfo) connectionInfo.textContent = `Bağlantı: ${result.ip}`;
                if (serverOsDisplay) serverOsDisplay.textContent = `OS: ${result.os}`;
                if (phpVersionDisplay) phpVersionDisplay.textContent = `PHP: ${result.php_version}`;
                if (serverTimeDisplay) serverTimeDisplay.textContent = result.server_time;

                // Health Info
                if (result.disk) {
                    if (diskUsagePct) diskUsagePct.textContent = `${result.disk.usage}%`;
                    if (diskProgress) diskProgress.style.width = `${result.disk.usage}%`;
                    if (diskInfo) diskInfo.textContent = `${formatBytes(result.disk.total - result.disk.free)} / ${formatBytes(result.disk.total)} kullanıldı`;
                }
                if (result.uptime && systemUptime) {
                    systemUptime.textContent = result.uptime;
                }

                const floatingIp = document.querySelector('.fixed.bottom-6 #connection-info');
                if (floatingIp) floatingIp.textContent = result.ip;
            }
        } catch (error) {
            console.error('Info load error:', error);
            if (connectionInfo) connectionInfo.textContent = 'Hata';
        }
    };

    const renderMiniNotes = () => {
        if (!dashboardNotesMini) return;
        if (dashboardNotesMini) dashboardNotesMini.innerHTML = '';
        if (notes.length === 0) {
            if (dashboardNotesMini) dashboardNotesMini.innerHTML = '<p class="text-[10px] text-gray-400 italic">Henüz not yok...</p>';
            return;
        }

        notes.slice(0, 3).forEach(note => {
            const div = document.createElement('div');
            div.className = 'p-3 bg-gray-50 dark:bg-dark-bg rounded-xl border border-gray-100 dark:border-dark-border';
            div.innerHTML = `
                <div class="flex items-center gap-2 mb-1">
                    <span class="w-1.5 h-1.5 rounded-full ${note.priority === 'high' ? 'bg-red-500' : (note.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-400')}"></span>
                    <span class="text-[8px] font-black uppercase tracking-widest opacity-50">${note.priority}</span>
                </div>
                <p class="text-[10px] leading-tight line-clamp-2">${note.content}</p>
            `;
            dashboardNotesMini.appendChild(div);
        });
    };

    if (saveNoteBtn) {
        saveNoteBtn.onclick = async () => {
            const content = noteInput ? noteInput.value.trim() : '';
            if (!content) return;

            try {
                const response = await fetch('api/notes.php?action=add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content, priority: selectedPriority })
                });
                const result = await response.json();
                if (result && result.success) {
                    if (noteInput) noteInput.value = '';
                    loadNotes();
                    showNotification('Not kaydedildi');
                } else {
                    showNotification(result ? result.message : 'Hata oluştu', 'error');
                }
            } catch (error) {
                showNotification('Not kaydetme hatası', 'error');
            }
        };
    }

    window.deleteNote = async (id) => {
        if (!confirm('Bu notu silmek istediğinize emin misiniz?')) return;
        try {
            const response = await fetch('api/notes.php?action=delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const result = await response.json();
            if (result && result.success) {
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
            if (result && result.success) {
                showNotification('Dosya silindi');
                loadFiles();
            } else {
                showNotification(result ? result.message : 'Hata oluştu', 'error');
            }
        } catch (error) {
            showNotification('Silme hatası', 'error');
        }
    };

    window.shareFile = async (fileId) => {
        try {
            const response = await fetch('api/share.php?action=create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file_id: fileId })
            });
            const result = await response.json();
            if (result && result.success) {
                // Copy to clipboard
                if (navigator.clipboard) {
                    await navigator.clipboard.writeText(result.share_url);
                    showNotification('Paylaşım linki kopyalandı!');
                } else {
                    prompt('Paylaşım Linki:', result.share_url);
                }
            } else {
                showNotification(result ? result.message : 'Hata oluştu', 'error');
            }
        } catch (error) {
            showNotification('Paylaşım oluşturulamadı', 'error');
        }
    };

    // Action Modal Logic (Unified Preview & Rename)
    window.openActionModal = async (type, id, filename, mimeType = '', size = 0) => {
        if (!actionModal) return;

        // Find file for category & md5
        const file = files.find(f => f.id === id);

        // Reset & Show Modal
        actionModal.classList.remove('hidden');
        setTimeout(() => {
            actionModalContainer.classList.remove('scale-95', 'opacity-0');
            actionModalContainer.classList.add('scale-100', 'opacity-100');
        }, 10);

        actionModalTitle.textContent = filename;
        actionModalInfo.textContent = '';
        actionModalButtons.innerHTML = '';
        actionModalBody.innerHTML = `
            <div id="modal-loader" class="flex flex-col items-center gap-4 py-20">
                <div class="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p class="text-sm font-bold animate-pulse text-gray-500">Yükleniyor...</p>
            </div>
        `;

        if (type === 'preview') {
            actionModalIcon.innerHTML = '<i data-lucide="eye" class="w-5 h-5"></i>';
            actionModalInfo.textContent = `${mimeType} • ${formatBytes(size)} • MD5: ${file?.md5_hash || 'N/A'}`;
            
            const downloadUrl = `api/download.php?id=${id}&preview=1`;
            const ext = filename.split('.').pop().toLowerCase();

            // Log preview action
            fetch('api/logs.php?action=add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'PREVIEW', details: `Dosya önizlendi: ${filename}` })
            }).catch(e => console.error('Log error:', e));

            if (isImage(mimeType, filename)) {
                actionModalBody.innerHTML = `<img src="${downloadUrl}" class="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl transition-all duration-500 opacity-0" onload="this.classList.remove('opacity-0')">`;
            } else if (ext === 'pdf') {
                actionModalBody.innerHTML = `<iframe src="${downloadUrl}" class="w-full h-[70vh] border-0 rounded-b-xl"></iframe>`;
            } else if (['txt', 'py', 'js', 'html', 'css', 'php', 'json', 'sql', 'bat'].includes(ext)) {
                try {
                    const response = await fetch(`api/files.php?action=get_content&id=${id}`);
                    const result = await response.json();
                    if (result.success) {
                        actionModalBody.innerHTML = `
                            <div class="w-full h-[70vh] p-6 overflow-auto bg-gray-900 text-gray-300 font-mono text-xs leading-relaxed selection:bg-blue-500/30">
                                <pre class="whitespace-pre-wrap break-all">${result.content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                            </div>
                        `;
                    } else {
                        actionModalBody.innerHTML = `<div class="py-20 text-red-500 font-bold">${result.message}</div>`;
                    }
                } catch (e) {
                    actionModalBody.innerHTML = `<div class="py-20 text-red-500 font-bold">İçerik yüklenemedi.</div>`;
                }
            } else {
                actionModalBody.innerHTML = `
                    <div class="py-20 flex flex-col items-center gap-4 text-gray-400">
                        <i data-lucide="alert-circle" class="w-16 h-16 opacity-20"></i>
                        <p class="font-bold text-lg">Bu dosya türü önizlenemez.</p>
                        <p class="text-sm">Dosyayı indirerek görüntüleyebilirsiniz.</p>
                    </div>
                `;
            }

            actionModalButtons.innerHTML = `
                <button onclick="closeActionModal()" class="px-6 py-2 text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-dark-bg rounded-xl transition-all">Kapat</button>
                <a href="api/download.php?id=${id}" class="px-8 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700 transition-all flex items-center gap-2">
                    <i data-lucide="download" class="w-4 h-4"></i> İndir
                </a>
            `;
        } else if (type === 'rename') {
            actionModalIcon.innerHTML = '<i data-lucide="type" class="w-5 h-5"></i>';
            actionModalTitle.textContent = 'Dosyayı Yeniden Adlandır';
            
            actionModalBody.innerHTML = `
                <div class="w-full max-w-md p-10">
                    <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Yeni Dosya Adı</label>
                    <input type="text" id="rename-input-field" value="${filename}" class="w-full px-5 py-4 bg-white dark:bg-dark-bg border-2 border-gray-100 dark:border-dark-border rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all shadow-sm">
                    <p class="mt-3 text-[10px] text-gray-400 font-medium">Uzantıyı (örn: .jpg) değiştirmeniz önerilmez.</p>
                </div>
            `;

            actionModalButtons.innerHTML = `
                <button onclick="closeActionModal()" class="px-6 py-2 text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-dark-bg rounded-xl transition-all">İptal</button>
                <button id="confirm-rename-btn" class="px-8 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700 transition-all">Güncelle</button>
            `;

            const confirmBtn = document.getElementById('confirm-rename-btn');
            const inputField = document.getElementById('rename-input-field');
            
            inputField.focus();
            inputField.select();

            confirmBtn.onclick = async () => {
                const newName = inputField.value.trim();
                if (!newName || newName === filename) {
                    closeActionModal();
                    return;
                }

                confirmBtn.disabled = true;
                confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>...';

                try {
                    const response = await fetch('api/files.php?action=rename', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id, new_name: newName })
                    });
                    const result = await response.json();
                    if (result.success) {
                        showNotification('Dosya başarıyla güncellendi');
                        loadFiles();
                        closeActionModal();
                    } else {
                        showNotification(result.message, 'error');
                        confirmBtn.disabled = false;
                        confirmBtn.textContent = 'Güncelle';
                    }
                } catch (error) {
                    showNotification('İşlem başarısız', 'error');
                    confirmBtn.disabled = false;
                    confirmBtn.textContent = 'Güncelle';
                }
            };
        }

        if (window.lucide) lucide.createIcons();
    };

    window.closeActionModal = () => {
        if (!actionModal) return;
        actionModalContainer.classList.add('scale-95', 'opacity-0');
        actionModalContainer.classList.remove('scale-100', 'opacity-100');
        setTimeout(() => {
            actionModal.classList.add('hidden');
            actionModalBody.innerHTML = '';
        }, 200);
    };

    // Old functions fallback (prevent errors)
    window.openPreviewModal = (id, filename, mimeType, size) => window.openActionModal('preview', id, filename, mimeType, size);
    window.closePreviewModal = () => window.closeActionModal();
    window.openEditModal = (id, filename) => window.openActionModal('rename', id, filename);
    window.closeEditModal = () => window.closeActionModal();

    // Tag Modal Logic
    window.openTagModal = (id, tags) => {
        currentTaggingFileId = id;
        if (customTagInput) customTagInput.value = tags;
        if (tagModal) tagModal.classList.remove('hidden');
    };

    window.closeTagModal = () => {
        tagModal.classList.add('hidden');
        currentTaggingFileId = null;
    };

    popularTagChips.forEach(chip => {
        chip.onclick = () => {
            const tag = chip.getAttribute('data-tag');
            let currentTags = customTagInput.value.split(',').map(t => t.trim()).filter(t => t);
            if (currentTags.includes(tag)) {
                currentTags = currentTags.filter(t => t !== tag);
            } else {
                currentTags.push(tag);
            }
            if (customTagInput) customTagInput.value = currentTags.join(', ');
        };
    });

    saveTagsBtn.onclick = async () => {
        if (!currentTaggingFileId) return;
        const tags = customTagInput.value;
        
        try {
            const response = await fetch('api/files.php?action=update_tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: currentTaggingFileId, tags })
            });
            const result = await response.json();
            if (result.success) {
                showNotification('Etiketler güncellendi');
                loadFiles();
                closeTagModal();
            } else {
                showNotification(result.message, 'error');
            }
        } catch (error) {
            showNotification('Etiketleme hatası', 'error');
        }
    };

    // Port Checker Logic
    if (portCheckBtn) portCheckBtn.onclick = async () => {
        const host = portHostInput ? portHostInput.value.trim() : '';
        const port = portNumberInput ? portNumberInput.value.trim() : '';
        
        if (!host || !port) return;
        
        portCheckBtn.disabled = true;
        portCheckBtn.textContent = '...';
        if (portResultDisplay) portResultDisplay.classList.remove('hidden');
        if (portResultDisplay) portResultDisplay.textContent = 'Kontrol ediliyor...';

        try {
            const response = await fetch('api/tools.php?action=port_check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ host, port })
            });
            const result = await response.json();
            if (result.success) {
                if (portResultDisplay) portResultDisplay.className = `mt-4 p-3 rounded-xl text-[10px] font-mono ${result.open ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`;
                if (portResultDisplay) portResultDisplay.textContent = result.message;
            } else {
                if (portResultDisplay) portResultDisplay.className = 'mt-4 p-3 rounded-xl bg-red-50 text-red-600 text-[10px] font-mono';
                if (portResultDisplay) portResultDisplay.textContent = result.message;
            }
        } catch (error) {
            if (portResultDisplay) portResultDisplay.textContent = 'Hata oluştu.';
        } finally {
            portCheckBtn.disabled = false;
            portCheckBtn.textContent = 'Kontrol Et';
        }
    };

    // IP Info Logic
    if (ipInfoBtn) {
        ipInfoBtn.onclick = async () => {
            const ip = ipInfoInput ? ipInfoInput.value.trim() : '';
            if (!ip) return;
            
            ipInfoBtn.disabled = true;
            if (ipInfoResult) ipInfoResult.classList.remove('hidden');
            if (ipInfoResult) ipInfoResult.textContent = 'Sorgulanıyor...';

            try {
                const response = await fetch('api/tools.php?action=ip_info', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ip })
                });
                const result = await response.json();
                if (result.status === 'success') {
                    if (ipInfoResult) ipInfoResult.textContent = `Ülke: ${result.country}\nŞehir: ${result.city}\nISP: ${result.isp}\nAS: ${result.as}`;
                } else {
                    if (ipInfoResult) ipInfoResult.textContent = result.message || 'Hata oluştu.';
                }
            } catch (error) {
                if (ipInfoResult) ipInfoResult.textContent = 'Hata oluştu.';
            } finally {
                ipInfoBtn.disabled = false;
            }
        };
    }

    // Sorting Logic
    const dateHeader = document.querySelector('th:nth-child(3)'); // Date column
    if (dateHeader) {
        dateHeader.style.cursor = 'pointer';
        dateHeader.classList.add('hover:text-blue-600', 'transition-colors');
        dateHeader.innerHTML += ' <i data-lucide="chevrons-up-down" class="w-3 h-3 inline-block ml-1"></i>';
        
        dateHeader.onclick = () => {
            sortDirection = sortDirection === 'desc' ? 'asc' : 'desc';
            files.sort((a, b) => {
                const dateA = new Date(a.created_at);
                const dateB = new Date(b.created_at);
                return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
            });
            applyFilter();
            lucide.createIcons();
        };
    }

    // File Upload Logic (Chunked)
    const uploadFile = async (file) => {
        const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        const fileUuid = crypto.randomUUID();
        
        // Create Status UI
        const statusId = 'upload-' + Date.now();
        const statusHtml = `
            <div id="${statusId}" class="bg-white dark:bg-dark-card p-4 rounded-2xl border border-gray-100 dark:border-dark-border shadow-2xl flex flex-col gap-2">
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-black uppercase tracking-widest text-gray-400 truncate max-w-[150px]">${file.name}</span>
                    <span id="${statusId}-pct" class="text-[10px] font-black text-blue-600">0%</span>
                </div>
                <div class="w-full bg-gray-100 dark:bg-dark-bg rounded-full h-1.5 overflow-hidden">
                    <div id="${statusId}-progress" class="bg-blue-600 h-full transition-all duration-300" style="width: 0%"></div>
                </div>
                <p id="${statusId}-msg" class="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Yükleniyor...</p>
            </div>
        `;
        if (uploadStatusContainer) uploadStatusContainer.insertAdjacentHTML('afterbegin', statusHtml);

        try {
            for (let i = 0; i < totalChunks; i++) {
                const start = i * CHUNK_SIZE;
                const end = Math.min(file.size, start + CHUNK_SIZE);
                const chunk = file.slice(start, end);

                const formData = new FormData();
                formData.append('file', chunk);
                formData.append('fileName', file.name);
                formData.append('chunkIndex', i);
                formData.append('totalChunks', totalChunks);
                formData.append('fileUuid', fileUuid);
                formData.append('totalSize', file.size);
                formData.append('mimeType', file.type);
                formData.append('category', document.getElementById('upload-category')?.value || 'Genel');

                const response = await fetch('api/upload.php?action=upload', {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.message);
                }

                const pct = Math.round(((i + 1) / totalChunks) * 100);
                const progressBar = document.getElementById(`${statusId}-progress`);
                const pctText = document.getElementById(`${statusId}-pct`);
                const msgText = document.getElementById(`${statusId}-msg`);

                if (progressBar) progressBar.style.width = pct + '%';
                if (pctText) pctText.textContent = pct + '%';
                
                if (pct === 100 && totalChunks > 1) {
                    if (msgText) msgText.textContent = 'Parçalar Birleştiriliyor...';
                }
            }

            showNotification('Dosya başarıyla yüklendi');
            loadFiles();
            setTimeout(() => {
                const el = document.getElementById(statusId);
                if (el) el.remove();
            }, 3000);

        } catch (error) {
            console.error('Upload error:', error);
            showNotification(error.message || 'Yükleme başarısız', 'error');
            const el = document.getElementById(statusId);
            if (el) el.classList.add('border-red-500');
            const msgText = document.getElementById(`${statusId}-msg`);
            if (msgText) msgText.textContent = 'HATA: ' + error.message;
        }
    };

    if (fileInput) {
        fileInput.onchange = (e) => {
            const files = Array.from(e.target.files);
            files.forEach(file => uploadFile(file));
        };
    }

    if (dropZone) {
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
            const files = Array.from(e.dataTransfer.files);
            files.forEach(file => uploadFile(file));
        };
        dropZone.onclick = () => fileInput && fileInput.click();
    }

    // IT Tools Logic
    if (pingBtn) pingBtn.onclick = async () => {
        const ip = pingIpInput ? pingIpInput.value.trim() : '';
        if (!ip) return;
        
        if (pingResult) pingResult.classList.remove('hidden');
        if (pingResult) pingResult.textContent = 'Ping atılıyor...';
        pingBtn.disabled = true;

        try {
            const response = await fetch('api/tools.php?action=ping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ip })
            });
            const result = await response.json();
            if (result.success) {
                if (pingResult) pingResult.className = `mt-4 p-3 rounded-xl text-[10px] font-mono overflow-x-auto whitespace-pre ${result.online ? 'bg-green-50 dark:bg-green-900/10 text-green-600' : 'bg-red-50 dark:bg-red-900/10 text-red-600'}`;
                if (pingResult) pingResult.innerHTML = `<span class="font-black">[${result.online ? 'ONLINE' : 'OFFLINE'}]</span>\n${result.output}`;
            } else {
                if (pingResult) pingResult.textContent = result.message;
            }
        } catch (error) {
            if (pingResult) pingResult.textContent = 'Hata oluştu.';
        } finally {
            pingBtn.disabled = false;
        }
    };

    if (genPasswordBtn) genPasswordBtn.onclick = async () => {
        try {
            const response = await fetch('api/tools.php?action=password');
            const result = await response.json();
            if (result.success) {
                if (genPasswordDisplay) genPasswordDisplay.textContent = result.password;
                showNotification('Şifre oluşturuldu');
            }
        } catch (error) {}
    };

    if (b64EncodeBtn) b64EncodeBtn.onclick = () => {
        try {
            if (b64Input) b64Input.value = btoa(unescape(encodeURIComponent(b64Input.value)));
            showNotification('Base64 Encode edildi');
        } catch (e) { showNotification('Hata oluştu', 'error'); }
    };

    if (b64DecodeBtn) b64DecodeBtn.onclick = () => {
        try {
            if (b64Input) b64Input.value = decodeURIComponent(escape(atob(b64Input.value)));
            showNotification('Base64 Decode edildi');
        } catch (e) { showNotification('Hata oluştu', 'error'); }
    };

    // Dark Mode Logic
    const initDarkMode = () => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        lucide.createIcons();
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
            const activeTab = document.getElementById(`tab-${tabId}`);
            if (activeTab) activeTab.classList.remove('hidden');
            
            // Mobile: Close Sidebar
            sidebar.classList.add('-translate-x-full');
            
            // Specific Tab Actions
            if (tabId === 'dashboard') {
                loadFiles();
                loadNotes();
                loadConnectionInfo();
            } else if (tabId === 'notes') {
                loadNotes();
            } else if (tabId === 'activity') {
                loadLogs();
            }
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

    // Activity Logs
    const loadLogs = async () => {
        if (!logTableBody) return;

        try {
            const response = await fetch('api/logs.php?action=list');
            const result = await response.json();
            if (result.success) {
                if (result.logs.length === 0) {
                    logTableBody.innerHTML = `
                            <tr>
                                <td colspan="5" class="px-8 py-20 text-center text-gray-400 font-bold">
                                    <i data-lucide="activity" class="w-12 h-12 mb-4 opacity-20 mx-auto"></i>
                                    <p>Henüz sistem aktivitesi bulunmuyor.</p>
                                </td>
                            </tr>
                        `;
                    lucide.createIcons();
                    return;
                }

                logTableBody.innerHTML = result.logs.map(log => `
                    <tr class="hover:bg-gray-50/50 transition-colors">
                        <td class="px-8 py-4 whitespace-nowrap">${log.username || 'Sistem'}</td>
                        <td class="px-8 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 rounded text-[10px] font-bold uppercase ${log.action === 'DELETE' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}">${log.action}</span>
                        </td>
                        <td class="px-8 py-4 max-w-xs truncate" title="${log.details || ''}">${log.details || '-'}</td>
                        <td class="px-8 py-4 whitespace-nowrap font-mono text-gray-400">${log.ip_address || '-'}</td>
                        <td class="px-8 py-4 whitespace-nowrap text-gray-400">${timeAgo(log.created_at)}</td>
                    </tr>
                `).join('');
                lucide.createIcons();
            }
        } catch (error) {
            console.error('Logs load error:', error);
        }
    };

    checkAuth();
});