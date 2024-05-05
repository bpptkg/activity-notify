import injectStyle from './inject-style.js';
import openPopup from './open-popup.js';
import openPulse from './open-pulse.js';

injectStyle()
openPopup()
openPulse()

const url = new URL(import.meta.url).searchParams.get("url");
const source = new EventSource(`${atob(url)}/notify`);
source.onmessage = function (event) {
    const data = JSON.parse(event.data);
    const popup = document.getElementById('rsam-popup')
    const pulse = document.getElementById('rsam-pulse')
    const messageEl = document.getElementById('rsam-popup-message')

    if (data.message && (!popup || !pulse)) {
        return alert(data.message)
    }

    if (data.message) {
        if (popup) {
            if (localStorage.getItem('popup') !== 'off') {
                popup.style.display = 'flex'
            }
        }

        if (pulse) {
            pulse.style.display = 'block'
        }

        messageEl.innerHTML = data.message
    } else {
        // popup.style.display = 'none'
        // pulse.style.display = 'none'
        // messageEl.innerHTML = ''
        // localStorage.setItem('popup', 'on')
    }
};
