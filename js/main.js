// assets/js/main.js

import Swiper from 'swiper';
import { Navigation, Pagination, Autoplay, EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

import lightGallery from 'lightgallery';
import 'lightgallery/css/lightgallery.css';

import { supabase } from './modules/supabase.js';
import { createProjectSliderCard, createTeamMemberCard } from './modules/ui.js';

// =========================================================
//      VARIABLES Y CONSTANTES GLOBALES
// =========================================================
let allTeamMembers = [];
let teamSwiperInstance = null;

const PROJECTS_TO_SHOW = 10;
const LOGO_LIGHT_THEME = '/img/logo-dark.png';
const LOGO_DARK_THEME = '/img/logo-light.png';

const headerLogo = document.querySelector('#header .logo img');
const themeToggle = document.getElementById('theme-toggle');
const header = document.getElementById('header');
const navMenu = document.getElementById('nav-menu');
const navToggle = document.getElementById('nav-toggle');
const navClose = document.getElementById('nav-close');


// =========================================================
//      LÓGICA DEL TEMA (OSCURO/CLARO) - SE EJECUTA SIEMPRE
// =========================================================

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        if (themeToggle) {
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
        if (headerLogo && headerLogo.src.includes('logo-dark.png') || headerLogo.src.includes('logo-light.png')) {
            headerLogo.src = LOGO_DARK_THEME;
        }
    } else {
        document.body.removeAttribute('data-theme');
        if (themeToggle) {
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
        if (headerLogo && headerLogo.src.includes('logo-dark.png') || headerLogo.src.includes('logo-light.png')) {
            headerLogo.src = LOGO_LIGHT_THEME;
        }
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


// =========================================================
//      LÓGICA COMÚN A TODAS LAS PÁGINAS (HEADER, MENÚ MÓVIL)
// =========================================================

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
//      LÓGICA ESPECÍFICA DE LA PÁGINA DE INICIO (HOME)
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('home-page')) {
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
        if (!phoneContainer.classList.contains('zoomed')) {
            toggleZoom();
        }
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            toggleZoom();
        }
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
        const { data: projects, error: projectsError } = await supabase
            .from('proyectos')
            .select(`*, profiles(nombre_usuario, nombre_completo, URL_del_avatar)`)
            .order('creado_en', { ascending: false })
            .limit(PROJECTS_TO_SHOW);

        if (projectsError) throw projectsError;
        
        renderProjectsSlider(projects);

    } catch (error) {
        console.error('Error al manejar la carga de proyectos:', error.message);
        const container = document.querySelector('#projects-carousel-wrapper');
        if (container) container.innerHTML = `<p class="section-intro">Error al cargar proyectos.</p>`;
    }

    try {
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select(`*`);

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
    if (sliderContainer.swiper) {
        sliderContainer.swiper.destroy(true, true);
    }
    
    new Swiper('.projects-slider-container', {
        modules: [Navigation, Pagination, Autoplay, EffectCoverflow],
        effect: 'coverflow',
        grabCursor: true,
        centeredSlides: true,
        loop: true,
        slidesPerView: 'auto',
        spaceBetween: 60,
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
        },
        coverflowEffect: {
            rotate: 20,
            stretch: 0,
            depth: 150,
            modifier: 1,
            slideShadows: false,
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
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
    if (lgContainer && lgContainer.lg) {
        lgContainer.lg.destroy();
    }

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
        grabCursor: true,
        spaceBetween: 30,
        slidesPerView: 1,
        pagination: { el: '.team-pagination', clickable: true },
        navigation: { nextEl: '.team-next', prevEl: '.team-prev' },
        breakpoints: {
            640: { slidesPerView: 2, spaceBetween: 20 },
            992: { slidesPerView: 3, spaceBetween: 30 },
        },
    });

    if(lgContainer){
        lightGallery(lgContainer, { 
            selector: '.team-card-avatar-link', 
            download: false 
        });
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