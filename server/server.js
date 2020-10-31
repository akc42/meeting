
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
  const debuguser = require('debug')('meeting:user');
  const debugauth = require('debug')('meeting:auth');
  const debugpeer = require('debug')('meeting:peer');
  const url = require('url');
  const path = require('path');
  require('dotenv').config({path: path.resolve(__dirname,'db-init','meeting.env')});

  const {logger, Responder, database:db, version:versionPromise} = require('@akc42/server-utils'); //this has to come after environment is set up
  
  const fs = require('fs');
  const  {PeerServer} = require('peer');

  const requireAll = require('require-all');
  const bodyParser = require('body-parser');
  const Router = require('router');
  const jwt = require('jwt-simple');
  const http = require('http');
  const {v4:uuidV4} = require('uuid');
  const chalk = require('chalk');

  const serverDestroy = require('server-destroy');
  const finalhandler = require('finalhandler');

  const bcrypt = require('bcrypt');
  const sendMessage = require('utils/sendmessage');

  const serverConfig = {};
  
  let server;
  let peerServer;

  function loadServers(rootdir, relPath) {
    return requireAll({
      dirname: path.resolve(rootdir, relPath),
      filter: /(.+)\.js$/
    }) || {};
  }
  function forbidden(req,res, message) {
    debug('In "forbidden"');
    logger(req.headers['x-forwarded-for'],'auth', message, 'with request url of',req.originalUrl);
    res.statusCode = 403;
    res.end('---403---'); //definitely not json, so should cause api to throw even if attempt to send status code is to no avail

  }
  function errored(req,res,message) {
    debug('In "Errored"');
    logger(req.headers['x-forwarded-for'] ,'error', message,'with request url of ',req.originalUrl);
    res.statusCode = 500;
    res.end('---500---'); //definitely not json, so should cause api to throw even if attempt to send status code is to no avail.

  }

  function finalErr (err, res, req) {
    logger('error', `Final Error at url ${req.originalUrl} with error ${err.stack}`);
  }

  function generateCookie(payload, key, expires) {
    const date = new Date();
    
    if (expires) {
      date.setTime(date.getTime() + (expires * 60 * 60 * 1000));
      payload.exp = Math.round(date.getTime() / 1000);
    }
    debug('generated cookie', key, ' expires ', expires ? date.toGMTString() : 0);
    return `${key}=${jwt.encode(payload, serverConfig.tokenKey)}; expires=${expires ? date.toGMTString() : 0}; Path=/`;
  }

  function startUp (http, serverDestroy,Router, finalhandler, Responder, logger, db, bcrypt) {
    try {
      /*
        start off a process to find the version of the app, and the copyright year
      */

      //try and open the database, so that we can see if it us upto date
      const version = db.prepare(`SELECT value FROM settings WHERE name = 'version'`).pluck();
      const dbVersion = version.get();

      const meetVersion = parseInt(process.env.DATABASE_DB_VERSION,10);
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
        serverConfig.tokenKey = `Meet${s.get('token_key').toString()}`;
        serverConfig.serverPort = s.get('server_port');
        serverConfig.peerPort = s.get('peer_port');
        clientConfig.peerPort = serverConfig.peerPort;
        serverConfig.tokenExpires = s.get('token_expires');
        clientConfig.tokenExpires = serverConfig.tokenExpires;
        serverConfig.pinExpires = s.get('pin_expires');
        clientConfig.pinExpires = serverConfig.pinExpires;
        clientConfig.clientLog = s.get('client_log');
        clientConfig.minPassLength = s.get('min_pass_len');
        clientConfig.dwellTime = s.get('dwell_time');
        clientConfig.webmaster = s.get('webmaster');
      })();

      debug('read config variables');

      const routerOpts = {mergeParams: true};
      const router = Router(routerOpts);  //create a router
      const api = Router(routerOpts);
      const usr = Router(routerOpts);
      const room = Router(routerOpts);
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
          debugapi('returned version', info.version,'and year', info.year);
        });
      })
      /*
        the next is a special route used to identify users to keep track of failed password attempts
      */
      debug('setting up user.js response')
      api.get('/user.js', (req,res) => {
        debuguser('got /api/user.js request')
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
          debuguser('making response of uid', uid, 'ip', ip);
          const token = jwt.encode(payload, serverConfig.tokenKey);
          debuguser('tracking token = ', token);
          res.writeHead(200, {
            'ETag': token,
            'Last-Modified': new Date(0).toUTCString(),
            'Cache-Control': 'private, max-age=31536000, s-max-age=31536000, must-revalidate',
            'Content-Type': 'application/javascript'
          })
          res.write(`      
document.cookie = '${serverConfig.meetingUser}=${token}; expires=0; Path=/'; 
          `);
        }
        // main checking
        if (token !== undefined && token.length > 0) {
          //we have previously set this up as an e-tag and now the browser is asking us whether it has changed
          debuguser('tracking token found as ', token);
          try {
            //we want to decode this to check it hasn't been tampered wth
            const payload = jwt.decode(token, serverConfig.tokenKey);
            debuguser('Decoded tracking token as payload', payload);
            res.statusCode = 304;
          } catch(e) {
            // someone has been messing with things so we make a new one, but mark it as corrupt, so when its used we know
            makeResponse(res, 'Corrupt');
          }
        } else if (modify !== undefined && modify.length > 0) {
          debuguser('tracking modify has a date so 304 it');
          res.StatusCode = 304;
        } else {
          //not set this up before, so lets create a uid and set it up
          makeResponse(res, uuidV4()); //unique id from uuid.v4
        }
        res.end();
        debuguser('/api/user.js response complete');
      });
      /*
          From this point on, all calls expect the user to have a meeting_user cookie.
      */
      /*
        firstly the user apis
      */

      debug('Setting up to Check Cookies from further in');
      api.use((req, res, next) => {
        debuguser('checking cookie');
        const cookies = req.headers.cookie;
        if (!cookies) {
          forbidden(req, res, 'No Cookie');
          return;
        }
        const userTester = new RegExp(`^(.*; +)?${serverConfig.meetingUser}=([^;]+)(.*)?$`);
        const matches = cookies.match(userTester);
        if (matches) {
          debuguser('Cookie found')
          const token = matches[2];
          try {
            const payload = jwt.decode(token, serverConfig.tokenKey);  //this will throw if the token is corrupt
            req.user = payload;
            debuguser('completed checking cookie')
            next();
          } catch (error) {
            forbidden(req, res, 'Invalid Auth Token');
          }
        } else {
          forbidden(req, res, 'Invalid Cookie');
        }
      });


      /*
        Room routes are all messages about change of room status - which will ultimately provide server side
        event to all the subscribed clients.
      */      
      debug('setting up room routes');
      api.use('/room', room);
      const subscribers = {};
      const rooms = loadServers(__dirname, 'room');
      for (const r in rooms) {
        debugapi(`Setting up /api/room/${r} route`);
        room.get(`/${r}`, (req, res) => {
          const params = url.parse(req.url, true).query;
          rooms[r](params, subscribers, req, res)
        });
      }


      /*
        We now only support posts request with json encoded bodies so we parse the body
      */

      api.use(bodyParser.json());
      /*
        A simple log api
      */
      debug('set up logging api')
      api.post('/log', (req,res) => {
        const ip = req.headers['x-forwarded-for'];
        const message = `${chalk.black.bgCyan(req.body.topic)} ${req.body.message}${req.body.gap !== undefined ? chalk.redBright(' +' + req.body.gap + 'ms') : ''}`;
        logger(ip,'log',message );
        res.end();
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
            await users[u](req.user, req.body, responder, req.headers);
            responder.end();
          } catch (e) {
            errored(req, res, e.toString());
          }
        });
      }


      debug('Setting up to Check Hoster Cookies');
      api.use((req, res, next) => {
        debugauth('Check Cookie');
        const cookies = req.headers.cookie;
        const hostTester = new RegExp(`^(.*; +)?${serverConfig.meetingHost}=([^;]+)(.*)?$`);
        const matches = cookies.match(hostTester);
        if (matches) {
          debugauth('Cookie found')
          const token = matches[2];
          try {
            const payload = jwt.decode(token, serverConfig.tokenKey);  //this will throw if the cookie is expired
            req.hoster = payload;
            res.setHeader('Set-Cookie', generateCookie(payload, serverConfig.meetingHost, serverConfig.tokenExpires)); //refresh cookie to the new value 
            debugauth('Cookie Check Complete')
            next();
          } catch (error) {
            forbidden(req, res, 'Invalid Auth Token');
          }
        } else {
          forbidden(req, res, 'Invalid Cookie');
        }
      });
      debug('Setting Up Hoster');
      api.use('/host', hoster);
      const hosters = loadServers(__dirname, 'host');
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
      debug('setting up admin route')
      api.use('/admin', admin);
      admin.use((req,res,next) => {
        debugauth('Check User is an Admin')
        if (req.hoster.admin === 1) {
          //we are admin, fine
          debugauth('User is Admin')
          next();
        } else {
          forbidden(req, res, 'Invalid Permissions');
        }
      });

      const admins = loadServers(__dirname, 'admin');
      for (const a in admins) {
        debug(`setting up /api/admin/${a} route`);
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
      server.listen(serverConfig.serverPort, '0.0.0.0');
      serverDestroy(server);
      versionPromise.then(info => 
        logger('app', `Release ${info.version} of Meeting Server Operational on Port:${
          serverConfig.serverPort} using node ${process.version}`));
      debug('Create the Peer Server');
      peerServer = PeerServer({
        port: serverConfig.peerPort,
        host: '/',
        ssl: {
          key: fs.readFileSync(path.resolve(__dirname, '../keys', 'meetdev-privkey.pem')),
          cert: fs.readFileSync(path.resolve(__dirname, '../keys', 'meetdev-cert.pem'))
        }
      }, () => {
          logger('app', `Peerserver started on Port ${serverConfig.peerPort}`);
      });
      peerServer.on('connection', client => {
        debugpeer('client connected', client.id);
        subscribers[client.id] = ''
      });
      peerServer.on('disconnect', client => {
        debugpeer('client disconnected', client.id);
        const clearGuest = db.prepare('UPDATE room SET guest_uid = NULL WHERE guest_uid = ?');
        const clearHost = db.prepare('UPDATE room SET host_uid WHERE host_uid = ?');
        db.transaction(() => {
          clearGuest.run(client.id);
          clearHost.run(client.id);
        })();




        if (subscribers[client.id]) delete subscribers[client.id];
        for(const id in subscribers) {
          if (typeof id !== 'string') {
            sendMessage(subscriber[id], 'disconnect', client.id);
          }
        } 
      });

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
