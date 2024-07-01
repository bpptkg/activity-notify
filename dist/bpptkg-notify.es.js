function b() {
  const e = document.createElement("style");
  document.head.appendChild(e), e.innerHTML = `
      #rsam-popup {
        position: fixed;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        justify-content: center;
        align-items: center;
      }
      #rsam-popup .popup-content {
        padding: 20px;
        background-color: #fdfbfd;
        width: 300px;
        border-radius: 20px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        text-align: center;
        font-size: 18px;
        font-family: sans-serif;
        font-weight: bold;
      }
      #rsam-popup .close-btn {
        float: right;
        font-size: 24px;
        cursor: pointer;
        line-height: 0;
      }

      #rsam-pulse {
          position: fixed;
          left: calc(100% - 70px);
          top: 0;
          cursor: pointer;
          z-index: 1050;
      }
      
      #rsam-pulse .circle {
          width: 15px;
          height: 15px;
          background-color: red;
          border-radius: 50%;
          position: absolute;
          top: 20px;
          left: 20px;
      }
      
      #rsam-pulse .ringring {
          border: 3px solid red;
          -webkit-border-radius: 30px;
          height: 25px;
          width: 25px;
          position: absolute;
          left: 15px;
          top: 15px;
          -webkit-animation: pulsate 1s ease-out;
          -webkit-animation-iteration-count: infinite; 
          opacity: 0.0
      }
      @-webkit-keyframes pulsate {
          0% {-webkit-transform: scale(0.1, 0.1); opacity: 0.0;}
          50% {opacity: 1.0;}
          100% {-webkit-transform: scale(1.2, 1.2); opacity: 0.0;}
      }
    `;
}
function v() {
  const e = document.createElement("div");
  e.style.display = "none", e.id = "rsam-popup", document.body.appendChild(e);
  const t = document.createElement("div");
  t.classList.add("popup-content");
  const n = document.createElement("span");
  n.textContent = "×", n.classList.add("close-btn"), t.appendChild(n);
  const s = document.createElement("div");
  s.innerHTML = `<svg style="width:50%;height:auto;color: red" data-slot="icon" fill="none" stroke-width="1.5" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"></path>
    </svg>`, t.appendChild(s);
  const o = document.createElement("div");
  o.innerHTML = `<div style="margin-bottom:8px">PERINGATAN!!!</div> 
        <div style="margin-bottom:12px;font-size:15px" id="rsam-popup-message"></div> 
        <div style="margin-bottom:5px;font-size:14px" id="kubah-message"></div> 
        <div style="margin-bottom:5px;font-size:14px" id="bebeng-message"></div> 
        <div style="margin-bottom:5px;font-size:14px" id="boyong-message"></div> 
        <div style="margin-bottom:5px;font-size:14px" id="krasak-message"></div> 
    <br>`, t.appendChild(o), e.appendChild(t), n.addEventListener("click", () => {
    localStorage.setItem("popup", "off"), e.style.display = "none";
  });
}
function w() {
  const e = document.createElement("div");
  e.id = "rsam-pulse", e.style.display = "none", e.innerHTML = '<div class="ringring"></div><div class="circle"></div>', document.body.appendChild(e);
  let t = !1;
  e.addEventListener("mousedown", function(o) {
    var a = o.clientX - parseInt(window.getComputedStyle(this).left), i = o.clientY - parseInt(window.getComputedStyle(this).top);
    function p(l) {
      t = !0, e.style.left = l.clientX - a + "px", e.style.top = l.clientY - i + "px";
    }
    function u() {
      setTimeout(() => {
        t = !1;
      }, 2e3), window.removeEventListener("mousemove", p), window.removeEventListener("mouseup", u);
    }
    window.addEventListener("mousemove", p), window.addEventListener("mouseup", u);
  });
  let n = 0, s = null;
  e.addEventListener("click", function() {
    n++, !s && (s = setTimeout(() => {
      if (n === 1) {
        if (!t) {
          const o = document.getElementById("rsam-popup");
          o && (o.style.display = "flex", localStorage.setItem("popup", "on"));
        }
      } else
        e.style.left = `${window.innerWidth - 70}px`, e.style.top = "0px";
      n = 0, s = null;
    }, 200));
  });
}
let c = 0, f = 0, g = 0, y = 0, x = 0;
function E({ kubahBd: e, kubahBdAvg: t, bebeng: n, boyong: s, krasak: o }) {
  let a = !1;
  if (n[1] > 20 && n[1] > c) {
    a = !0, c = n[1];
    const i = document.getElementById("bebeng-message");
    i.innerHTML = `Terjadi RF/AP di Sungai Bebeng (Suhu ${n[1]}&deg;) <br> <span style="font-size:12px;font-weight:normal">${n[0]}</span>`;
  }
  if (s[1] > 20 && s[1] > f) {
    a = !0, f = s[1];
    const i = document.getElementById("boyong-message");
    i.innerHTML = `Terjadi RF/AP di Sungai Boyong (Suhu ${s[1]}&deg;) <br> <span style="font-size:12px;font-weight:normal">${s[0]}</span>`;
  }
  if (o[1] > 20 && o[1] > g) {
    a = !0, g = o[1];
    const i = document.getElementById("krasak-message");
    i.innerHTML = `Terjadi RF/AP di Sungai Krasak (Suhu ${o[1]}&deg;) <br> <span style="font-size:12px;font-weight:normal">${o[0]}</span>`;
  }
  if (e[1] > 100 && e[1] > y || t[1] > 20 && t[1] > x) {
    a = !0, y = e[1], x = t[1];
    const i = document.getElementById("kubah-message");
    i.innerHTML = `Terjadi peningkatan suhu di kubah BD <br> (Suhu Avg ${t[1]}&deg;, Suhu Max ${e[1]}&deg;) <br> <span style="font-size:12px;font-weight:normal">${e[0]}</span>`;
  }
  if (a) {
    const i = document.getElementById("rsam-popup"), p = document.getElementById("rsam-pulse");
    p.style.display = "block", localStorage.getItem("popup") !== "off" && (i.style.display = "flex");
  }
}
b();
v();
w();
let r = 0, d = "";
const L = new URL(import.meta.url).searchParams.get("url"), M = new EventSource(`${atob(L)}/notify`);
M.onmessage = function(e) {
  const { mepas: t, date: n, alertType: s, kubahBd: o, kubahBdMax: a, bebeng: i, boyong: p, krasak: u } = JSON.parse(e.data), l = document.getElementById("rsam-popup"), m = document.getElementById("rsam-pulse"), h = document.getElementById("rsam-popup-message");
  l && m && (E({ kubahBd: o, kubahBdMax: a, bebeng: i, boyong: p, krasak: u }), s ? (d || (d = n), t > r && (r = t), m.style.display = "block", localStorage.getItem("popup") !== "off" && (l.style.display = "flex"), h.innerHTML = s === 1 ? `Nilai RSAM ${r} <br> Waspadai APG > 1KM <br> <span style="font-size:12px;font-weight:normal">${d}</span>` : `Nilai RSAM ${r} <br>Terjadi Gempa VT Kuat <br> <span style="font-size:12px;font-weight:normal">${d}</span>`) : (r = 0, d = "", localStorage.setItem("popup", "on")));
};
