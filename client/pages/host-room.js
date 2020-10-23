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
 import '../elements/app-page.js';
import page from '../styles/page.js';
import Route from '../libs/route.js';

/*
     <host-room>: edit a room
*/
class HostRoom extends LitElement {
  static get styles() {
    return [page,css``];
  }
  static get properties() {
    return {
      name: {type: String},
      rooms: {type: Array},
      room: {type:  Object},
      route: {type: Object}
    };
  }
  constructor() {
    super();
    this.name='';
    this.rooms = [];
    this.room = {name: ''};
    this.route = {active: false};
    this.router = new Route('/:name', 'page:room')

  }
  connectedCallback() {
    super.connectedCallback();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
  }
  update(changed) {
    if (changed.has('route') && this.route.active) {
      const roomRoute = this.router.routeChange(this.route);
      if (roomRoute.active) {
        this.room = this.rooms.find((r) => {})
      }

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
      <style>
      </style>
      <app-page heading="Rooms">
        
      </app-page>
    `;
  }
}
customElements.define('host-room', HostRoom);