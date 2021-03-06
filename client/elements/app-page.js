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
import { LitElement, html, css } from '../libs/lit-element.js';



/*
     <app-page>
*/
class AppPage extends LitElement {
  static get styles() {
    return css`
      :host{
        height:calc(100% - 20px);
        display:flex;
        flex-direction: column;
        max-width: 600px;
        margin:10px;
      }
      header {
        height: 70px;
        display: flex;
        flex-direction: row;
        flex:0 1 0;
      }
      img {
        background-color: transparent;
        padding: 3px;

      }
      #hcont {
        margin-left: 10px;
        font-weight: bold;
        display:flex;
        flex-direction: column;
        justify-content:space-between;
        flex: 1 1 auto;
        align-items: flex-end;
        min-height: 0;
      }
      header .heading {
        font-size:18px;
        text-transform: uppercase;
        flex:0 1 auto;

      }
      header .subheading {
        font-size: 10pt;
        flex:1 1 auto;

      }
      section {
        display: flex;
        flex-direction: column;
        height: calc(100% - 70px);
        flex-grow: 1;
      }

      .action {
        display: flex;
        width:100%;
        flex-direction:row;
        flex-wrap: wrap;
        justify-content: space-evenly;
        align-items: flex-end;
        margin: 5px 0px;
      }
      :host {
          height: 100%;
          display: flex;
          flex-direction: column-reverse;
          font-size:12px;
          --icon-size:24px;
        }
        #menuicon, #closeicon {
          display: flex;
          flex-direction: row;
          cursor:pointer;
          background-color: var(--header-icon-background-color);
          color: var(--header-icon-color);
          margin: 0 15px;
          border: none;
          padding: 5px;
          border-radius:5px;
          box-shadow: 2px 2px 5px 4px var(--shadow-color);
          --icon-size:30px;
        }
        #menuicon:active, #closeicon.active {
          border: none;
          padding: 5px;
          border-radius:5px;
          box-shadow: 2px 2px 5px 4px var(--shadow-color);
          box-shadow:none;
        }
        .menucontainer {
          display:flex;
          flex-direction: column-reverse;
          padding: 10px;
        }

        [role="menuitem"] {
          --icon-size: 18px;
          height: 20px;
          display:flex;
          flex-direction:row;
          cursor: pointer;
        }
        [role="menuitem"] span:nth-of-type(2) {
          margin-left:auto;
        }
        [role="menuitem"]>material-icon {
          margin-right: 4px;
        }
        hr.sep {
          width:100%;
          border-top: 1px -solid var(--menu-separator);
        }
      @media (min-width: 500px) {

        :host {
          margin: 0 auto 0 auto;
          max-height: 100%;
          border-radius: 10px;
          box-shadow: 0px 0px 38px -2px var(--shadow-color);
          padding: 20px;
          min-width: 500px;
          box-sizing: border-box;
        }

      }

       @media (min-width: 500px) {
          :host, .menucontainer {
            flex-direction: column;
          }

          [role="menuitem"] {
            height: 20px;
          }
        }

      @media (max-width: 300px) {
        header {
          transform: scale(0.75);
          transform-origin: left top;
        }
      }
    `;
  }
  static get properties() {
    return {
      heading: {type: String}
    };
  }
  constructor() {
    super();
    this.heading='';
  }
  render() {
    return html`
      <header>
        <img src="/images/meeting-logo.svg" height="64px"/>
        <div id="hcont">
          <div class="heading">${this.heading}</div>
          <div class="subheading"><slot name="subheading"></slot></div>
        </div>
      </header>
      <section>
        <slot></slot>
        <div class="action"><slot name="action"></slot></div>
      </section>
      <footer>
      
      </footer>
    `;
  }
}
customElements.define('app-page', AppPage);