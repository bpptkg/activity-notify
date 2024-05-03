export default function openPulse() {
    // Create the popup container
    const pulseContainer = document.createElement('div');
    pulseContainer.id = 'rsam-pulse';
    pulseContainer.style.display = 'none';
    pulseContainer.innerHTML = `<div class="ringring"></div><div class="circle"></div>`
    document.body.appendChild(pulseContainer);

    let moving = false
    pulseContainer.addEventListener('mousedown', function (e) {
        var offsetX = e.clientX - parseInt(window.getComputedStyle(this).left);
        var offsetY = e.clientY - parseInt(window.getComputedStyle(this).top);

        function mouseMoveHandler(e) {
            moving = true
            pulseContainer.style.left = e.clientX - offsetX + 'px';
            pulseContainer.style.top = e.clientY - offsetY + 'px';
        }

        function reset() {
            setTimeout(() => {
                moving = false
            }, 2000);
            window.removeEventListener('mousemove', mouseMoveHandler);
            window.removeEventListener('mouseup', reset);
        }

        window.addEventListener('mousemove', mouseMoveHandler);
        window.addEventListener('mouseup', reset);
    });

    let clickCount = 0
    let timeout = null
    pulseContainer.addEventListener('click', function () {
        clickCount++
        if (timeout) {
            return
        }

        timeout = setTimeout(() => {
            if (clickCount === 1) {
                if (!moving) {
                    const popup = document.getElementById('rsam-popup')
                    if (popup) {
                        popup.style.display = 'flex'
                        localStorage.setItem('popup', 'on')
                    }
                }
            } else {
                pulseContainer.style.left = `${window.innerWidth - 70}px`;
                pulseContainer.style.top = '0px';
            };
            clickCount = 0
            timeout = null
        }, 200);
    });
}