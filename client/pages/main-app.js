/**
@licence
    Copyright (c) 2020 Alan Chandler, all rights reserved

    This file is part of Football-Mobile.

    Football-Mobile is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Football-Mobile is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Football-Mobile.  If not, see <http://www.gnu.org/licenses/>.
*/
import { LitElement, html } from '../libs/lit-element.js';
import {cache} from '../libs/cache.js';

import Debug from '../modules/debug.js';

import './error-manager.js';
import './session-manager.js';

import '../elements/waiting-indicator.js';

const logger = Debug('logger')

/*
     <fm-app>: The controlling app
*/
class MainApp extends LitElement {

  static get properties() {
    return {
      permissions: {type: Object},
      serverError: {type: Boolean},
      authorised: {type: Boolean}
    };
  }
  constructor() {
    super();
    this.route = {active: false};
    this.permissions = {rid: 0, hid: 0, admin: false, name: '' };
    this.serverError = false;
    this.authorised = false;
  }
  connectedCallback() {
    super.connectedCallback();
    this.removeAttribute('unresolved');
    logger('Main App Started'); 
  }
  disconnectedCallback() {
    super.disconnectedCallback();
  }

  render() {
  
    return html`  
      <style>
        html,
        body {
          height: 100vh;
          width: 100vh;
          margin: 0;
        }
        session-manager[hidden], page-manager[hidden], error-manager[hidden] {
          display: none !important;
        }
      </style>
      <waiting-indicator></waiting-indicator>
      <section>
        <error-manager 
          ?hidden=${!this.serverError} 
          @error-status=${this._errorChanged} ></error-manager>    
        <session-manager 
          ?hidden=${this.authorised || this.serverError} 
          id="session" 
      
          @permissions-changed=${this.__permissionsChanged}></session-manager>
        ${cache(this.authorised ? html`
          <page-manager
            id="pages"
            .permissions=${this.permissions}
            ?hidden=${this.serverError}
            @permissions-changed=${this._permissionsChanged}></page-manager>      
        `:'')}
      </section>
    `;
  }
  _permissionsChanged(e) {
    e.stopProgation();
    this.permissions = e.changed;
    this.authorised = this.permissions.rid > 0 || this.permissions.hid > 0;
    if (this.authorised) {
      import('./page-manager.js');
    }
  }
  _errorChanged(e) {
    e.stopPropagation();
    this.serverError = (e.status !== 'reset');
  }
  _hostChanged(e) {
    e.stopPropagation();
    this.isHost = e.changed;
  }
  _pinAuthorised(e) {
    e.stopPropagation();
    this.rid = e.rid;
  }
  _roomLeave(e) {
    e.stopPropagation()
    this.router.params = {page: ''};
  }
}
customElements.define('main-app', MainApp);