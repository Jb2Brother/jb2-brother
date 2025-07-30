// CÓDIGO COMPLETO DE contact.js MODIFICADO
import { showToast } from './modules/ui.js';

document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;

    const submitButton = contactForm.querySelector('button[type="submit"]');

    async function handleSubmit(event) {
        event.preventDefault();
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Enviando...';

        const formData = new FormData(event.target);
        
        try {
            const response = await fetch(event.target.action, {
                method: contactForm.method,
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                showToast('¡Mensaje enviado con éxito! Nos pondremos en contacto pronto.');
                contactForm.reset();
            } else {
                const data = await response.json();
                if (Object.hasOwn(data, 'errors')) {
                    const errorMessage = data["errors"].map(error => error["message"]).join(", ");
                    throw new Error(errorMessage);
                } else {
                    throw new Error('Hubo un problema al enviar el formulario.');
                }
            }
        } catch (error) {
            console.error('Error al enviar el formulario:', error);
            showToast('Error: ' + error.message, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    }

    contactForm.addEventListener("submit", handleSubmit);
});