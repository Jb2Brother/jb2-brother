// js/admin.js
import { supabase } from './modules/supabase.js';

// --- IMPORTACIÓN DE IMÁGENES PARA RUTAS CORRECTAS EN PRODUCCIÓN ---
import logoForLightTheme from '/img/logo-dark.png';
import logoForDarkTheme from '/img/logo-light.png';

let userProfile = null;

// --- 1. FUNCIÓN DE NOTIFICACIONES (TOAST) ---
function showToast(message, type = 'success', duration = 4000) {
    const container = document.querySelector('.toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconClass = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    toast.innerHTML = `<i class="fas ${iconClass}"></i><p>${message}</p>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, duration);
}

// --- 2. COMPROBACIÓN DE SESIÓN Y OBTENCIÓN DE USUARIO ---
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
    window.location.replace('/login.html');
}
const user = session.user;

// --- 3. REFERENCIAS A ELEMENTOS DEL DOM ---
const adminMainContainer = document.querySelector('.admin-main-container');
const headerLogo = document.querySelector('#header .logo img');
const profileManagementSection = document.getElementById('profile-management-section');
const projectManagementSection = document.getElementById('project-management-section');
const userManagementSection = document.getElementById('user-management-section');
const profileForm = document.getElementById('profile-form');
const projectForm = document.getElementById('project-form');
const createUserForm = document.getElementById('create-user-form');
const logoutButton = document.getElementById('logout-button');
const projectsListContainer = document.getElementById('projects-list');
const usersListContainer = document.getElementById('users-list');
const techSearchInput = document.getElementById('tech-search-input');
const techDropdown = document.getElementById('tech-dropdown');
const selectedTechsContainer = document.getElementById('selected-techs');
const themeToggle = document.getElementById('theme-toggle');
const userSearchInput = document.getElementById('user-search-input');
const userInfoModal = document.getElementById('user-info-modal');
const userInfoContent = document.getElementById('user-info-content');
const confirmModal = document.getElementById('confirm-modal');
const confirmTitle = document.getElementById('confirm-title');
const confirmMessage = document.getElementById('confirm-message');
const confirmOkBtn = document.getElementById('confirm-ok-btn');
const confirmCancelBtn = document.getElementById('confirm-cancel-btn');

const credentialsSection = document.getElementById('credentials-section');
const credentialsList = document.getElementById('credentials-list');
const masterPasswordInput = document.getElementById('master-password-input');
const showCredentialsBtn = document.getElementById('show-credentials-btn');
const credentialForm = document.getElementById('credential-form');
const credentialMasterPasswordInput = document.getElementById('credential-master-password');

// --- 4. DATOS Y ESTADO ---
const ALL_TECHNOLOGIES = [ 'HTML5', 'CSS3', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Vue.js', 'Angular', 'Node.js', 'Express', 'Python', 'Django', 'Flask', 'Ruby on Rails', 'PHP', 'Laravel', 'Supabase', 'PostgreSQL', 'MySQL', 'MongoDB', 'Firebase', 'SQL', 'NoSQL', 'REST API', 'GraphQL', 'JWT', 'OAuth', 'Git', 'GitHub', 'Docker', 'Vercel', 'Netlify', 'Render', 'AWS', 'Heroku', 'Figma', 'Adobe XD', 'Responsive Design', 'CSS Modules', 'Tailwind CSS', 'Bootstrap', 'Sass/SCSS', 'Vite', 'Webpack', 'PDFKit', 'i18next', 'Swiper.js', 'Vanta.js' ].sort();
let selectedTechnologies = [];
let allUsersList = [];

// --- LÓGICA DEL MODO OSCURO (CON CAMBIO DE LOGO) ---
function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        if (headerLogo) headerLogo.src = logoForDarkTheme; // Usamos la variable importada
    } else {
        document.body.removeAttribute('data-theme');
        if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        if (headerLogo) headerLogo.src = logoForLightTheme; // Usamos la variable importada
    }
}

(function() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    applyTheme(currentTheme);
})();

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        let theme = document.body.getAttribute('data-theme');
        if (theme === 'dark') {
            localStorage.removeItem('theme');
            applyTheme('light');
        } else {
            localStorage.setItem('theme', 'dark');
            applyTheme('dark');
        }
    });
}

