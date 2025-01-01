const peer = new Peer();
        const connections = {};
        const peerInput = document.getElementById('peer-id-input');
        const userList = document.getElementById('user-list');
        const messages = document.getElementById('messages');
        const messageInput = document.getElementById('message-input');
        const profilePopup = document.getElementById('profile-popup');
        const loadingPopup = document.getElementById('loading-popup');
        const peerInputContainer = document.getElementById('peerinput-container');
        const exitChatBtn = document.getElementById('exit-chat-btn');
        const fileInput = document.getElementById('file-input');
        let userName = '';
        let userProfilePic = '';
        let userNumber = '';
        let isConnecting = false;
        let connectionTimeout;
        const profileIcon = document.getElementById('profile-icon');
        const profileMenu = document.getElementById('profile-menu');
        const profileImage = document.getElementById('profile-image');
        const profileNameInput = document.getElementById('profile-name');
        const profilePictureInput = document.getElementById('profile-picture');
        const profilePreview = document.getElementById('profile-preview');
        const previewImage = document.getElementById('preview-image');
        const hiddenDiv = document.getElementById('hiddenDiv');
        const messageArea = document.getElementById('messageArea');




        function generateUserNumber() {
            return 'UN' + Math.random().toString(36).substr(2, 9);
        }

        function saveUserData() {
            localStorage.setItem('userName', userName);
            localStorage.setItem('userProfilePic', userProfilePic);
            localStorage.setItem('userNumber', userNumber);
        }

        function loadUserData() {
            userName = localStorage.getItem('userName') || '';
            userProfilePic = localStorage.getItem('userProfilePic') || '';
            userNumber = localStorage.getItem('userNumber') || generateUserNumber();
            if (!userName || !userProfilePic) {
                profilePopup.style.display = 'flex';
            } else {
                saveUserData();
            }
        }



        const wallpaperOptions = [
            { name: 'Default', image: 'wall3.jpg' },
            { name: 'Nature', image: 'wall1.jpg' },
            { name: 'City', image: 'wall2.jpg' },
            { name: 'Abstract', image: 'wall4.jpg' },
            { name: 'Space', image: 'wall6.jpg' },
            { name: 'Space', image: 'wall7.jpg' },
            { name: 'Space', image: 'wall5.avif' },
        ];

        const wallpaperContainer = document.getElementById('wallpaper-options');
        let selectedWallpaper = '';
        let sentMessageColor = '#FFD662FF';
        let receivedMessageColor = '#00539CFF';




        function createWallpaperOptions() {
            wallpaperOptions.forEach((wallpaper, index) => {
                const option = document.createElement('div');
                option.className = 'wallpaper-option';
                option.style.backgroundImage = `url('${wallpaper.image}')`;
                option.setAttribute('data-wallpaper', wallpaper.image);
                option.title = wallpaper.name;
                option.onclick = () => selectWallpaper(index);
                wallpaperContainer.appendChild(option);
            });
        }

        function selectWallpaper(index) {
            const options = wallpaperContainer.getElementsByClassName('wallpaper-option');
            for (let option of options) {
                option.classList.remove('selected');
            }
            options[index].classList.add('selected');
            selectedWallpaper = wallpaperOptions[index];
        }





        /*======================================================*/

        profilePictureInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewImage.src = e.target.result;
                    previewImage.style.display = 'block';
                    profilePreview.textContent = '';
                };
                reader.readAsDataURL(file);
            }
        });

        profileNameInput.addEventListener('input', () => {
            const name = profileNameInput.value.trim();
            if (name) {
                if (!profilePictureInput.files[0] && !userProfilePic) {
                    profilePreview.textContent = name.charAt(0).toUpperCase();
                    previewImage.style.display = 'none';
                }
            } else {
                if (!profilePictureInput.files[0] && !userProfilePic) {
                    profilePreview.textContent = 'A';
                    previewImage.style.display = 'none';
                }
            }
        });


        profileIcon.addEventListener('click', () => {
            profileMenu.classList.toggle('active');
        });

        function updateProfile() {
            const newName = profileNameInput.value.trim();
            const newPicture = profilePictureInput.files[0];

            if (newName) {
                userName = newName;
                localStorage.setItem('userName', userName);
                showSuccess("✓ Profile Updated Successfully!");
            }

            if (newPicture) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    userProfilePic = e.target.result;
                    localStorage.setItem('userProfilePic', userProfilePic);
                    profileImage.src = userProfilePic;
                };
                reader.readAsDataURL(newPicture);
                showSuccess("✓ Profile Updated Successfully!");
            }


            if (selectedWallpaper) {
                localStorage.setItem('chatWallpaper', JSON.stringify(selectedWallpaper));
            }

            sentMessageColor = document.getElementById('sent-color').value;
            receivedMessageColor = document.getElementById('received-color').value;
            localStorage.setItem('sentMessageColor', sentMessageColor);
            localStorage.setItem('receivedMessageColor', receivedMessageColor);

            applyWallpaperAndColors();
            showSuccess("✓ Profile Updated Successfully!");
            //============================

            profileMenu.classList.remove('active');
            updateUserList();
            
            // Notify other peers about the profile update
            Object.values(connections).forEach(conn => {
                conn.send({type: 'profile', name: userName, profilePic: userProfilePic});
            });
        }



        function applyWallpaperAndColors() {
            const chatMessages = document.querySelector('.chat-messages');
            chatMessages.style.backgroundImage = `url('${selectedWallpaper.image}')`;
            
            document.documentElement.style.setProperty('--sent-message-color', sentMessageColor);
            document.documentElement.style.setProperty('--sent-message-text-color', getContrastColor(sentMessageColor));
            document.documentElement.style.setProperty('--received-message-color', receivedMessageColor);
            document.documentElement.style.setProperty('--received-message-text-color', getContrastColor(receivedMessageColor));

            // Update existing messages
            document.querySelectorAll('.sent .message').forEach(msg => {
                msg.style.backgroundColor = sentMessageColor;
                msg.style.color = getContrastColor(sentMessageColor);
            });
            document.querySelectorAll('.received .message').forEach(msg => {
                msg.style.backgroundColor = receivedMessageColor;
                msg.style.color = getContrastColor(receivedMessageColor);
            });
        }


        function getContrastColor(hexcolor) {
            // Convert hex to RGB
            const r = parseInt(hexcolor.substr(1,2),16);
            const g = parseInt(hexcolor.substr(3,2),16);
            const b = parseInt(hexcolor.substr(5,2),16);
            // Calculate luminance
            const yiq = ((r*299)+(g*587)+(b*114))/1000;
            // Return black or white depending on luminance
            return (yiq >= 128) ? 'black' : 'white';
        }

        // Load user profile on startup
        function loadUserProfile() {
            userName = localStorage.getItem('userName') || 'Anonymous';
            userProfilePic = localStorage.getItem('userProfilePic');
            
            profileNameInput.value = userName;
            if (userProfilePic) {
                profileImage.src = userProfilePic;
                previewImage.src = userProfilePic;
                previewImage.style.display = 'block';
            } else {
                profilePreview.textContent = userName.charAt(0).toUpperCase();
                previewImage.style.display = 'none';
            }
        }


        const savedWallpaper = localStorage.getItem('chatWallpaper');
            sentMessageColor = localStorage.getItem('sentMessageColor') || '#FFD662FF';
            receivedMessageColor = localStorage.getItem('receivedMessageColor') || '#00539CFF';
            
            document.getElementById('sent-color').value = sentMessageColor;
            document.getElementById('received-color').value = receivedMessageColor;

            createWallpaperOptions();
            if (savedWallpaper) {
                selectedWallpaper = JSON.parse(savedWallpaper);
                const selectedIndex = wallpaperOptions.findIndex(w => w.name === selectedWallpaper.name);
                if (selectedIndex !== -1) {
                    selectWallpaper(selectedIndex);
                }
            } else {
                selectWallpaper(0); // Select default wallpaper
            }
            applyWallpaperAndColors();

        // Call this function when the page loads
        loadUserProfile();




        peer.on('open', (id) => {
            document.getElementById('peer-id').textContent = id;
            checkUserProfile();
        });

        peer.on('connection', (conn) => {
            setupConnection(conn);
        });;

        function checkUserProfile() {
            userName = localStorage.getItem('userName');
            userProfilePic = localStorage.getItem('userProfilePic');
            if (!userName || !userProfilePic) {
                profilePopup.style.display = 'flex';
            }
        }

        function saveProfile() {
            userName = document.getElementById('name-input').value.trim();
            const profilePicInput = document.getElementById('profile-pic-input');
            
            if (userName && profilePicInput.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    userProfilePic = e.target.result;
                    saveUserData();
                    localStorage.setItem('userName', userName);
                    localStorage.setItem('userProfilePic', userProfilePic);
                    profilePopup.style.display = 'none';
                    updateUserList();
                    showSuccess('✓ Setup Completed');
                };
                reader.readAsDataURL(profilePicInput.files[0]);
            } else {
                showError('✗ Please enter your name and select a profile picture.');
            }
        }

        function copyPeerId() {
            const peerId = document.getElementById('peer-id').textContent;
            
            // Create a temporary textarea element
            const tempTextArea = document.createElement('textarea');
            tempTextArea.value = peerId;
            
            // Make the textarea out of viewport
            tempTextArea.style.position = 'fixed';
            tempTextArea.style.left = '-999999px';
            tempTextArea.style.top = '-999999px';
            document.body.appendChild(tempTextArea);
            
            // Select and copy the text
            tempTextArea.focus();
            tempTextArea.select();
            
            let succeeded;
            try {
                succeeded = document.execCommand('copy');
            } catch (err) {
                succeeded = false;
            }
            
            // Remove the temporary element
            document.body.removeChild(tempTextArea);
            
            // Provide user feedback
            if (succeeded) {
                showSuccess('✓ Peer ID copied to clipboard!');
            } else {
                showError('✗ Failed to copy Peer ID. Please copy it manually.');
            }
        }

        function connectToPeer() {
            const peerId = document.getElementById('peer-id-input').value;
            if (peerId && !isConnecting) {
                console.log('Attempting to connect to:', peerId);
                isConnecting = true;
                loadingPopup.style.display = 'flex';
                const conn = peer.connect(peerId);
                
                setupConnection(conn);

                // Set a timeout to stop the connection attempt after 10 seconds
                connectionTimeout = setTimeout(() => {
                    if (isConnecting) {
                        console.log('Connection attempt timed out');
                        conn.close();
                        hideLoadingPopup();
                        showError('✗ Connection timed out. Please try again.');
                    }
                }, 10000);
            }
        }


        function hideLoadingPopup() {
            console.log('Hiding loading popup');
            isConnecting = false;
            loadingPopup.style.display = 'none';
            clearTimeout(connectionTimeout);
        }

        function setupConnection(conn) {

            conn.on('open', () => {
                console.log('Connection opened with:', conn.peer);
                hideLoadingPopup();
                connections[conn.peer] = conn;
                conn.send({type: 'profile', name: userName, profilePic: userProfilePic});
                updateUserList();
                loadPreviousChat(conn.peer);
                addMessage('System', `Connected to ${conn.peer}`, 'system');
                exitChatBtn.style.display = 'block';
                peerInput.value = '';
            });

            conn.on('error', (err) => {
                console.error('Connection error:', err);
                hideLoadingPopup();
                delete connections[conn.peer];
                updateUserList();
                addMessage('System', `Failed to connect to ${conn.peer}`, 'system');
            });

            conn.on('data', (data) => {
                console.log('Received data from:', conn.peer, data);
                if (data.type === 'profile') {
                    connections[conn.peer].name = data.name;
                    connections[conn.peer].profilePic = data.profilePic;
                    connections[conn.peer].userNumber = data.userNumber;
                    updateUserList();
                    loadPreviousChat(conn.peer);
                } else if (data.type === 'file') {
                    const blob = new Blob([data.file], {type: data.fileType});
                    const url = URL.createObjectURL(blob);
                    addFileMessage(connections[conn.peer].name || conn.peer, url, data.fileType, 'received', connections[conn.peer].profilePic);
                    saveChatMessage(conn.peer, {type: 'file', url: url, fileType: data.fileType, sender: connections[conn.peer].name || conn.peer});
                } else {
                    addMessage(connections[conn.peer].name || conn.peer, data, 'received', connections[conn.peer].profilePic);
                    saveChatMessage(conn.peer, {type: 'text', content: data, sender: connections[conn.peer].name || conn.peer});
                }
            });

            conn.on('close', () => {
                const disconnectedUser = connections[conn.peer]?.name || conn.peer;
                delete connections[conn.peer];
                updateUserList();
                if (Object.keys(connections).length >= 3) {
                    addNotification(`${disconnectedUser} left the chat`);
                } else {
                    addMessage('System', `Disconnected from ${disconnectedUser}`, 'system');
                    showError(`✗ Disconnected from ${disconnectedUser}`);
                }
                if (Object.keys(connections).length === 0) {
                    peerInputContainer.style.display = 'flex';
                    exitChatBtn.style.display = 'none';
                }
            });

        }

        
        


        function loadPreviousChat(peerId) {
            const chatHistory = JSON.parse(localStorage.getItem(`chat_${connections.userNumber}`)) || [];
            chatHistory.forEach(msg => {
                if (msg.type === 'text') {
                    addMessage(msg.sender, msg.content, msg.sender === userName ? 'sent' : 'received', msg.sender === userName ? userProfilePic : connections[peerId].profilePic);
                } else if (msg.type === 'file') {
                    addFileMessage(msg.sender, msg.url, msg.fileType, msg.sender === userName ? 'sent' : 'received', msg.sender === userName ? userProfilePic : connections[peerId].profilePic);
                }
            });
        }

        function updateUserList() {
            userList.innerHTML = `
                <h3>Connected Users</h3>
                <div class="close-connect">
                    <button onclick="toggleMenu()" class="close">X</button>
                </div>  
            `;
            Object.values(connections).forEach(conn => {
                const userElement = document.createElement('div');
                userElement.innerHTML = `
                    <div class="user-profile">
                        ${conn.profilePic ? `<img src="${conn.profilePic}" alt="${conn.name}">` : conn.name.charAt(0).toUpperCase()}
                    </div>
                    <span>${conn.name || conn.peer}</span>
                `;
                userList.appendChild(userElement);
                showSuccess("✓ Connected to: " + conn.name);
            });
        }


        function addNotification(message) {
            const notificationElement = document.createElement('div');
            notificationElement.className = 'notification';
            notificationElement.textContent = message;
            messages.appendChild(notificationElement);
            messages.scrollTop = messages.scrollHeight;
        }


        function addFileMessage(sender, fileUrl, fileType, type, profilePic) {
            const messageContainer = document.createElement('div');
            messageContainer.className = `message-container ${type}`;

            const profileElement = document.createElement('div');
            profileElement.className = 'user-profile';
            if (profilePic) {
                profileElement.innerHTML = `<img src="${profilePic}" alt="${sender}">`;
            } else {
                profileElement.textContent = sender.charAt(0).toUpperCase();
            }

            const messageElement = document.createElement('div');
            messageElement.className = 'message';

            if (fileType.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = fileUrl;
                img.className = 'image-message';
                messageElement.appendChild(img);
            } else if (fileType.startsWith('video/')) {
                const video = document.createElement('video');
                video.src = fileUrl;
                video.className = 'video-message';
                video.controls = true;
                messageElement.appendChild(video);
            }

            if (type === 'sent') {
                messageContainer.appendChild(messageElement);
                messageContainer.appendChild(profileElement);
            } else {
                messageContainer.appendChild(profileElement);
                messageContainer.appendChild(messageElement);
            }

            messages.appendChild(messageContainer);
            messages.scrollTop = messages.scrollHeight;
        }

        function addMessage(sender, message, type, profilePic) {
            const messageContainer = document.createElement('div');
            messageContainer.className = `message-container ${type}`;

            const profileElement = document.createElement('div');
            profileElement.className = 'user-profile';
            if (profilePic) {
                profileElement.innerHTML = `<img src="${profilePic}" alt="${sender}">`;
            } else {
                profileElement.textContent = sender.charAt(0).toUpperCase();
            }

            const messageElement = document.createElement('div');
            messageElement.className = 'message';
            messageElement.textContent = message;

            if (type === 'sent') {
                messageContainer.appendChild(messageElement);
                messageContainer.appendChild(profileElement);
                messageElement.style.backgroundColor = 'var(--sent-message-color)';
                messageElement.style.color = 'var(--sent-message-text-color)';
            } else if (type === 'received') {
                messageContainer.appendChild(profileElement);
                messageContainer.appendChild(messageElement);
                messageElement.style.backgroundColor = 'var(--received-message-color)';
                messageElement.style.color = 'var(--received-message-text-color)';
            } else {
                messageElement.style.backgroundColor = '#999';
                messageContainer.style.justifyContent = 'center';
                messageContainer.appendChild(messageElement);
                messageElement.style.backgroundColor = '#999';
                messageElement.style.color = '#fff';
            }

            messages.appendChild(messageContainer);
            messages.scrollTop = messages.scrollHeight;
        }

            function sendMessage() {
                const message = messageInput.value;
                if (message) {
                    console.log('Sending message:', message);
                    addMessage('You', message, 'sent', userProfilePic);
                    for (let peerId in connections) {
                        connections[peerId].send(message);
                    }
                    messageInput.value = '';
                    messageInput.style.height ='27px';
                    resetInput();

                }
            }


            /*=============================================input=================================================*/
