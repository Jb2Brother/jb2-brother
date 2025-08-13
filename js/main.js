// js/main.js

import Swiper from 'swiper';
import { Navigation, Pagination, Autoplay, EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

import lightGallery from 'lightgallery';
import 'lightgallery/css/lightgallery.css';

import { supabase } from './modules/supabase.js';

// --- IMPORTACIÓN DE IMÁGENES PARA RUTAS CORRECTAS EN PRODUCCIÓN ---
import logoForLightTheme from '/img/logo-dark.png';
import logoForDarkTheme from '/img/logo-light.png';

// =========================================================
//      VARIABLES Y CONSTANTES GLOBALES
// =========================================================
const headerLogo = document.querySelector('#header .logo img');
const themeToggle = document.getElementById('theme-toggle');
const header = document.getElementById('header');
const navMenu = document.getElementById('nav-menu');
const navToggle = document.getElementById('nav-toggle');
const navClose = document.getElementById('nav-close');

// =========================================================
//      MÓDULO DE UI (FUNCIONES PARA CREAR ELEMENTOS HTML)
// =========================================================

/**
 * Trunca un texto a una longitud máxima sin cortar palabras.
 * @param {string} text - El texto a truncar.
 * @param {number} maxLength - La longitud máxima deseada.
 * @returns {string} - El texto truncado.
 */
function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) {
        return text;
    }
    const truncated = text.substr(0, text.lastIndexOf(' ', maxLength));
    return truncated + '...';
}

/**
 * Crea el HTML para una tarjeta de proyecto en el carrusel de la página de inicio.
 * @param {object} project - El objeto del proyecto que viene de Supabase.
 * @returns {string} - La cadena HTML de la tarjeta.
 */
function createProjectSliderCard(project) {
    const defaultAvatar = 'https://via.placeholder.com/40';
    const author = project.profiles;
    const authorName = author ? author.nombre_completo : 'Anónimo';
    const authorUsername = author ? author.nombre_usuario : '';
    const authorAvatar = author ? (author.URL_del_avatar || defaultAvatar) : defaultAvatar;
    const isCeo = author ? author.is_ceo : false;
    
    const ceoBadgeHTML = isCeo ? '<span class="ceo-badge">CEO</span>' : '';
    const projectDescription = project.objetivos || project.descripción || 'Un proyecto innovador de nuestro equipo.';

    return `
        <div class="swiper-slide">
            <div class="project-slider-card">
                <a href="${project.URL_en_vivo || '#'}" target="_blank" rel="noopener noreferrer" class="project-slider-image-link">
                    <img src="${project.URL_de_la_imagen}" alt="Imagen del proyecto ${project.titulo}" class="project-slider-image" loading="lazy">
                </a>
                <div class="project-slider-info">
                    <h3 class="project-slider-title">${project.titulo}</h3>
                    <p class="project-slider-desc">${truncateText(projectDescription, 80)}</p>
                    <a href="/profile.html?user=${authorUsername}" class="project-author-info">
                        <img src="${authorAvatar}" alt="Avatar de ${authorName}" class="project-author-avatar" loading="lazy">
                        <span class="project-author-name">${authorName}</span>
                        ${ceoBadgeHTML}
                    </a>
                </div>
            </div>
        </div>
    `;
}

/**
 * Crea el HTML para una tarjeta de miembro del equipo.
 * @param {object} profile - El objeto del perfil del usuario que viene de Supabase.
 * @returns {string} - La cadena HTML de la tarjeta.
 */
