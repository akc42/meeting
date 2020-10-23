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

  const debug = require('debug')('meeting:host:profile');
  const db = require('@akc42/server-utils/database');
  const bcrypt = require('bcrypt');
  const jwt = require('jwt-simple');

  module.exports = async function(user, hoster, params, responder) {
    debug('new request' );
    let checkNameAvailable;
    let updateUser;
    let hashedPassword;
    let s;
    //is hoster changing name
    if (hoster.name !== params.name) {
      checkNameAvailable = db.prepare('SELECT name FROM user WHERE name = ?').pluck(); 
      s = db.prepare('SELECT value FROM settings WHERE name = ?').pluck();
    }
    //are we changing password
    if (params.password !== '') {
      if (params.replica !== params.password) throw new Error('Password and Replica not the same');
      hashedPassword = await bcrypt.hash(params.password, 10);
      updateUser = db.prepare('UPDATE user SET name = ?, password = ?, email = ? WHERE name = ?');
    } else {
      updateUser = db.prepare('UPDATE user SET name = ?, email = ? WHERE name = ?');
    }

    db.transaction(() => {
      let proceed = true;
      if (hoster.name !== params.name) {
        const nameFound = checkNameAvailable.get(params.name);
        if (nameFound !== null) {
          proceed = false; //we cannot continue
          responder.addSection('status', 'Name Taken');
        }
      }
      if (proceed) {
        if (params.password !== '') {
          updateUser.run(params.name, hashedPassword, params.email, hoster.name);
        } else {
          updateUser.run(params.name, params.email, hoster.name);
        }
        responder.addSection('status', 'OK');
        if (hoster.name !== params.name) {
          const tokenKey = `Meet${s.get('token_key')}`;
          const tokenExpires = s.get('token_expires');

          const payload = {
            name: params.name,
            admin: hoster.admin,
            exp: Math.round(Date.now() / 1000) + (tokenExpires * 3600),
          };
          responder.addSection('token', jwt.encode(payload, tokenKey.toString()));
          responder.addSection('authdata', {name: params.name, admin: hoster.admin});

          debug('made token with expiry', tokenExpires, 'hours from now');
        }
      }
      
    })();
  };
})();