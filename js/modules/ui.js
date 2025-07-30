// assets/js/modules/ui.js

/**
 * Crea el HTML para una tarjeta de proyecto en el carrusel del home.
 */
export function createProjectSliderCard(project) {
    const imageUrl = project.URL_de_la_imagen || 'https://via.placeholder.com/420x300.png?text=Proyecto';
    const projectUrl = project.URL_en_vivo || '#';
    const authorName = project.profiles?.nombre_completo || 'Miembro del Equipo';
    const authorUsername = project.profiles?.nombre_usuario || '#';
    const authorAvatar = project.profiles?.URL_del_avatar || 'https://via.placeholder.com/40';

    return `
        <div class="swiper-slide">
            <div class="project-slider-card">
                <a href="${projectUrl}" target="_blank" rel="noopener noreferrer" class="project-slider-image-link" title="Ver proyecto: ${project.titulo}">
                    <img src="${imageUrl}" alt="Imagen del proyecto ${project.titulo}" class="project-slider-image">
                </a>
                <div class="project-slider-info">
                    <h3 class="project-slider-title">${project.titulo}</h3>
                    <a href="profile.html?user=${authorUsername}" class="project-author-info" title="Ver perfil de ${authorName}">
                        <img src="${authorAvatar}" alt="Avatar de ${authorName}" class="project-author-avatar">
                        <span class="project-author-name">${authorName}</span>
                    </a>
                </div>
            </div>
        </div>
    `;
}


/**
 * ==================================================================
 *  TARJETA DE MIEMBRO DEL EQUIPO - VERSIÓN FINAL CORREGIDA
 * ==================================================================
 * Crea el HTML para la tarjeta de un miembro del equipo con un diseño profesional y funcional.
 * @param {object} profile - El objeto del perfil desde Supabase.
 * @returns {string} - El string HTML de la tarjeta del miembro.
 */
export function createTeamMemberCard(profile) {
    const avatarUrl = profile.URL_del_avatar || 'https://via.placeholder.com/120';
    const profileUrl = `profile.html?user=${profile.nombre_usuario}`;
    
    let bioSnippet = profile.biografía || 'Miembro apasionado por la tecnología y la innovación.';
    if (bioSnippet.length > 75) {
        bioSnippet = bioSnippet.substring(0, 75) + '...';
    }

    const socialLinksHTML = `
        ${profile.URL_de_github ? `<a href="${profile.URL_de_github}" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><i class="fab fa-github"></i></a>` : ''}
        ${profile.URL_de_LinkedIn ? `<a href="${profile.URL_de_LinkedIn}" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><i class="fab fa-linkedin"></i></a>` : ''}
    `.trim();

    return `
        <div class="team-card">
            <div class="team-card-header"></div>
            
            <!-- ===== LA CORRECCIÓN ESTÁ AQUÍ ===== -->
            <!-- El href ahora apunta a la IMAGEN para que lightGallery funcione -->
            <a href="${avatarUrl}" class="team-card-avatar-link">
                <img src="${avatarUrl}" alt="Avatar de ${profile.nombre_completo}" class="team-card-avatar">
            </a>

            <div class="team-card-body">
                <h3 class="team-card-name">${profile.nombre_completo}</h3>
                <p class="team-card-title">${profile.titulo_profesional || 'Miembro del Equipo'}</p>
                <p class="team-card-bio">${bioSnippet}</p>
            </div>
            <div class="team-card-footer">
                ${socialLinksHTML ? `<div class="team-card-socials">${socialLinksHTML}</div>` : ''}
                <a href="${profileUrl}" class="btn btn-secondary">Ver Perfil</a>
            </div>
        </div>
    `;
}


/**
 * Crea el HTML para una tarjeta de proyecto individual (para la página de perfil).
 */
export const createProjectCard = (project) => {
    const imageUrl = project.URL_de_la_imagen || 'https://via.placeholder.com/400x220';
    const liveUrl = project.URL_en_vivo; 
    const codeUrl = project.código_url;

    return `
        <div class="project-card">
            <a href="${imageUrl}" class="project-card-image-link" data-src="${imageUrl}" title="${project.titulo}">
                <img src="${imageUrl}" alt="Imagen del proyecto ${project.titulo}" class="project-card-image">
            </a>
            <div class="project-card-content">
                <h3 class="project-card-title">${project.titulo}</h3>
                <p class="project-card-description">${project.descripción || 'No hay descripción disponible.'}</p>
                <div class="project-card-links">
                    ${liveUrl ? `<a href="${liveUrl}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">Ver Demo</a>` : ''}
                    ${codeUrl ? `<a href="${codeUrl}" class="btn btn-secondary" target="_blank" rel="noopener noreferrer">Ver Código</a>` : ''}
                </div>
            </div>
        </div>
    `;
};


/**
 * Muestra una notificación toast.
 */
export function showToast(message, type = 'success', duration = 5000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const iconClass = type === 'success' ? 'fas fa-check-circle' : 'fas fa-times-circle';
    toast.innerHTML = `<i class="${iconClass}"></i><p>${message}</p>`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('show'); }, 10);
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, duration);
}