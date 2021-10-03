const bcrypt = require('bcryptjs');

// To generate the shortURL
const generateRandomString = function() {

  let randomStr = '';
  randomStr = Math.random().toString(36).substring(2, 8);

  return randomStr;

};

// To Create a new user
const createUser = function(email, password, users) {

  // To generate a random user ID
  const userId = generateRandomString();

  // Adding user info to users object
  users[userId] = {
    id: userId,
    email,
    password,
  };

  return userId;

};

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

// To Create a new URL
const createNewURL = function(userId, newlongURL, urlDatabase) {

  // To generate a random short URL
  const shortURL = generateRandomString();

  // Adding new URl to urlDatabase object
  urlDatabase[shortURL] = {
    longURL: newlongURL,
    userID: userId
  };

  return shortURL;

};

// To fetch the URLs of the logged in user
const urlsForUser = function(userId, urlDatabase) {

  const usersURLs = {};

  for (const urlId in urlDatabase) {
    if (urlDatabase[urlId]['userID'] === userId) {
      usersURLs[urlId] = urlDatabase[urlId];
    }
  }
  
  return usersURLs;

};


module.exports = {
  createUser, 
  getUserByEmail,
  authenticateUser,
  createNewURL,
  urlsForUser
};