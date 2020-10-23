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
import { WaitRequest } from '../elements/waiting-indicator.js';
import { LitElement, html, css } from '../libs/lit-element.js';
import { api, switchPath } from '../libs/utils.js';

import '../elements/app-page.js';
import '../elements/styled-input.js';
import '../elements/material-icon.js';
import '../elements/form-manager.js';

import button from '../styles/button.js';
import { AuthChanged } from '../modules/events.js';
/*
     <login-page>
*/
class LoginPage extends LitElement {
  static get styles() {
    return [button,css``];
  }
  static get properties() {
    return {
      name: {type: String},
      password: {type: String},
      showPass: {type: Boolean},
      nameMessage: {type: String},
      pwRequired: {type: Boolean}
    };
  }
  constructor() {
    super();
    this.name = '';
    this.password = '';
    this.showPass = false;
    this.nameMessage = 'Your Name Required';
    this.pwRequired = false;
  }
  connectedCallback() {
    super.connectedCallback();
    const name = localStorage.getItem('lastName')
    if (name !== null) this.name = name;
    this.password = '';
    this.showPass = false;
    this.pwRequired = false;
  }
  disconnectedCallback() {
    super.disconnectedCallback(); 
    this.password = '';
  }
  update(changed) {
    super.update(changed);
  }
  firstUpdated() {
    this.nameInput = this.shadowRoot.querySelector('#name');
    this.makeReq = this.shadowRoot.querySelector('#makereq');
    this.passInput = this.shadowRoot.querySelector('#pw');
  }
  updated(changed) {
    super.updated(changed);
  }
  render() {
    return html`
      <style>
        .container {
          width: 250px;
          margin:0 auto;
        }
        #makereq {
          display: grid;
          grid-template-columns: 1fr 2fr 1fr;
          grid-column-gap: 5px;
          grid-row-gap: 0px;
          grid-template-areas:
            "name name ."
            "password eye eye"
            "forgotten forgotten forgotten"
        }
        #name {
          grid-area: name;
        }
        #pw {
          grid-area: password;
        }
        #see {
          grid-area: eye;
          cursor:pointer;
        }
        #forgotten {
          grid-area: forgotten;
        }
      </style>
      <app-page heading="Login">
        <div class="container">
          <form-manager id="makereq" action="user/login" @form-response=${this._formResponse}>     
            <styled-input
              id="name"
              label="Your Name"
              name="name"
              required
              .message=${this.nameMessage}
              .value=${this.name} 
              @value-changed=${this._nameChanged}></styled-input>
         
            <styled-input
              label="Password"
              ?required=${this.pwRequired}
              .minlength=${localStorage.getItem('minPassLength')}
              autofocus
              .message="min ${localStorage.getItem('minPassLength')} chars"
              type="${this.showPass ? 'text' : 'password'}"
              name="password"
              id="pw"
              .value=${this.password}
              @value-changed=${this._pwChanged}>
            </styled-input>
            <p id="see">
              <material-icon @click=${this._toggleVisibility}>${this.showPass ? 'visibility_off' : 'visibility'}</material-icon>
              Click the eye to ${this.showpass ? 'hide' : 'show'} password</p> 
            <p id="forgotten"><a href="#" @click=${this._forgotten}>Forgotten Password</a></p>
        
          </form-manager>
        </div>
        <button cancel slot="action" @click=${this._cancel}><material-icon>cancel</material-icon> Cancel</button>
        <button slot="action" @click=${this._login}><material-icon>login</material-icon> Login</button>
      </app-page>
    `;
  }
  _cancel(e) {
    e.stopPropagation();
    switchPath('/');
  }
  async _forgotten(e) {
    e.preventDefault();
    e.stopPropagation();
    if (this.name.length > 0) {
      this.dispatchEvent(new WaitRequest(true));
      const response = await api('user/forgotten', {name: this.name});
      this.dispatchEvent(new WaitRequest(false));
      if (response.status === 'OK') {
        this.nameInput.invalid = false;
        this.nameMessage = 'Your Name Required';
        this.name= response.name;
        localStorage.setItem('lastName', this.name);
        switchPath('/forgotten');
      } else {
        this.nameMessage = response.status;
        this.nameInput.invalid = true;
      }
    }
  }
  _formResponse(e) {
    e.stopPropagation();
    if (e.response.token.length > 0) {
      const cookie =`${localStorage.getItem('meetingHost')}=${e.response.token}; max-age=${parseInt(localStorage.getItem('tokenExpires'),10) * 3600}; path=/;`;
      document.cookie = cookie;
      this.name = e.response.name;
      this.dispatchEvent(new AuthChanged({name: this.name, admin: e.response.admin}));
      if (e.response.password) {
        switchPath('/host');
      } else {
        switchPath('/host/profile');
      }
    } else {
      this.passInput.invalid = true;
    }
  }
  async _login(e) {
    e.stopPropagation();
    this.pwRequired = true;
    this.requestUpdate().then(() => this.makeReq.submit());
    
  }
  _nameChanged(e) {
    e.stopPropagation();
    this.name = e.changed;
  }
  _pwChanged(e) {
    e.stopPropagation();
    this.password = e.changed;
    this.pwRequired = true;
  }
  _toggleVisibility(e) {
    e.stopPropagation();
    this.showPass = !this.showPass;
    this.pwRequired = true;
  } 
}
customElements.define('login-page', LoginPage);