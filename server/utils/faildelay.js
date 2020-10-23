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
/*
  The module provides a function which returns a promise which resolves after an appropriate delay.

  It uses (as the first parameter) the user who is provided from the document cookie that is created
  when the application starts up/

  To determine the delay it checks back over a record of previous attempts from the same user to 
  achieve a pass and increases the delay if there is a record of past failures.

  Even a passed attempt may cause a delay if the past recent history is bad - so the second parameter is whether
  the current attempt is a pass or failed.  Failed attempts definitely cause a new record to be written 
  to the history.
*/

(function () {
  'use strict';

  const debug = require('debug')('meeting:utils:faildelay');
  const db = require('@akc42/server-utils/database');

  module.exports = function (user, fail, name) {
    debug('new request');
    const writeFailure = db.prepare('INSERT INTO failed (uid, ip, name, suspect) VALUES (?,?,?, ?)');
    const checkFailures = db.prepare('SELECT COUNT(*) FROM failed WHERE uid = ? AND date > ?').pluck();
    const checkSuspect = db.prepare('SELECT COUNT(*) FROM failed WHERE uid = ? AND date > ? AND suspect = 1').pluck();
    let delay = 0;
    const now = Math.floor(Date.now() / 1000);
    db.transaction(() => {
      const f = checkFailures.get(user.uid, now - 3600);  //last hour
      const s = checkSuspect.get(user.uid, now - 3600);
      let delay = 0;
      if (!fail) {
        if (f > 3) delay = 10000
        if (s > 0) delay += 5000;
      } else {
        let suspect = 0;
        const d = checkFailures.get(user.uid, now - 86400);  //last day
        delay = 15000;
        if (s > 0) delay += 10000;
        if (d > 7) {
          const w = checkFailures.get(user.uid, now - 604800);  //last week
          delay += 5000;
          if (w > 10) {
            delay += 10000;
            suspect = 1;
          }
        }
        writeFailure.run(user.uid, user.ip, name, suspect);
      }
    })();
    return new Promise(resolve => {
      if (delay > 0) {
        setTimeout(() => resolve(), delay);
      } else {
        resolve();
      }
    });

    return;

  };
})();