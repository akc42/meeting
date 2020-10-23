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

const { deflate } = require('zlib');

(function() {
  'use strict';

  const debug = require('debug')('meeting:user:forgotten');
  const {logger, database:db} = require('@akc42/server-utils');
  const path = require('path');
  const nodemailer = require('nodemailer');
  const htmlToText = require('html-to-text');
  const delay = require('../utils/faildelay')

  const header1 = `<!DOCTYPE html><html style="font-size: 100%; overflow-y:scroll;-webkit-text-size-adjust:100%;
  -ms-text-size-adjust:100%;"><head style><meta charset="utf-8"><title>Your Temporary Password</title>`;
  const header3 = `<meta name="description" content="Temporary Password"><meta name="author" content="Meeting Adminstration"></head>
    <body style="background-color:#FFFFFF;margin:0;font-size:11pt;line-height:1.231;font-family:sans-serif;color:#222;">
    <div style="width:620px;margin:auto;background-color:#FFF;padding:5px 30px;border solid 2px black">
    <img src="cid:image1" alt="Site Logo" height="64px"/>`;
  const footer = `<p></p><div style="font-size: 100%;"></div></div></body></html>`;



  //eslint-disable-next-line max-len,no-useless-escape
  const emailRegex = /^(,?\s*\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b)+$/i;



  function validateEmail(email) {
    debug('validating ', email);
    if (email) return emailRegex.test(email);
    return false;
  }

  module.exports = async function(user, params, responder, headers) {
    debug('new request' );
    const newPin = ('000000' + (Math.floor(Math.random() * 999999)).toString()).slice(-6); //make a new pin 
    debug('going to use pin', newPin);
    const checkParticipant = db.prepare('SELECT email, name, pin, pin_expiry FROM user WHERE name = ?');
    const s = db.prepare('SELECT value FROM settings WHERE name = ?').pluck();
    let mailData;
    let actualName = '';
    let emailValid = false;
    const updateParticipant = db.prepare(`UPDATE user SET pin = ?, pin_expiry = ? WHERE name = ?`);
    db.transaction(() => {
      debug('in transaction about to check participant with name', params.name);
      const {email, name, pin, pin_expiry}  = checkParticipant.get(params.name);
      actualName = name;

      if (validateEmail(email)) emailValid = true;

      if (pin !== null) debug('existing pin expires', pin_expiry, 'time now', Math.floor(Date.now() / 1000));
      if ((pin === null || pin_expiry < Math.floor(Date.now() / 1000)) && email && emailValid) {
        debug('found user from uid as email = ', email);
        const siteBaseref = 'https://' + headers['host']; //not from database
        const webmaster = s.get('webmaster');
        const pinExpires = s.get('pin_expires');
        const expires = Math.floor(Date.now() / 1000) + (pinExpires * 3600) ;
        debug('read the config values');

        const header2 = `<link rel="dns-prefetch" href="${siteBaseref}">`;
        const html = header1 + header2 + header3 + `<h3>Hi ${name}</h3><p>Someone requested a short term password to log 
        on to <a href="${siteBaseref}">${siteBaseref}</a>. They
        requested for it to be sent to this email address. If it was not you, you can safely ignore this email but might like to inform 
        <a href="mailto:${webmaster}">${webmaster}</a> that you were not expecting it.</p>

        <p>Return to the site (using the link above) and enter the following code as your password.  This is only a short term password and it
        can only be used once and will <strong>not</strong> work after <strong>${pinExpires} hours</strong> from
        the time you requested it.</p>

        <p>Your code: <strong>${newPin}</strong></p>

        <p>Regards</p>
        
        <p>Meeting Administration</p>` + footer;

        mailData = {
          subject: 'Your Temporary Password',
          to: process.env.ENABLE_EMAIL === 'yes' ? email : process.env.ENABLE_EMAIL,
          from: webmaster,
          html: html,
          text: htmlToText.fromString(html, {
            wordwrap: 130,
            linkHrefBaseUrl: siteBaseref,
            hideLinkHrefIfSameAsText: true
          }),
          attachments: [
            {
              path: path.resolve(__dirname, '../../client/images', 'meeting-logo.svg'),
              cid: 'image1'
            }
          ]
        };
        updateParticipant.run(newPin, expires, params.name); //update user with new pin we just created and sent
        debug('upated user ', params.name, 'with new pin we just made')
      }
    })();
    //outside of the transaction, so can now be asynchonous again.

    if (mailData) { 
      const transport = nodemailer.createTransport({
        port: 25,
        host: 'localhost',
        secure: false,
        ignoreTLS: true
      });
      const info = await transport.sendMail(mailData);
      logger('app', `Pin for temporary password sent to ${mailData.to} with message id ${info.meddageId}`);
      await delay(user, true, params.name); // count as a failed attempt
    } else {
      await delay(user, true, params.name);
      await delay(user, false, params.name); //count as one failed attempt followed by an OK attempt
    }
    responder.addSection('status', mailData? 'OK': actualName.length > 0 ? (emailValid ? 'Forgotten too Frequent':'Invalid Email' )  :'Invalid Name');
    responder.addSection('name', actualName);
  
  };
})();