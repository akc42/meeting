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

  const debug = require('debug')('meeting:user:checkhoster');
  const db = require('@akc42/server-utils/database');
  const jwt = require('jwt-simple');

  module.exports = async function(user, params, responder,headers) {
    debug('new request' );
    const s = db.prepare(`SELECT value FROM Settings WHERE name = ?`).pluck();
    db.transaction(() => {
      const meetingHost = s.get('meeting_host');
      const tokenKey = `Meet${s.get('token_key')}`;
      const hostTester = new RegExp(`^(.*; +)?${meetingHost}=([^;]+)(.*)?$`);
      const matches = headers.cookie.match(hostTester);
      if (matches) {
        debug('Cookie found')
        const token = matches[2];
        try {
          const payload = jwt.decode(token, tokenKey);  //this will throw if the cookie is expired
          responder.addSection('hoster', payload);
          return;
        } catch (e) {
          //fall trough
          debug('cookie parse fails with error ', e.toString()); //probably token expired
        }
      }
    })();
    //if we get here then we failed to match the cookie
  };
})();