function createTeamMemberCard(profile) {
    const defaultAvatar = 'https://via.placeholder.com/120';
    const ceoRibbonHTML = profile.is_ceo 
        ? `<div class="ceo-badge-ribbon"><span>CEO</span></div>` 
        : '';
    const bio = profile.biografía || 'Un miembro valioso de nuestro equipo.';
    const truncatedBio = truncateText(bio, 110); // Cortar la biografía

    return `
        <div class="team-card">
            ${ceoRibbonHTML}
            <div class="team-card-header"></div>
            <a href="${profile.URL_del_avatar || defaultAvatar}" class="team-card-avatar-link" data-src="${profile.URL_del_avatar || defaultAvatar}" data-sub-html="<h4>${profile.nombre_completo}</h4><p>${profile.titulo_profesional}</p>">
                <img src="${profile.URL_del_avatar || defaultAvatar}" alt="Avatar de ${profile.nombre_completo}" class="team-card-avatar" loading="lazy">
            </a>
            <div class="team-card-body">
                <h3 class="team-card-name">${profile.nombre_completo}</h3>
                <p class="team-card-title">${profile.titulo_profesional || 'Miembro del Equipo'}</p>
                <p class="team-card-bio">${truncatedBio}</p>
            </div>
            <div class="team-card-footer">
                <a href="/profile.html?user=${profile.nombre_usuario}" class="btn btn-secondary">Ver Perfil</a>
            </div>
        </div>
    `;
}


// =========================================================
//      LÓGICA COMÚN (SE EJECUTA EN TODAS LAS PÁGINAS)
// =========================================================

// --- Lógica del Tema (Oscuro/Claro) ---
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

// Aplicar tema al cargar la página
const currentTheme = localStorage.getItem('theme') || 'light';
applyTheme(currentTheme);

// Event listener para el botón de cambio de tema
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

// --- Lógica del Header y Menú Móvil ---
if (header) {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    }
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    });
}

if (navToggle) {
    navToggle.addEventListener('click', () => {
        if (navMenu) navMenu.classList.add('active');
    });
}

if (navClose) {
    navClose.addEventListener('click', () => {
        if (navMenu) navMenu.classList.remove('active');
    });
}

