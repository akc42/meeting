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
import { html, css } from '../libs/lit-element.js';
import {cache} from '../libs/cache.js';

import RouteManager from '../elements/route-manager.js'

import {api} from '../libs/utils.js';
import { WaitRequest } from '../elements/waiting-indicator.js';

/*
     <host-page>
*/
class HostPage extends RouteManager {
  static get styles() {
    return css`        
      :host {
        height: 100%;
      }`;
  }
  static get properties() {
    return {
      name: {type: String},
      rooms: {type: Array},
      admin: {type: Boolean}
    };
  }
  constructor() {
    super();
    this.name = ''
    this.rooms = [];
    this.admin = false;
  }
  connectedCallback() {
    super.connectedCallback();
    if (this.name.length > 0) this._fetchRooms();
  }

  update(changed) {
    if (changed.has('name') && this.name.length > 0) {
      this._fetchRooms();
    }
    super.update(changed);
  }
  firstUpdated() {
  }
  updated(changed) {
    super.updated(changed);
  }
  render() {
    return html`
      ${cache({
        home: html`<host-home managed-page .name=${this.name} ?admin=${this.admin} .rooms=${this.rooms} @delete-room=${this._deleteRoom}></host-home>`,
        profile: html`<host-profile managed-page .name=${this.name}></host-profile>`,
        room: html`<host-room managed-page .name=${this.name} .route=${this.subRoute} .rooms=${this.rooms}></host-room>`
        
      }[this.page])}
    `;
  }
  loadPage(page) {
    this.dispatchEvent(new WaitRequest(true));
    switch (page) {
      case 'home':
      case 'profile':
      case 'room':
        import(`./host-${page}.js`).then(() => this.dispatchEvent(new WaitRequest(false)));
        break;
      default:
        return false;
    }
    return true;
  }
  async _fetchRooms() {
    const response = await api('host/rooms');
    this.rooms = response.rooms;
  }
}
customElements.define('host-page', HostPage);