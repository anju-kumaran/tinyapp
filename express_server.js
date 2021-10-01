const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);

const PORT = 8080; // default port 8080

// creating an Express app
const app = express();


// For body parser
app.use(bodyParser.urlencoded({extended: true}));


// activate cookie parser
app.use(cookieParser());


// Setting ejs as the template engine
app.set("view engine", "ejs");


// Object to store the URLs
const urlDatabase = {
  b6UTxQ: {
      longURL: "https://www.tsn.ca",
      userID: "aJ48lW"
  },
  i4BoGr: {
    longURL: "https://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  i3BoGr: {
      longURL: "https://www.google.ca",
      userID: "userRandomID"
  },
  b5UTxQ: {
    longURL: "https://zoom.us/",
    userID: "user2RandomID"
  }
};


// Object to store the users data
const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: bcrypt.hashSync("purple-monkey-dinosaur", salt)
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: bcrypt.hashSync("dishwasher-funk", salt)
  }
}


// To generate the shortURL
const generateRandomString = function () {

  let randomStr = '';
  randomStr = Math.random().toString(36).substring(2, 8);

  return randomStr;
}

// To Create a new user
const createUser = function (email, password, users) {

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
const findUserByEmail = function (email, users) {

  for (let userId in users) {
    const user = users[userId];
    if (email === user.email) {
      return user;
    }
  }

  return false;
};


// To check the user authentication
const authenticateUser = (email, password, users) => {

  const userExist = findUserByEmail(email, users);

  if (userExist && bcrypt.compareSync(password, userExist.password)) {
    return userExist;
  }

  // if (userExist && userExist.password === password) {
  //   return userExist;
  // }

  return false;
};


// To Create a new URL
const createNewURL = function (userId, newlongURL) {

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
const urlsForUser = function (userId) {

  const usersURLs = {};

  for (let urlId in urlDatabase) {
  
    if (urlDatabase[urlId]['userID'] === userId) {
      usersURLs[urlId] = urlDatabase[urlId];
    }
  }
  
  return usersURLs;
};


app.get("/", (req, res) => {
  
  const userId = req.cookies["user_id"];
  const user = users[userId];

  if (!user) {
    res.redirect('/login');
  }

  res.redirect('/urls');

});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


// To go to url index page
app.get("/urls", (req, res) => {

  const userId = req.cookies["user_id"];
  const user = users[userId];

  if (!user) {
    return res.status(403).send("Please <a href='/login' >Login</a> to view the URLs");
  }
  
  const urlsList = urlsForUser(userId);

  const templateVars = { user: users[userId], urls: urlsList };
  
  res.render("urls_index", templateVars);
});


// To go to User Registration Form
app.get("/register", (req, res) => {
 
  //const templateVars = { username: null };
  const templateVars = { user: null };

  res.render('register', templateVars);
});


// To handle the user registration form
app.post("/register", (req, res) => {

  //const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  
  if (email === '') {
    res.status(400).send("Sorry, You forgot to enter an Email ID! Please Go Back To <a href='/register' >Register</a>");
    return;
  } else if (password === '') {
    res.status(400).send("Sorry, You forgot to enter the Password! Please Go Back To <a href='/register' >Register</a>");
    return;
  }

  const userExist = findUserByEmail(email, users);

  if (userExist) {
    res.status(401).send("Sorry, User Already Exists! Please Go Back To <a href='/register' > Register</a>");
    return;
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const userId = createUser(email, hashedPassword, users);

  // To Set a user_id cookie containing the user's newly generated ID
  res.cookie('user_id', userId);
 
  // Redirect to '/urls' page
  res.redirect('/urls');
});


// To redirect to Login form
app.get("/login", (req, res) => {

  //res.cookie("username",req.body["username"]);
  const templateVars = { user: null };

  res.render('login', templateVars);
});


// To handle the user login form 
app.post("/login", (req, res) => {

  const email = req.body.email;
  const password = req.body.password;

  const user = authenticateUser(email, password, users);

  if (user) {
    res.cookie('user_id', user.id);
    res.redirect('/urls');
  } else {
    res.status(403).send("Sorry, Wrong Credentials!! Please Go Back To<a href='/login' > Login</a>");
  }

});


// To handle User logout and redirecting to url_index
app.post("/logout", (req, res) => {
  
  res.clearCookie('user_id');
  res.redirect('/urls');

});



// To go to urls_new page to Create New URL 
app.get("/urls/new", (req, res) => {

  const userId = req.cookies["user_id"];
 
  //const templateVars = { user: users[userId], urls: urlDatabase };  //Commented to test if it work without urls
  const templateVars = { user: users[userId] };

  if (!userId) {
    res.redirect('/login');
  }
  
  res.render("urls_new", templateVars);
});


// To Create a new URL
app.post("/urls/create", (req, res) => {

  const newlongURL = req.body.longURL;
  const userId = req.cookies["user_id"];
  
  const shortURL = createNewURL(userId, newlongURL);

  //urlDatabase[shortURL] = newlongURL;

 // const templateVars = { user: userId, shortURL: shortURL, longURL: newlongURL};
  
  res.redirect("/urls");
});


// To Delete the URL and redirect the client back to the urls_index page
app.post("/urls/:shortURL/delete", (req, res) => {

  const userId = req.cookies["user_id"];

  // To check the condition only the owner of the URL can delete
  if (!userId) {
    return res.status(401).send("You Need To<a href='/login' > Login</a> To Delete URL");
  }
  
  delete urlDatabase[req.params.shortURL];
  
  res.redirect("/urls");

});


// To render urls_show page to update the URL
app.post("/urls/:shortURL/edit", (req, res) => {

  const userId = req.cookies["user_id"];

  if (!userId) {
    return res.status(401).send("You Need To<a href='/login' > Login</a> To edit URL");
  }

  const longURL = urlDatabase[req.params.shortURL]['longURL'];

  
  const templateVars = { user: users[userId], shortURL: req.params.shortURL, longURL: longURL };
 
  res.render("urls_show", templateVars);
});


// To Show URL list after Updation
app.post("/urls/:shortURL", (req, res) => {

  const userId = req.cookies["user_id"];
  const updatedlongURL = req.body.newlongURL;
  
  console.log('urlDatabase change **** after update longURL  :   ', updatedlongURL)

  urlDatabase[req.params.shortURL]['longURL'] = updatedlongURL;


  //const templateVars = { shortURL: req.params.shortURL, longURL: updatedlongURL};
  console.log('urlDatabase change **** in index after update  :   ', urlDatabase[req.params.shortURL]);


  //const templateVars = { user: userId, shortURL: shortURL, longURL: newlongURL};

  //res.redirect("/urls");

  //const templateVars = { user: userId, urls: urlDatabase };
  //res.render("urls_index", templateVars);

  res.redirect("/urls");
});


// Redirecting to the LongURL website from url_show page by clicking shortURL
app.get("/u/:shortURL", (req, res) => {

  const longURL = urlDatabase[req.params.shortURL]['longURL'];
 
  res.redirect(longURL);
});


app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
