import { supabase } from './supabase.js';
import { showToast } from './ui.js';

const loginForm = document.querySelector('#login-form');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm.email.value;
        const password = loginForm.password.value;

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            showToast('Error: ' + error.message, 'error');
        } else {
            window.location.href = '/admin.html';
        }
    });
}

export const checkUserSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
};

export const getCurrentUserProfile = async () => {
    const session = await checkUserSession();
    if (!session) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

    if (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
    return data;
};

export const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        showToast('Error al cerrar sesión', 'error');
    } else {
        window.location.href = '/login.html';
    }
};

const logoutButton = document.querySelector('#logout-button');
if (logoutButton) {
    logoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
}