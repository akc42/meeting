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
import { switchPath } from '../libs/utils.js';
import { AuthChanged, DeleteRequest } from '../modules/events.js';

class DeleteRoom extends Event {
  /*
     The following are the fields provided by this event

     room: name of room to be deleted (for current host)

  */
  constructor(room) {
    super('delete-room',{composed: true, bubbles: true});
    this.room = room;
  }
};

/*
     <host-home>
*/
class HostHome extends LitElement {
  static get styles() {
    return [page,css``];
  }
  static get properties() {
    return {
      name: {type: String},
      rooms: {type: Array},
      admin: {type: Boolean},
      newroom: {type: String}
    };
  }
  constructor() {
    super();
    this.name='';
    this.rooms = [];
    this.admin = false;
    this,
    this._deleteReply = this._deleteReply.bind(this);

  }
  connectedCallback() {
    super.connectedCallback();
    this.deleteRoom = '';
    this.addEventListener('delete-reply', this._deleteReply);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('delete-reply', this._deleteReply);
  }
  update(changed) {
    super.update(changed);
  }

  updated(changed) {
    super.updated(changed);
  }
  render() {
    return html`
      <style>
        .container {
          display: flex;
          flex-direction: row-reverse;
        }
        #menu {
          flex: 1;
          border: none;
          padding: 5px;
          border-radius:5px;
          box-shadow: 2px 2px 5px 4px var(--shadow-color);
        }

        .menuitem {
          display: flex;
          flex-direction: row;
          width: 120px;
          margin: 5px;
          cursor: pointer;
          border-bottom: 1px dotted var(--menu-separator);
        }
        .menuitem > material-icon {
          align-self: flex-start;
        }
        .menuitem > div {
          margin-left: 10px;
        }
        .scrollable {
          flex: 3;
          margin-right: 10px;
        }
        .room:nth-child(odd) {
          background-color: #b6eaf7;
        }

        .room {
          display: flex;
          flex-direction: row;
          border-radius: 5px;
        }

        .room > span {
          flex: 1;
          width: var(--name-input-width);
          margin-right: auto;
          cursor: pointer;
        }
        .home {
          color: var(--home-color);
        }
        .edit {
          color: var(--edit-color);
        }
        .admin {
          color: var(--admin-color);
        }
        #newroom {
          --input-length: var(--name-input-length);
        }
        .newroom > material-icon {
          align-self: flex-end;
          margin: 0 24px 10px auto;
        }
        .room >material-icon {
          cursor: pointer;
        }
      </style>
      <app-page heading="Rooms">
        <div class="container">
          <section id="menu">
            <div class="menuitem" role="menuitem" @click=${this._goHome}><material-icon class="home">home</material-icon><div>Home</div></div>
            <div class="menuitem" role="menuitem" @click=${this._editProfile}><material-icon class="edit">account_box</material-icon><div>Edit Profile</div></div>
            ${cache(this.admin ? html`
              <div class="menuitem" role="menuitem" @click=${this._userAdmin}><material-icon class="admin">people_outline</material-icon><div>Users Admin</div></div>
            `: '')}
            <div class="menuitem" role="menuitem" @click=${this._logoff}><material-icon>exit_to_app</material-icon><div>Log Off</div></div>          
          </section>
          <section class="scrollable">
            <div class="room newroom">
              <styled-input id="newroom" label="New Room" name="newroom" @value-changed=${this._newRoomChanged}></styled-input>
              <material-icon class="add" @click=${this._newRoom}>note_add</material-icon>
            </div>
            ${cache(this.rooms.map(room => html`
              <div class="room" @click=${this._hostMeeting} data-room=${room.name}>
                <span>${room.name}</span>
                <material-icon class="edit" @click=${this._editRoom} data-room=${room.name}>room_preferences</material-icon>
                <material-icon @click=${this._deleteRoom} data-room=${room.name}>close</material-icon></div>
            `))}
          </section>
        </div>
      </app-page>
    `;
  }
  _deleteReply(e) {
    e.stopPropagation();
    if (this.deleteRoom.length > 0) {
      dispatchEvent(new DeleteRoom(this.deleteRoom));
      this.deleteRoom = '';
    }
  }
  _deleteRoom(e) {
    e.stopPropagation();
    this.deleteRoom = e.currentTarget.dataset.room;
    dispatchEvent(new DeleteRequest(`Room ${e.currentTarget.dataset.room}`));
  }
  _editProfile(e) {
    e.stopPropagation();
    switchPath('/host/profile');
  }
  _editRoom(e) {
    e.stopPropagation();
    switchPath(`/host/room/${e.currentTarget.dataset.room}`)
  }
  _goHome(e) {
    e.stopPropagation();
    switchPath('/');
  }
  _hostMeeting(e) {
    e.stopPropagation();
    switchPath(`/room/${this.name}/${e.currentTarget.dataset.room}/${this.name}`)
  }
  _logoff(e) {
    e.stopPropagation()
    this.dispatchEvent(new AuthChanged({name:''}));
    switchPath('/');
  }

  _userAdmin(e) {
    e.stopPropagation();
    switchPath('/admin');
  }

}
customElements.define('host-home', HostHome);