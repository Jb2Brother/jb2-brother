// assets/js/profile.js

import lightGallery from 'lightgallery';
import { supabase } from './modules/supabase.js';

let allUserProjects = [];

// --- Carga principal de datos del perfil ---
async function loadUserProfile() {
    const contentContainer = document.getElementById('profile-dynamic-content');
    const loader = document.getElementById('loader');
    const params = new URLSearchParams(window.location.search);
    const username = params.get('user');

    if (!username) {
        contentContainer.innerHTML = `<div class="section container" style="text-align: center;"><h1 class="section-title">Perfil no encontrado</h1><p class="section-intro">No se especificó un usuario en la URL.</p></div>`;
        return;
    }

    try {
        const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('nombre_usuario', username).single();
        if (profileError || !profile) throw new Error('Perfil no encontrado en la base de datos.');
        
        document.title = `${profile.nombre_completo || 'Perfil'} | JB2 Brother`;

        const { data: projects, error: projectsError } = await supabase.from('proyectos').select('*').eq('ID_de_usuario', profile.identificación).order('creado_en', { ascending: false });
        if (projectsError) console.error('Error cargando proyectos:', projectsError);

        allUserProjects = projects || [];
        renderProfilePage(profile, allUserProjects);

    } catch (error) {
        if (loader) loader.remove();
        const errorContainer = document.querySelector('.container') || document.body;
        errorContainer.innerHTML = `<div style="padding: 10rem 2rem; text-align: center;"><h1 class="section-title" style="font-family: var(--font-secondary); color: var(--dark-color);">Error</h1><p style="font-family: monospace; color: var(--text-color); background: var(--light-color); padding: 1rem; border-radius: 8px; display: inline-block;">${error.message}</p></div>`;
    }
}

// --- Renderizado de la página de perfil (MODIFICADO) ---
function renderProfilePage(profile, projects) {
    const contentContainer = document.getElementById('profile-dynamic-content');
    contentContainer.innerHTML = renderAboutSection(profile) + renderSkillsSection(profile);

    const projectsSectionHTML = renderProjectsSection(projects);
    contentContainer.insertAdjacentHTML('beforeend', projectsSectionHTML);
    
    if (projects.length > 0) {
        initializeProfileCarousel();
        setupProjectSearch(); // Configura la nueva lógica de búsqueda
    }
    
    initializeLightGallery();
}

// ========= NUEVA FUNCIÓN PARA CONFIGURAR LA BÚSQUEDA CON DROPDOWN =========
function setupProjectSearch() {
    const searchInput = document.getElementById('project-search-input');
    const resultsContainer = document.getElementById('project-search-results');
    const searchContainer = document.querySelector('.project-search-container');

    if (!searchInput || !resultsContainer || !searchContainer) return;

    // Muestra los resultados al escribir
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        if (searchTerm === '') {
            resultsContainer.innerHTML = '';
            resultsContainer.classList.remove('active');
            return;
        }

        const filteredProjects = allUserProjects.filter(project =>
            project.titulo.toLowerCase().includes(searchTerm)
        );

        if (filteredProjects.length > 0) {
            resultsContainer.innerHTML = filteredProjects.map((project, index) =>
                // Usamos el título del proyecto como un identificador único
                `<div class="result-item" data-project-title="${project.titulo}">${project.titulo}</div>`
            ).join('');
            resultsContainer.classList.add('active');
        } else {
            resultsContainer.innerHTML = '<div class="result-item disabled">No se encontraron resultados</div>';
            resultsContainer.classList.add('active');
        }
    });

    // Navega al proyecto al hacer clic en un resultado
    resultsContainer.addEventListener('click', (e) => {
        const clickedItem = e.target.closest('.result-item');
        if (!clickedItem || clickedItem.classList.contains('disabled')) return;

        const projectTitle = clickedItem.dataset.projectTitle;
        const projectIndex = allUserProjects.findIndex(p => p.titulo === projectTitle);

        if (projectIndex !== -1) {
            // Simulamos un clic en el punto de navegación correspondiente
            const dots = document.querySelectorAll('.carousel-nav-profile .carousel-dot-profile');
            if (dots[projectIndex]) {
                dots[projectIndex].click();
            }
        }

        searchInput.value = '';
        resultsContainer.innerHTML = '';
        resultsContainer.classList.remove('active');
    });
    
    // Oculta el dropdown si se hace clic fuera
    document.addEventListener('click', (e) => {
        if (!searchContainer.contains(e.target)) {
            resultsContainer.classList.remove('active');
        }
    });
}

