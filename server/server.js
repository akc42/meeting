
/**
@licence
    Copyright (c) 2020 Alan Chandler, all rights reserved

    This file is part of meeting.

    meeting is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    meeting is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with meeting.  If not, see <http://www.gnu.org/licenses/>.
*/

(function() {
  'use strict';
  const debug = require('debug')('meeting:server');
  const debugapi = require('debug')('meeting:api');
  const path = require('path');
  require('dotenv').config({path: path.resolve(__dirname,'db-init','meeting.env')});
  const db = require('./utils/database'); //this has to come after environment is set up
  
  const fs = require('fs');

  const includeAll = require('include-all');
  const bodyParser = require('body-parser');
  const Router = require('router');
  const jwt = require('jwt-simple');
  const http = require('http');
  const {v4:uuidV4} = require('uuid');

  const serverDestroy = require('server-destroy');
  const finalhandler = require('finalhandler');

  const logger = require('./utils/logger');
  const Responder = require('./utils/responder');
  const versionPromise = require('./utils/version');
  
  const bcrypt = require('bcrypt');

  const serverConfig = {};
  
  let server;

  function loadServers(rootdir, relPath) {
    return includeAll({
      dirname: path.resolve(rootdir, relPath),
      filter: /(.+)\.js$/
    }) || {};
  }
  function forbidden(req,res, message) {
    debug('In "forbidden"');
    logger('auth', `${message} with request url of ${req.originalUrl}`, req.headers['x-forwarded-for']);
    res.statusCode = 403;
    res.end('---403---'); //definitely not json, so should cause api to throw even if attempt to send status code is to no avail

  }
  function errored(req,res,message) {
    debug('In "Errored"');
    logger('error', `${message} with request url of ${req.originalUrl}`, req.headers['x-forwarded-for']);
    res.statusCode = 500;
    res.end('---500---'); //definitely not json, so should cause api to throw even if attempt to send status code is to no avail.

  }

  function finalErr (err, res, req) {
    logger('error', `Final Error at url ${req.originalUrl} with error ${err.stack}`);
  }

  function generateCookie(payload, key, expires) {
    const date = new Date();
    date.setTime(date.getTime() + (serverConfig.tokenExpires * 60 * 60 * 1000));
    if (expires) payload.exp = Math.round(date.getTime() / 1000);
    debug('generated cookie', key, ' expires ', expiry ? date.toGMTString() : 0);
    return `${key}=${jwt.encode(payload, serverConfig.tokenKey)}; expires=${expiry ? date.toGMTString() : 0}; Path=/`;
  }

  function startUp (http, serverDestroy,Router, finalhandler, Responder, logger, db, bcrypt) {
    try {
      /*
        start off a process to find the version of the app, and the copyright year
      */

      //try and open the database, so that we can see if it us upto date
      const version = db.prepare(`SELECT value FROM settings WHERE name = 'version'`).pluck();
      const dbVersion = version.get();

      const meetVersion = parseInt(process.env.MEETING_DB_VERSION,10);
      debug('database is at version ', dbVersion, ' we require ', meetVersion);
      if (dbVersion !== meetVersion) {
        if (dbVersion > meetVersion) throw new Error('Setting Version in Database too high');
        db.pragma('foreign_keys = OFF');
        const upgradeVersions = db.transaction(() => {
          
          for (let version = dbVersion; version < meetVersion; version++) {
            if (fs.existsSync(path.resolve(__dirname, 'db-init', `pre-upgrade_${version}.sql`))) {
              //if there is a site specific update we need to do before running upgrade do it
              const update = fs.readFileSync(path.resolve(__dirname, 'db-init', `pre-upgrade_${version}.sql`), { encoding: 'utf8' });
              db.exec(update);
            }
            const update = fs.readFileSync(path.resolve(__dirname, 'db-init', `upgrade_${version}.sql`),{ encoding: 'utf8' });
            db.exec(update);
            if (fs.existsSync(path.resolve(__dirname, 'db-init', `post-upgrade_${version}.sql`))) {
              //if there is a site specific update we need to do after running upgrade do it
              const update = fs.readFileSync(path.resolve(__dirname, 'db-init', `post-upgrade_${version}.sql`), { encoding: 'utf8' });
              db.exec(update);
            }
          }
        });
        upgradeVersions.exclusive();
        db.exec('VACUUM');
        db.pragma('foreign_keys = ON');
        debug('Committed Updates, ready to go')
      }
      /*
        Get the few important settings that we need in our server, but also take the opportunity to get back what we need for
        or config route
      */
     const clientConfig= {};
      const s = db.prepare('SELECT value FROM settings WHERE name = ?').pluck();
      db.transaction(() => {
        serverConfig.meetingUser = s.get('meeting_user');
        serverConfig.meetingHost = s.get('meeting_host');
        clientConfig.meetingHost = serverConfig.meetingHost;
        serverConfig.tokenKey = s.get('token_key');
        serverConfig.tokenExpires = s.get('token_expires');
        serverConfig.pinExpires = s.get('pin_expires');
        clientConfig.clientLog = s.get('client_log');
        clientConfig.minPathLength = s.get('min_pass_len');
        clientConfig.dwellTime = s.get('dwell_time');
      })();


      const routerOpts = {mergeParams: true};
      const router = Router(routerOpts);  //create a router
      const api = Router(routerOpts);
      const usr = Router(routerOpts);
      const hoster = Router(routerOpts);
      const admin = Router(routerOpts);
    
      debug('tell router to use api router for /api/ routes');
      router.use('/api/', api);

      /*
        Our first route is very simple, we just need to return user config parameters - we set up earlier

      */
      api.get('/config', (req,res) => {
        versionPromise.then(info => {
          //we might have already done this but it doesn't matter
          clientConfig.version = info.version; 
          clientConfig.copyrightYear = info.year;
          res.end(JSON.stringify(clientConfig));
        });
      })
      /*
        the next is a special route used to identify users to keep track of failed password attempts
      */
      debug('setting up tracking.js response')
      api.get('/user.js', (req,res) => {
        debugapi('got /api/user.js request')
        const token = req.headers['if-none-match'];
        const modify = req.headers['if-modified-since'];
        const ip = req.headers['x-forwarded-for'];  //note this is ip Address Now, it might be different later. Is a useful indication for misuse.
        /*
          Special function to make a response to this request
        */
        function makeResponse(res,uid) {
          const payload = {
            uid: uid,
            ip: ip
          };
          debugapi('making response of uid', uid, 'ip', ip);
          const token = jwt.encode(payload, serverConfig.tokenKey);
          debugapi('tracking token = ', token);
          res.writeHead(200, {
            'ETag': token,
            'Last-Modified': new Date(0).toUTCString(),
            'Cache-Control': 'private, max-age=31536000, s-max-age=31536000, must-revalidate',
            'Content-Type': 'application/javascript'
          })
          res.write(`      
             Document.cookie = '${serverConfig.meetingUser}=${token}; expires= 0; Path=/' 
          `);
        }
        // main checking
        if (token !== undefined && token.length > 0) {
          //we have previously set this up as an e-tag and now the browser is asking us whether it has changed
          debugapi('tracking token found as ', token);
          try {
            //we want to decode this to check it hasn't been tampered wth
            const payload = jwt.decode(token, serverConfig.tokenKey);
            debugapi('Decoded tracking token as payload', payload);
            res.statusCode = 304;
          } catch(e) {
            // someone has been messing with things so we make a new one, but mark it as corrupt, so when its used we know
            makeResponse(res, 'Corrupt');
          }
        } else if (modify !== undefined && modify.length > 0) {
          debugapi('tracking modify has a date so 304 it');
          res.StatusCode = 304;
        } else {
          //not set this up before, so lets create a uid and set it up
          makeResponse(res, uuidV4()); //unique id from uuid.v4
        }
        res.end();
        debugapi('/api/user.js response complete');
      });
      /*
        We now only support posts request with json encoded bodies so we parse the body

      */

      api.use(bodyParser.json());
      /*
          From this point on, all calls expect the user to have a meeting_user cookie.
      */
      /*
        firstly the user apis
      */

      debug('Setting up to Check Cookies from further in');
      api.use((req, res, next) => {
        debugapi('checking cookie');
        const cookies = req.headers.cookie;
        if (!cookies) {
          forbidden(req, res, 'No Cookie');
          return;
        }
        const userTester = new RegExp(`^(.*; +)?${serverConfig.meetingUser}=([^;]+)(.*)?$`);
        const matches = cookies.match(userTester);
        if (matches) {
          debugapi('Cookie found')
          const token = matches[2];
          try {
            const payload = jwt.decode(token, serverConfig.tokenKey);  //this will throw if the cookie is expired
            req.user =payload;
            res.setHeader('Set-Cookie', generateCookie(payload, serverConfig.meetingUser)); //refresh cookie to the new value 
            next();
          } catch (error) {
            forbidden(req,res, 'Invalid Auth Token');
          }
        } else {
          forbidden(req, res, 'Invalid Cookie');
        }
      });

      api.use('/user', usr);
      debug('Setting Up Users');


      const users = loadServers(__dirname, 'user');
      for (const u in users) {
        debugapi(`Setting up /api/user/${u} route`);
        usr.post(`/${u}`, async (req, res) => {
          debugapi(`Received /api/user/${u}`);
          try {
            const responder = new Responder(res);
            await users[u](req.user, req.body, responder);
            responder.end();
          } catch (e) {
            errored(req, res, e.toString());
          }
        });
      }


      debug('Setting up to Hoster Cookies');
      api.use((req, res, next) => {
        debugapi('checking hoster cookie');
        const cookies = req.headers.cookie;
        const hostTester = new RegExp(`^(.*; +)?${serverConfig.meetingHost}=([^;]+)(.*)?$`);
        const matches = cookies.match(hostTester);
        if (matches) {
          debugapi('Cookie found')
          const token = matches[2];
          try {
            const payload = jwt.decode(token, serverConfig.tokenKey);  //this will throw if the cookie is expired
            req.hoster = payload;
            res.setHeader('Set-Cookie', generateCookie(payload, serverConfig.meetingHost, serverConfig.tokenExpires)); //refresh cookie to the new value 
            next();
          } catch (error) {
            forbidden(req, res, 'Invalid Auth Token');
          }
        } else {
          forbidden(req, res, 'Invalid Cookie');
        }
      });
      debug('Setting Up Hoster');
      api.post('/host', hoster);
      const hosters = loadServers(__dirname, 'hoster');
      for (const h in hosters) {
        debugapi(`setting up /api/host/${h} route`);
        hoster.post(`/${h}`, async (req, res) => {
          debugapi(`received /api/host/${h}`);
          try {
            const responder = new Responder(res);
            await hosters[h](req.user, req.hoster, req.body, responder);
            responder.end();
          } catch (e) {
            errored(req, res, e.toString());
          }
        });
      }
      //finally our admin routes.
      api.post('/admin', admin);
      admin.use((req,res,next) => {
        if (req.hoster.admin === 1) {
          //we are admin, fine
          next();
        } else {
          forbidden(req, res, 'Invalid Permissions');
        }
      });

      const admins = loadServers(__dirname, 'admin');
      for (const a in admins) {
        debugapi(`setting up /api/admin/${a} route`);
        admin.post(`/${a}`, async (req, res) => {
          debugapi(`received /api/admin/${req.params.cid}/${a}`);
          try {
            const responder = new Responder(res);
            await admins[a](req.user,req.hoster,req.body, responder);
            responder.end();
          } catch (e) {
            errored(req, res, e.toString());
          }
        });
      }
     debug('Creating Web Server');
      server = http.createServer((req,res) => {
        //standard values (although status code might get changed and other headers added);
        res.satusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-cache');
        const done = finalhandler(req,res,{onerr:finalErr});
        router(req,res,done);
        
      });
      server.listen(process.env.MEETING_SERVER_PORT, '0.0.0.0');
      serverDestroy(server);
      versionPromise.then(info => 
        logger('app', `Release ${info.version} of Meeting Server Operational on Port:${
          process.env.MEETING_SERVER_PORT} using node ${process.version}`));

    } catch(e) {
      logger('error', 'Initialisation Failed with error ' + e.toString());
      close();
    }
  }
  function close() {
  // My process has received a SIGINT signal

    if (server) {
      logger('app', 'Starting Meeting Server ShutDown Sequence');
      try {
        const tmp = server;
        server = null;
        //we might have to stop more stuff later, so leave as a possibility
        tmp.destroy();
        logger('app', 'Meeting  Server ShutDown Complete');
      } catch (err) {
        logger('error', `Trying to close caused error:${err}`);
      }
    }
    process.exit(0);  //database catches this and closed automatically
  }
  if (!module.parent) {
    //running as a script, so call startUp
    debug('Startup as main script');
    startUp(http, serverDestroy, Router, finalhandler, Responder, logger, db, bcrypt);
    process.on('SIGINT',close);
  }
  module.exports = {
    startUp: startUp,
    close: close
  };
})();
