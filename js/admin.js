// js/admin.js
import { supabase } from './modules/supabase.js';
import logoForLightTheme from '/img/logo-dark.png';
import logoForDarkTheme from '/img/logo-light.png';

let userProfile = null;
let activeChannelId = null;
let chatSubscriptions = [];
let allProfiles = new Map();

function showToast(message, type = 'success', duration = 4000) {
    const container = document.querySelector('.toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const iconClass = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    toast.innerHTML = `<i class="fas ${iconClass}"></i><p>${message}</p>`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('show'); }, 100);
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, duration);
}

const { data: { session } } = await supabase.auth.getSession();
if (!session) { window.location.replace('/login.html'); }
const user = session.user;

const headerLogo = document.querySelector('#header .logo img');
const logoutButton = document.getElementById('logout-button');
const themeToggle = document.getElementById('theme-toggle');
const adminViews = document.querySelectorAll('.admin-view');
const menuCards = document.querySelectorAll('.menu-card');
const backToMenuButtons = document.querySelectorAll('.btn-back-to-menu');
const backToPanelButtons = document.querySelectorAll('.btn-back-to-panel');
const chatGlobalNotification = document.getElementById('chat-global-notification');
const chatContainer = document.getElementById('chat-container');
const channelsListContainer = document.getElementById('chat-channels-list');
const chatChannelName = document.getElementById('chat-channel-name');
const chatChannelDescription = document.getElementById('chat-channel-description');
const messagesContainer = document.getElementById('chat-messages-container');
const messageForm = document.getElementById('chat-message-form');
const messageInput = document.getElementById('chat-message-input');
const sendButton = messageForm.querySelector('.btn-send');
const profileForm = document.getElementById('profile-form');
const projectForm = document.getElementById('project-form');
const projectsListContainer = document.getElementById('projects-list');
const techSearchInput = document.getElementById('tech-search-input');
const techDropdown = document.getElementById('tech-dropdown');
const selectedTechsContainer = document.getElementById('selected-techs');
const credentialsList = document.getElementById('credentials-list');
const masterPasswordInput = document.getElementById('master-password-input');
const showCredentialsBtn = document.getElementById('show-credentials-btn');
const usersListContainer = document.getElementById('users-list');
const userSearchInput = document.getElementById('user-search-input');
const createUserForm = document.getElementById('create-user-form');
const credentialForm = document.getElementById('credential-form');
const rulesListViewer = document.getElementById('rules-list-viewer');
const rulesListAdmin = document.getElementById('rules-list-admin');
const ruleForm = document.getElementById('rule-form');
const ruleIdInput = document.getElementById('rule-id-input');
const ruleTitleInput = document.getElementById('rule-title');
const ruleDescriptionInput = document.getElementById('rule-description');
const cancelEditRuleBtn = document.getElementById('cancel-edit-rule-btn');
const userInfoModal = document.getElementById('user-info-modal');
const userInfoContent = document.getElementById('user-info-content');
const confirmModal = document.getElementById('confirm-modal');
const confirmTitle = document.getElementById('confirm-title');
const confirmMessage = document.getElementById('confirm-message');
const confirmOkBtn = document.getElementById('confirm-ok-btn');
const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
const scrollToBottomBtn = document.getElementById('scroll-to-bottom-btn');
const clearChatBtn = document.getElementById('clear-chat-btn');
const chatMobileBackBtn = document.getElementById('chat-mobile-back-btn');

const ALL_TECHNOLOGIES = [ 'HTML5', 'CSS3', 'JavaScript', 'TypeScript','Formspree API','React', 'Next.js', 'Vue.js', 'Angular', 'Node.js', 'Express', 'Python', 'Django', 'Flask', 'Ruby on Rails', 'PHP', 'Laravel', 'Supabase', 'PostgreSQL', 'MySQL', 'MongoDB', 'Firebase', 'SQL', 'NoSQL', 'REST API', 'GraphQL', 'JWT', 'OAuth', 'Git', 'GitHub', 'Docker', 'Vercel', 'Netlify', 'Render', 'AWS', 'Heroku', 'Figma', 'Adobe XD', 'Responsive Design', 'CSS Modules', 'Tailwind CSS', 'Bootstrap', 'Sass/SCSS', 'Vite', 'Webpack', 'PDFKit', 'i18next', 'Swiper.js', 'Vanta.js', 'Fetch API', 'OpenAI API',  'CSS Grid', 'GitHub Pages', 'Flexbox', 'Api', 'Api de dicord' ].sort();
let selectedTechnologies = [];
let allUsersList = [];

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        if (headerLogo) headerLogo.src = 'img/logo-light.png';
    } else {
        document.body.removeAttribute('data-theme');
        if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        if (headerLogo) headerLogo.src = 'img/logo-dark.png';
    }
}
(function() { const currentTheme = localStorage.getItem('theme') || 'light'; applyTheme(currentTheme); })();
if (themeToggle) { themeToggle.addEventListener('click', () => { let theme = document.body.getAttribute('data-theme'); if (theme === 'dark') { localStorage.removeItem('theme'); applyTheme('light'); } else { localStorage.setItem('theme', 'dark'); applyTheme('dark'); } }); }

