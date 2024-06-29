import injectStyle from './inject-style.js';
import openPopup from './open-popup.js';
import openPulse from './open-pulse.js';
import processThermal from './process-thermal.js';

injectStyle()
openPopup()
openPulse()

let highMepas = 0
let firstEventDate = ''

const url = new URL(import.meta.url).searchParams.get("url");
const source = new EventSource(`${atob(url)}/notify`);
source.onmessage = function (event) {
    const { mepas, date, alertType, kubahBd, kubahBdMax, bebeng, boyong, krasak } = JSON.parse(event.data);
    const popup = document.getElementById('rsam-popup')
    const pulse = document.getElementById('rsam-pulse')
    const messageEl = document.getElementById('rsam-popup-message')

    if (!(popup && pulse)) {
        return
    }

    processThermal({kubahBd, kubahBdMax, bebeng, boyong, krasak})

    if (alertType) {
        if (!firstEventDate) {
            firstEventDate = date
        }

        if (mepas > highMepas) {
            highMepas = mepas
        }

        pulse.style.display = 'block'
        if (localStorage.getItem('popup') !== 'off') {
            popup.style.display = 'flex'
        }

        messageEl.innerHTML = alertType === 1
            ? `Nilai RSAM ${highMepas} <br> Waspadai APG > 1KM <br> <span style="font-size:12px;font-weight:normal">${firstEventDate}</span>`
            : `Nilai RSAM ${highMepas} <br>Terjadi Gempa VT Kuat <br> <span style="font-size:12px;font-weight:normal">${firstEventDate}</span>`
    } else {
        highMepas = 0
        firstEventDate = ''
        localStorage.setItem('popup', 'on')
    }
};
