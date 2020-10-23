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

  const debug = require('debug')('meeting:user:checkroom');
  const { database: db } = require('@akc42/server-utils');

  module.exports = async function(user, params, responder) {
    debug('new request ');
    if (params.host !== undefined && params.host.length > 0) {
      responder.addSection('room',
        db.prepare('SELECT name, host, CASE WHEN pin IS NULL THEN 0 ELSE 1 END as hasPin FROM room WHERE name = ? AND host = ?')
          .get(params.name, params.host));
    } else {
      responder.addSection('rooms',
        db.prepare('SELECT name, host, CASE WHEN pin IS NULL THEN 0 ELSE 1 END as hasPin FROM room WHERE name = ?').all(params.name));
    }
    debug('Done');
  };
})();