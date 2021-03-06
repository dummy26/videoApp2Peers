//audio not wokring if video on, video off then mute and then other user joins and then u unmute
myPeer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id, myUserName)
    myUserId = id
})

//receive peerUserName when someone connects to u
myPeer.on('connection', conn => {
    connection = conn
    shareScreenBtn.disabled = false
    shareFileBtn.disabled = false
    whiteboardBtn.disabled = false

    if (chatInput.value !== '') sendMsgBtn.disabled = false

    connection.on('data', data => {
        handleConnectionData(data)
    })
})


navigator.mediaDevices.getUserMedia({
        video: myVideoOn,
        audio: audioOn
    }).then(stream => {
        myStream = stream
            //connect to new user whose id is userId and send ur stream
        socket.on('user-connected', (userId, userName) => {
            peerUserId = userId
            peerUserName = userName
            peerName.innerHTML = peerNameFallback.innerHTML = peerUserName
            connectToNewUser(userId, myStream)

            shareScreenBtn.disabled = false
            shareFileBtn.disabled = false
            whiteboardBtn.disabled = false

            if (chatInput.value !== '') sendMsgBtn.disabled = false
        })

        myVideo.srcObject = myStream
        myVideo.muted = true
        myName.innerHTML = myNameFallback.innerHTML = myUserName
        myName.style.opacity = 0

        setEventListeners()

        //when someone calls, we answer them and send our stream
        myPeer.on('call', call => {
            call.answer(myStream)
            handleCall(call)
            myVideoOn && !peerSharingScreen ? connection.send('video') : connection.send('noVideo')
        })
    })
    .catch(e => {
        console.log(e, 'Please allow microphone')
    })


socket.on('user-disconnected', userId => {
    if (peers[userId]) {
        // onPeerDisconnect()
        peers[userId].close()
    }
})


function setEventListeners() {
    videoBtn.addEventListener('click', toggleVideo)
    audioBtn.addEventListener('click', toggleAudio)

    shareScreenBtn.addEventListener('click', () => {
        sharingScreen ? stopScreenShare() : shareScreen()
    })

    shareFileBtn.addEventListener('click', () => {
        selectFileDialog.style.display = 'block'
        fileShareStatus.innerHTML = ''
    })

    document.getElementById('shareFileCancelBtn').addEventListener('click', () => {
        selectFileInput.value = ''
        selectFileDialog.style.display = 'none'
    })

    selectFileInput.addEventListener('change', (e) => {
        file = e.target.files[0]
        shareFileOkBtn.disabled = !file
    })

    shareFileOkBtn.addEventListener('click', shareFile)

    fileRequestAcceptBtn.addEventListener('click', () => {
        connection.send('fileRequestAccepted')
        fileRequestDialog.style.display = 'none'
    })

    fileRequestDenyBtn.addEventListener('click', () => {
        connection.send('fileRequestDenied')
        fileRequestDialog.style.display = 'none'
    })

    openChatBtn.addEventListener('click', () => {
        if (!chatOpen) {
            let w = getComputedStyle(chatWindow).getPropertyValue('--chatWindowWidth')
            chatWindow.style.opacity = 1
            chatWindow.style.left = `calc(100vw - ${w})`
            videoGrid.style.marginRight = w
            chatInput.focus()
            notificationCount = 0
            notificationBubble.innerHTML = ''

            if (peerSharingScreen)
                videoGrid.style.gridTemplateColumns = '1fr'
            chatOpen = true

        } else closeChatBtn.click()
    })

    closeChatBtn.addEventListener('click', () => {
        chatWindow.style.opacity = 0
        chatWindow.style.left = '100vw'
        videoGrid.style.marginRight = 0
        notificationCount = 0
        notificationBubble.innerHTML = ''

        if (peerSharingScreen)
            videoGrid.style.gridTemplateColumns = '10fr 1fr'
        chatOpen = false
    })

    chatInput.oninput = () => {
        chatInput.value !== '' && connection ? sendMsgBtn.disabled = false : sendMsgBtn.disabled = true
    }

    //if enter is pressed on chatInput then send message
    chatInput.addEventListener('keyup', (e) => {
        if (e.keyCode === 13 && chatInput.value !== '')
            sendMsgBtn.click()
    })

    sendMsgBtn.addEventListener('click', () => {
        connection.send({ msg: chatInput.value })

        createMsg('myMsg', chatInput.value)

        chatInput.value = ''
        chatInput.focus()
        sendMsgBtn.disabled = true
    })

    whiteboardBtn.addEventListener('click', () => {
        if (whiteboardOn)
            stopWhiteboard()
        else
            startWhiteboard()
        whiteboardOn = !whiteboardOn
    })
}