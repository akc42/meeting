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

import {api, switchPath} from '../libs/utils.js';
import global from '../modules/globals.js';

import '../elements/app-page.js';
import '../elements/styled-input.js';
import '../elements/material-icon.js';

import button from '../styles/button.js'


import {WaitRequest} from '../elements/waiting-indicator.js';



/*
     <home-page>
*/
class HomePage extends LitElement {
  static get styles() {
    return [button,css``];
  }
  static get properties() {
    return {
      master: {type: Boolean},  //If I am the master tab, I am allowed to log in
      hoster: {type: String},
      iamhost: {type: Boolean},
      name:{type: String}, //name by which user will be known as in chat room
      roomName: {type: String},
      host: {type: String},
      rooms: {type: Array},
      hosts: {type: Array},
      notFound: {type: Boolean} //true if after checking for room it was not found.
    };
  }
  constructor() {
    super();
    this.name = '';
    this.hoster = '';
    this.iamhost = false;
    this.roomName = '';
    this.host = '';
    this.rooms = [];
    this.hosts = [];
    this.noPin = false;
    this.roomChecked = false;
  }
  connectedCallback() {
    super.connectedCallback();
    global.master.then(master => this.master = master);
    const rooms = localStorage.getItem('recentRooms');
    if (rooms !== null) {
      this.rooms = JSON.parse(rooms);
    }
    const name = localStorage.getItem('lastName');
    if (name) {
      this.name = name;
    } 
    this.roomChecked = false;

  }
  disconnectedCallback() {
    super.disconnectedCallback();
  }
  update(changed) {
    if( changed.has('hoster') && this.hoster.length > 0) {
      this.name = this.hoster;   //if we change hoster, then we can use that as our name.
      this.iamhost = true; //and assume initially that I will host as well.
    } 
    super.update(changed);
  }
  firstUpdated() {
    this.roomEl = this.shadowRoot.querySelector('#room');
  }
  updated(changed) {
    super.updated(changed);
  }
  render() {
    return html`
      <style>
        .container {
          width: 150px;
          margin:0 auto;
        }
        .spacer {
          height: 40px;
          width: 100%;
        }
      </style>
      <app-page heading="Select Meeting">
        <div class="container">
          <styled-input 
            label="Your Name" 
            required 
            message="Your name required" 
            .value=${this.name} 
            @value-changed=${this._nameChanged}
            @blur=${this._saveName}></styled-input>
          ${cache(this.hoster.length > 0 ? html`
            <check-box name="host" value=${this.iamhost} @value-changed=${this._amHost}>I am the host</check-box>
          `:'')}  
          ${cache(this.hosts.length > 0 ? html`
            <styled-input
              id="host" 
              label="Host (needed as room name is not unique)" 
              message="Required"
              required 
              .value=${this.host} 
              value-changed=${this._hostChanged} 
              @blur=${this._checkName}
              .items=${this.hosts}></styled-input>
          `:html`
            <div class="spacer"></div>
          `)}
          <styled-input
            id="room" 
            label="Room" 
            .message=${this.notFound ? 'Room not found': 'Required'}
            .value=${this.roomName} 
            @value-changed=${this._roomChanged} 
            @blur=${this._checkName} 
            .items=${this.rooms}></styled-input>
        </div>
        ${cache(this.master ? html`
          ${this.hoster.length > 0 ? html`
            <button slot="action" @click=${this._manageAccount}><material-icon>people </material-icon> Manage Account</button>
          `:html`
            <button slot="action" @click=${this._login}><material-icon>login</material-icon> Login</button>
          `}
        `:'')}
        <button slot="action" @click=${this._meeting}><material-icon>meeting_room</material-icon> Enter Meeting</button>
      </app-page>
    `;
  }
  _amHost(e) {
    e.stopPropagation();
    this.iamhost = e.changed;
    if (this.iamhost) this.host = this.hoster;
  }
  async _checkName(e) {
    e.stopPropagation();
    if (this.roomName.length > 0) {
      const params = { name: this.roomName };
      this.dispatchEvent(new WaitRequest(true));
      if (this.host.length > 0) {
        params.host = this.host;
        const response = await api('user/check_room', params);
        if (response.room) {
          this.notFound = false;
          this.noPin = response.room.hasPin === 0;
          this.hosts = [];
          this.roomChecked = true;
        } else {
          this.notFound = true
          this.roomEl.invalid = true;
        }
      } else {
        const response = await api('user/check_room', params);       
        if (response.rooms.length === 0) {
          this.notFound = true;
          this.roomEl.invalid = true;
        } else if (response.rooms.length === 1) {
          this.hosts = [];  //no not need to worry about hosts
          this.noPin = response.rooms[0].hasPin === 0;
          this.host = resppnse.rooms[0].host;
          this.roomChecked = true;
        } else {
          this.hosts = rooms.map(r => r.host);
        }

      }
      this.dispatchEvent(new WaitRequest(false));
    }

  }
  _login(e) {
    e.stopPropagation();
    switchPath('/login');
  }
  _manageAccount(e) {
    e.stopPropagation();
    switchPath('/host');
  }
  _meeting(e) {
    e.stopPropagation();
    if (this.roomChecked) {
      if (this.noPin || this.iamhost) {
        switchPath(`/room/${this.host}/${this.roomName}/${this.name}/main`);
      } else {
        switchPath(`/room/${this.host}/${this.roomName}/${this.name}`);
      }
    } else {
      const host = this.shadowRoot.querySelector('#host');
      if (host !== undefined) {
        this.host.invalid = true;
      } else {
        this.roomEl.invalid = true;
      }
    }
  }  
  _nameChanged(e) {
    e.stopPropagation();
    this.name = e.changed;
  }
  _roomChanged(e) {
    e.stopPropagation();
    this.roomName = e.changed;
    this.notFound = false;
    this.roomChecked = false;
  }
  _saveName(e) {
    e.stopPropagation();
    localStorage.setItem('lastName', this.name);
  }
}
customElements.define('home-page', HomePage);