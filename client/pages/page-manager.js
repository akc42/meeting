/**
@licence
    Copyright (c) 2020 Alan Chandler, all rights reserved

    This file provided as part of Football-Mobile

    Page page is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Page Manager is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Page Manager.  If not, see <http://www.gnu.org/licenses/>.
*/


import { html } from '../libs/lit-element.js';
import {cache} from '../libs/cache.js';

import {connectUrl, disconnectUrl} from '../modules/location.js';

import RouteManager from './route-manager.js.js';
import Route from '../modules/route.js';


import global from '../modules/globals.js';

import page from '../styles/page.js';

import './delete-dialog.js.js';

import { MenuRemove,MenuReset, WaitRequest } from '../modules/events.js';
import { switchPath } from '../modules/utils.js';

export class PageManager extends RouteManager {
  static get styles() {
    return [page];
  }
  constructor() {
    super();
    this.cidRouter = new Route('/:cid');
  }

  connectedCallback() {
    super.connectedCallback();
    connectUrl(route => {
      const cidR = this.cidRouter.routeChange(route);
      if (Number.isInteger(cidR.params.cid) && cidR.params.cid > 0 && cidR.params.cid <= global.lcid) {
        //seems like a legitimate request
        global.cid = cidR.params.cid;
        this.route = cidR;
      } else {
        /*
          some urls, don't need a cid, they are /,  /profile, /navref and /icon plus /gadm and its sub pages
        */
        if (cidR.params.cid === '' || cidR.params.cid === 'profile' || 
            cidR.params.cid === 'navref' || cidR.params.cid === 'help' || cidR.params.cid === 'gadm' ) {
          this.route = route; //just pass straight through
        } else {
          if (global.cid === 0) global.cid = global.lcid;
          switchPath(`/${global.cid}${route.path}`); //extend our path to include the cid.
        }
      }
    
    });
    this.removeAttribute('unresolved');
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    disconnectUrl();
  }

  render() {
    return html`

      <delete-dialog ></delete-dialog>

      <dialog-box id="mainmenu">
        <div class="menucontainer">
          <div role="menuitem" @click=${this._goHome}>
            <material-icon>home</material-icon><span>Home</span>
          </div>
          ${cache(this.scores ? html`
          <div id="scores" role="menuitem" @click=${this._selectPage}>
            <material-icon>people_outline</material-icon><span>Scores</span><span>F2</span>
          </div>
          `: '')}
          ${cache(this.teams ? html`
          <div id="teams" role="menuitem" @click=${this._selectPage}>
            <material-icon outlined>group_work</material-icon><span>Teams</span><span>F4</span>
          </div>
          `: '')}
          <hr class="sep" />
          ${cache(this.competitions.length > 0 ? html`
          <div id="cm" role="menuitem" @click=${this._competitionsMenu}><span>Competitions</span>
            <span>
              <material-icon>navigate_next</material-icon>
            </span></div>
          <hr class="sep" />
          `: '')}
          <div role="menuitem" @click=${this._logoff}>
            <material-icon>exit_to_app</material-icon>Log Off
          </div>
          ${cache(this.profile ? html`
          <div id="profile" role="menuitem" @click=${this._selectPage}>
            <material-icon>account_box</material-icon><span>Edit Profile</span> <span>F12</span>
          </div>
          `: '')}
          <hr class="sep" />
          <div id="navref" role="menuitem" @click=${this._selectPage}>
            <material-icon>support</material-icon><span>Navigation Help</span><span>F1</span>
          </div>
          <div id="icon" role="menuitem" @click=${this._selectPage}>
            <material-icon>image_search</material-icon><span>Icon Meanings</span>
          </div>
          ${cache((admin || global.user.approve) ? html`
          <hr class="sep" />
          <div id="approve" role="menuitem" @click=${this._selectPage}>
            <material-icon>grading</material-icon>Approve Members
          </div>
          ${cache(admin ? html`
          ${cache(global.user.global_admin ? html`
          <div id="gadm" role="menuitem" @click=${this._selectPage}>
            <material-icon>public</material-icon>Global Admin
          </div>
          `: '')}
          <div id="admin" role="menuitem" @click=${this._selectPage}>
            <material-icon>font_download</material-icon>Competition Admin
          </div>
          <div id="ahelp" role="menuitem" @click=${this._adminHelp}>
            <material-icon>support</material-icon><span>Admin Help</span>
          </div>
          `: '')}
          `: '')}
        </div>
        </dialog-box>

      ${cache({
        approve: html`<approve-page managed-page .route=${this.subRoute}></approve-page>`,
        admin: html`<admin-page managed-page .route=${this.subRoute}></admin-page>`,
        gadm: html`<gadm-page managed-page .route=${this.subRoute}></gadm-page>`,
        home:html`<home-page managed-page></home-page>`,
        icon: html`<icon-page managed-page></icon-page>`,
        navref: html`<navref-page managed-page></navref-page>`,
        profile: html`<profile-page managed-page></profile-page>`,
        register: html`<register-page managed-page></register-page>`,
        rounds: html`<rounds-page managed-page .roundRoute=${this.subRoute}></rounds-page>`,
        soon: html`<soon-page managed-page></soon-page>`,
        scores: html`<scores-page managed-page .route=${this.subRoute}></scores-page>`,
        teams: html`<teams-page managed-page .route=${this.subRoute}></teams-page>`
      }[this.page])}

    `;
  }

  loadPage(page) {
    this.dispatchEvent(new WaitRequest(true));
    import(`./${page}-page.js`).then(() => this.dispatchEvent(new WaitRequest(false)));
    this.dispatchEvent(new MenuReset(true));
    this.dispatchEvent(new MenuRemove(page));

   }

}
customElements.define('page-manager',PageManager);