// Basic reset function
function resetInput() {
    messageInput.value = '';
}

// Enhanced reset function with optional features
function resetInputEnhanced() {
    messageInput.value = '';               // Clear the text   
    messageInput.focus();                  // Return focus to input
}
// Add event listeners
sendButton.addEventListener('click', sendMessage);

// Add keyboard shortcut (Enter to send)
messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

// Optional: Reset input on Escape key
messageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        resetInput();
    }
});


messageInput.addEventListener('input', function() {
    // Reset height
    this.style.height = '18px';
    
    // Set new height based on content
    const newHeight = Math.min(this.scrollHeight, 150); // Max 150px
    this.style.height = newHeight + 'px';
});
            
            /*=============================================input=================================================*/


        function toggleMenu() {
            userList.classList.toggle('open');
        }

        function exitChat() {
            console.log('Exiting chat');
            Object.values(connections).forEach(conn => conn.close());
            connections = {};
            updateUserList();
            peerInputContainer.style.display = 'flex';
            exitChatBtn.style.display = 'none';
            addMessage('System', 'You have left the chat', 'system');
        }

        messageInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                sendMessage();
            }
        });

        fileInput.addEventListener('change', (event) => {
            const files = Array.from(event.target.files);
            files.forEach(file => {
                console.log('File selected:', file.name);
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    const fileData = new Uint8Array(e.target.result);
                    const fileUrl = URL.createObjectURL(new Blob([fileData], {type: file.type}));
                    addFileMessage('You', fileUrl, file.type, 'sent', userProfilePic);
                    
                    for (let peerId in connections) {
                        connections[peerId].send({
                            type: 'file',
                            file: fileData,
                            fileType: file.type,
                            fileName: file.name
                        });
                    }
                };
                
                reader.readAsArrayBuffer(file);
            });
        });
        
        loadUserData();

