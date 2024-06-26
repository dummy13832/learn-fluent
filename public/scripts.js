const socket = io('/');
const videoContainer = document.getElementById('video-container');
const myVideo = document.getElementById('my-video');
const userVideo = document.getElementById('user-video');

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        myVideo.srcObject = stream;
        const peer = new Peer(undefined, {
            path: '/peerjs',
            host: '/',
            port: location.port || (location.protocol === 'https:' ? 443 : 80),
            secure: location.protocol === 'https:'
        });

        peer.on('open', id => {
            const ROOM_ID = 'learn-fluent-room'; // Ensure you define a room ID
            socket.emit('join-room', ROOM_ID, id);
        });

        socket.on('user-connected', userId => {
            connectToNewUser(userId, stream, peer);
        });

        peer.on('call', call => {
            call.answer(stream);
            call.on('stream', userVideoStream => {
                userVideo.srcObject = userVideoStream;
            });
        });

        socket.on('user-disconnected', userId => {
            if (peers[userId]) peers[userId].close();
        });

        const peers = {};

        function connectToNewUser(userId, stream, peer) {
            const call = peer.call(userId, stream);
            call.on('stream', userVideoStream => {
                userVideo.srcObject = userVideoStream;
            });
            call.on('close', () => {
                userVideo.remove();
            });
            peers[userId] = call;
        }
    })
    .catch(error => {
        console.error('Error accessing media devices.', error);
    });

document.addEventListener('DOMContentLoaded', () => {
    const usernameElement = document.getElementById('username');
    const logoutButton = document.getElementById('logout');
    const userInfo = document.querySelector('.user-info span');

    userInfo.addEventListener('click', () => {
        const dropdown = document.querySelector('.user-info .dropdown');
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });

    window.login = function () {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.token) {
                localStorage.setItem('token', data.token);
                usernameElement.textContent = username;
                showUserInfo();
            }
        });
    };

    window.register = function () {
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;

        fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
        .then(response => {
            if (response.status === 201) {
                alert('Registration successful. Please login.');
                showLoginForm();
            }
        });
    };

    window.showLoginForm = function () {
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('register-form').classList.add('hidden');
    };

    window.showRegisterForm = function () {
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.remove('hidden');
    };

    function showUserInfo() {
        document.getElementById('main-content').classList.add('hidden');
        videoContainer.classList.remove('hidden');
        usernameElement.parentElement.style.display = 'flex';
    }

    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        usernameElement.textContent = '';
        videoContainer.classList.add('hidden');
        document.getElementById('main-content').classList.remove('hidden');
        showLoginForm();
    });

    if (localStorage.getItem('token')) {
        const decoded = jwt_decode(localStorage.getItem('token'));
        usernameElement.textContent = decoded.username;
        showUserInfo();
    }
});
