const bcrypt = require('bcryptjs');

// To find if user already exists
const getUserByEmail = function (email, users) {

  for (const userId in users) {
    const user = users[userId];
    if (email === user.email) {
      return user;
    }  
  }

  return false;
};


// To check the user authentication
const authenticateUser = (email, password, users) => {

  const userExist = getUserByEmail(email, users);

  if (userExist && bcrypt.compareSync(password, userExist.password)) {
    return userExist;
  }

  return false;
};


module.exports = { 
  getUserByEmail,
  authenticateUser
};