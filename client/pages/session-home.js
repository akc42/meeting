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
import api from '../modules/api.js';

/*
     <session-home>
*/
class SessionHome extends LitElement {
  static get styles() {
    return css``;
  }
  static get properties() {
    return {
      master: {type: Boolean},  //If I am the master tab, I am allowed to log in
      name:{type: String}, //name by which user will be known as in chat room
      rid: {type:Number},
      rooms: {type: Array}
    };
  }
  constructor() {
    super();
    this.name = '';
    this.rid = 0;
    this.rooms = [];
  }
  connectedCallback() {
    super.connectedCallback();
    const rooms = localStorage.getItem('recentRooms');
    if (rooms !== null) {
      this.rooms = JSON.parse(rooms);
    }

  }
  disconnectedCallback() {
    super.disconnectedCallback();
  }
  update(changed) {
    super.update(changed);
  }
  firstUpdated() {
  }
  updated(changed) {
    super.updated(changed);
  }
  render() {
    return html`
      <style>
      </style>
      <div class="container">
        <styled-input label="Name" .value=${this.name} @value-changed=${this._nameChanged}></styled-input>
        <styled-input label="Room" combo .value=${this.rid} @value-changed=${this._roomChanged} .items=${this.rooms}></styled-input>
      </div>
    `;
  }
  _nameChanged(e) {
    e.stopPropogation();
    this.name = e.changed;
  }
  _roomChanged(e) {
    e.stopPropogation();
    const room = e.changed;
    if (typeof room === 'string') {
      api('user/check_room', {name: room}).then(response => {
        const c = response;
      });
    } else {
      this.rid = room;
    }
  }
}
customElements.define('session-home', SessionHome);