# Controllers

To enforce MVC design principles, we break up our system into its models, views, and controllers. This directory contains all controllers. Each controller controls an aspect of the system. For example, a `UserController` might allow adding, finding, listing, removing, and updating users via GET, POST, CREATE, and DELETE requests.

To implement a route in a controller, add a function to the controller's exports:

```javascript
// file: controllers/user.js
'use strict';

exports.listUsers = (req, res) => {
    // do something
};
```

Notice the following:

- the `listUsers` function is of identical form to the anonymous (arrow) function we used in labs previously
- JavaScript is partially functional in nature—`listUsers` is an exported *variable* that is a function. You'll see why this matters in a second.

In the main (`server.js`) file, you connect this controller to the router like so:

```javascript
// file: /server.js
// ...
const userController = require('./controllers/user');
// ...
app.get('/users', userController.listUsers);
```

We're just passing the function in where we would previously write an anonymous function.
