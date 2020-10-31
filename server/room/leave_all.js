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

  const debug = require('debug')('meeting:room:leaveall');
  const db = require('@akc42/server-utils/database');
  const sendMessage = require('../utils/sendmessage');

  module.exports = function (params, subscribers, req, res) {
    const client = params.uid;
    debug('new request from client', client );
    const clearGuest = db.prepare('UPDATE room SET guest_uid = NULL WHERE guest_uid = ?');
    const clearHost = db.prepare('UPDATE room SET host_uid WHERE host_uid = ?');
    db.transaction(() => {
      clearGuest.run(req.params.uid);
      clearHost.run(req.params.uid);
    })();
    
    if (subscribers[client]) {
      //subscriber subscribed
      delete subscribers[client]; //remove him
      for(user in subscribers) {
        sendMessage(user,'left', client); //tell the remaining clients that he left.
      }
    }
   
    res.end();


    
  };
})();