/*================================================new records====================================================*/
const alertPopup2 = document.getElementById('alertPopup2');
const overlay2 = document.getElementById('overlay2');

// Function to show alert and hide content
function showAlert2() {
    alertPopup2.style.display = 'block';
    overlay2.style.display = 'block';
    messages.style.display = 'none'; // Hide the content

    // Hide the alert and content after 5 seconds
    setTimeout(() => {
        alertPopup2.style.display = 'none';
        overlay2.style.display = 'none';
        messages.style.display = 'block'; // Show the content again
    }, 1000); // Adjusted timeout value to 1000ms (1 seconds)
}

// Track touches
let touchStartCount = 0;

// When touch starts (first touch), reset count
document.addEventListener('touchstart', (e) => {
    touchStartCount = e.touches.length;
    console.log('touchstart - Touch count:', touchStartCount); // Debugging log
    if (touchStartCount > 2) {
        console.log('More than 2 touches, triggering alert');
        showAlert2(); // Trigger alert if more than 2 touches
    }
});

// When touch moves, check the number of active touches
document.addEventListener('touchmove', (e) => {
    touchStartCount = e.touches.length;
    console.log('touchmove - Touch count:', touchStartCount); // Debugging log
    if (touchStartCount > 2) {
        console.log('More than 2 touches, triggering alert');
        showAlert2(); // Trigger alert if more than 2 touches
    }
});

