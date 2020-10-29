/**
@licence
    Copyright (c) 2020 Alan Chandler, all rights reserved

    This file is part of Meeting.

    Meeting is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Meeting is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Meeting.  If not, see <http://www.gnu.org/licenses/>.
*/
import {ApiError, generateUri} from '../libs/utils.js';
import { MasterClose } from './events.js';





let master = false;
let masterResolver;
let masterPromise = new Promise(resolve => masterResolver = resolve);
  

let otherTabs = new Set();
let timer = 0.
const tabId = Date.now().toString();
const storageHandler = (e) => {
  if (e.key === 'pageOpen') {
    otherTabs.add(localStorage.getItem('pageOpen'))
    localStorage.setItem('pageAvailable', tabId); //respond - so the ender knows he is not master.
  }
  if (e.key === 'pageAvailable') {
    if (timer > 0) {
      clearTimeout(timer);
      master = false;
      masterResolver(false);
    }
  }
  if (e.key === 'pageClose') {
    const closer = JSON.parse(localStorage.getItem('pageClose'));
    if (master) {
      otherTabs.delete(closer.id);
    } else {
      if (closer.master) {
        otherTabs = new Set(closer.list); //Make a set from the list the closing master had
        otherTabs.delete(tabId); //remove self  
        masterPromise = new Promise(resolve => masterResolver = resolve);

        if (closer.size === 1) {
          //must be just me left, so I become master
          master = true;
          masterResolver(true);
        } else {
          //We need to wait a random time before trying to become master, but
          timer = setTimeout(() => {
            timer = setTimeout(() => {
              master = true;
              masterResolver(true);
            }, 70); //wait 70 ms to see if our claim was refuted
            localStorage.setItem('pageClaim', tabId); //try and claim storage
          }, 70 * Math.floor((Math.random() * 40))); //wait random time between 70ms and about 3 seconds before trying to claim master
        }
        window.dispatchEvent(new MasterClose());
      }
    }
  }
  if (e.key === 'pageClaim') {
    if (timer > 0) {
      clearTimeout(timer); //someone else has claimed master ship, kill of our attempt;
      master = false;
      masterResolver(false);
    }
  }
}

window.addEventListener('storage', storageHandler);
const unloadHandler = () => {
  const uid = sessionStorage.getItem('uid');
  if (uid !== null) {
    window.fetch(generateUri('/api/room/leave_all',{uid: uid}), { method: 'get' });
  }
  localStorage.setItem('pageClose', JSON.stringify({
    master: master,
    id: tabId,
    size: otherTabs.size,
    list: Array.from(otherTabs)
  }));
  window.removeEventListener('storage', storageHandler);
  window.removeEventListener('unload', unloadHandler);
};
window.addEventListener('unload', unloadHandler);
timer = setTimeout(() => {
  timer = 0;  //prevent out assertion being overridden by a later try
  master = true;
  masterResolver(true);
}, 70);
localStorage.setItem('pageOpen', tabId);

const configPromise = new Promise(resolve => {
  window.fetch('/api/config', { method: 'get' }).then(response => response.text()).then(text => {
    try {
      return JSON.parse(text);
    } catch (err) {
      //we failed to parse the json - the actual code should be in the text near the end;
      throw new ApiError(parseInt(text.substr(-6, 3), 10));
    }
  }).then(conf => { //most like just update values.
    localStorage.setItem('meetingHost', conf.meetingHost);
    localStorage.setItem('clientLog', conf.clientLog);
    localStorage.setItem('version', conf.version);
    localStorage.setItem('copyrightYear', conf.copyrightYear);
    localStorage.setItem('minPassLength', conf.minPassLength);
    localStorage.setItem('pinExpires', conf.pinExpires);
    localStorage.setItem('dwellTime', conf.dwellTime);
    localStorage.setItem('webmaster', conf.webmaster);
    localStorage.setItem('peerPort', conf.peerPort);
    localStorage.setItem('tokenExpires', conf.tokenExpires);
    resolve();
  }).catch((e) => {
    window.dispatchEvent(new Error(e));
    resolve()
  });
  if (localStorage.getItem('version') !== null) {
    //just one of the known values - but given it set, we should have the full set so can resolve the promise - when the answers do come we just update the values we already have.
    resolve();
  }
});



const global = {
  get config() {
    return configPromise;
  },
  get master() {
    return masterPromise;
  }
}

export default global;
