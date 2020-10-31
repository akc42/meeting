/**
@licence
    Copyright (c) 2020 Alan Chandler, all rights reserved

    This file is part of Meeting.

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
import { LitElement, html, css } from '../libs/lit-element.js';
import {cache} from '../libs/cache.js';

import '../elements/app-page.js';
import '../elements/styled-input.js';
import page from '../styles/page.js';
import button from '../styles/button.js';
import { AuthChanged} from '../modules/events.js';
import {WaitRequest} from '../elements/waiting-indicator.js';
import {api,switchPath} from '../libs/utils.js';
import Route from '../libs/route.js';

/*
     <pin-page>: Collects the room pin from the user and validates it is correct
*/
class PinPage extends LitElement {
  static get styles() {
    return [page, button, css``];
  }
  static get properties() {
    return {
      hoster: {type: String},
      route: {type: Object},
      pin: {type: String},
      room: {type: Object},
      host: {type: String},
      name: {type: String},
      showPass: {type: Boolean},
      failed: {type: Boolean} //set to true after api call
    };
  }
  constructor() {
    super();
    this.pin = '';
    this.room = '';
    this.host = '';
    this.name = '';
    this.showPass = false;
    this.failed = false;
    this.roomRouter = new Route('/:host/:room', 'page:room');

    this.checkInProgress = false;
  }
  connectedCallback() {
    super.connectedCallback();
    this.showPass = false;
    this.checkInProgress = false;
  }
  disconnectedCallback() {
    super.disconnectedCallback();
  }
  update(changed) {
    if (changed.has('route')  && this.route.active) {
      const route = this.roomRouter.routeChange(this.route);
      this.pin = '';
      if (route.active) {
        this.host = route.params.host;
        this.room = route.params.room;
        const pinSet = sessionStorage.getItem('roomPin');
        if (pinSet) {
          const items = pinSet.split(':');
          if( items.length === 3 && items[0] === this.host && items[1] === this.room) {
            //we previously already have entered a pin for this room, so set pin
            this.pin = items[2];
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
  firstUpdated() {
    this.input = this.shadowRoot.querySelector('#pin');
  }
  updated(changed) {
    super.updated(changed);
  }
  render() {
    return html`
      <style>
        .container {
          display: grid;
          grid-gap: 5px;
          grid-template-columns: var(--name-input-length) 24px 1fr;
          grid-template-areas:
            "namelabel myname myname"
            "roomlabel roomname roomname"
            "pin eye visibility";
        }
        .namelabel {
          grid-area: namelabel;
          font-weight: bold;
        }
        .myname {
          grid-area: myname;
        }
        .roomlabel {
          grid-area: roomlabel;
          font-weight: bold;
        }
        .roomname {
          grid-area: roomname;
        }

        #pin {
          grid-area: pin;
        }
        material-icon.eye {
          grid-area: eye;
          align-self: center;
        }
        p {
          grid-area: visibility;
          align-self: flex-end;
        }
      </style>
      <app-page id="page" heading="Room Pin">
        <div class="container">
          <div class="namelabel">Your name</div>
          <div class="myname">${this.name}</div>          
          <div class="roomlabel">Room</div>
          <div class="roomname">${this.host}:${this.room}</div>
          <styled-input
            id="pin"
            label="Room Pin"
            name="pin" 
            type="${this.showpass ? 'text' : 'password'}"
            min-length="4"
            max-length="4"
            required
            .message=${this.failed ? 'Incorrect pin' : '4 characters required'}
            .value=${this.pin}
            @value-changed=${this._pinChanged}></styled-input>
          
          <material-icon class="eye" @click=${this._toggleVisibility}>${this.showpass ? 'visibility_off' : 'visibility'}</material-icon>
          <p>Click the eye to ${this.showpass ? 'hide' : 'show'} password</p> 
        </div>
        <button cancel slot="action" @click=${this._cancel}><material-icon>cancel</material-icon> Cancel</button>
        <button slot="action" @click=${this._meeting}><material-icon>meeting_room</material-icon> Enter Meeting</button>
      </app-page>
    `;
  }
  _cancel(e) {
    e.stopPropagation();
    swicthPath('/');
  }
  async _meeting(e) {
    e.stopPropagation();
    if (this.input && this.input.validate() && !this.checkInProgress) {
      this.checkinProgress = true; //just to prevent double submission as we might take some time
      this.dispatchEvent(new WaitRequest(true));  //important because we might be artificially delaying response
      const response = await api('user/check_pin', {
        host: this.host,
        room: this.room,
        pin: this.pin
      });
      this.checkInProgress = false;
      this.dispatchEvent(new WaitRequest(false));
      if (response.status === 'OK'){
        this.failed = false;
        sessionStorage.setItem('roomPin', `${this.host}:${this.room}:${this.pin}`)
      } else {
        this.failed = true;
      }

    }
  }
  async _newRoute(params) {
    this.dispatchEvent(new WaitRequest(true));
    const response = await api('user/room_details', params);
    if (response.room) {
      this.dispatchEvent(new WaitRequest(true));
      if (!response.room.pin || this.hoster === this.host) { //no pin, or we own the room
        switchPath(`/room/${this.host}/${this.room}`); //go straight to room
      }
    } else {
      switchPath('/');
    }
  }
  _pinChanged(e) {
    e.stopPropagation();
    this.pin = e.changed;
  }
}
customElements.define('pin-page', PinPage);