// --- 5. FUNCIÓN PRINCIPAL DE INICIALIZACIÓN ---
async function initializeAdminPanel() {
    const { data: profile, error } = await supabase.from('profiles').select('*').eq('identificación', user.id).single();
    if (error) {
        showToast('Error fatal: No se pudo cargar tu perfil. Redirigiendo...', 'error');
        setTimeout(() => logout(), 3000);
        return;
    }
    
    userProfile = profile;

    if (profile.role === 'super_admin') {
        document.title = `Panel de Super Admin | JB2 Brother`;
        profileManagementSection.style.display = 'none';
        projectManagementSection.style.display = 'none';
        userManagementSection.classList.remove('admin-section-hidden');
        credentialsSection.classList.remove('admin-section-hidden');
        
        await fetchAllUsersAndRender();
        userSearchInput.addEventListener('input', handleUserSearch);
        usersListContainer.addEventListener('click', handleUsersListClick);
        credentialForm.addEventListener('submit', handleAddCredential);
        showCredentialsBtn.addEventListener('click', handleShowCredentials);
        credentialsList.addEventListener('click', handleCredentialListClick);

    } else {
        document.title = `Panel de ${profile.nombre_completo || 'Admin'} | JB2 Brother`;
        
        userManagementSection.style.display = 'none';
        profileManagementSection.style.display = 'block';
        projectManagementSection.style.display = 'block';
        credentialsSection.classList.remove('admin-section-hidden');

        fillProfileForm(profile);
        loadUserProjects(user.id);
        setupTechSelector();
        showCredentialsBtn.addEventListener('click', handleShowCredentials);
        credentialsList.addEventListener('click', handleCredentialListClick);
    }
    
    userInfoModal.addEventListener('click', (e) => (e.target === userInfoModal || e.target.classList.contains('modal-close-btn')) && hideModal(userInfoModal));
    confirmModal.addEventListener('click', (e) => e.target === confirmModal && hideModal(confirmModal));
    confirmCancelBtn.addEventListener('click', () => hideModal(confirmModal));
}

function fillProfileForm(profile) {
    document.getElementById('full-name').value = profile.nombre_completo || '';
    document.getElementById('avatar-preview').src = profile.URL_del_avatar || 'https://via.placeholder.com/150';
    document.getElementById('job-title').value = profile.titulo_profesional || '';
    document.getElementById('bio').value = profile.biografía || '';
}

