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
import page from '../styles/page.js';
import button from '../styles/button.js';
import { SessionStatus} from '../modules/events.js';
import {WaitRequest} from '../elements/waiting-indicator.js';
import {api,switchPath} from '../libs/utils.js';

/*
     <session-pin>: Collects the room pin from the user and validates it is correct
*/
class RoomHome extends LitElement {
  static get styles() {
    return [page, button, css``];
  }
  static get properties() {
    return {
      pin: {type: String},
      room: {type: String},
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
      </style>
      <app-page id="page" heading="Room Pin">
        <div class="container">
          <div class="label">Your name</div>
          <div class="name">${this.name}</div>
          <div class="fullroomname">
            <div class="label">Room</div>
            ${cache(this.host.length > 0 ? html`
              <div class="name">${this.host}</div>
            `:'')}
            <div class="name">${this.room}</div>
          </div>
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
          <p id="see">
              <material-icon @click=${this._toggleVisibility}>${this.showpass ? 'visibility_off' : 'visibility'}</material-icon>
              Click the eye to ${this.showpass ? 'hide' : 'show'} password</p> 
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
        name: this.name,
        host: this.host,
        room: this.room,
        pin: this.pin
      });
      this.checkInProgress = false;
      this.dispatchEvent(new WaitRequest(false));
      if (response.status === 'OK'){
        this.failed = false;
        this.dispatchEvent(new SessionStatus({
          host: this.host,
          room: this.room,
          state: 'authorised'
        }));
      } else {
        this.failed = true;
      }

    }
  }
  _pinChanged(e) {
    e.stopPropagation();
    this.pin = e.changed;
  }
}
customElements.define('room-home', RoomHome);