// When touch ends, reset the touch count
document.addEventListener('touchend', () => {
    touchStartCount = 0;
    console.log('touchend - Touch count reset:', touchStartCount); // Debugging log
});

/* // Disable right-click (context menu)
document.addEventListener('contextmenu', (e) => {
    e.preventDefault(); // Disable right-click menu
    showAlert2();
}); */

// Prevent text selection
document.addEventListener('selectstart', (e) => {
    e.preventDefault(); // Prevent text selection
});


/*============================================preview modal=========================================*/
// Add modal HTML
document.body.insertAdjacentHTML('beforeend', `
<div id="mediaPreviewModal" class="media-preview-modal">
    <div class="modal-content">
        <div class="close-button">
            <span class="close-modal">X</span>
        </div>
        <div id="mediaContainer"></div>
    </div>
</div>`);

// Add styles
const modalStyle = document.createElement('style');
modalStyle.textContent = `
.media-preview-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.9);
    z-index: 1000;
    display: none;
}

.modal-content {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}

.close-button {
    position: absolute;
    right: 15px;
    top: 15px;
    background-color: #4a90e2;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    z-index: 1001;
}

.close-modal {
    color: white;
    font-size: 24px;
}

#mediaContainer {
    max-width: 90%;
    max-height: 90%;
}

#mediaContainer img, 
#mediaContainer video {
    max-width: 100%;
    max-height: 90vh;
    object-fit: contain;
}`;
document.head.appendChild(modalStyle);

