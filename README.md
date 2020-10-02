Inspired by [Web Dev Simplified](https://youtu.be/DvlyzDZDEq4)

This is my version of a simplified video chat.  I only need it as person to person video, to replace Jitsi Meet which itself it taking up almost all the resources on my cloud server.  It may morph into more of a multi person conferencing app later, but my initial release does not have that aim.

Some things that I want to achieve

- Only registered users may create rooms
- Rooms should have very friendly names - and should be matched by the url
- Rooms may be, at the creators descretion, password protected.  A simple 4 digit code is all that is needed.
- The creator can require to be one of the participants, or they may create a room for two other people to use.
- Only the creator has an account on the system and has to sign in to make use of those facilities, other users have to provide a name, but
  it is not stored anywhere, other than in the room when they enter it.
- Rooms may have an opening time, before which user is taken to a page with a count down timer until the room opens (if within
  an hour of the opening time) which automatically redirects them to the room when it reaches zero. If earlier than an hour before
  it should just say room closed.
- In a room each user should be able to select a single audio devices (if they have more than one), and one or more video cameras to show. At any   
  time they should be able to mute the sound and/or "mute" one of the cameras without leaving the room.  
- There should be two room views:-
   1) Main view has other persons view as large, own view as small
   2) Both peoples views of equal size.
   A user should be able to toggle between the views easily.
- Multiple cameras can fit into the view port they have been assigned on one of three ways selectable by the viewer
  1) One camera selected, the others shown is small icons outside the viewing area all together
  2) One camera selected taking the majority of the view space, with other cameras being small
  3) All cameras showing equal size.
- In any view were one or more cameras are small they should show above the large one and be dragable by the viewer to another position on the screen
- One user is designated as admin (created when database is first set up).  The admin may create other users but these users are not able to create others.
- Each user has a profile page where they may change their name and or password.
- Users when created are given a one time 6 digit pin, which enables them to only visit the profile page to set up a password.  The same is true of forgotten passwords.  The pin is emailed