function renderAboutSection(profile) {
    const avatarUrl = profile.URL_del_avatar || 'https://via.placeholder.com/250';
    return `
        <section id="profile-about" class="section">
            <div class="container">
                <div class="profile-about-grid">
                    <div class="profile-about-visual"><a href="${avatarUrl}" id="profile-avatar-link"><img src="${avatarUrl}" alt="Avatar de ${profile.nombre_completo}" class="profile-main-avatar"></a></div>
                    <div class="profile-about-text">
                        <h1 class="profile-main-name">${profile.nombre_completo || 'Nombre no disponible'}</h1>
                        <p class="profile-main-role">${profile.titulo_profesional || 'Miembro del Equipo'}</p>
                        <p class="profile-main-bio">${profile.biografía || 'Este miembro aún no ha añadido una biografía.'}</p>
                        <div class="profile-socials-horizontal">
                            ${profile.URL_de_github ? `<a href="${profile.URL_de_github}" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><i class="fab fa-github"></i> GitHub</a>` : ''}
                            ${profile.URL_de_LinkedIn ? `<a href="${profile.URL_de_LinkedIn}" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><i class="fab fa-linkedin"></i> LinkedIn</a>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `;
}

function renderSkillsSection(profile) {
    const skills = [
        { icon: 'fa-desktop', title: 'Frontend', text: profile.habilidad_frontend || 'Desarrollo de interfaces interactivas y responsivas.' },
        { icon: 'fa-server', title: 'Backend', text: profile.habilidad_backend || 'Creación de APIs robustas y lógicas de servidor.' },
        { icon: 'fa-database', title: 'Bases de Datos', text: profile.habilidad_db || 'Gestión y modelado de datos eficientes.' },
        { icon: 'fa-tools', title: 'Herramientas', text: profile.habilidad_herramientas || 'Control de versiones, diseño y metodologías ágiles.' },
    ];
    const hasSkills = skills.some(skill => skill.text && skill.text.trim() !== 'Desarrollo de interfaces interactivas y responsivas.' && skill.text.trim() !== 'Creación de APIs robustas y lógicas de servidor.' && skill.text.trim() !== 'Gestión y modelado de datos eficientes.' && skill.text.trim() !== 'Control de versiones, diseño y metodologías ágiles.');
    if (!hasSkills) return '';
    return `
        <section id="profile-skills" class="section bg-light">
            <div class="container"><h2 class="section-title">Habilidades Principales</h2><div class="skills-grid-profile">${skills.filter(s => s.text).map(skill => `<div class="skill-card-profile"><h3><i class="fas ${skill.icon}"></i> ${skill.title}</h3><p>${skill.text}</p></div>`).join('')}</div></div>
        </section>
    `;
}

// ========= RENDERIZADO DE SECCIÓN DE PROYECTOS MODIFICADO (NUEVO LAYOUT) =========
function renderProjectsSection(projects) {
    let content;
    if (projects.length > 0) {
        content = `<div class="carousel-container-profile"><div class="carousel-viewport-profile"><div class="carousel-track-profile">${projects.map(createProjectSlide).join('')}</div></div><div class="carousel-controls-unified-profile"><button class="carousel-btn-profile prev-btn"><i class="fas fa-chevron-left"></i></button><div class="carousel-nav-profile"></div><button class="carousel-btn-profile next-btn"><i class="fas fa-chevron-right"></i></button></div></div>`;
    } else {
        content = '<p class="section-intro">Este miembro aún no ha añadido proyectos.</p>';
    }

    return `
        <section id="profile-projects" class="section section-full-width-profile">
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
            // Esto hace que el punto activo se desplace a la vista automáticamente.
            targetDot.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
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

function initializeLightGallery() {
    const aboutSection = document.getElementById('profile-about');
    if (aboutSection) lightGallery(aboutSection, { selector: '#profile-avatar-link', download: false });
    const projectsSection = document.getElementById('profile-projects');
    if (projectsSection) lightGallery(projectsSection, { selector: '.zoom-link', download: false });
}

document.addEventListener('DOMContentLoaded', loadUserProfile);