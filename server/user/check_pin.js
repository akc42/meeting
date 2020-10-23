/**
@licence
    Copyright (c) 2020 Alan Chandler, all rights reserved

    This file is part of Meeting.

    Meeing is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Meeing is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Meeting.  If not, see <http://www.gnu.org/licenses/>.
*/

(function() {
  'use strict';

  const debug = require('debug')('meeting:user:checkpin');
  const db = require('@akc42/server-utils/database');
  const delay = require('../utils/faildelay');

  module.exports = async function(user, params, responder) {
    debug('new request' );
    let getpin;
    if (params.host.length > 0) {
      getpin = db.prepare('SELECT pin FROM room WHERE name = ? AND host = ?').pluck();
    } else {
      getpin = db.prepare('SELECT pin FROM room WHERE name = ?').pluck();
    }
    let status;
    const now = Math.floor(Date.now().getTime()/1000);
    db.transaction(() => {
      let pin
      if (params.host.length > 0) {
        pin = getpin(params.room, params.host);
      } else {
        pid = getpin(params.room);
      }
      if (pin === params.pin) {
        status = 'OK'
      } else {
        status = 'Fail'
      }
    })();
    await delay(user, status !== 'OK' );
    responder.addSection('status', status);
    return;
    
  };
})();