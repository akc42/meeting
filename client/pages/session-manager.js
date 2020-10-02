/**
@licence
    Copyright (c) 2020 Alan Chandler, all rights reserved

    This file is part of Football Mobile.

    Football Mobile is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Football Mobile is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Football Mobile.  If not, see <http://www.gnu.org/licenses/>.
*/

import { LitElement, html } from '../libs/lit-element.js';
import { cache } from '../libs/cache.js';
import page from '../styles/page.js';
import api from '../modules/api.js';
import global from '../modules/globals.js';
import { AuthChanged, RoundChanged, WaitRequest } from '../modules/events.js';
import Debug from '../modules/debug.js';

import {switchPath} from '../modules/utils.js';

import '/api/user.js';  //create user cookie

import './session-home.js'; //import statically because we

const debug = Debug('session');




/*
     <session-manager>
*/
class SessionManager extends LitElement {


  static get properties() {
    return {
      state: {type: String},
      authorised: {type, Boolean},
      name: {type: String},
      id: {type: Number},
      admin: {type: Boolean},
      master: {type: Boolean}
    };
  }
  constructor() {
    super();
    this.state = '';
    this.authorised = false;
    this.name = '';
    this.id = 0;
    this.admin = false;
    this._setState = this._setState.bind(this);
    /*
      We need to see if we are Master or not
    */
    this.master = false;
    this.otherTabs = new Set(); 
    this._storageHandler = this._storageHandler.bind(this);
    this.timer = setTimeout(() => {
      this.timer = 0;  //prevent out assertion being overridden by a later try
      this.master = true;
    }, 70);
    this.tabId = Date.now();

    window.addEventListener('storage', this._storageHandler);
    const unloadHandler = () => {
      localStorage.setItem('pageClose', JSON.stringify({
        master: this.master, 
        id: this.tabId, 
        size: this.otherTabs.size,
        list: Array.from(this.OtherTabs) 
      }));    
      window.removeEventListener('storage', this._storageHandler);
      window.removeEventListener('unload', unloadHandler);
    };
    window.addEventListener('unload', unloadHandler)        
    localStorage.setItem('pageOpen', this.tabId);

    this.configPromise = new Promise(resolve => {
      window.fetch('/api/config', { method: 'get' }).then(response => response.text()).then(text => {
        try {
          return JSON.parse(text);
        } catch (err) {
          //we failed to parse the json - the actual code should be in the text near the end;
          throw new ApiError(parseInt(text.substr(-6, 3), 10));
        }
      }).then(conf => { //most like just update values.
        localStorage.setItem('meetingHost', conf.meetingHost);
        localStorage.setItem('clientLog', conf.clientLog);
        localStorage.setItem('version', conf.version);
        localStorage.setItem('copyrightYear', conf.copyrightYear);
        localStorage.setItem('minPassLen', conf.minPassLen);
        localStorage.setItem('dwellTime', conf.dwellTime);

        resolve();
      }).catch((e) => {
        window.dispatchEvent(e);
        resolve()
      })
      if (localStorage.getItem('version') !== null) {
        //just one of the known values - but given it set, we should have the full set so can resolve the promise - when the answers do come we just update the values we already have.
        resolve();
      }
    });
  }
  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('session-status', this._setState);
    this.state = 'home';
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('session-status', this._setState);
    this.authorised = false;
  }
  update(changed) {
    let permission;
    if (changed.has('authorised')) {      
      if (this.authorised) {
        permission = {
          rid: this.state === 'pin' ? this.id:0,
          hid: this.state === 'login' ? this.id : 0,
          name: this.name,
          admin: this.admin
        };
      } else {
        permission = {
          rid: 0,
          hid: this.state === 'login' ? this.id : 0,
          name: this.name,
          admin: false
        };
      }
      this.state = 'home';
      this.dispatchEvent(new AuthChanged(this.permissions));
    }
    super.update(changed);
  }
  updated(changed) {
    if (changed.has('state') && this.state.length > 0) {
      if (this.state !== 'home') import(`./session-${this.state}.js`);
    }
    super.updated(changed);
  }

  render() {
    return html`
      ${this.authorised ? '': cache({
        home: html`<session-home 
          ?master=${this.master} 
          .name=${this.name} 
          @session-status=${this._setState}></session-home>`,
        pin: html`<session-pin 
          .rid=${this.id} 
          .name=${this.permission.name} 
          @session-status=${this._setState}></session-pin>`,
        login: html`<session-login 
          .hid=${this.id} 
          .name=${this.name} 
          @session-status=${this._setState}></session-login>`            
      }[this.state])}
    `;
  }
  _setState(e) {
    e.stopPropagation();
    if (e.status.name !== undefined) this.name = e.status.name;
    if (e.status.id !== undefined) this.id = e.status.id;
    if (e.status.admin !== undefined) this.admin = e.status.admin;
    this.state = e.status.state;
  }
  _storageHandler = (e) => {
    if (e.key === 'pageOpen') {
      this.otherTabs.add(localStorage.getItem('pageOpen'))
      localStorage.setItem('pageAvailable', this.tabId); //respond - so the ender knows he is not master.
    }
    if (e.key === 'pageAvailable') {
      if (this.timer > 0) {
        clearTimeout(this.timer);
        this.master = false;
      }
    }
    if (e.key === 'pageClose') {
      const closer = JSON.parse(localStorage.getItem('pageClose'));
      if (this.master) {
        this.otherTabs.delete(closer.id);
      } else {
        if (closer.master) {     
          this.otherTabs = new Set(closer.list); //Make a set from the list the closing master had
          this.otherTabs.delete(this.tabId); //remove self   
          if (closer.size === 1) {
            //must be just me left, so I become master
            this.master = true;
            
          } else {
            //We need to wait a random time before trying to become master, but
            this.timer = setTimeout(() => {
              this.timer = setTimeout(() => {
                this.master = true;
              }, 70); //wait 70 ms to see if our claim was refuted
              localStorage.setItem('pageClaim', this.tabId); //try and claim storage
            }, 70 * Math.floor((Math.random() * 40))); //wait random time between 70ms and about 3 seconds before trying to claim master
          }
        }
      }
    }
    if (e.key === 'pageClaim') {
      if(this.timer > 0 ) {
        clearTimeout(this.timer); //someone else has claimed master ship, kill of our attempt;
        this.master = false;
      }
    }
  }
}
customElements.define('session-manager', SessionManager);
