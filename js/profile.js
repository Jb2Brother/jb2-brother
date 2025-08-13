// js/profile.js
import { supabase } from './modules/supabase.js';
import lightGallery from 'lightgallery';

// NOTA: Se ha eliminado la importación de jsPDF

let allUserProjects = []; // Variable global para los proyectos del usuario

// --- Carga principal de datos del perfil ---
async function loadUserProfile() {
    const contentContainer = document.getElementById('profile-dynamic-content');
    const loader = document.getElementById('loader');
    const params = new URLSearchParams(window.location.search);
    const username = params.get('user');

    if (!username) {
        contentContainer.innerHTML = `<div class="section container" style="text-align: center;"><h1 class="section-title">Perfil no encontrado</h1><p class="section-intro">No se especificó un usuario en la URL.</p></div>`;
        if(loader) loader.remove();
        return;
    }

    try {
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*, proyectos(*)')
            .eq('nombre_usuario', username)
            .order('creado_en', { foreignTable: 'proyectos', ascending: false })
            .single();

        if (profileError || !profile) {
            throw new Error('Perfil no encontrado en la base de datos.');
        }
        
        document.title = `${profile.nombre_completo || 'Perfil'} | JB2 Brother`;
        allUserProjects = profile.proyectos || [];
        
        renderProfilePage(profile, allUserProjects);

    } catch (error) {
        const errorContainer = document.querySelector('#profile-dynamic-content') || document.body;
        errorContainer.innerHTML = `<div style="padding: 10rem 2rem; text-align: center;"><h1 class="section-title" style="font-family: var(--font-secondary); color: var(--dark-color);">Error</h1><p style="font-family: monospace; color: var(--text-color); background: var(--light-color); padding: 1rem; border-radius: 8px; display: inline-block;">${error.message}</p></div>`;
    } finally {
        if(loader) loader.remove();
    }
}

// --- Renderizado de la página de perfil ---
function renderProfilePage(profile, projects) {
    const contentContainer = document.getElementById('profile-dynamic-content');
    
    contentContainer.innerHTML = renderPresentationSection(profile) + renderProjectsSection(projects);
    
    // NOTA: El listener para el botón de descarga se ha eliminado.

    if (projects.length > 0) {
        initializeProfileCarousel();
        setupProjectSearch();
    }
    
    initializeLightGallery();
}

