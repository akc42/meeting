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


import { html,css } from '../libs/lit-element.js';
import {cache} from '../libs/cache.js';


import RouteManager from '../elements/route-manager.js';
import {RouteChanged} from '../modules/events.js';

import {WaitRequest} from '../elements/waiting-indicator.js';
import Route from '../libs/route.js';
import { api } from '../libs/utils.js';

export class RoomPage extends RouteManager {
  static get styles() {
    return css`
      :host {
        height:100%;
      }
    `;
  }
  static get properties() {
    return {
      hoster: {type: String}, //non zero length is use logged in
      roomName: {type: String}, //value from route
      roomHost: {type: String}, //value from route
      name: {type:String}, //value from route
      roomRoute: {type: Object}, //initial route
      room: {type: Object}, //room object from database
      authorised: {type: Boolean} //authorised to access room

    };
  }
  constructor() {
    super();
    this.hoster = '';
    this.roomName = '';
    this.roomHost = '';
    this.name = '';
    this.authorised = false;
    this.roomRoute = {actvice: false};
    this.roomRouter = new Route('/:host/:room/:name','page:room')
  }

  connectedCallback() {
    super.connectedCallback();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
  }
  update(changed) {
    if (changed.has('roomRoute') && this.roomRoute.active) {
      this.route = this.roomRouter.routeChange(this.roomRoute);
      if (this.route.active) {
        this._newRoute();
      }
    }
    if (changed.has('authorised') && this.authorised) {
      this.router.params = {page: 'main'}; //this should switch us to the main page
    }
    super.update(changed);
  }
  render() {
    return html`
      ${cache({
        alt: html`<room-alt managed-page .hoster=${this.hoster} .name=${this.name} .room=${this.room}></room-alt>`,
        home: html`<room-home managed-page .hoster=${this.hoster} .name=${this.name} .room=${this.room} @auth-changed=${this._auth}></room-home>`,
        main: html`<room-main managed-page .hoster=${this.hoster} .name=${this.name} .room=${this.room}></room-main>`
      }[this.page])}
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
  async _newRoute() {
    if (this.route.params.room !== this.roomName || this.route.params.host !== this.roomHost || this.route.params.name !== this.name) {
      //new room request so lets get it
      this.roomName = this.route.params.room;
      this.roomHost = this.route.params.host;
      this.name = this.route.params.name;
      this.dispatchEvent(new WaitRequest(true));
      const response = await api('user/room_details', this.route.params);
      this.dispatchEvent(new WaitRequest(false));
      this.room = response.room;

    }

  }
}
customElements.define('room-page',RoomPage);