// --- 6. GESTIÓN DE PERFIL ---
profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const updates = {
        identificación: user.id,
        nombre_completo: document.getElementById('full-name').value,
        titulo_profesional: document.getElementById('job-title').value,
        biografía: document.getElementById('bio').value,
        actualizado_en: new Date(),
    };
    const avatarFile = document.getElementById('avatar-file').files[0];
    if (avatarFile) {
        const filePath = `avatars/${user.id}/${Date.now()}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, avatarFile, { upsert: true });
        if (uploadError) {
            return showToast(`Error subiendo avatar: ${uploadError.message}`, 'error');
        }
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        updates.URL_del_avatar = urlData.publicUrl;
    }
    const { error: updateError } = await supabase.from('profiles').upsert(updates);
    if (updateError) {
        showToast(`Error actualizando perfil: ${updateError.message}`, 'error');
    } else {
        showToast('Perfil actualizado con éxito!', 'success');
        if(updates.URL_del_avatar) {
            document.getElementById('avatar-preview').src = updates.URL_del_avatar;
        }
    }
});

// --- 7. GESTIÓN DE PROYECTOS ---
async function loadUserProjects(userId) {
    const { data: projects, error } = await supabase.from('proyectos').select('*').eq('ID_de_usuario', userId).order('creado_en', { ascending: false });
    if (error) {
        projectsListContainer.innerHTML = '<p>Error cargando proyectos.</p>';
        return;
    }
    projectsListContainer.innerHTML = projects.length > 0 
        ? projects.map(p => `
            <div class="project-item">
                <span>${p.titulo}</span>
                <button class="btn-delete" data-project-id="${p.identificación}">Eliminar</button>
            </div>`).join('')
        : '<p>Aún no tienes proyectos.</p>';
    document.querySelectorAll('.btn-delete[data-project-id]').forEach(button => button.addEventListener('click', handleProjectDelete));
}

projectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const projectImageFile = document.getElementById('project-image').files[0];
    if (!projectImageFile) {
        return showToast('La imagen del proyecto es obligatoria.', 'error');
    }
    const filePath = `images/${user.id}/${Date.now()}`;
    const { error: uploadError } = await supabase.storage.from('images').upload(filePath, projectImageFile);
    if (uploadError) {
        return showToast(`Error subiendo imagen: ${uploadError.message}`, 'error');
    }
    const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);
    
    const newProject = {
        "ID_de_usuario": user.id,
        titulo: document.getElementById('project-title').value,
        descripción: document.getElementById('project-description').value,
        objetivos: document.getElementById('project-objetivo').value,
        solucion: document.getElementById('project-solucion').value,
        tecnologias: selectedTechnologies,
        "URL_de_la_imagen": urlData.publicUrl,
        "URL_en_vivo": document.getElementById('project-live-url').value,
        "código_url": document.getElementById('project-code-url').value,
    };

    const { error: insertError } = await supabase.from('proyectos').insert(newProject);
    if (insertError) {
        showToast(`Error añadiendo proyecto: ${insertError.message}`, 'error');
    } else {
        showToast('¡Proyecto añadido con éxito!', 'success');
        projectForm.reset();
        selectedTechnologies = [];
        renderSelectedTechs();
        loadUserProjects(user.id);
    }
});

async function handleProjectDelete(e) {
    const projectId = e.target.dataset.projectId;
    const confirmed = await showConfirmModal('Eliminar Proyecto', '¿Seguro que quieres eliminar este proyecto? Esta acción no se puede deshacer.');
    if (!confirmed) return;

    const { error } = await supabase.from('proyectos').delete().eq('identificación', projectId);
    if (error) {
        showToast(`Error al eliminar: ${error.message}`, 'error');
    } else { 
        showToast('Proyecto eliminado.', 'success'); 
        loadUserProjects(user.id); 
    }
}

// --- 8. LÓGICA DEL SELECTOR DE TECNOLOGÍAS ---
function setupTechSelector() {
    techSearchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        if (searchTerm.length === 0) {
            techDropdown.innerHTML = '';
            techDropdown.classList.remove('active');
            return;
        }
        const filteredTechs = ALL_TECHNOLOGIES.filter(tech => 
            tech.toLowerCase().includes(searchTerm) && !selectedTechnologies.includes(tech)
        );
        if (filteredTechs.length > 0) {
            techDropdown.innerHTML = filteredTechs.map(tech => `<div class="tech-item" data-tech="${tech}">${tech}</div>`).join('');
            techDropdown.classList.add('active');
        } else {
            techDropdown.innerHTML = '';
            techDropdown.classList.remove('active');
        }
    });
    techDropdown.addEventListener('click', (e) => {
        if (e.target.classList.contains('tech-item')) {
            const tech = e.target.dataset.tech;
            if (!selectedTechnologies.includes(tech)) {
                selectedTechnologies.push(tech);
                renderSelectedTechs();
            }
            techSearchInput.value = '';
            techDropdown.innerHTML = '';
            techDropdown.classList.remove('active');
        }
    });
    selectedTechsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-tag')) {
            const techToRemove = e.target.dataset.tech;
            selectedTechnologies = selectedTechnologies.filter(t => t !== techToRemove);
            renderSelectedTechs();
        }
    });
    document.addEventListener('click', (e) => {
        if (techSearchInput && techDropdown && !techSearchInput.contains(e.target) && !techDropdown.contains(e.target)) {
            techDropdown.classList.remove('active');
        }
    });
}

function renderSelectedTechs() {
    selectedTechsContainer.innerHTML = selectedTechnologies.map(tech => `<span class="tech-tag">${tech}<span class="remove-tag" data-tech="${tech}">×</span></span>`).join('');
}

// --- 9. GESTIÓN DE USUARIOS (Solo Super Admin) ---
function formatTimeAgo(dateString) {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    const now = new Date();
    let seconds = Math.floor((now - date) / 1000);

    if (seconds < 10) return "Ahora mismo";
    if (seconds < 60) return `Hace ${seconds} segundos`;
    let minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes === 1 ? "Hace 1 minuto" : `Hace ${minutes} minutos`;
    let hours = Math.floor(minutes / 60);
    if (hours < 24) return hours === 1 ? "Hace 1 hora" : `Hace ${hours} horas`;
    let days = Math.floor(hours / 24);
    if (days < 30) return days === 1 ? "Hace 1 día" : `Hace ${days} días`;
    let months = Math.floor(days / 30);
    if (months < 12) return months === 1 ? "Hace 1 mes" : `Hace ${months} meses`;
    let years = Math.floor(days / 365);
    return years === 1 ? "Hace 1 año" : `Hace ${years} años`;
}

function renderUsersTable(usersToRender) {
    if (usersToRender.length === 0) {
        usersListContainer.innerHTML = '<p>No se encontraron miembros.</p>';
        return;
    }
    usersListContainer.innerHTML = `
        <table class="admin-users-table">
            <thead>
                <tr><th>Nombre</th><th>Username</th><th>Acciones</th></tr>
            </thead>
            <tbody>
                ${usersToRender.map(u => {
                    if (u.role === 'super_admin') {
                        return `<tr><td>${u.nombre_completo || 'N/A'} (Super Admin)</td><td>${u.nombre_usuario || 'N/A'}</td><td>-</td></tr>`;
                    }
                    return `<tr>
                        <td><a href="#" class="user-name-link" data-user-id="${u.identificación}">${u.nombre_completo || 'N/A'}</a></td>
                        <td>${u.nombre_usuario || 'N/A'}</td>
                        <td><button class="btn-delete" data-user-id="${u.identificación}" data-user-name="${u.nombre_completo || u.nombre_usuario}">Eliminar</button></td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>`;
}

async function fetchAllUsersAndRender() {
    const { data: users, error } = await supabase.from('profiles').select('identificación, nombre_completo, nombre_usuario, role');
    if (error) {
        showToast('Error cargando usuarios.', 'error');
        return;
    }
    allUsersList = users;
    renderUsersTable(allUsersList);
}

function handleUserSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    if (!searchTerm) {
        renderUsersTable(allUsersList);
        return;
    }
    const filteredUsers = allUsersList.filter(user =>
        (user.nombre_completo && user.nombre_completo.toLowerCase().includes(searchTerm)) ||
        (user.nombre_usuario && user.nombre_usuario.toLowerCase().includes(searchTerm))
    );
    renderUsersTable(filteredUsers);
}

function showConfirmModal(title, message) {
    return new Promise((resolve) => {
        confirmTitle.textContent = title;
        confirmMessage.textContent = message;
        showModal(confirmModal);
        const onOk = () => { cleanup(); resolve(true); };
        const onCancel = () => { cleanup(); resolve(false); };
        function cleanup() {
            confirmOkBtn.removeEventListener('click', onOk);
            confirmCancelBtn.removeEventListener('click', onCancel);
            hideModal(confirmModal);
        }
        confirmOkBtn.addEventListener('click', onOk, { once: true });
        confirmCancelBtn.addEventListener('click', onCancel, { once: true });
    });
}

async function handleUsersListClick(e) {
    const target = e.target;
    if (target.matches('.btn-delete[data-user-id]')) {
        e.preventDefault();
        const userIdToDelete = target.dataset.userId;
        const userName = target.dataset.userName;
        const confirmed = await showConfirmModal(`Eliminar a ${userName}`, `¿Estás seguro de que quieres eliminar a este miembro? Se borrará su perfil y todos sus proyectos. Esta acción es irreversible.`);
        if (confirmed) {
            await handleUserDelete(userIdToDelete);
        }
    }
    if (target.matches('.user-name-link')) {
        e.preventDefault();
        const userId = target.dataset.userId;
        await showUserInfoModal(userId);
    }
}

async function showUserInfoModal(userId) {
    showModal(userInfoModal);
    userInfoContent.innerHTML = '<p style="padding: 2rem; text-align: center;">Cargando datos del usuario...</p>';
    try {
        const { data, error } = await supabase.functions.invoke('get-user-details', { body: { userId } });
        if (error || data.error) throw new Error(error?.message || data.error);
        const userDetails = data.user;
        const defaultAvatar = 'https://via.placeholder.com/150';
        userInfoContent.innerHTML = `
            <button class="modal-close-btn">×</button>
            <div class="user-info-header">
                <img src="${userDetails.URL_del_avatar || defaultAvatar}" alt="Avatar de ${userDetails.nombre_completo}" class="user-info-avatar">
                <div class="user-info-name-stack">
                    <h3 class="user-info-name">${userDetails.nombre_completo || 'Sin nombre'}</h3>
                    <p class="user-info-username">@${userDetails.nombre_usuario || 'N/A'}</p>
                </div>
            </div>
            <div class="user-info-body">
                <div class="user-info-stat"><strong>${userDetails.projectsCount}</strong>Proyectos publicados</div>
                <div class="user-info-stat"><strong>${formatTimeAgo(userDetails.last_sign_in_at)}</strong>Último login</div>
            </div>
            <div class="user-info-footer">
                <a href="/profile.html?user=${userDetails.nombre_usuario}" class="btn btn-primary" target="_blank">Ver Perfil Público</a>
            </div>
        `;
    } catch (err) {
        userInfoContent.innerHTML = `<button class="modal-close-btn">×</button><p style="padding: 2rem; text-align: center; color: var(--danger-color);">Error al cargar los datos: ${err.message}</p>`;
    }
}

createUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newUserData = {
        email: document.getElementById('new-user-email').value,
        password: document.getElementById('new-user-password').value,
        username: document.getElementById('new-user-username').value,
        full_name: document.getElementById('new-user-fullname').value
    };
    const { data, error } = await supabase.functions.invoke('create-user', { body: JSON.stringify(newUserData) });
    if (error) {
        showToast(`Error de red: ${error.message}`, 'error');
    } else if (data.error) {
        showToast(`Error en la función: ${data.error}`, 'error');
    } else {
        showToast(`Usuario ${newUserData.email} creado con éxito.`, 'success');
        createUserForm.reset();
        await fetchAllUsersAndRender();
    }
});

