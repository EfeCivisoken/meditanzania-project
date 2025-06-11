# Feature: Authentication

**Subroute**: `/auth/`

**Pages Exposed**: `/auth/login`, `/auth/logout`

**Tested?**: Yes (`tests/authentication.test.js`)

Authentication allows users to pass a challenge to show that they are who they say that they are. The challenge in this case is a password challenge—users will provide their email and a (hopefully secret) password in order to log into the system. This feature works using the `passport` library, and the session cookie is managed with `express-session.`

Pages can be restricted to authenticated users with a check like the following:

```javascript
if(!req.isAuthenticated()) {
  res.send('Error...');
}
```

If the user is authenticated, their corresponding user object (from the database) is attached at
```javascript
req.user
```