// =========================================================
//      LÓGICA ESPECÍFICA DE CADA PÁGINA
// =========================================================
document.addEventListener('DOMContentLoaded', () => {

    // --- CÓDIGO SOLO PARA LA PÁGINA DE INICIO ---
    if (document.body.classList.contains('home-page')) {
        
        let allTeamMembers = [];
        let teamSwiperInstance = null;
        const PROJECTS_TO_SHOW = 10;

        // Funciones específicas de la home
        function setupPhoneShowcase() {
            const phoneContainer = document.querySelector('.phone-container');
            const overlay = document.getElementById('phone-zoom-overlay');
            if (!phoneContainer || !overlay) return;
            const originalParent = phoneContainer.parentElement;
            const toggleZoom = () => {
                const isZoomed = phoneContainer.classList.contains('zoomed');
                document.body.classList.toggle('phone-zoomed', !isZoomed);
                overlay.classList.toggle('active', !isZoomed);
                if (isZoomed) {
                    phoneContainer.classList.remove('zoomed');
                    originalParent.appendChild(phoneContainer);
                } else {
                    overlay.appendChild(phoneContainer);
                    phoneContainer.classList.add('zoomed');
                }
            };
            phoneContainer.addEventListener('click', (e) => {
                if (!phoneContainer.classList.contains('zoomed')) toggleZoom();
            });
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) toggleZoom();
            });
        }

        function updatePhoneTime() {
            const timeElement = document.getElementById('phone-time');
            if (!timeElement) return;
            const now = new Date();
            const hours = now.getHours();
            const minutes = String(now.getMinutes()).padStart(2, '0');
            timeElement.textContent = `${hours}:${minutes}`;
        }

        async function loadHomepageContent() {
            try {
                // Ahora pedimos explícitamente la columna 'is_ceo' del perfil relacionado
                const { data: projects, error: projectsError } = await supabase
                    .from('proyectos').select(`*, profiles(nombre_usuario, nombre_completo, URL_del_avatar, is_ceo)`)
                    .order('creado_en', { ascending: false }).limit(PROJECTS_TO_SHOW);
                if (projectsError) throw projectsError;
                renderProjectsSlider(projects);
            } catch (error) {
                console.error('Error al manejar la carga de proyectos:', error.message);
                const container = document.querySelector('#projects-carousel-wrapper');
                if (container) container.innerHTML = `<p class="section-intro">Error al cargar proyectos.</p>`;
            }

            try {
                const { data: profiles, error: profilesError } = await supabase.from('profiles').select(`*`);
                if (profilesError) throw profilesError;
                allTeamMembers = profiles.filter(profile => profile.role !== 'super_admin');
                renderTeamCarousel(allTeamMembers);
            } catch (error) {
                console.error('Error fetching profiles:', error.message);
            }
        }

        function renderProjectsSlider(projects) {
            const container = document.querySelector('#projects-carousel-wrapper');
            if (!container) return;
            if (projects.length === 0) {
                container.innerHTML = `<p class="section-intro">Aún no hay proyectos para mostrar.</p>`;
                const sliderContainer = document.querySelector('.projects-slider-container');
                if(sliderContainer) sliderContainer.style.display = 'none';
                return;
            }
            const sliderContainerVisible = document.querySelector('.projects-slider-container');
            if(sliderContainerVisible) sliderContainerVisible.style.display = 'block';
            container.innerHTML = projects.map(createProjectSliderCard).join('');
            const sliderContainer = document.querySelector('.projects-slider-container');
            if (sliderContainer.swiper) sliderContainer.swiper.destroy(true, true);
            new Swiper('.projects-slider-container', {
                modules: [Navigation, Pagination, Autoplay, EffectCoverflow],
                effect: 'coverflow', grabCursor: true, centeredSlides: true, loop: projects.length > 2,
                slidesPerView: 'auto', spaceBetween: 60,
                autoplay: { delay: 5000, disableOnInteraction: false },
                coverflowEffect: { rotate: 20, stretch: 0, depth: 150, modifier: 1, slideShadows: false },
                pagination: { el: '.swiper-pagination', clickable: true },
                navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
            });
        }
        
        function renderTeamCarousel(membersToRender) {
            const container = document.querySelector('#team-container');
            if (!container) return;
            if (teamSwiperInstance) {
                teamSwiperInstance.destroy(true, true);
                teamSwiperInstance = null;
            }
            const lgContainer = document.querySelector('#team');
            if (lgContainer && lgContainer.lg) lgContainer.lg.destroy();
            const prevButton = document.querySelector('.team-prev');
            const nextButton = document.querySelector('.team-next');
            const pagination = document.querySelector('.team-pagination');
            if (membersToRender.length === 0) {
                container.innerHTML = `<p class="section-intro" style="margin-top: 2rem;">No se encontraron miembros con ese nombre.</p>`;
                if(prevButton) prevButton.style.display = 'none';
                if(nextButton) nextButton.style.display = 'none';
                if(pagination) pagination.style.display = 'none';
                return;
            }
            if(prevButton) prevButton.style.display = 'flex';
            if(nextButton) nextButton.style.display = 'flex';
            if(pagination) pagination.style.display = 'block';
            container.innerHTML = membersToRender.map(profile => `<div class="swiper-slide">${createTeamMemberCard(profile)}</div>`).join('');
            teamSwiperInstance = new Swiper('.team-carousel', {
                modules: [Navigation, Pagination],
                loop: membersToRender.length > 3,
                grabCursor: true, spaceBetween: 30, slidesPerView: 1,
                pagination: { el: '.team-pagination', clickable: true },
                navigation: { nextEl: '.team-next', prevEl: '.team-prev' },
                breakpoints: { 640: { slidesPerView: 2, spaceBetween: 20 }, 992: { slidesPerView: 3, spaceBetween: 30 } },
            });
            if(lgContainer){
                lightGallery(lgContainer, { selector: '.team-card-avatar-link', download: false });
            }
        }
        
        function handleTeamSearch(event) {
            const searchTerm = event.target.value.toLowerCase().trim();
            const filteredMembers = allTeamMembers.filter(member => member.nombre_completo && member.nombre_completo.toLowerCase().includes(searchTerm));
            renderTeamCarousel(filteredMembers);
        }
        
        function setupRealtimeChanges() {
            supabase.channel('public-changes')
              .on('postgres_changes', { event: '*', schema: 'public', table: 'proyectos' }, loadHomepageContent)
              .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, loadHomepageContent)
              .subscribe();
        }

        // Ejecución del código de la home
        loadHomepageContent();
        setupRealtimeChanges();
        const searchInput = document.getElementById('team-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', handleTeamSearch);
        }
        setupPhoneShowcase();
        updatePhoneTime();
        setInterval(updatePhoneTime, 60000);
    }
});