async function handleUserDelete(userIdToDelete) {
    const { data, error } = await supabase.functions.invoke('delete-user', { body: JSON.stringify({ userId: userIdToDelete }) });
    if (error || data.error) {
        showToast(`Error eliminando usuario: ${error?.message || data.error}`, 'error');
    } else {
        showToast('Usuario eliminado con éxito.', 'success');
        await fetchAllUsersAndRender();
    }
}

// --- 10. LÓGICA DE CIFRADO Y GESTIÓN DE CREDENCIALES ---
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

async function deriveKey(password, salt) {
    const keyMaterial = await crypto.subtle.importKey('raw', textEncoder.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

async function encrypt(text, masterPassword) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveKey(masterPassword, salt);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedContent = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, textEncoder.encode(text));
    const encryptedBytes = new Uint8Array([...salt, ...iv, ...new Uint8Array(encryptedContent)]);
    return btoa(String.fromCharCode.apply(null, encryptedBytes));
}

async function decrypt(encryptedBase64, masterPassword) {
    const encryptedBytes = new Uint8Array(atob(encryptedBase64).split('').map(c => c.charCodeAt(0)));
    const salt = encryptedBytes.slice(0, 16);
    const iv = encryptedBytes.slice(16, 28);
    const data = encryptedBytes.slice(28);
    const key = await deriveKey(masterPassword, salt);
    const decryptedContent = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, data);
    return textDecoder.decode(decryptedContent);
}

