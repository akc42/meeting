/**
    @licence
    Copyright (c) 2019 Alan Chandler, all rights reserved

    This file is part of PASv5, an implementation of the Patient Administration
    System used to support Accuvision's Laser Eye Clinics.

    PASv5 is licenced to Accuvision (and its successors in interest) free of royality payments
    and in perpetuity in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the
    implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. Accuvision
    may modify, or employ an outside party to modify, any of the software provided that
    this modified software is only used as part of Accuvision's internal business processes.

    The software may be run on either Accuvision's own computers or on external computing
    facilities provided by a third party, provided that the software remains soley for use
    by Accuvision (or by potential or existing customers in interacting with Accuvision).
*/
/*
    `<pas-input>` Provides a stylised input element and label for use

*/

import { LitElement, html, css } from '../libs/lit-element.js';
import {ifDefined} from '../libs/if-defined.js';
import {cache} from '../libs/cache.js';

import { ValueChanged } from '../modules/events.js';
import error from '../styles/error.js';


class StyledInput extends LitElement {
  static get styles() {
    return [error,css`
      :host {
        display: block;
        margin-bottom: 10px;
        margin-top: 10px
      }
      input, textarea {
        border: 2px solid var(--accent-color);
        padding: 2px;
        border-radius: 4px;
        font-family: Roboto, sans-serif;
        width: var(--input-width, 100%);
        box-sizing: border-box;
      }
      input:focus, textarea:focus {
        outline: none;
      }

      textarea {
        font-family:'NotoColorEmoji', 'Roboto Mono', monospace;
      }
      .labelcontainer {
        display: flex;
        flex-direction: row;
        padding: 2px;
        width: 100%;

      }
      label {
        font-size: 10pt;
        flex: 1 0 0;
      }
      .error {
        white-space: nowrap;
        flex: 2 0 0;
      }
    `];
  }

  static get properties() {
    return {
      label: {type: String},
      disabled: {type: Boolean},
      invalid: {type: Boolean, reflect: true},
      title: {type: String},
      type: {type: String},
      pattern: {type: String},
      preventInvalid: {type: Boolean},
      placeholder: {type: String},
      autocomplete: {type: String},
      autofocus: {type: Boolean},
      form: {type: String},
      items: {type: Array}, //can either be array of strings or array of objects with {id: value, name: label} only defined for datalist
      name: {type: String},
      readonly: {type: Boolean},
      required: {type: Boolean},
      _required: {type: Boolean},
      value: {type: String},
      maxlength: {type: Number},
      minlength: {type: Number},
      max: {type: Number},
      min: {type: Number},
      step: {type: Number},
      message:{type: String},
      validator: {type: Function},
      textArea: {type: Boolean},
      cols: {type: Number},
      rows: {type: Number},
      wrap: {type: String}
    };
  }
  constructor() {
    super();
    this.items = [];
    this.label = '';
    this.name = '';
    this.type='text';
    this.disabled = false;
    this.autofocus = false;
    this.readonly = false;
    this.required = false;
    this._required = false;
    this.preventInvalid = false;
    this.value = '';
    this.invalid = false;
    this.textArea = false;
    this.message = 'Invalid Input';
    this._placeholder = this.label; //only for now
    this._inputChanged = this._inputChanged.bind(this);

  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._required = false;
  }

  firstUpdated() {
    this.input = this.shadowRoot.querySelector('#input');
    if (this.textArea) this.requestUpdate(); //needed so we set target on emoji button
    this.invalid = !this.input.validity.valid; //just make sure we know the current situation
  }
  updated(changed) {
    if (changed.has('combo')) {
      if (this.combo) {
        this.list = 'dropdown';
      } else {
        delete this.list;
      }
    }
    if (changed.has('value') && changed.get('value') !== undefined) {
      this.validate();
      this.dispatchEvent(new ValueChanged(this.value));
    }
    if (changed.has('_required') && this.input !== undefined) {
      this.invalid = !this.input.validity.valid;
    }
    if (changed.has('required') && !this.required) this._required = false; //removed the required flag so make _required match

    super.updated(changed);
  }
  render() {
    return html`
      <div class="labelcontainer">
        <label id="label" for="input" >${this.label}</label>
        ${cache(this.invalid? html`
          <div class="error" role="alert">
            <material-icon>cancel</material-icon><span>${this.message}</span>
          </div>
        `:'')}

      </div>   
      ${this.textArea ?  html`
        <textarea
          id="input"
          aria-labelledby="label"
          ?disabled=${this.disabled}
          name=${this.name}
          ?readonly=${this.readonly}
          placeholder=${this._placeholder}
          autocomplete=${ifDefined(this.autocomplete)}
          ?autofocus=${this.autofocus}
          form=${ifDefined(this.form)}
          maxlength="${ifDefined(this.maxlength)}"
          minlength="${ifDefined(this.minlength)}"
          cols=${ifDefined(this.cols)}
          rows=${ifDefined(this.rows)}
          wrap=${ifDefined(this.wrap)}
          .value=${this.value}
          @input=${this._inputChanged}
          @blur=${this._blur}>${this.value}</textarea>
      ` : html`
        <input
          id="input"
          type=${this.type}
          aria-labelledby="label"
          ?disabled=${this.disabled}
          title=${ifDefined(this.title)}
          pattern=${ifDefined(this.pattern)}
          placeholder=${this._placeholder}
          autocomplete=${ifDefined(this.autocomplete)}
          ?autofocus=${this.autofocus}
          form=${ifDefined(this.form)}
          list=${ifDefined(this.items.length > 0 ? 'dropdown' : undefined)}
          name=${this.name}
          maxlength="${ifDefined(this.maxlength)}"
          minlength="${ifDefined(this.minlength)}"
          ?readonly=${this.readonly}
          ?required=${this._required}
          .value=${this.value}
          max=${ifDefined(this.max)}
          min=${ifDefined(this.min)}
          step=${ifDefined(this.step)}
          @input=${this._inputChanged}
          @blur=${this._blur}
        />
        ${this.items.length > 0 ? html`
          <datalist id="dropdown">
            ${this.items.map(item => html`<option value="${typeof item === 'string'? item: item.id}">${typeof item === 'string' ? '': item.name}</option>`)}
          </datalist>`:''}
        `}
    `;
  }

  focus() {
    if (this.input !== undefined) this.input.focus();
  }
  setRangeText(t) {
    if (this.input !== undefined) this.input.setRangeText(t);
  }
  validate() {
    if (this.input !== undefined && !this.input.validity.valid) {
        this.invalid = true;
    } else if (typeof this.validator === 'function' ) {
      this.invalid = !this.validator(this.input === undefined ? this.value : this.input.value);
    } else if (this.required && !this._required) { //if we do a validity check, the actual required flag should now take its place
      this.invalid =  this.value.length === 0; 
      this._required = this.required;
    } else {
      this.invalid = (this.input !== undefined && !this.input.validity.valid);
    }
    return !this.invalid;
  }
  _blur(e) {
    this._required = this.required;
  }
  _inputChanged(e) {
    e.stopPropagation();
    this.validate();
    if (!(this.invalid && this.preventInvalid)) {
      if (this.combo && this.items.length > 0 && typeof this.items[0] !== 'string') {
        this.value = this.items.find(item => item.name === e.target.value).id;
      }
      this.value = e.target.value;
    }
  }
}
customElements.define('styled-input', StyledInput);
