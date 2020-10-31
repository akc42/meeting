/**
@licence
    Copyright (c) 2020 Alan Chandler, all rights reserved

    This file provided as part of Meeting

    Meeting is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Meeting is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Meeting.  If not, see <http://www.gnu.org/licenses/>.
*/


import {LitElement, html,css } from '../libs/lit-element.js';
import {classMap} from '../libs/class-map.js';

import {WaitRequest} from '../elements/waiting-indicator.js';
import Route from '../libs/route.js';
import { api, generateUri, switchPath } from '../libs/utils.js';



export class RoomPage extends LitElement {
  static get styles() {
    return css`
      :host {
        height:100%;
      }
    `;
  }
  static get properties() {
    return {
      hoster: {type:String}, //Login name if logged in.
      myName: {type: String}, //Name to show as me 
      otherName: {type: String}, //Name from other person
      route: {type: Object}, //host and room names passed in via url
      altView: {type: Boolean}, //display preference
      myFeeds: {type: Array}, //A list of my streams
      otherFeeds: {type: Array}, //A list of streams from the other guy
      iAmHost: {type: Boolean},  //I am host of the meeting
      hostDueIn: {type: String}, //Time until host is due ("Overdue" if late)
      myUid: {type: String},  //peerjs clientid for me
      otherUid: {type: String}, //uid of other person
      host: {type: String}, //host of Room
      room: {type: String}, //name of Room
      joined: {type: Boolean} //True when other feed has been received

    };
  }
  constructor() {
    super();
    this.hoster = '';
    this.myName = '';
    this.otherName = '';
    this.route = {actvice: false};
    this.altView = false;
    this.myFeeds = [];
    this.otherFeeds = [];
    this.iAmHost = false;
    this.hostDueIn = '';
    this.myUid = '';
    this.otherUid = '';
    this.host = '';
    this.room = '';
    this.joined = false;
    this.roomRouter = new Route('/:host/:room','page:room');
  }

  connectedCallback() {
    super.connectedCallback();
    console.log('Room Page Connected');
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    
    console.log('Room Page Disconnected');
    if (this.eventSrc) {
      this.eventSrc.close();
      delete this.eventSrc;
    }
    if (this.peer) {
      this.peer.destroy();
      delete this.peer;
    }
  }
  update(changed) {
    if (changed.has('route') && this.route.active) {
      const route = this.roomRouter.routeChange(this.route);
      this.pin = '';
      if (route.active) {
        this.host = route.params.host;
        this.room = route.params.room;
        const pinSet = sessionStorage.getItem('roomPin');
        if (pinSet) {
          const items = pinSet.split(':');
          if (items.length === 3 && items[0] === this.host && items[1] === this.room) {
            //we previously already have entered a pin for this room, so set pin
            this.pin= items[2];
          } 
        }

        this._newRoute(route.params);
      } else {
        this.host = '';
        this.room = '';
      }
    }
    super.update(changed);
  }
  render() {
    return html`
      <style>
      </style>
      <dialog id="message">
      </dialog>

      <div id="container" class="${classMap({alt: this.altView})}">
        <section id="otherfeeds" class="${classMap({})}">
        </section>
        <section id="myfeeds"></section>
      </div>
    `;
  }
  loadPage(page) {
    switch (page) {
      case 'main':
      case 'alt':
        if (!this.authorised) return false;
      case 'home':
        break;
      default:
        return false;
    }

    this.dispatchEvent(new WaitRequest(true));
    import(`./room-${page}.js`).then(() => this.dispatchEvent(new WaitRequest(false)));
    return true;
  }
  _auth(e) {
    e.stopPropagation();
    this.authorised = e.changed;
  }
  async _newRoute(params) {
    this.dispatchEvent(new WaitRequest(true));
    const response = await api('user/room_details', params);
    let success = true;
    if (response.room) {
      if(response.room.pin && this.host !== this.hoster) {
        const reply = await api('user/check_pin', {
          host: this.host,
          room: this.room,
          pin: this.pin
        });
        if (reply.status !== 'OK') {
          success = false;
          switchPath(`/pin/${this.host}/${this.room}`); //Failed so go back to get pin to check
        } 
      }
    } else {
      success = false;
      switchPath('/'); //totally invalid room
    }
    this.dispatchEvent(new WaitRequest(false));
    if (success) {
      this._setUpCall(response.room);
    }
  }
  _setUpCall(room) {
    console.log('entered room setup');
    const myPeer = new Peer({
      host: '/',
      port: '2051',
    });
    myPeer.on('open', id => {
      sessionStorage.setItem('uid', id);
      this.eventSrc = new EventSource(generateUri('/api/room/subscribe',{uid:id}));
      this.myUid = id;
      
    })

/*




    myPeer.on('call', call => {
      call.answer(stream)
      const video = document.createElement('video')
      call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream)
      })
    })

    const peers = {}


    let myVideoStream;
    const myVideo = document.createElement('video')
    myVideo.muted = true;
    const peers = {}
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    }).then(stream => {
      myVideoStream = stream;
      addVideoStream(myVideo, stream)
      myPeer.on('call', call => {
        call.answer(stream)
        const video = document.createElement('video')
        call.on('stream', userVideoStream => {
          addVideoStream(video, userVideoStream)
        })
      })



    })

    socket.on('user-disconnected', userId => {
      if (peers[userId]) peers[userId].close()
    })

    myPeer.on('open', id => {
      socket.emit('join-room', ROOM_ID, id)
    })

    function connectToNewUser(userId, stream) {
      const call = myPeer.call(userId, stream)
      const video = document.createElement('video')
      call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream)
      })
      call.on('close', () => {
        video.remove()
      })

      peers[userId] = call
    }

    function addVideoStream(video, stream) {
      video.srcObject = stream
      video.addEventListener('loadedmetadata', () => {
        video.play()
      })
      videoGrid.append(video)
    }
 */   
  }
}
customElements.define('room-page',RoomPage);
