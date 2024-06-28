const socket = io();
const joinButton = document.getElementById('joinButton');
const languageSelect = document.getElementById('languageSelect');
const connectingMessage = document.getElementById('connectingMessage');
const videoContainer = document.getElementById('videoContainer');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const exitButton = document.getElementById('exitButton');

let localStream;
let peerConnection;

const servers = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302"
        }
    ]
};

joinButton.addEventListener('click', async () => {
    const language = languageSelect.value;
    socket.emit('join', language);
    joinButton.style.display = 'none';
    languageSelect.style.display = 'none';
    connectingMessage.style.display = 'block';

    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    socket.on('offer', async (offer) => {
        peerConnection = new RTCPeerConnection(servers);
        peerConnection.addStream(localStream);

        peerConnection.onaddstream = (event) => {
            remoteVideo.srcObject = event.stream;
        };

        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('answer', answer);
    });

    socket.on('answer', async (answer) => {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('candidate', async (candidate) => {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });

    socket.on('ready', async () => {
        if (peerConnection) return;

        peerConnection = new RTCPeerConnection(servers);
        peerConnection.addStream(localStream);

        peerConnection.onaddstream = (event) => {
            remoteVideo.srcObject = event.stream;
        };

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('offer', offer);
    });

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('candidate', event.candidate);
        }
    };

    socket.on('connected', () => {
        connectingMessage.style.display = 'none';
        videoContainer.style.display = 'flex';
    });
});

exitButton.addEventListener('click', () => {
    peerConnection.close();
    socket.emit('leave');
    videoContainer.style.display = 'none';
    joinButton.style.display = 'block';
    languageSelect.style.display = 'block';
});
