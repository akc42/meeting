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

  const debug = require('debug')('meeting:utils:sendmessage');
  let messageId = 0
  module.exports = function(res,type, client) {
    debug('new request of type', type, 'with uid of', client );
    messageId++;
    res.write(`id: ${messageId.toString()}\n`);
    res.write(`event: ${type}\n`);
    res.write("data: " + client + '\n\n');
    debug('message sent with messageid', messageId);
    
  };
})();