async function handleAddCredential(e) {
    e.preventDefault();
    const appName = document.getElementById('credential-app-name').value;
    const email = document.getElementById('credential-email').value;
    const password = document.getElementById('credential-password').value;
    const masterPassword = credentialMasterPasswordInput.value;

    if (!appName || !password || !masterPassword) {
        return showToast('Todos los campos son obligatorios.', 'error');
    }

    try {
        const encryptedPassword = await encrypt(password, masterPassword);
        const { error } = await supabase.from('credenciales_equipo').insert({
            nombre_aplicacion: appName,
            correo_usuario: email,
            credencial_cifrada: encryptedPassword,
            creado_por: user.id
        });
        if (error) throw error;
        showToast('Credencial guardada de forma segura.', 'success');
        credentialForm.reset();
        if (credentialsList.innerHTML !== '' && !credentialsList.innerHTML.includes('<p>')) {
            handleShowCredentials();
        }
    } catch (error) {
        showToast(`Error al guardar: ${error.message}`, 'error');
    }
}

async function handleShowCredentials() {
    const masterPassword = masterPasswordInput.value;
    if (!masterPassword) {
        showToast('Debes introducir la Contraseña Maestra.', 'error');
        return;
    }

    credentialsList.innerHTML = '<p>Cargando y descifrando credenciales...</p>';
    const { data: credentials, error } = await supabase.from('credenciales_equipo').select('*').order('creado_en');

    if (error) {
        credentialsList.innerHTML = `<p style="color: var(--danger-color)">Error al cargar: ${error.message}</p>`;
        return;
    }

    if (credentials.length === 0) {
        credentialsList.innerHTML = '<p>No hay credenciales guardadas para el equipo.</p>';
        return;
    }

    const decryptedCredentials = [];
    for (const cred of credentials) {
        try {
            const decryptedPass = await decrypt(cred.credencial_cifrada, masterPassword);
            decryptedCredentials.push({ ...cred, decryptedPass });
        } catch (e) {
            credentialsList.innerHTML = `<p style="color: var(--danger-color)">Error al descifrar. ¿Contraseña Maestra incorrecta?</p>`;
            return;
        }
    }
    
    renderDecryptedCredentials(decryptedCredentials, userProfile.role);
}

