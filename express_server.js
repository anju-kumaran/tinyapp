const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

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
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};


// Object to store the users data
const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
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


// To check if user authenticated
const authenticateUser = (email, password, users) => {

  const userExist = findUserByEmail(email, users);
  if (userExist && userExist.password === password) {
    return userExist;
  }

  return false;
};


app.get("/", (req, res) => {
  res.send("Hello!");
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


// To go to url index page
app.get("/urls", (req, res) => {

  const userId = req.cookies["user_id"];
  const templateVars = { user: users[userId], urls: urlDatabase };
  
  res.render("urls_index", templateVars);
});


// To go to urls_new page to Create New URL 
app.get("/urls/new", (req, res) => {

  const userId = req.cookies["user_id"];
  const templateVars = { user: users[userId], urls: urlDatabase };

  res.render("urls_new", templateVars);
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
    res.status(400).send('Please Enter Email ID!');
    return;
  } else if (password === '') {
    res.status(400).send('Please Enter Password!');
    return;
  }

  const userExist = findUserByEmail(email, users);

  if (userExist) {
    res.status(401).send('Sorry, User Already Exists!');
    return;
  }

  //const userId = createUser(name, email, password, users);
  const userId = createUser(email, password, users);

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

  //res.cookie("username",req.body["username"]);
  //console.log('req.body  login post  :  ', req.body);
  //const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;

  console.log('email after login post:', email);
  console.log('password after login post:', password);

  const user = authenticateUser(email, password, users);

  if (user) {
    res.cookie('user_id', user.id);
    res.redirect('/urls');
  } else {
    res.status(403).send('Sorry, Wrong Credentials!!');
  }

});


// To handle User logout and redirecting to url_index
app.post("/logout", (req, res) => {
  
  res.clearCookie('user_id');
  res.redirect('/urls');

});


// To Create a new URL
app.post("/urls/create", (req, res) => {

  const newlongURL = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = newlongURL;
  //const templateVars = { shortURL: shortURL, longURL: newlongURL};
  //const templateVars = { username: req.cookies["username"]};
  //res.redirect("/urls", templateVars);

  res.redirect("/urls");
});


// To Delete the URL and redirect the client back to the urls_index page
app.post("/urls/:shortURL/delete", (req, res) => {

  //console.log(urlDatabase[req.params.shortURL]); 
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");

});


// To render urls_show page to update the URL
app.post("/urls/:shortURL/edit", (req, res) => {

  //console.log(urlDatabase[req.params.shortURL]); 
  const userId = req.cookies["user_id"];
  const longURL = urlDatabase[req.params.shortURL];
  //const templateVars = { user: users[userId], shortURL: req.params.shortURL, longURL: longURL, username: req.cookies["username"]};
  const templateVars = { user: users[userId], shortURL: req.params.shortURL, longURL: longURL };
 
  res.render("urls_show", templateVars);
});


// To Show URL list after Updation
app.post("/urls/:shortURL", (req, res) => {

  const updatedlongURL = req.body.newlongURL;
  urlDatabase[req.params.shortURL] = updatedlongURL;
  //const templateVars = { shortURL: req.params.shortURL, longURL: updatedlongURL};

  res.redirect("/urls");
});


// Redirecting to the LongURL website from url_show page by clicking shortURL
app.get("/u/:shortURL", (req, res) => {

  const longURL = urlDatabase[req.params.shortURL];

  res.redirect(longURL);
});


app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
