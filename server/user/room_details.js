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

  const debug = require('debug')('meeting:user:roomdetails');
  const db = require('@akc42/server-utils/database');

  module.exports = async function(user, params, responder) {
    debug('new request for room',`${params.host}:${params.room}` );
    const room = db.prepare('SELECT * FROM room WHERE host= ? and name = ?').get(params.host, params.room);
    if (room) {
      debug('found room')
      room.pin = !!room.pin; //hide pin but indicate if present
      responder.addSection('room', room);
    }
    debug ('request complete');
  };
})();