function renderDecryptedCredentials(credentials, role) {
    if (!credentials || credentials.length === 0) {
        credentialsList.innerHTML = '<p>No hay credenciales para mostrar.</p>';
        return;
    }
    credentialsList.innerHTML = `
        <div class="credentials-grid">
            ${credentials.map(cred => `
                <div class="credential-card" data-credential-id="${cred.id}">
                    <div class="credential-info-wrapper">
                        <div class="app-name">${cred.nombre_aplicacion}</div>
                        <div class="info-field">
                            <label>Usuario/Email</label>
                            <span>${cred.correo_usuario || 'N/A'}</span>
                        </div>
                        <div class="info-field password-field">
                            <label>Contraseña</label>
                            <span class="password-text" data-password="${cred.decryptedPass}">••••••••••••</span>
                        </div>
                    </div>
                    <div class="credential-actions">
                        <button class="btn-credential-action btn-toggle-visibility" title="Mostrar/Ocultar"><i class="fas fa-eye"></i></button>
                        <button class="btn-credential-action btn-copy" title="Copiar"><i class="far fa-copy"></i></button>
                        ${role === 'super_admin' ? `
                            <button class="btn-credential-action btn-delete-credential" title="Eliminar Credencial"><i class="fas fa-trash"></i></button>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

async function handleCredentialListClick(e) {
    const button = e.target.closest('.btn-credential-action');
    if (!button) return;

    const card = button.closest('.credential-card');
    const passwordTextSpan = card.querySelector('.password-text');
    const realPassword = passwordTextSpan.dataset.password;
    
    if (button.classList.contains('btn-copy')) {
        navigator.clipboard.writeText(realPassword).then(() => {
            showToast('Contraseña copiada al portapapeles', 'success');
        }).catch(err => {
            showToast('Error al copiar la contraseña', 'error');
        });
    }

    if (button.classList.contains('btn-toggle-visibility')) {
        const icon = button.querySelector('i');
        if (passwordTextSpan.textContent.includes('•')) {
            passwordTextSpan.textContent = realPassword;
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            passwordTextSpan.textContent = '••••••••••••';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    }

    if (button.classList.contains('btn-delete-credential')) {
        const credentialId = card.dataset.credentialId;
        const appName = card.querySelector('.app-name').textContent;
        const confirmed = await showConfirmModal('Eliminar Credencial', `¿Estás seguro de que quieres eliminar la credencial para "${appName}"? Esta acción es irreversible.`);
        
        if (confirmed) {
            const { error } = await supabase.from('credenciales_equipo').delete().eq('id', credentialId);
            if (error) {
                showToast(`Error al eliminar: ${error.message}`, 'error');
            } else {
                showToast('Credencial eliminada con éxito.', 'success');
                card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.95)';
                setTimeout(() => card.remove(), 300);
            }
        }
    }
}

// --- 11. MODALES, LOGOUT Y EJECUCIÓN INICIAL ---
function showModal(modalElement) {
    modalElement.classList.remove('hidden');
}

function hideModal(modalElement) {
    modalElement.classList.add('hidden');
}

async function logout() {
    await supabase.auth.signOut();
    window.location.replace('/');
}
logoutButton.addEventListener('click', logout);

initializeAdminPanel();