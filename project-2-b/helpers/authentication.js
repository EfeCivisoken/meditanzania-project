const { User } = require('../models');
const bcrypt = require('bcrypt');

/**
 * Holds functionality essential for user authentication.
 * @file
 */

/**
 * The logic for authentication—how the system determines if a user is who they say 
 * they are.
 * 
 * @param {string} email 
 * @param {string} password 
 * @param {function} done a function to call upon completion of the authentication 
 * @returns the result of the done function called on an error, the resulting object (or false), and a message
 */
async function authenticationStrategy(email, password, done) {

  try {
    const user = await User.findOne({ where: { email } });

    if(!user) {
      // => email is invalid
      return done(null, false, { message: 'Invalid email.' });
    }

    // => email is correct
    bcrypt.compare(password, user.passwordHash, (err, res) => {
      if(res) {
        // => password matched
        return done(null, user);
      }

      // => password does not match
      return done(null, false, { message: 'Invalid password.' });
    });

  } catch(err) {
    return done(err);
  }

}

/**
 * Serializes a User object into a unique identifier.
 * 
 * @param {User} user the user to serialize
 * @param {function} done the function to call when the user is serialized
 */
function serializeUser(user, done) {
  done(null, user.id);
}

/**
 * Deserializes a user, then calls done with that deserialzed user
 * 
 * @param {number} id the id of the user to deserialize
 * @param {function} done the function to call when the user is deserialized.
 */
async function deserializeUser(id, done) {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch(err) {
    done(err);
  }
}


module.exports = {
  authenticationStrategy,
  serializeUser,
  deserializeUser
};