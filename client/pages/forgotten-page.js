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
import '../elements/app-page.js'
import button from '../styles/button.js'
import {switchPath} from '../libs/utils.js';

/*
     <forgotten-page>
*/
class ForgottenPage extends LitElement {
  static get styles() {
    return [button, css``];
  }
  static get properties() {
    return {
    
    };
  }
  constructor() {
    super();
  }
  connectedCallback() {
    super.connectedCallback();
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
      <app-page heading="Forgotten Password">
      <p>You have been sent an e-mail continining a special onetime password that can be used to log into your account.  Use this code to 
      log in and access your profile page.  From there you can change your password.</p>
      <p>Please note that the code can only be used once and must be used within the next ${localStorage.getItem('pinExpires')} hours.</p>
      <p>If you forgot to change your password.  You will have to wait until the current short term password expires, and then repeat
      the process that led you here in the first place.  Note, that in order to prevent abuse, we will not supply a new short term passwords 
      until at least ${localStorage.getItem('pinExpires')} hours has passed since the last request.</p>
      <button slot="action" @click=${this._login}><material-icon>login</material-icon> Login</button>
      </app-page>
    `;
  }
  _login(e) {
    e.stopPropagation();
    switchPath('/login');

  }
}
customElements.define('forgotten-page', ForgottenPage);