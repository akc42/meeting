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

/*
  The purpose of this file is to hold all the definitions of custom events used in pas.  We define
  event here as a sublassing of window event and then don't need to use customEvent.

 
  export class MyEvent extends Event {
    

    // a place to document event fields
    myData;

    constructor(myData) {
      super(MyEvent.eventType);
      this.myData = myData;
    }
  }
  -----------
  this.dispatchEvent(new MyEvent(42));

  el.addEventListener(MyEvent.eventType, e => console.log(e.myData));

*/



export class AuthChanged extends Event {
  

  /*
     The following are the fields provided by this event

     changed: 

  */

  constructor(changed) {
    super('auth-changed',{composed: true, bubbles: true});
    this.changed = changed;
  }
};

export class CalendarReply extends Event {
  

  /*
     The following are the fields provided by this event

     date: Resultant Date/Time after editing in seconds since 1970

  */

  constructor(date) {
    super('calendar-reply',{composed: true, bubbles: true});
    this.date = date;
  }
};

export class CalendarRequest extends Event {
  

  /*
     The following are the fields provided by this event

     date: Starting Date Time in Seconds since 1970

  */

  constructor(date) {
    super('calendar-request',{composed: true, bubbles: true});
    this.date = date;
  }
};

export class CommentChanged extends Event {
  

  /*
     The following are the fields provided by this event

     changed: new value of comment

  */

  constructor(changed) {
    super('comment-changed',{composed: true, bubbles: true});
    this.changed = changed;
  }
};
export class CommentReply extends Event {
  

  /*
     The following are the fields provided by this event

     comment: edited string;

  */

  constructor(comment) {
    super('comment-reply', { composed: true, bubbles: true });
    this.comment = comment;
  }
};

export class CommentRequest extends Event {
  

  /*
     The following are the fields provided by this event

     comment: String to be edited 

  */

  constructor(comment) {
    super('comment-request',{composed: true, bubbles: true});
    this.comment = comment;
  }
};

export class CommentShow extends Event {
  

  /*
     The following are the fields provided by this event

     comment: 

  */

  constructor(comment) {
    super('comment-show',{composed: true, bubbles: true});
    this.comment = comment;
  }
};

export class CompetitionChanged extends Event {
  

  /*
     The following are the fields provided by this event

     changed: an object with at least a cid field.  Fields are:
      cid - id of appropriate competion
      adm - uid of administration (0 if unassign)
      name - new name if name changed.
  */

  constructor(changed) {
    super('competition-changed',{composed: true, bubbles: true});
    this.changed = changed;
  }
};



export class DeleteReply extends Event {
  

  /*
     The following are the fields provided by this event

     none: A reply is a confirmation, no reply is a reject  

  */

  constructor() {
    super('delete-reply',{composed: true, bubbles: true});
  }
};


export class DeleteRequest extends Event {
  

  /*
     The following are the fields provided by this event

     item: The name of the item being requested to delete.

  */

  constructor(item) {
    super('delete-request',{composed: true, bubbles: true});
    this.item = item;
  }
};

export class ErrorStatus extends Event {


  /*
     The following are the fields provided by this event

     status: We have an update releted to our error

  */

  constructor(status) {
    super('error-status', { composed: true, bubbles: true });
    this.status = status;
  }
};

export class FormError extends Event {
  

  /*
     The following are the fields provided by this event

     none

  */

  constructor() {
    super('form-error',{composed: true, bubbles: true});
  }
};




export class InputReply extends Event {
  

  /*
     The following are the fields provided by this event

     reply: field and value

  */

  constructor(reply) {
    super('input-reply',{composed: true, bubbles: true});
    this.reply = reply;
  }
};

export class InputRequest extends Event {
  

  /*
     The following are the fields provided by this event

     request: field and value

  */

  constructor(request) {
    super('input-request',{composed: true, bubbles: true});
    this.request = request;
  }
};

export class KeyPressed extends Event {
  

  /*
     The following are the fields provided by this event

     keys: The code string of the key pressed. (but event.key when one is pressed)

  */

  constructor(keys) {
    super('key-pressed',{composed: true, bubbles: true});
    this.key = keys;
  }
};

export class KeyUpdated extends Event {
  

  /*
    The purpose of this event is to cross inform subsytems that something they may be interested in has been updated.
    The <app-pages> element will eventually receive these, and depending where it comes from will send update and agreed parameter on the 
    subsystems that might be interest.

    key value that they are both interested in has updated. This allows a subsystem, that may not actualy be active to update its data

    The following are the fields provided by this event

     entity:  The type of entity (as a string) that this refers to. We will keep the list of allowed entities names here:-


  */

  constructor(entity, key) {
    super('key-updated', { composed: true, bubbles: true });
    this.entity = entity;
    this.key = key;
  }
};

export class MasterClose extends Event {
  /*
     This event is fired on the window when a master tab closes.  Its for the home page to re check the master
     promise to see if made it.

  */
  constructor() {
    super('master-close',{composed: true, bubbles: true});
  }
};

export class OverlayClosed  extends Event {
  

  /*
     The following are the fields provided by this event

     reason: reason overlay closed
     position: x,y coordinates of mouse click outside box that caused it to close 

  */

  constructor(reason,position) {
    super('overlay-closed',{composed: true, bubbles: true});
    this.reason = reason;
    this.position = position;
  }
};

export class OverlayClosing extends Event {
  

  /*
     The following are the fields provided by this event

     none

  */

  constructor() {
    super('overlay-closing',{composed: true, bubbles: true});
  }
};

export class OverwriteWarning extends Event {
  

  /*
     The following are the fields provided by this event

     None

  */

  constructor() {
    super('overwrite-warning',{composed: true, bubbles: true});
  }
};

export class PageClose extends Event {
  

  /*
     The following are the fields provided by this event

    none: 

  */

  constructor() {
    super('page-close', { composed: true, bubbles: true });
  }
};

export class PageClosed extends Event {
  

  /*
     The following are the fields provided by this event

    none: 

  */

  constructor() {
    super('page-closed', { composed: true, bubbles: true });
  }
};


export class PageData extends Event {
  

  /*
     The following are the fields provided by this event

     pageData: 

  */

  constructor(pageData) {
    super('page-data',{composed: true, bubbles: true});
    this.pageData = pageData;
  }
};

export class PageTitle extends Event {
  

  /*
     The following are the fields provided by this event

     pageTitle: Title to be displayed at head of page

  */

  constructor(pageTitle) {
    super('page-title', { composed: true, bubbles: true });
    this.pageTitle = pageTitle;
  }
};



export class RouteChanged extends Event {
  

  /*
     The following are the fields provided by this event

     changed: path and segment (route) that has changed 

  */

  constructor(route) {
    super('route-changed',{composed: true, bubbles: true});
    this.changed = route;
  }
};


export class ValueChanged extends Event {
  

  /*
     The following are the fields provided by this event

     changed: the new value

  */

  constructor(value) {
    super('value-changed',{composed: true, bubbles: true});
    this.changed = value;
  }
};


