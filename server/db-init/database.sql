-- @licence
--  Copyright (c) 2020 Alan Chandler, all rights reserved

--  This file is part of Meeting.

--  Meeting is free software: you can redistribute it and/or modify
--  it under the terms of the GNU General Public License as published by
--  the Free Software Foundation, either version 3 of the License, or
--  (at your option) any later version.

--  Meeting is distributed in the hope that it will be useful,
--  but WITHOUT ANY WARRANTY; without even the implied warranty of
--  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
--  GNU General Public License for more details.

--  You should have received a copy of the GNU General Public License
--  along with Meeting.  If not, see <http://www.gnu.org/licenses/>.

--
-- Database version 14 (See copy of data to default_competition below) using sqlite
--

--
--  NOTE: There are a number of settings in the Settings table that are just example values.  There is a list at the end of this file that
--        you MUST change, but the recommendation is to review off of them, and the settings in the style table to check they meet your needs.


BEGIN EXCLUSIVE;
CREATE TABLE user (
  uid integer PRIMARY KEY,
  name character varying,
  password character varying, --hashed version of password
  email character varying, --email
  pin integer, --short term password
  pin_expiry integer, --expiry date of short term password
  admin boolean NOT NULL DEFAULT 0
);


CREATE TABLE room (
  rid integer PRIMARY KEY,  --room id
  name character varying, --friendly name
  description character varying, -- Reason for room's existence
  no_host boolean NOT NULL DEFAULT 0, --if set host not required
  open_time integer, --time room is due to open (if not null). (only real host may enter before then)
  open boolean NOT NULL DEFAULT 0, --room is open (overrides open_time)
  pin integer, --a 4 digit pin - used as password for room
  max_present integer NOT NULL DEFAULT 2, --number, including host allowed in room (initially always 2, but may change in future)
  present integer, --number in room (excluding host)
  host_here boolean, -- if host is present
  host integer NOT NULL REFERENCES user(uid) ON UPDATE CASCADE ON DELETE CASCADE --owner of room
);

CREATE TABLE guest_visit (
  uid character varying NOT NULL, --uid of guest which is created on first visit
  rid integer, --room visited
  joined bigint NOT NULL DEFAULT (strftime('%s','now')),  --date joined the room
  left bigint NOT NULL DEFAULT 0 --date left room (0 not left yet)
);

CREATE TABLE failed (
  fid integer PRIMARY KEY, -- auto increment key
  uid character varying NOT NULL, --
  ip character varying NOT NULL,
  name character varying,
  date bigint NOT NULL DEFAULT (strftime('%s','now')),
  corrupt boolean NOT NULL DEFAULT 0,
  suspect boolean NOT NULL DEFAULT 0
);

CREATE TABLE settings (
  name character varying(20) PRIMARY KEY, --name of setting
  value integer -- although an integer can store strings.
);


-- END OF TABLES -------------------------------------------------------------------------------------------------


-- INDEXES --------------------------------------------------------------

CREATE UNIQUE INDEX user_name_idx ON user(name);

CREATE INDEX room_name_idx ON room(name);
CREATE INDEX room_home_idx ON room(host);

CREATE INDEX failed_uid_idx ON failed(uid);


-- END OF INDEXES -------------------------------------------------------

-- SPECIFIC SETTINGS FOR THIS VERSION OF THE SOFTWARE.

INSERT INTO settings (name,value) VALUES('version',1); --version of this configuration
-- values for client config

INSERT INTO settings (name,value) VALUES('client_log',''); --if none empty string should specify colon separated function areas client should log or 'all' for every thing.

INSERT INTO settings (name,value) VALUES('min_pass_len', 6); --minimum password length
INSERT INTO settings (name,value) VALUES('dwell_time', 2000); --time to elapse before new urls get to be pushed to the history stack
INSERT INTO settings (name,value) VALUES('meeting_user', 'meeting_user'); --name we use on cookie to hold a uid token (from user.js)
INSERT INTO settings (name,value) VALUES('meeting_host', 'meeting_host'); -- name we use on cookie to hold a host token (from login.js)
INSERT INTO settings (name,value) VALUES('token_key', 'newTokenKey'); --key used to encrypt/decrypt cookie token (new value set during db create)
INSERT INTO settings (name,value) VALUES('token_expires', 720); --hours until expire for standard logged on token
INSERT INTO settings (name,value) VALUES('pin_expires', 24); --hours until expire for temporary login pins (forgotten passwords)
INSERt INTO user (uid,name,pin,admin) VALUES(1,'admin',1234,1); --make admin user with 1234 temporary password

COMMIT;

VACUUM;
-- set it all up as Write Ahead Log for max performance and minimum contention with other users.
PRAGMA journal_mode=WAL;