// Simple preview functionality
function openMediaPreview(url, type) {
    const modal = document.getElementById('mediaPreviewModal');
    const container = document.getElementById('mediaContainer');
    const closeBtn = document.querySelector('.close-modal');
    
    container.innerHTML = '';
    
    if (type === 'image') {
        const img = document.createElement('img');
        img.src = url;
        container.appendChild(img);
    } else if (type === 'video') {
        const video = document.createElement('video');
        video.src = url;
        video.controls = true;
        video.autoplay = true;
        container.appendChild(video);
    }
    
    modal.style.display = 'flex';
    
    const closeModal = () => {
        modal.style.display = 'none';
        container.innerHTML = '';
    };
    
    closeBtn.onclick = closeModal;
    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

// Update file message function to include preview
function addFileMessage(sender, fileUrl, fileType, type, profilePic) {
    const messageContainer = document.createElement('div');
    messageContainer.className = `message-container ${type}`;

    const messageElement = document.createElement('div');
    messageElement.className = 'message';

    if (fileType.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = fileUrl;
        img.className = 'image-message';
        img.onclick = () => openMediaPreview(fileUrl, 'image');
        messageElement.appendChild(img);
    } else if (fileType.startsWith('video/')) {
        const video = document.createElement('video');
        video.src = fileUrl;
        video.className = 'video-message';
        video.controls = true;
        video.onclick = () => openMediaPreview(fileUrl, 'video');
        messageElement.appendChild(video);
    }

    const profileElement = document.createElement('div');
    profileElement.className = 'user-profile';
    if (profilePic) {
        profileElement.innerHTML = `<img src="${profilePic}" alt="${sender}">`;
    } else {
        profileElement.textContent = sender.charAt(0).toUpperCase();
    }

    if (type === 'sent') {
        messageContainer.appendChild(messageElement);
        messageContainer.appendChild(profileElement);
    } else {
        messageContainer.appendChild(profileElement);
        messageContainer.appendChild(messageElement);
    }

    messages.appendChild(messageContainer);
    messages.scrollTop = messages.scrollHeight;
}



/*====================================reset button==============================================*/
// Add the reset button HTML after the color inputs
const colorContainer = document.querySelector('.color-options');
const resetButton = document.createElement('button');
resetButton.textContent = 'Reset Colors';
resetButton.className = 'reset-colors-btn';
resetButton.onclick = resetColors;
colorContainer.appendChild(resetButton);

// Add the reset colors function
function resetColors() {
    sentMessageColor = '#FFD662FF';
    receivedMessageColor = '#00539CFF';
    
    
    document.getElementById('sent-color').value = sentMessageColor;
    document.getElementById('received-color').value = receivedMessageColor;
    
    localStorage.setItem('sentMessageColor', sentMessageColor);
    localStorage.setItem('receivedMessageColor', receivedMessageColor);
    
    applyWallpaperAndColors();
    showSuccess("✓ Successfully Reseted!");    
    profileMenu.classList.remove('active');
}

// Add CSS for the reset button
const style = document.createElement('style');
style.textContent = `
.reset-colors-btn {
    margin-top: 10px;
    padding: 8px 16px;
    background-color: #4a90e2;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.reset-colors-btn:hover {
    background-color: #357abd;
}
`;
document.head.appendChild(style);

// Success notification
function showSuccess(message) {
    const notification = document.getElementById('notification-success');
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 2000);
}

