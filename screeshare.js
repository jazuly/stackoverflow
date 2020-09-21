import io from 'socket.io-client';
export default {
  name: 'index',
  data: () => ({
    peers: {},
    videoGrid: null,
    myPeerID: null,
    myStream: null,
    mediaStatus: {
      audio: true, video: true
    }
  }),

  mounted() {
    this.configurePeer()
  },

  methods: {
    configurePeer() {
      const socket = io()
      const myVideo = document.createElement('video')
            myVideo.muted = true
            myVideo.className = 'mr-3 mb-3'
      this.videoGrid = document.getElementById('videoGrid')

      navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      }).then(stream => {
        this.myStream = stream
        this.addVideoStream(myVideo, this.myStream)
        this.$peer.on('call', call => {
          const video = document.createElement('video')
                video.className = 'mr-3 mb-3'

          call.answer(stream)
          call.on('stream', userVideoStream => {
            this.addVideoStream(video, userVideoStream)
          })
        })

        socket.on('userConnected', dataUser => {
          this.$store.dispatch('userConnected', dataUser)
          this.connectToNewUser(dataUser, stream)
        })
      })

      socket.on('userDisconnected', dataUser => {
        if (this.$store.state.users[dataUser.id] && this.$store.state.users[dataUser.id].stream) {
          this.$store.state.users[dataUser.id].stream.close()
          this.$store.dispatch('userDisconnected', dataUser)
        }
      })

      this.$peer.on('open', id => {
        this.myPeerID = id
        socket.emit('joinRoom', 11, id)
      })
    },

    addVideoStream(video, stream) {
      video.srcObject = stream
      video.addEventListener('loadedmetadata', () => {
        video.play()
      })
      this.videoGrid.appendChild(video)
    },

    connectToNewUser(dataUser, stream) {
      const call = this.$peer.call(dataUser.id, stream)
      const video = document.createElement('video')
            video.className = 'mr-3 mb-3'

      call.on('stream', userVideoStream => {
        this.addVideoStream(video, userVideoStream)
      })
      call.on('close', () => {
        video.remove()
      })
      
      this.$store.dispatch('userStream', { id: dataUser.id, stream: call })
    },

    screenSharing() {
      navigator.mediaDevices.getDisplayMedia().then(stream => {
        console.log(this.myPeerID, stream)
        this.$peer.call(this.myPeerID, stream)
      })
    },

    videoAction() {
      this.myStream.getVideoTracks()[0].enabled = !(this.myStream.getVideoTracks()[0].enabled)
      this.mediaStatus.video = this.myStream.getVideoTracks()[0].enabled
    },

    audioAction() {
      this.myStream.getAudioTracks()[0].enabled = !(this.myStream.getAudioTracks()[0].enabled)
      this.mediaStatus.audio = this.myStream.getAudioTracks()[0].enabled
    }
  },
}
