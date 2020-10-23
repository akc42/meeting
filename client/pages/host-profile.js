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
import '../elements/form-manager.js';

import button from '../styles/button.js';
import { api, switchPath } from '../libs/utils.js';
import { AuthChanged } from '../modules/events.js';
import { e } from '../libs/lit-html-2cd7c8b3.js';

/*
     <host-profile>
*/
class HostProfile extends LitElement {
  static get styles() {
    return [button,css``];
  }
  static get properties() {
    return {
      name: {type: String},
      password: {type: String},
      replica: {type: String},
      email: {type: String},
      newName: {type: String}
    };
  }
  constructor() {
    super();
    this.name = '';
    this.newName = '';
    this.password = '';
    this.replica = '';
    this.email = '';
  }
  connectedCallback() {
    super.connectedCallback();
    api('host/user').then(response => {
      this.email = response.email;
    });
  }
  update(changed) {
    if (changed.has('name')) {
      this.newName = this.name;
    }
    super.update(changed);
  }
  firstUpdated() {
    this.dinput = this.shadowRoot.querySelector('#newname');
    this.einput = this.shadowRoot.querySelector('#email');
    this.pinput = this.shadowRoot.querySelector('#pw');
    this.rinput = this.shadowRoot.querySelector('#replica');
    this.doProfile = this.shadowRoot.querySelector('#doprofile')
  }
  render() {
    return html`
      <style>
        #email {
          width: var(--email-input-length);
        }
        #pw, #replica {
          width: var(--pw-input-length);
        }
        #newname {
          width: var(--name-input-length);
        }
        .subtitle {

          font-weight:bold;
        }
        #passwords {
          display: grid;
          align-items:center;
          grid-gap: 5px;
          grid-template-columns: 1fr 1fr;
          grid-template-areas:
            "pw1 ."
            "pw1 see"
            "pw1 note"
            "pw2 note"
        }
        .names {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
        }
        #pw {
          grid-area:pw1;
        }
        #replica {
          grid-area: pw2;
        }

        #see {
          grid-area: see;
          font-size:8pt;
          margin-bottom:0px;
          
        }
        #see material-icon {
          cursor: pointer;
          --icon-size: 18px;
          margin-right: 10px;
        }
        #pnote {
          grid-area: note;
        }
        .fixedemail {
          font-size: 10pt;
        }
        .fixedemail span {
          font-weight:400;
          font-size: 13.3333px;
          font-family: Roboto, sans-serif;
        }
        .explain {
          align-self: center;
        }
      </style>
      <app-page heading="User Profile">
        <form-manager
          id="doprofile"
          action="host/profile"
          class="inputs"
          @form-response=${this._formResponse}>
          <div class="names">
            <styled-input 
              id="newname" 
              label="Name to use" 
              name="name"
              .message=${this.name.length > 0 ? 'Name already in use' : 'Required'}
              required 
              value=${this.newName}
              validate=${this._checkDisplayName}
              autofocus
              @value-changed=${this._nameChanged}
              autocomplete="off"></styled-input>
          </div>
    
          <styled-input
            label="E-Mail"
            message="Use a valid email address"
            autocomplete="off"
            type="email"
            name="email"
            id="email"
            .value="${this.email}"
            @value-changed="${this._emChanged}"></styled-input>
          
          <div id="passwords">
            <styled-input              
              label="Password"
              .message="min ${localStorage.getItem('minPassLen')} chars"
              type="${this.showpass ? 'text' : 'password'}"
              name="password"
              id="pw"
              .value=${this.password}
              @value-changed=${this._pwChanged}
              .validator=${this._pwValidate}>
            </styled-input>
            <styled-input
              label="Repeat"
              .message="${'does not match'}"
              type="${this.showpass ? 'text' : 'password'}"
              name="replica"
              id="replica"
              .value=${this.replica}
              @value-changed=${this._repChanged}
              .validator=${this._replicaValidate}>
            </styled-input>
            <p id="see">
              <material-icon @click=${this._toggleVisibility}>${this.showpass ? 'visibility_off' : 'visibility'}</material-icon>
              Click the eye to ${this.showpass ? 'hide' : 'show'} passwords</p>
            
            <p id="pnote" class="explain">Only enter a password if you wish to change it.</p>
          </div>
        </form-manager>

        <button slot="action" @click=${this._changeProfile}><material-icon>save</material-icon> Update</button>
        <button slot="action" cancel @click=${this._cancel}><material-icon>cancel</material-icon> Cancel</button>
      </app-page>
    `;
  }
  _cancel(e) {
    e.stopPropagation();
    switchPath('/host');
  }
  _changeProfile(e) {
    e.stopPropagation();
    const result = this.doProfile.submit();
    if (result) {
      this.dinput.invalid = false;
      this.einput.invalid = false;
      this.pinput.invalid = false;
      this.rinput.invalid = false;
    }

  }
  _emChanged(e) {
    e.stopPropagation();
    this.email = e.changed;
  }
  _formResponse(e) {
    e.stopPropagation();
    if (e.response.status === 'OK') {
      if (e.response.token !== undefined) {
        //we changed name, so need to redo authorisation
        const cookie = `${localStorage.getItem('meetingHost')}=${e.response.token}; max-age=${parseInt(localStorage.getItem('tokenExpires'), 10) * 3600}; path=/;`;
        document.cookie = cookie;
        this.dispatchEvent(new AuthChanged(response.authdata));
      }
      switchPath('/host');
    } else {
      this.dinput.invalid = true;
    }
  }
  _nameChanged(e) {
    e.stopPropagation();
    this.newName = e.changed;
    if (this.name.length > 0) {
      this.dinput.invalid = false;
    } else {
      this.dinput.invalid = true;
    }
  }  
 
  _replicaValidate() {
    return this.password === this.replica;
  }
  async _toggleVisibility() {
    this.showpass = !this.showpass;
    await this.requestUpdate();
    this.pinput = this.shadowRoot.querySelector('#pw');
    this.rinput = this.shadowRoot.querySelector('#replica');
  }
}
customElements.define('host-profile', HostProfile);