// --- SECCIÓN DE PRESENTACIÓN ---
function renderPresentationSection(profile) {
    const avatarUrl = profile.URL_del_avatar || 'https://via.placeholder.com/250';
    const isCeoBadge = profile.is_ceo ? '<span class="ceo-badge">CEO</span>' : '';
    const technologies = [
        profile.habilidad_frontend, 
        profile.habilidad_backend, 
        profile.habilidad_db, 
        profile.habilidad_herramientas
    ].filter(Boolean);

    return `
        <section id="profile-presentation" class="section">
            <div class="container">
                <div class="presentation-grid">
                    <div class="presentation-visual">
                        <a href="${avatarUrl}" id="profile-avatar-link">
                            <img src="${avatarUrl}" alt="Avatar de ${profile.nombre_completo}" class="presentation-avatar">
                        </a>
                        <!-- BOTÓN DE DESCARGAR CV ELIMINADO -->
                    </div>
                    <div class="presentation-text">
                        <div class="name-container">
                            <h1 class="presentation-name">${profile.nombre_completo || 'Nombre no disponible'}</h1>
                            ${isCeoBadge}
                        </div>
                        <p class="presentation-title">${profile.titulo_profesional || 'Miembro del Equipo'}</p>
                        <div class="presentation-stats">
                            ${profile.nacionalidad ? `<span><i class="fas fa-flag"></i> ${profile.nacionalidad}</span>` : ''}
                            ${profile.años_de_experiencia ? `<span><i class="fas fa-briefcase"></i> +${profile.años_de_experiencia} años de exp.</span>` : ''}
                        </div>
                        <p class="presentation-bio">${profile.biografía || 'Este miembro aún no ha añadido una biografía.'}</p>
                        <div class="presentation-skills">
                            <h3 class="skills-title">Tecnologías Principales</h3>
                            <div class="skills-tags-container">
                                ${technologies.length > 0 ? technologies.map(tech => `<span class="skill-tag-presentation">${tech}</span>`).join('') : '<span>No especificadas</span>'}
                            </div>
                        </div>
                        <div class="presentation-socials">
                            ${profile.URL_de_github ? `<a href="${profile.URL_de_github}" target="_blank" rel="noopener noreferrer" class="social-link-presentation"><i class="fab fa-github"></i> GitHub</a>` : ''}
                            ${profile.URL_de_LinkedIn ? `<a href="${profile.URL_de_LinkedIn}" target="_blank" rel="noopener noreferrer" class="social-link-presentation"><i class="fab fa-linkedin"></i> LinkedIn</a>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `;
}

// --- SECCIÓN DE PROYECTOS (CARRUSEL ORIGINAL) ---
function renderProjectsSection(projects) {
    let content;
    if (projects.length > 0) {
        content = `<div class="carousel-container-profile"><div class="carousel-viewport-profile"><div class="carousel-track-profile">${projects.map(createProjectSlide).join('')}</div></div><div class="carousel-controls-unified-profile"><button class="carousel-btn-profile prev-btn"><i class="fas fa-chevron-left"></i></button><div class="carousel-nav-profile"></div><button class="carousel-btn-profile next-btn"><i class="fas fa-chevron-right"></i></button></div></div>`;
    } else {
        content = '<p class="section-intro">Este miembro aún no ha añadido proyectos.</p>';
    }

    return `
        <section id="profile-projects" class="section section-full-width-profile bg-light">
            <div class="container">
                <div class="projects-header-controls">
                    <h2 class="section-title" style="text-align: left; margin-bottom: 0;">Proyectos Destacados</h2>
                    <div class="project-search-container">
                        <i class="fas fa-search"></i>
                        <input type="text" id="project-search-input" placeholder="Buscar por nombre de proyecto...">
                        <div id="project-search-results" class="project-search-results"></div>
                    </div>
                </div>
            </div>
            ${content}
        </section>
    `;
}

function createProjectSlide(project) {
    const imageUrl = project.URL_de_la_imagen || 'https://via.placeholder.com/800x600.png?text=Proyecto';
    const technologiesHTML = project.tecnologias && project.tecnologias.length > 0 ? `<strong>Tecnologías:</strong> ${project.tecnologias.join(', ')}` : '';
    return `<div class="project-slide-profile"><div class="project-image-column-profile"><a href="${imageUrl}" class="zoom-link" aria-label="Ampliar imagen del proyecto ${project.titulo}"><img src="${imageUrl}" alt="Imagen del proyecto ${project.titulo}"><div class="zoom-overlay-profile"><i class="fas fa-search-plus"></i></div></a></div><div class="project-text-column-profile"><div class="project-info-profile"><h3>${project.titulo}</h3><p class="project-description-final"><strong>El Objetivo:</strong> ${project.objetivos || project.descripción || 'Objetivo no detallado.'}</p><p class="project-takeaway-final"><strong>Mi Solución:</strong> ${project.solucion || 'Solución no detallada.'}</p><div class="project-tech-final">${technologiesHTML}</div><div class="project-links-profile">${project.código_url ? `<a href="${project.código_url}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary"><i class="fab fa-github"></i> Ver Código</a>` : ''}${project.URL_en_vivo ? `<a href="${project.URL_en_vivo}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Ver Demo</a>` : ''}</div></div></div></div>`;
}

// --- LÓGICA DEL CARRUSEL Y BÚSQUEDA ---
function setupProjectSearch() {
    const searchInput = document.getElementById('project-search-input');
    const resultsContainer = document.getElementById('project-search-results');
    const searchContainer = document.querySelector('.project-search-container');
    if (!searchInput || !resultsContainer || !searchContainer) return;
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        if (searchTerm === '') {
            resultsContainer.innerHTML = '';
            resultsContainer.classList.remove('active');
            return;
        }
        const filteredProjects = allUserProjects.filter(p => p.titulo.toLowerCase().includes(searchTerm));
        if (filteredProjects.length > 0) {
            resultsContainer.innerHTML = filteredProjects.map(p => `<div class="result-item" data-project-title="${p.titulo}">${p.titulo}</div>`).join('');
            resultsContainer.classList.add('active');
        } else {
            resultsContainer.innerHTML = '<div class="result-item disabled">No se encontraron resultados</div>';
            resultsContainer.classList.add('active');
        }
    });
    resultsContainer.addEventListener('click', (e) => {
        const clickedItem = e.target.closest('.result-item');
        if (!clickedItem || clickedItem.classList.contains('disabled')) return;
        const projectTitle = clickedItem.dataset.projectTitle;
        const projectIndex = allUserProjects.findIndex(p => p.titulo === projectTitle);
        if (projectIndex !== -1) {
            const dots = document.querySelectorAll('.carousel-nav-profile .carousel-dot-profile');
            if (dots[projectIndex]) dots[projectIndex].click();
        }
        searchInput.value = '';
        resultsContainer.innerHTML = '';
        resultsContainer.classList.remove('active');
    });
    document.addEventListener('click', (e) => {
        if (!searchContainer.contains(e.target)) resultsContainer.classList.remove('active');
    });
}

function initializeProfileCarousel() {
    const track = document.querySelector('.carousel-track-profile');
    if (!track) return;
    const slides = Array.from(track.children);
    if (slides.length === 0) return;
    const nextButton = document.querySelector('.carousel-controls-unified-profile .next-btn');
    const prevButton = document.querySelector('.carousel-controls-unified-profile .prev-btn');
    const dotsNav = document.querySelector('.carousel-nav-profile');
    dotsNav.innerHTML = '';
    if (slides.length <= 1) {
        if (nextButton && nextButton.parentElement) nextButton.parentElement.style.display = 'none';
        return;
    } else {
        if (nextButton && nextButton.parentElement) nextButton.parentElement.style.display = 'flex';
    }
    slides.forEach(() => dotsNav.insertAdjacentHTML('beforeend', '<button class="carousel-dot-profile"></button>'));
    const dots = Array.from(dotsNav.children);
    const slideWidth = slides[0].getBoundingClientRect().width;
    const setSlidePosition = (slide, index) => { slide.style.left = slideWidth * index + 'px'; };
    slides.forEach(setSlidePosition);
    let currentIndex = 0;
    const moveToSlide = (targetIndex) => {
        const targetSlide = slides[targetIndex];
        if (!targetSlide) return;
        track.style.transform = `translateX(-${targetSlide.style.left})`;
        const currentDot = dotsNav.querySelector('.current-slide');
        if (currentDot) currentDot.classList.remove('current-slide');
        const targetDot = dots[targetIndex];
        if (targetDot) {
            targetDot.classList.add('current-slide');
            targetDot.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
        currentIndex = targetIndex;
    };
    moveToSlide(0);
    nextButton.addEventListener('click', () => moveToSlide((currentIndex + 1) % slides.length));
    prevButton.addEventListener('click', () => moveToSlide((currentIndex - 1 + slides.length) % slides.length));
    dotsNav.addEventListener('click', e => {
        const targetDot = e.target.closest('.carousel-dot-profile');
        if (!targetDot) return;
        const targetIndex = dots.findIndex(dot => dot === targetDot);
        moveToSlide(targetIndex);
    });
}

// --- TODA LA LÓGICA DE GENERACIÓN DE PDF SE HA ELIMINADO ---

// --- INICIALIZACIÓN DE LIGHTGALLERY ---
function initializeLightGallery() {
    const presentationSection = document.getElementById('profile-presentation');
    if (presentationSection) {
        lightGallery(presentationSection, { selector: '#profile-avatar-link', download: false });
    }
    const projectsSection = document.getElementById('profile-projects');
    if (projectsSection) {
        lightGallery(projectsSection, { selector: '.zoom-link', download: false });
    }
}

document.addEventListener('DOMContentLoaded', loadUserProfile);