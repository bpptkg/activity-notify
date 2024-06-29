export default function openPopup() {
    // Create the popup container
    const popupContainer = document.createElement('div');
    popupContainer.style.display = 'flex';
    popupContainer.id = 'rsam-popup';
    document.body.appendChild(popupContainer);

    // Create the popup content box
    const popupContent = document.createElement('div');
    popupContent.classList.add('popup-content');

    // Create the close button inside the popup
    const closeBtn = document.createElement('span');
    closeBtn.textContent = '×';
    closeBtn.classList.add('close-btn');
    popupContent.appendChild(closeBtn);

    // Add image content to pop up
    const icon = document.createElement('div');
    icon.innerHTML = `<svg style="width:50%;height:auto;color: red" data-slot="icon" fill="none" stroke-width="1.5" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"></path>
    </svg>`;
    popupContent.appendChild(icon);

    // Add additional content to the popup here if necessary
    const messageContainer = document.createElement('div');
    messageContainer.innerHTML = `<div style="margin-bottom:8px">PERINGATAN!!!</div> 
        <div style="margin-bottom:12px;font-size:15px" id="rsam-popup-message"></div> 
        <div style="margin-bottom:5px;font-size:14px" id="kubah-message"></div> 
        <div style="margin-bottom:5px;font-size:14px" id="bebeng-message"></div> 
        <div style="margin-bottom:5px;font-size:14px" id="boyong-message"></div> 
        <div style="margin-bottom:5px;font-size:14px" id="krasak-message"></div> 
    <br>`;
    popupContent.appendChild(messageContainer);

    // Append the popup content box to the popup container
    popupContainer.appendChild(popupContent);

    closeBtn.addEventListener('click', () => {
        localStorage.setItem('popup', 'off')
        popupContainer.style.display = 'none';
    });

    
}