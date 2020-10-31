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

  const debug = require('debug')('meeting:room:subscribe');
  module.exports = function(params,subscribers,req,res) {
    debug('new request' );
    if (req.headers.accept && req.headers.accept == 'text/event-stream') {
      //we make our client id from the uid passed with the request
      const client = params.uid;
       
      subscribers[client] = res; //save the response so we can use it later to send events 
      debug('creating/reusing client uid', client);
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no'
      });
      req.once('end', () => {
        debug('client uid', client, 'left');
        if (subscribers[client] !== undefined) subscribers[client] = '';
      });
      for(const c in subscribers) {
        console.log('subscriber',c);
      }
    }
  };
})();