// Error notification
function showError(message) {
    const notification = document.getElementById('notification-error');
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 2000);
}
// Function to handle peer ID pasting
async function pastePeerId() {
    try {
        // Try to read from clipboard
        const text = await navigator.clipboard.readText();
        const cleanText = text.trim();
        
        // Validate peer ID
        if (isValidPeerId(cleanText)) {
            document.getElementById('peer-id-input').value = cleanText;
            showSuccess('✓ Peer ID pasted successfully');
            connectToPeer(cleanText);
            messageInput.focus();
        } else {
            showError('✗ Invalid Peer ID format');
        }
    } catch (err) {
        showError('✗ Unable to paste. Please paste manually.');
    }
}

// Function to validate peer ID format
function isValidPeerId(id) {
    // Basic validation - adjust regex as needed for your peer ID format
    if (!id) return false;
    
    // Check if it's the user's own peer ID
    const ownPeerId = document.getElementById('peer-id').textContent;
    if (id === ownPeerId) {
        showError("✗ You can't paste Your Connection Id!");
        return false;
    }
    
    // Allow alphanumeric characters and hyphens
    return /^[a-zA-Z0-9-]+$/.test(id);
}



// Add these functions to handle message interactions
function initializeMessageInteractions(messageContainer, messageElement, sender, message, type) {
    let startX = null;
    let currentOffset = 0;
    const actionMenu = createActionMenu(messageContainer, message, type, sender);
    
    messageContainer.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    });

    messageContainer.addEventListener('touchmove', (e) => {
        if (!startX) return;
        
        const currentX = e.touches[0].clientX;
        const diff = currentX - startX;
        
        // Only allow right swipe for received messages and left swipe for sent messages
        if ((type === 'received' && diff < 0) || (type === 'sent' && diff > 0)) return;
        
        if (Math.abs(diff) < 100) {
            messageContainer.style.transform = `translateX(${diff}px)`;
            currentOffset = diff;
        }
    });

    messageContainer.addEventListener('touchend', () => {
        if (Math.abs(currentOffset) > 50) {
            actionMenu.style.display = 'flex';
        }
        messageContainer.style.transform = 'translateX(0)';
        startX = null;
        currentOffset = 0;
    });

    // Add long press handler for non-touch devices
    let longPressTimer;
    messageContainer.addEventListener('mousedown', () => {
        longPressTimer = setTimeout(() => {
            actionMenu.style.display = 'flex';
        }, 500);
    });

    messageContainer.addEventListener('mouseup', () => {
        clearTimeout(longPressTimer);
    });

    // Close action menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!actionMenu.contains(e.target) && !messageContainer.contains(e.target)) {
            actionMenu.style.display = 'none';
        }
    });
}

