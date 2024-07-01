let bebengLastMax = 0
let boyongLastMax = 0
let krasakLastMax = 0
let kubahBdLastMax = 0
let kubahBdAvgLastMax = 0

export default function processThermal({ kubahBd, kubahBdAvg, bebeng, boyong, krasak }) {
  let openPopup = false
  if (bebeng[1] > 20 && bebeng[1] > bebengLastMax) {
    openPopup = true
    bebengLastMax = bebeng[1]
    const messageEl = document.getElementById('bebeng-message')
    messageEl.innerHTML = `Terjadi RF/AP di Sungai Bebeng (Suhu ${bebeng[1]}&deg;) <br> <span style="font-size:12px;font-weight:normal">${bebeng[0]}</span>`
  }

  if (boyong[1] > 20 && boyong[1] > boyongLastMax) {
    openPopup = true
    boyongLastMax = boyong[1]
    const messageEl = document.getElementById('boyong-message')
    messageEl.innerHTML = `Terjadi RF/AP di Sungai Boyong (Suhu ${boyong[1]}&deg;) <br> <span style="font-size:12px;font-weight:normal">${boyong[0]}</span>`
  }

  if (krasak[1] > 20 && krasak[1] > krasakLastMax) {
    openPopup = true
    krasakLastMax = krasak[1]
    const messageEl = document.getElementById('krasak-message')
    messageEl.innerHTML = `Terjadi RF/AP di Sungai Krasak (Suhu ${krasak[1]}&deg;) <br> <span style="font-size:12px;font-weight:normal">${krasak[0]}</span>`
  }

  if ((kubahBd[1] > 100 && kubahBd[1] > kubahBdLastMax) || (kubahBdAvg[1] > 20 && kubahBdAvg[1] > kubahBdAvgLastMax)) {
    openPopup = true
    kubahBdLastMax = kubahBd[1]
    kubahBdAvgLastMax = kubahBdAvg[1]
    const messageEl = document.getElementById('kubah-message')
    messageEl.innerHTML = `Terjadi peningkatan suhu di kubah BD <br> (Suhu Avg ${kubahBdAvg[1]}&deg;, Suhu Max ${kubahBd[1]}&deg;) <br> <span style="font-size:12px;font-weight:normal">${kubahBd[0]}</span>`
  }

  if (openPopup) {
    const popup = document.getElementById('rsam-popup')
    const pulse = document.getElementById('rsam-pulse')

    pulse.style.display = 'block'
    if (localStorage.getItem('popup') !== 'off') {
        popup.style.display = 'flex'
    }
  }
}