function switchView(targetId) {
    adminViews.forEach(view => view.classList.remove('active'));
    const targetView = document.getElementById(targetId);
    if (targetView) targetView.classList.add('active');
}

function setupAdminNavigation() {
    menuCards.forEach(card => card.addEventListener('click', () => switchView(card.dataset.view)));
    backToMenuButtons.forEach(button => button.addEventListener('click', () => switchView('admin-menu')));
    backToPanelButtons.forEach(button => button.addEventListener('click', () => switchView(button.dataset.targetPanel)));
}

async function fetchAllUserProfiles() {
    const { data, error } = await supabase.from('profiles').select('identificación, nombre_completo, URL_del_avatar');
    if (error) { console.error("Error fetching profiles:", error); return; }
    data.forEach(p => allProfiles.set(p.identificación, p));
}

function scrollToBottom(behavior = 'smooth') {
    messagesContainer.scrollTo({ top: messagesContainer.scrollHeight, behavior });
}

function renderMessage(message) {
    const profile = allProfiles.get(message.user_id) || { nombre_completo: 'Usuario Desconocido', URL_del_avatar: 'https://via.placeholder.com/150' };
    const isOwn = message.user_id === user.id;
    const time = new Date(message.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    const isScrolledToBottom = messagesContainer.scrollHeight - messagesContainer.clientHeight <= messagesContainer.scrollTop + 100;

    const messageEl = document.createElement('div');
    messageEl.className = `message ${isOwn ? 'own' : ''}`;
    messageEl.dataset.messageId = message.id;

    messageEl.innerHTML = `
        <img src="${profile.URL_del_avatar}" alt="Avatar" class="message-avatar">
        <div class="message-content">
            <div class="message-header">
                <span class="message-author">${isOwn ? 'Tú' : profile.nombre_completo}</span>
                <span class="message-time">${time}</span>
            </div>
            <p class="message-text">${message.content}</p>
        </div>
    `;
    
    messagesContainer.appendChild(messageEl);
    
    if (isScrolledToBottom || isOwn) {
        scrollToBottom('smooth');
    }
}

async function loadMessagesForChannel(channelId) {
    messagesContainer.innerHTML = '<div class="admin-section"><p>Cargando mensajes...</p></div>';
    const { data, error } = await supabase.from('chat_messages').select('*').eq('channel_id', channelId).order('created_at', { ascending: true });
    if (error) { messagesContainer.innerHTML = '<p>Error al cargar mensajes.</p>'; return; }
    
    messagesContainer.innerHTML = '';
    data.forEach(renderMessage);
    
    setTimeout(() => scrollToBottom('auto'), 50);
}

async function updateReadStatus(channelId) {
    const { error } = await supabase.from('chat_read_status').upsert({ user_id: user.id, channel_id: channelId, last_read_at: new Date().toISOString() });
    if (error) console.error("Error updating read status:", error);
    
    const channelLiBadge = document.querySelector(`li[data-channel-id="${channelId}"] .notification-badge`);
    if (channelLiBadge) channelLiBadge.style.display = 'none';
    updateGlobalChatNotification();
}

async function selectChannel(channelId, channelName, channelDescription) {
    if (activeChannelId === channelId) {
        chatContainer.classList.add('mobile-chat-active');
        return;
    }
    activeChannelId = channelId;
    
    document.querySelectorAll('.channels-list li').forEach(li => li.classList.remove('active'));
    document.querySelector(`li[data-channel-id="${channelId}"]`).classList.add('active');
    chatChannelName.textContent = `# ${channelName}`;
    chatChannelDescription.textContent = channelDescription;
    messageInput.disabled = false;
    sendButton.disabled = false;
    
    if (userProfile && userProfile.is_ceo) {
        clearChatBtn.style.display = 'block';
    } else {
        clearChatBtn.style.display = 'none';
    }

    chatContainer.classList.add('mobile-chat-active');

    await loadMessagesForChannel(channelId);
    await updateReadStatus(channelId);
    
    chatSubscriptions.forEach(sub => sub.unsubscribe());
    chatSubscriptions = [];

    const messageSubscription = supabase.channel(`messages-in-${channelId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages', filter: `channel_id=eq.${channelId}` }, payload => {
            if (payload.eventType === 'INSERT') {
                renderMessage(payload.new);
                if (payload.new.user_id !== user.id) {
                    updateReadStatus(channelId);
                }
            }
            if (payload.eventType === 'DELETE') {
                if (payload.old.id) {
                    const msgEl = document.querySelector(`[data-message-id="${payload.old.id}"]`);
                    if (msgEl) msgEl.remove();
                } else {
                    messagesContainer.innerHTML = '';
                }
            }
        }).subscribe();
    chatSubscriptions.push(messageSubscription);
}

function updateGlobalChatNotification() {
    setTimeout(() => {
        const unreadCount = document.querySelectorAll('.channels-list .notification-badge:not([style*="display: none"])').length;
        if (unreadCount > 0) {
            chatGlobalNotification.textContent = unreadCount;
            chatGlobalNotification.style.display = 'flex';
        } else {
            chatGlobalNotification.style.display = 'none';
        }
    }, 100);
}

async function initializeChat() {
    await fetchAllUserProfiles();
    const { data: channels, error: channelsError } = await supabase.from('chat_channels').select('*');
    if (channelsError) { channelsListContainer.innerHTML = '<li>Error al cargar canales.</li>'; return; }
    const { data: readStatuses } = await supabase.from('chat_read_status').select('*').eq('user_id', user.id);
    const readStatusMap = new Map(readStatuses.map(rs => [rs.channel_id, rs.last_read_at]));
    channelsListContainer.innerHTML = '';
    for (const channel of channels) {
        const lastRead = readStatusMap.get(channel.id) || new Date(0).toISOString();
        const { count } = await supabase.from('chat_messages').select('*', { count: 'exact', head: true }).eq('channel_id', channel.id).gt('created_at', lastRead);
        const li = document.createElement('li');
        li.dataset.channelId = channel.id;
        li.dataset.channelName = channel.name;
        li.dataset.channelDescription = channel.description;
        li.innerHTML = `<span class="channel-name">${channel.name}</span><span class="notification-badge" style="display: ${count > 0 ? 'flex' : 'none'};">${count > 9 ? '9+' : count}</span>`;
        li.addEventListener('click', () => selectChannel(channel.id, channel.name, channel.description));
        channelsListContainer.appendChild(li);
    }
    updateGlobalChatNotification();
    const notificationSubscription = supabase.channel('chat-notifications')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, async payload => {
            if (payload.new.channel_id !== activeChannelId && payload.new.user_id !== user.id) {
                const channelLiBadge = document.querySelector(`li[data-channel-id="${payload.new.channel_id}"] .notification-badge`);
                if (channelLiBadge) {
                    const currentCount = parseInt(channelLiBadge.textContent) || 0;
                    const newCount = currentCount + 1;
                    channelLiBadge.textContent = newCount > 9 ? '9+' : newCount;
                    channelLiBadge.style.display = 'flex';
                    updateGlobalChatNotification();
                }
            }
        }).subscribe();
    chatSubscriptions.push(notificationSubscription);
}

async function handleClearChat() {
    if (!activeChannelId || !userProfile.is_ceo) return;
    const channelName = document.querySelector(`li[data-channel-id="${activeChannelId}"]`).dataset.channelName;
    const confirmed = await showConfirmModal('Vaciar Canal', `¿Estás seguro de que quieres eliminar TODOS los mensajes del canal "#${channelName}"? Esta acción es PERMANENTE.`);

    if (confirmed) {
        showToast('Vaciando el canal...', 'success', 2000);
        const { error } = await supabase.from('chat_messages').delete().eq('channel_id', activeChannelId);
        if (error) {
            showToast(`Error al vaciar el canal: ${error.message}`, 'error');
        } else {
            messagesContainer.innerHTML = '';
            showToast(`Canal "#${channelName}" vaciado con éxito.`, 'success');
        }
    }
}

messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = messageInput.value.trim();
    if (content && activeChannelId) {
        messageInput.value = '';
        messageInput.focus();
        const { error } = await supabase.from('chat_messages').insert({ content, user_id: user.id, channel_id: activeChannelId });
        if (error) showToast('Error al enviar mensaje.', 'error');
    }
});

messagesContainer.addEventListener('scroll', () => {
    if (messagesContainer.scrollHeight - messagesContainer.scrollTop > messagesContainer.clientHeight + 300) {
        scrollToBottomBtn.classList.add('visible');
    } else {
        scrollToBottomBtn.classList.remove('visible');
    }
});

scrollToBottomBtn.addEventListener('click', () => scrollToBottom('smooth'));
clearChatBtn.addEventListener('click', handleClearChat);
chatMobileBackBtn.addEventListener('click', () => {
    chatContainer.classList.remove('mobile-chat-active');
});

async function initializeAdminPanel() {
    setupAdminNavigation();
    const { data: profile, error } = await supabase.from('profiles').select('*').eq('identificación', user.id).single();
    if (error) { showToast('Error fatal al cargar tu perfil.', 'error'); setTimeout(logout, 3000); return; }
    userProfile = profile;
    const isSuperAdmin = profile.role === 'super_admin';
    const isCeo = profile.is_ceo === true;
    if (isSuperAdmin) {
        document.querySelector('.super-admin-or-ceo-only').style.display = 'block';
        switchView('panel-super-admin');
    } else if (isCeo) {
        document.querySelector('.admin-or-ceo-only').style.display = 'block';
        document.querySelector('.super-admin-or-ceo-only').style.display = 'block';
        switchView('admin-menu');
    } else {
        document.querySelector('.admin-or-ceo-only').style.display = 'block';
        switchView('panel-admin-normal');
    }
    fillProfileForm(profile);
    loadUserProjects(user.id);
    setupTechSelector();
    loadAndRenderRulesViewer();
    initializeChat();
    profileForm.addEventListener('submit', handleProfileUpdate);
    projectForm.addEventListener('submit', handleProjectSubmit);
    projectsListContainer.addEventListener('click', e => { if (e.target.matches('.btn-delete[data-project-id]')) handleProjectDelete(e); });
    showCredentialsBtn.addEventListener('click', handleShowCredentials);
    credentialsList.addEventListener('click', handleCredentialListClick);
    if (isSuperAdmin || isCeo) {
        await fetchAllUsersAndRender();
        loadAndRenderRulesAdmin();
        userSearchInput.addEventListener('input', handleUserSearch);
        usersListContainer.addEventListener('click', handleUsersListClick);
        createUserForm.addEventListener('submit', handleCreateUser);
        credentialForm.addEventListener('submit', handleAddCredential);
        ruleForm.addEventListener('submit', handleRuleFormSubmit);
        rulesListAdmin.addEventListener('click', handleRulesListClick);
        cancelEditRuleBtn.addEventListener('click', resetRuleForm);
    }
    userInfoModal.addEventListener('click', e => (e.target === userInfoModal || e.target.classList.contains('modal-close-btn')) && hideModal(userInfoModal));
    confirmModal.addEventListener('click', e => e.target === confirmModal && hideModal(confirmModal));
    confirmCancelBtn.addEventListener('click', () => hideModal(confirmModal));
}

function fillProfileForm(profile) { document.getElementById('full-name').value = profile.nombre_completo || ''; document.getElementById('avatar-preview').src = profile.URL_del_avatar || 'https://via.placeholder.com/150'; document.getElementById('job-title').value = profile.titulo_profesional || ''; document.getElementById('bio').value = profile.biografía || ''; document.getElementById('nationality').value = profile.nacionalidad || ''; document.getElementById('experience-years').value = profile.años_de_experiencia || ''; document.getElementById('habilidad_frontend').value = profile.habilidad_frontend || ''; document.getElementById('habilidad_backend').value = profile.habilidad_backend || ''; document.getElementById('habilidad_db').value = profile.habilidad_db || ''; document.getElementById('habilidad_herramientas').value = profile.habilidad_herramientas || ''; }
async function handleProfileUpdate(e) { e.preventDefault(); const experienceYears = document.getElementById('experience-years').value; const updates = { identificación: user.id, nombre_completo: document.getElementById('full-name').value, titulo_profesional: document.getElementById('job-title').value, biografía: document.getElementById('bio').value, actualizado_en: new Date(), nacionalidad: document.getElementById('nationality').value, años_de_experiencia: experienceYears ? parseInt(experienceYears, 10) : null, URL_de_github: "https://github.com/Jb2Brother", URL_de_LinkedIn: "https://www.linkedin.com/in/jb2-brother-94bb8a377/", habilidad_frontend: document.getElementById('habilidad_frontend').value, habilidad_backend: document.getElementById('habilidad_backend').value, habilidad_db: document.getElementById('habilidad_db').value, habilidad_herramientas: document.getElementById('habilidad_herramientas').value, }; const avatarFile = document.getElementById('avatar-file').files[0]; if (avatarFile) { const filePath = `avatars/${user.id}/${Date.now()}`; const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, avatarFile, { upsert: true }); if (uploadError) return showToast(`Error subiendo avatar: ${uploadError.message}`, 'error'); const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath); updates.URL_del_avatar = urlData.publicUrl; } const { error: updateError } = await supabase.from('profiles').upsert(updates); if (updateError) { showToast(`Error actualizando perfil: ${updateError.message}`, 'error'); } else { showToast('Perfil actualizado con éxito!', 'success'); if(updates.URL_del_avatar) document.getElementById('avatar-preview').src = updates.URL_del_avatar; } }
async function loadUserProjects(userId) { const { data: projects, error } = await supabase.from('proyectos').select('*').eq('ID_de_usuario', userId).order('creado_en', { ascending: false }); if (error) { projectsListContainer.innerHTML = '<p>Error cargando proyectos.</p>'; return; } projectsListContainer.innerHTML = projects.length > 0 ? projects.map(p => `<div class="project-item"><span>${p.titulo}</span><button class="btn-delete" data-project-id="${p.identificación}">Eliminar</button></div>`).join('') : '<p>Aún no tienes proyectos.</p>'; }
async function handleProjectSubmit(e) { e.preventDefault(); const projectImageFile = document.getElementById('project-image').files[0]; if (!projectImageFile) return showToast('La imagen del proyecto es obligatoria.', 'error'); const filePath = `images/${user.id}/${Date.now()}`; const { error: uploadError } = await supabase.storage.from('images').upload(filePath, projectImageFile); if (uploadError) return showToast(`Error subiendo imagen: ${uploadError.message}`, 'error'); const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath); const newProject = { "ID_de_usuario": user.id, titulo: document.getElementById('project-title').value, objetivos: document.getElementById('project-objetivo').value, solucion: document.getElementById('project-solucion').value, tecnologias: selectedTechnologies, "URL_de_la_imagen": urlData.publicUrl, "URL_en_vivo": document.getElementById('project-live-url').value, "código_url": document.getElementById('project-code-url').value }; const { error: insertError } = await supabase.from('proyectos').insert(newProject); if (insertError) { showToast(`Error añadiendo proyecto: ${insertError.message}`, 'error'); } else { showToast('¡Proyecto añadido con éxito!', 'success'); projectForm.reset(); selectedTechnologies = []; renderSelectedTechs(); loadUserProjects(user.id); } }
async function handleProjectDelete(e) { const projectId = e.target.dataset.projectId; const confirmed = await showConfirmModal('Eliminar Proyecto', '¿Seguro que quieres eliminar este proyecto?'); if (!confirmed) return; const { error } = await supabase.from('proyectos').delete().eq('identificación', projectId); if (error) showToast(`Error al eliminar: ${error.message}`, 'error'); else { showToast('Proyecto eliminado.', 'success'); loadUserProjects(user.id); } }
function setupTechSelector() { techSearchInput.addEventListener('input', (e) => { const searchTerm = e.target.value.toLowerCase(); if (searchTerm.length === 0) { techDropdown.innerHTML = ''; techDropdown.classList.remove('active'); return; } const filteredTechs = ALL_TECHNOLOGIES.filter(tech => tech.toLowerCase().includes(searchTerm) && !selectedTechnologies.includes(tech)); if (filteredTechs.length > 0) { techDropdown.innerHTML = filteredTechs.map(tech => `<div class="tech-item" data-tech="${tech}">${tech}</div>`).join(''); techDropdown.classList.add('active'); } else { techDropdown.innerHTML = ''; techDropdown.classList.remove('active'); } }); techDropdown.addEventListener('click', (e) => { if (e.target.classList.contains('tech-item')) { const tech = e.target.dataset.tech; if (!selectedTechnologies.includes(tech)) { selectedTechnologies.push(tech); renderSelectedTechs(); } techSearchInput.value = ''; techDropdown.innerHTML = ''; techDropdown.classList.remove('active'); } }); selectedTechsContainer.addEventListener('click', (e) => { if (e.target.classList.contains('remove-tag')) { selectedTechnologies = selectedTechnologies.filter(t => t !== e.target.dataset.tech); renderSelectedTechs(); } }); document.addEventListener('click', (e) => { if (techSearchInput && techDropdown && !techSearchInput.contains(e.target) && !techDropdown.contains(e.target)) { techDropdown.classList.remove('active'); } }); }
function renderSelectedTechs() { selectedTechsContainer.innerHTML = selectedTechnologies.map(tech => `<span class="tech-tag">${tech}<span class="remove-tag" data-tech="${tech}">×</span></span>`).join(''); }
function renderUsersTable(usersToRender) { if (usersToRender.length === 0) { usersListContainer.innerHTML = '<p>No se encontraron miembros.</p>'; return; } usersListContainer.innerHTML = `<table class="admin-users-table"><thead><tr><th>Nombre</th><th>Username</th><th>Acciones</th></tr></thead><tbody>${usersToRender.map(u => { const isCeoBadge = u.is_ceo ? '<span class="ceo-badge">CEO</span>' : ''; const ceoButtonText = u.is_ceo ? 'Quitar CEO' : 'Hacer CEO'; if (u.role === 'super_admin') { return `<tr><td><div class="name-container">${u.nombre_completo || 'N/A'} (Super Admin) ${isCeoBadge}</div></td><td>${u.nombre_usuario || 'N/A'}</td><td>-</td></tr>`; } return `<tr><td><div class="name-container"><a href="#" class="user-name-link" data-user-id="${u.identificación}">${u.nombre_completo || 'N/A'}</a>${isCeoBadge}</div></td><td>${u.nombre_usuario || 'N/A'}</td><td><div class="admin-user-actions"><button class="btn-toggle-ceo" data-user-id="${u.identificación}" data-is-ceo="${u.is_ceo}">${ceoButtonText}</button><button class="btn-delete" data-user-id="${u.identificación}" data-user-name="${u.nombre_completo || u.nombre_usuario}">Eliminar</button></div></td></tr>`; }).join('')}</tbody></table>`; }
async function fetchAllUsersAndRender() { const { data: users, error } = await supabase.from('profiles').select('*'); if (error) { showToast('Error cargando usuarios.', 'error'); return; } allUsersList = users; renderUsersTable(allUsersList); }
function handleUserSearch(event) { const searchTerm = event.target.value.toLowerCase().trim(); if (!searchTerm) { renderUsersTable(allUsersList); return; } const filteredUsers = allUsersList.filter(user => (user.nombre_completo && user.nombre_completo.toLowerCase().includes(searchTerm)) || (user.nombre_usuario && user.nombre_usuario.toLowerCase().includes(searchTerm))); renderUsersTable(filteredUsers); }
async function handleUsersListClick(e) { const target = e.target; if (target.matches('.btn-delete[data-user-id]')) { e.preventDefault(); const userIdToDelete = target.dataset.userId; const userName = target.dataset.userName; const confirmed = await showConfirmModal(`Eliminar a ${userName}`, `¿Seguro que quieres eliminar a este miembro?`); if (confirmed) await handleUserDelete(userIdToDelete); } if (target.matches('.user-name-link')) { e.preventDefault(); const userId = target.dataset.userId; await showUserInfoModal(userId); } if (target.matches('.btn-toggle-ceo')) { e.preventDefault(); const userId = target.dataset.userId; const isCurrentlyCeo = target.dataset.isCeo === 'true'; await handleToggleCeoStatus(userId, isCurrentlyCeo); } }
async function handleToggleCeoStatus(userId, isCurrentlyCeo) { const { error } = await supabase.from('profiles').update({ is_ceo: !isCurrentlyCeo }).eq('identificación', userId); if (error) showToast(`Error al actualizar estado: ${error.message}`, 'error'); else { showToast('Estado de CEO actualizado.', 'success'); await fetchAllUsersAndRender(); } }
async function showUserInfoModal(userId) { showModal(userInfoModal); userInfoContent.innerHTML = '<p>Cargando...</p>'; try { const { data, error } = await supabase.functions.invoke('get-user-details', { body: { userId } }); if (error || data.error) throw new Error(error?.message || data.error); const d = data.user; const b = d.is_ceo ? '<span class="ceo-badge">CEO</span>' : ''; userInfoContent.innerHTML = `<button class="modal-close-btn">×</button><div class="user-info-header"><img src="${d.URL_del_avatar || 'https://via.placeholder.com/150'}" alt="Avatar" class="user-info-avatar"><div class="user-info-name-stack"><div class="name-container"><h3 class="user-info-name">${d.nombre_completo || 'N/A'}</h3>${b}</div><p class="user-info-username">@${d.nombre_usuario || 'N/A'}</p></div></div><div class="user-info-body"><div class="user-info-stat"><strong>${d.projectsCount}</strong>Proyectos</div><div class="user-info-stat"><strong>${formatTimeAgo(d.last_sign_in_at)}</strong>Último login</div></div><div class="user-info-footer"><a href="/profile.html?user=${d.nombre_usuario}" class="btn btn-primary" target="_blank">Ver Perfil</a></div>`; } catch (err) { userInfoContent.innerHTML = `<button class="modal-close-btn">×</button><p>Error: ${err.message}</p>`; } }
async function handleCreateUser(e) { e.preventDefault(); const d = { email: document.getElementById('new-user-email').value, password: document.getElementById('new-user-password').value, username: document.getElementById('new-user-username').value, full_name: document.getElementById('new-user-fullname').value }; const { data, error } = await supabase.functions.invoke('create-user', { body: JSON.stringify(d) }); if (error) showToast(`Error: ${error.message}`, 'error'); else if (data.error) showToast(`Error: ${data.error}`, 'error'); else { showToast(`Usuario ${d.email} creado.`, 'success'); createUserForm.reset(); await fetchAllUsersAndRender(); } }
async function handleUserDelete(userIdToDelete) { const { data, error } = await supabase.functions.invoke('delete-user', { body: JSON.stringify({ userId: userIdToDelete }) }); if (error || data.error) showToast(`Error: ${error?.message || data.error}`, 'error'); else { showToast('Usuario eliminado.', 'success'); await fetchAllUsersAndRender(); } }
async function loadAndRenderRulesViewer() { const { data: rules, error } = await supabase.from('reglas_equipo').select('*').order('creado_en', { ascending: true }); if (error) { rulesListViewer.innerHTML = `<p>Error al cargar las reglas.</p>`; return; } if (rules.length === 0) { rulesListViewer.innerHTML = `<p>No se han establecido reglas.</p>`; return; } rulesListViewer.innerHTML = rules.map(r => `<div class="rule-card"><h4>${r.titulo}</h4><p>${r.descripcion}</p></div>`).join(''); }
async function loadAndRenderRulesAdmin() { const { data: rules, error } = await supabase.from('reglas_equipo').select('*').order('creado_en', { ascending: true }); if (error) { rulesListAdmin.innerHTML = `<p>Error al cargar las reglas.</p>`; return; } if (rules.length === 0) { rulesListAdmin.innerHTML = `<p>No hay reglas. Añade la primera.</p>`; return; } rulesListAdmin.innerHTML = rules.map(r => `<div class="rule-card" data-id="${r.id}" data-title="${escape(r.titulo)}" data-description="${escape(r.descripcion)}"><div class="rule-content"><h4>${r.titulo}</h4><p>${r.descripcion}</p></div><div class="rule-actions"><button class="btn btn-edit-rule"><i class="fas fa-pencil-alt"></i></button><button class="btn btn-delete btn-delete-rule"><i class="fas fa-trash"></i></button></div></div>`).join(''); }
function resetRuleForm() { ruleForm.reset(); ruleIdInput.value = ''; cancelEditRuleBtn.style.display = 'none'; ruleForm.querySelector('button[type="submit"]').textContent = 'Guardar Regla'; }
async function handleRuleFormSubmit(e) { e.preventDefault(); const id = ruleIdInput.value; const d = { titulo: ruleTitleInput.value, descripcion: ruleDescriptionInput.value, actualizado_en: new Date() }; let error; if (id) { const { error: u } = await supabase.from('reglas_equipo').update(d).eq('id', id); error = u; } else { d.creado_por = user.id; const { error: i } = await supabase.from('reglas_equipo').insert(d); error = i; } if (error) { showToast(`Error: ${error.message}`, 'error'); } else { showToast(`Regla ${id ? 'actualizada' : 'creada'}.`, 'success'); resetRuleForm(); loadAndRenderRulesAdmin(); loadAndRenderRulesViewer(); } }
async function handleRulesListClick(e) { const edit = e.target.closest('.btn-edit-rule'); const del = e.target.closest('.btn-delete-rule'); if (edit) { const c = edit.closest('.rule-card'); ruleIdInput.value = c.dataset.id; ruleTitleInput.value = unescape(c.dataset.title); ruleDescriptionInput.value = unescape(c.dataset.description); cancelEditRuleBtn.style.display = 'inline-flex'; ruleForm.querySelector('button[type="submit"]').textContent = 'Actualizar Regla'; ruleTitleInput.focus(); } if (del) { const c = del.closest('.rule-card'); const id = c.dataset.id; const conf = await showConfirmModal('Eliminar Regla', '¿Estás seguro?'); if (conf) { const { error } = await supabase.from('reglas_equipo').delete().eq('id', id); if (error) { showToast(`Error: ${error.message}`, 'error'); } else { showToast('Regla eliminada.', 'success'); loadAndRenderRulesAdmin(); loadAndRenderRulesViewer(); } } } }
const textEncoder = new TextEncoder(); const textDecoder = new TextDecoder();
async function deriveKey(p, s) { const k = await crypto.subtle.importKey('raw', textEncoder.encode(p), { name: 'PBKDF2' }, false, ['deriveKey']); return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: s, iterations: 100000, hash: 'SHA-256' }, k, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']); }
async function encrypt(t, m) { const s = crypto.getRandomValues(new Uint8Array(16)); const k = await deriveKey(m, s); const i = crypto.getRandomValues(new Uint8Array(12)); const e = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: i }, k, textEncoder.encode(t)); const b = new Uint8Array([...s, ...i, ...new Uint8Array(e)]); return btoa(String.fromCharCode.apply(null, b)); }
async function decrypt(b, m) { const e = new Uint8Array(atob(b).split('').map(c => c.charCodeAt(0))); const s = e.slice(0, 16); const i = e.slice(16, 28); const d = e.slice(28); const k = await deriveKey(m, s); const c = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: i }, k, d); return textDecoder.decode(c); }
async function handleAddCredential(e) { e.preventDefault(); const n = document.getElementById('credential-app-name').value, m = document.getElementById('credential-email').value, p = document.getElementById('credential-password').value, a = document.getElementById('credential-master-password').value; if (!n || !p || !a) return showToast('Todos los campos son obligatorios.', 'error'); try { const enc = await encrypt(p, a); const { error } = await supabase.from('credenciales_equipo').insert({ nombre_aplicacion: n, correo_usuario: m, credencial_cifrada: enc, creado_por: user.id }); if (error) throw error; showToast('Credencial guardada.', 'success'); credentialForm.reset(); switchView('panel-super-admin'); } catch (err) { showToast(`Error: ${err.message}`, 'error'); } }
async function handleShowCredentials() { const m = masterPasswordInput.value; if (!m) { showToast('Introduce la Contraseña Maestra.', 'error'); return; } credentialsList.innerHTML = '<p>Descifrando...</p>'; const { data: c, error } = await supabase.from('credenciales_equipo').select('*').order('creado_en'); if (error) { credentialsList.innerHTML = `<p>Error: ${error.message}</p>`; return; } if (c.length === 0) { credentialsList.innerHTML = '<p>No hay credenciales.</p>'; return; } const dec = []; for (const cred of c) { try { const d = await decrypt(cred.credencial_cifrada, m); dec.push({ ...cred, decryptedPass: d }); } catch (e) { credentialsList.innerHTML = `<p>Error al descifrar. ¿Contraseña incorrecta?</p>`; return; } } renderDecryptedCredentials(dec); }
function renderDecryptedCredentials(credentials) { if (!credentials || credentials.length === 0) { credentialsList.innerHTML = '<p>No hay credenciales.</p>'; return; } const canDelete = userProfile.role === 'super_admin' || userProfile.is_ceo === true; credentialsList.innerHTML = `<div class="credentials-grid">${credentials.map(c => `<div class="credential-card" data-credential-id="${c.id}"><div class="credential-info-wrapper"><div class="app-name">${c.nombre_aplicacion}</div><div class="info-field"><label>Usuario</label><span>${c.correo_usuario || 'N/A'}</span></div><div class="info-field password-field"><label>Clave</label><span class="password-text" data-password="${c.decryptedPass}">••••••••</span></div></div><div class="credential-actions"><button class="btn-credential-action btn-toggle-visibility"><i class="fas fa-eye"></i></button><button class="btn-credential-action btn-copy"><i class="far fa-copy"></i></button>${canDelete ? `<button class="btn-credential-action btn-delete-credential"><i class="fas fa-trash"></i></button>` : ''}</div></div>`).join('')}</div>`; }
async function handleCredentialListClick(e) { const btn = e.target.closest('.btn-credential-action'); if (!btn) return; const card = btn.closest('.credential-card'); const passSpan = card.querySelector('.password-text'); const pass = passSpan.dataset.password; if (btn.classList.contains('btn-copy')) { navigator.clipboard.writeText(pass).then(() => showToast('Copiado.', 'success')).catch(() => showToast('Error al copiar.', 'error')); } if (btn.classList.contains('btn-toggle-visibility')) { const i = btn.querySelector('i'); if (passSpan.textContent.includes('•')) { passSpan.textContent = pass; i.classList.replace('fa-eye', 'fa-eye-slash'); } else { passSpan.textContent = '••••••••'; i.classList.replace('fa-eye-slash', 'fa-eye'); } } if (btn.classList.contains('btn-delete-credential')) { const id = card.dataset.credentialId; const name = card.querySelector('.app-name').textContent; const conf = await showConfirmModal('Eliminar Credencial', `¿Eliminar la credencial para "${name}"?`); if (conf) { const { error } = await supabase.from('credenciales_equipo').delete().eq('id', id); if (error) { showToast(`Error: ${error.message}`, 'error'); } else { showToast('Credencial eliminada.', 'success'); card.remove(); } } } }
function showConfirmModal(title, message) { return new Promise((resolve) => { confirmTitle.textContent = title; confirmMessage.textContent = message; showModal(confirmModal); const onOk = () => { cleanup(); resolve(true); }; const onCancel = () => { cleanup(); resolve(false); }; function cleanup() { confirmOkBtn.removeEventListener('click', onOk); confirmCancelBtn.removeEventListener('click', onCancel); hideModal(confirmModal); } confirmOkBtn.addEventListener('click', onOk, { once: true }); confirmCancelBtn.addEventListener('click', onCancel, { once: true }); }); }
function showModal(modalElement) { modalElement.classList.remove('hidden'); }
function hideModal(modalElement) { modalElement.classList.add('hidden'); }
async function logout() { await supabase.auth.signOut(); window.location.replace('/'); }
logoutButton.addEventListener('click', logout);

initializeAdminPanel();