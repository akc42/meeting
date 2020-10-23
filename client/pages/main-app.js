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

import '/api/user.js';  //create user cookie


import './error-manager.js';
import './page-manager.js';

import '../elements/waiting-indicator.js';

import Debug from '../modules/debug.js';
const logger = Debug('logger')

/*
     <main-app>: The controlling app
*/
class MainApp extends LitElement {

  static get properties() {
    return {

      serverError: {type: Boolean},

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
        page-manager[hidden], error-manager[hidden] {
          display: none !important;
        }
      </style>
      <waiting-indicator></waiting-indicator>
      <section>
        <error-manager 
          ?hidden=${!this.serverError} 
          @error-status=${this._errorChanged} ></error-manager>    
        <page-manager
          id="pages"
          ?hidden=${this.serverError}></page-manager>      
      </section>
    `;
  }

  _errorChanged(e) {
    e.stopPropagation();
    this.serverError = (e.status !== 'reset');
  }

}
customElements.define('main-app', MainApp);