function createActionMenu(messageContainer, message, type, sender) {
    const actionMenu = document.createElement('div');
    actionMenu.className = 'message-actions';
    actionMenu.style.display = 'none';
    
    const actions = [
        {
            icon: '↩️',
            text: 'Reply',
            onClick: () => handleReply(message, sender)
        },
        {
            icon: '📋',
            text: 'Copy',
            onClick: () => handleCopy(message)
        }
    ];

    if (type === 'sent') {
        actions.push(
            

        );
    }

    actions.push({
        icon: '🗑️',
        text: 'Delete for Me',
        onClick: () => handleDelete(messageContainer, 'me')
    });

    actions.forEach(action => {
        const button = document.createElement('button');
        button.className = 'action-button';
        button.innerHTML = `${action.icon} ${action.text}`;
        button.onclick = () => {
            action.onClick();
            actionMenu.style.display = 'none';
        };
        actionMenu.appendChild(button);
    });

    messageContainer.appendChild(actionMenu);
    return actionMenu;
}

function handleReply(message, sender) {
    const replyContent = `Replying to ${sender}: "${message}"\n`;
    messageInput.value = replyContent;
    messageInput.focus();
}

function handleCopy(message) {
    navigator.clipboard.writeText(message)
        .then(() => showSuccess('✓ Message copied!'))
        .catch(() => showError('✗ Failed to copy message'));
}

function handleEdit(messageContainer, originalMessage) {
    const messageElement = messageContainer.querySelector('.message');
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalMessage;
    input.className = 'edit-input';

    const saveButton = document.createElement('button');
    saveButton.textContent = '✓';
    saveButton.className = 'edit-save-button';

    messageElement.innerHTML = '';
    messageElement.appendChild(input);
    messageElement.appendChild(saveButton);

    saveButton.onclick = () => {
        const newMessage = input.value;
        messageElement.textContent = newMessage;
        
        // Send edit to all connected peers
        Object.values(connections).forEach(conn => {
            conn.send({
                type: 'edit',
                messageId: messageContainer.dataset.messageId,
                newContent: newMessage
            });
        });
    };
}

function handleDelete(messageContainer, deleteType) {
    messageContainer.remove();
    
    if (deleteType === 'everyone') {
        // Send delete message to all connected peers
        Object.values(connections).forEach(conn => {
            conn.send({
                type: 'delete',
                messageId: messageContainer.dataset.messageId
            });
        });
    }
}

// Modify your existing addMessage function
function addMessage(sender, message, type, profilePic) {
    const messageContainer = document.createElement('div');
    messageContainer.className = `message-container ${type}`;
    messageContainer.dataset.messageId = Date.now().toString();

    const profileElement = document.createElement('div');
    profileElement.className = 'user-profile';
    if (profilePic) {
        profileElement.innerHTML = `<img src="${profilePic}" alt="${sender}">`;
    } else {
        profileElement.textContent = sender.charAt(0).toUpperCase();
    }

    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    
    // Add sender name for received messages
    if (type === 'received') {
        const senderName = document.createElement('div');
        senderName.className = 'message-sender-name';
        senderName.textContent = sender;
        messageElement.appendChild(senderName);
    }
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = message;
    messageElement.appendChild(messageContent);

    if (type === 'sent') {
        messageContainer.appendChild(messageElement);
        messageContainer.appendChild(profileElement);
    } else {
        messageContainer.appendChild(profileElement);
        messageContainer.appendChild(messageElement);
    }

    messages.appendChild(messageContainer);
    messages.scrollTop = messages.scrollHeight;

    // Initialize message interactions
    initializeMessageInteractions(messageContainer, messageElement, sender, message, type);
}

// Add handler for edit and delete messages from peers
peer.on('connection', (conn) => {
    conn.on('data', (data) => {
        if (data.type === 'edit') {
            const messageElement = document.querySelector(`[data-message-id="${data.messageId}"]`);
            if (messageElement) {
                messageElement.querySelector('.message-content').textContent = data.newContent;
            }
        } else if (data.type === 'delete') {
            const messageElement = document.querySelector(`[data-message-id="${data.messageId}"]`);
            if (messageElement) {
                messageElement.remove();
            }
        }
    });
});

