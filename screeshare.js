<template>
  <v-sheet class="px-5 d-flex align-center justify-start" width="100%" height="100%">
    <v-row>
      <v-col cols="9">
        <v-row>
          <v-col class="pt-0" cols="12">
            <v-sheet class="video-ctr d-flex flex-wrap align-center justify-center" max-height="60vh" width="100%">
              <v-sheet class="text-center" id="videoGrid"></v-sheet>
            </v-sheet>
          </v-col>
          <v-col v-if="myStream" class="text-center pb-0" cols="12">
            <v-btn class="mr-3" fab large @click="audioAction">
              <v-icon color="red" v-text="this.mediaStatus.audio ? 'mdi-microphone' : 'mdi-microphone-off'" />
            </v-btn>
            <v-btn class="mr-3" fab large @click="videoAction">
              <v-icon color="red" v-text="this.mediaStatus.video ? 'mdi-video' : 'mdi-video-off'" />
            </v-btn>
            <v-btn class="mr-3" fab large @click="screenSharing">
              <v-icon color="red" v-text="`mdi-monitor-multiple`" />
            </v-btn>
            <v-btn class="mr-3" fab large><v-icon color="red" v-text="`mdi-phone-hangup`" /></v-btn>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="3">
        <v-card class="content-container" color="red" width="100%" height="100%" flat tile></v-card>
      </v-col>
    </v-row>
  </v-sheet>
</template>

<script>
import io from 'socket.io-client';
export default {
  name: 'index',
  data: () => ({
    peers: {},
    videoGrid: null,
    myPeerID: null,
    myStream: null,
    myScreen: null,
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

      // Owner Room Side
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
            this.$store.dispatch('userConnected', { name: call.peer, id: call.peer })
            this.$store.dispatch('userStream', { id: call.peer, stream: call })
            this.addVideoStream(video, userVideoStream)
          })

          call.on('close', () => {
            video.remove()
          })
        })

        socket.on('userConnected', dataUser => {
          this.$store.dispatch('userConnected', dataUser)
          this.connectToNewUser(dataUser, stream)
          if (this.myScreen) this.$peer.call(dataUser.id, this.myScreen)
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

    // Participant Room Side
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
        this.myScreen = stream
        const keys = Object.keys(this.$store.state.users)
        keys.forEach((value) => {
          this.$peer.call(value, this.myScreen)
        });
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
</script>

<style scoped>
*>>>video {
  width: 300px;
  height: auto;
  border-radius: 10px;
  box-shadow: 0px 2px 4px -1px rgba(0, 0, 0, 0.2), 0px 4px 5px 0px rgba(0, 0, 0, 0.14), 0px 1px 10px 0px rgba(0, 0, 0, 0.12);
}
.video-ctr {
  overflow-y: auto;
}
</style>
