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

  const debug = require('debug')('meeting:login');
  const db = require('@akc42/server-utils/database');
  const bcrypt = require('bcrypt');
  const jwt = require('jwt-simple');

  module.exports = async function(user, params, responder) {
    debug('new request from', params.name );
    const {name, password, pin, pin_expiry, admin} = db.prepare('SELECT name, password, pin, pin_expiry, admin FROM user WHERE name = ?').get(params.name);
    debug('pin', pin, 'expires', pin_expiry, 'now', Math.floor(Date.now() / 1000));
    let passMatched = pin !== null && pin_expiry > Math.floor(Date.now() / 1000) && pin === params.password;
    const pinMatched = passMatched;
    if (!pinMatched && password !== null) {
      debug('check hashed password')
      passMatched = await bcrypt.compare(params.password, password);
    }
    let token = '';
    if (passMatched) {
      debug('We matched so build token')
      const updatePin = db.prepare('UPDATE user SET pin = NULL, pin_expiry = NULL WHERE name = ?');
      const s = db.prepare('SELECT value FROM settings WHERE name = ?').pluck();
      db.transaction(() => {
        if (pinMatched) updatePin.run(name);
        const tokenKey = `Meet${s.get('token_key')}`;
        const tokenExpires = s.get('token_expires');

        const payload = {
          name: name,
          admin: admin,
          exp: Math.round(Date.now()/ 1000) + (tokenExpires * 3600),
        };
        token = jwt.encode(payload, tokenKey.toString());
        debug('made token with expiry', tokenExpires, 'hours from now');
      })();

    }
    responder.addSection('token', token);
    responder.addSection('name', name);
    responder.addSection('admin', admin === 1);
    responder.addSection('password', !!password); //say if we have a password yet
  };
})();