/*===========================================online check=========================================*/
// Handle offline detection and action menu positioning
function initOfflineDetector() {
    const overlay = document.getElementById('offlineOverlay');
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    let reconnectInterval;
    
    function showOfflineOverlay() {
        overlay.style.display = 'flex';
        overlay.style.opacity = '1';
        document.body.style.overflow = 'hidden';
    }
    
    function hideOfflineOverlay() {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
        reconnectAttempts = 0;
        clearInterval(reconnectInterval);
    }

    function updateStatusText(text) {
        const statusText = document.querySelector('.status-text');
        if (statusText) {
            statusText.style.opacity = '0';
            setTimeout(() => {
                statusText.textContent = text;
                statusText.style.opacity = '1';
            }, 300);
        }
    }
    
    async function checkConnection() {
        if (!navigator.onLine) {
            showOfflineOverlay();
            return;
        }

        try {
            const response = await fetch('https://www.google.com/favicon.ico', {
                mode: 'no-cors',
                cache: 'no-cache'
            });
            hideOfflineOverlay();
        } catch (error) {
            reconnectAttempts++;
            if (reconnectAttempts <= maxReconnectAttempts) {
                updateStatusText(`Reconnection attempt ${reconnectAttempts} of ${maxReconnectAttempts}`);
                showOfflineOverlay();
            } else {
                updateStatusText('Unable to establish connection. Please check your network settings.');
                clearInterval(reconnectInterval);
            }
        }
    }

    window.addEventListener('online', () => {
        hideOfflineOverlay();
        updateStatusText('Connection restored');
        // Start periodic connection checks when back online
        reconnectInterval = setInterval(checkConnection, 5000);
    });
    
    window.addEventListener('offline', () => {
        showOfflineOverlay();
        updateStatusText('Attempting to reconnect');
        clearInterval(reconnectInterval);
    });

    // Initial connection check and start periodic checks
    checkConnection();
    reconnectInterval = setInterval(checkConnection, 5000);
}

// Initialize the offline detector when the page loads
document.addEventListener('DOMContentLoaded', initOfflineDetector);

document.addEventListener('copy', function (event) {
    event.preventDefault();

    const textToCopy = 'You are not allowed to copy any thing of the site due to privacy restrictions';
    event.clipboardData.setData('text/plain', textToCopy);
});



let autoFetchInterval;

function startAutoFetch() {
    autoFetchInterval = setInterval(async () => {
        const clipboardText = await navigator.clipboard.readText();
        const cleanText = clipboardText.trim();
        
        const currentInput = document.getElementById('peer-id-input').value;
        
        if (cleanText !== currentInput && isValidPeerId(cleanText)) {
            document.getElementById('peer-id-input').value = cleanText;
            showSuccess('✓ Peer ID auto-fetched');
            connectToPeer(cleanText);
        }
    }, 1000); // Check every second
}

function stopAutoFetch() {
    clearInterval(autoFetchInterval);
}

// Start auto-fetch when page loads
document.addEventListener('DOMContentLoaded', startAutoFetch);

// Function to create and show the popup
function showPopup3(message) {
    // Create overlay
    const overlay3 = document.createElement('div');
    overlay3.id = 'overlay3';
    overlay3.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.6);
        z-index: 999;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    // Create popup container
    const popup3 = document.createElement('div');
    popup3.style.cssText = `
        background-color: #ffffff;
        border-radius: 12px;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
        padding: 20px;
        width: 350px;
        max-width: 90%;
        text-align: center;
        animation: fadeIn 0.3s ease-in-out;
    `;

    // Create popup content
    const popupMessage3 = document.createElement('p');
    popupMessage3.textContent = message;
    popupMessage3.style.cssText = `
        font-size: 1em;
        color: var(--primary-color);
        margin-bottom: 20px;
    `;

    // Create close button
    const closeBtn3 = document.createElement('button');
    closeBtn3.textContent = 'Close';
    closeBtn3.style.cssText = `
        background-color: var(--primary-color);
        color: #ffffff;
        border: none;
        border-radius: 8px;
        padding: 10px 20px;
        font-size: 0.9em;
        cursor: pointer;
        transition: background-color 0.3s;
    `;
    closeBtn3.onmouseover = () => {
        closeBtn3.style.backgroundColor = '#e14b45';
    };
    closeBtn3.onmouseout = () => {
        closeBtn3.style.backgroundColor = 'var(--primary-color)';
    };
    closeBtn3.onclick = () => document.body.removeChild(overlay3); // Close popup

    // Append elements
    popup3.appendChild(popupMessage3);
    popup3.appendChild(closeBtn3);
    overlay3.appendChild(popup3);
    document.body.appendChild(overlay3);

    // Add fade-in animation
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: scale(0.8);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }
    `;
    document.head.appendChild(style);
}
