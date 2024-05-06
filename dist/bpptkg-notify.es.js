function u() {
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
function m() {
  const e = document.createElement("div");
  e.style.display = "none", e.id = "rsam-popup", document.body.appendChild(e);
  const t = document.createElement("div");
  t.classList.add("popup-content");
  const o = document.createElement("span");
  o.textContent = "×", o.classList.add("close-btn"), t.appendChild(o);
  const i = document.createElement("div");
  i.innerHTML = `<svg style="width:50%;height:auto;color: red" data-slot="icon" fill="none" stroke-width="1.5" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"></path>
    </svg>`, t.appendChild(i);
  const n = document.createElement("div");
  n.innerHTML = 'PERINGATAN!!! <br> <div id="rsam-popup-message"></div> <br>', t.appendChild(n), e.appendChild(t), o.addEventListener("click", () => {
    localStorage.setItem("popup", "off"), e.style.display = "none";
  });
}
function f() {
  const e = document.createElement("div");
  e.id = "rsam-pulse", e.style.display = "none", e.innerHTML = '<div class="ringring"></div><div class="circle"></div>', document.body.appendChild(e);
  let t = !1;
  e.addEventListener("mousedown", function(n) {
    var a = n.clientX - parseInt(window.getComputedStyle(this).left), l = n.clientY - parseInt(window.getComputedStyle(this).top);
    function r(c) {
      t = !0, e.style.left = c.clientX - a + "px", e.style.top = c.clientY - l + "px";
    }
    function d() {
      setTimeout(() => {
        t = !1;
      }, 2e3), window.removeEventListener("mousemove", r), window.removeEventListener("mouseup", d);
    }
    window.addEventListener("mousemove", r), window.addEventListener("mouseup", d);
  });
  let o = 0, i = null;
  e.addEventListener("click", function() {
    o++, !i && (i = setTimeout(() => {
      if (o === 1) {
        if (!t) {
          const n = document.getElementById("rsam-popup");
          n && (n.style.display = "flex", localStorage.setItem("popup", "on"));
        }
      } else
        e.style.left = `${window.innerWidth - 70}px`, e.style.top = "0px";
      o = 0, i = null;
    }, 200));
  });
}
u();
m();
f();
let s = 0, p = "";
const g = new URL(import.meta.url).searchParams.get("url"), h = new EventSource(`${atob(g)}/notify`);
h.onmessage = function(e) {
  const { mepas: t, date: o, alertType: i } = JSON.parse(e.data), n = document.getElementById("rsam-popup"), a = document.getElementById("rsam-pulse"), l = document.getElementById("rsam-popup-message");
  n && a && (i ? (p || (p = o), t > s && (s = t), a.style.display = "block", localStorage.getItem("popup") !== "off" && (n.style.display = "flex"), l.innerHTML = i === 1 ? `Nilai RSAM ${s} <br> Waspadai APG > 1KM <br> <span style="font-size:12px;font-weight:normal">${p}</span>` : `Nilai RSAM ${s} <br>Terjadi Gempa VT Kuat <br> <span style="font-size:12px;font-weight:normal">${p}</span>`) : (s = 0, p = "", localStorage.setItem("popup", "on")));
};
