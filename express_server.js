const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
const { createUser } = require("./helpers");
const { getUserByEmail } = require("./helpers");
const { authenticateUser } = require("./helpers");
const { createNewURL } = require("./helpers");
const { urlsForUser } = require("./helpers");

const PORT = 8080; // default port 8080

// creating an Express app
const app = express();

// For body parser
app.use(bodyParser.urlencoded({extended: true}));

app.use(
  cookieSession({
    name: "session",
    keys: ["This is a test", "Test 2"]
  })
);

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
};


app.get("/", (req, res) => {
  
  const userId = req.session.user_id;
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

  const userId = req.session.user_id;
  const user = users[userId];

  if (!user) {
    return res.status(403).send("Please <a href='/login' >Login</a> to view the URLs");
  }
  
  const urlsList = urlsForUser(userId, urlDatabase);
  const templateVars = { user: users[userId], urls: urlsList };
  
  res.render("urls_index", templateVars);

});


// To go to User Registration Form
app.get("/register", (req, res) => {

  // To redirect to /urls if already logged in
  const userId = req.session.user_id;
  if (userId) {
    res.redirect('/urls');
  }
 
  const templateVars = { user: null };
  res.render('register', templateVars);

});


// To handle the user registration form
app.post("/register", (req, res) => {

  const email = req.body.email;
  const password = req.body.password;
  
  if (email === '') {

    res.status(400).send("Sorry, You forgot to enter an Email ID! Please Go Back To <a href='/register' >Register</a>");
    return;
  } else if (password === '') {

    res.status(400).send("Sorry, You forgot to enter the Password! Please Go Back To <a href='/register' >Register</a>");
    return;
  }

  const userExist = getUserByEmail(email, users);

  if (userExist) {

    res.status(401).send("Sorry, User Already Exists! Please Go Back To <a href='/register' > Register</a>");
    return;
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const userId = createUser(email, hashedPassword, users);

  // To set a user_id session containing the user's newly generated ID
  req.session.user_id = userId;
 
  // Redirect to '/urls' page
  res.redirect('/urls');

});


// To redirect to Login form
app.get("/login", (req, res) => {

  // To redirect to /urls if already logged in
  const userId = req.session.user_id;
  if (userId) {
    res.redirect('/urls');
  }

  const templateVars = { user: null };

  res.render('login', templateVars);

});


// To handle the user login form
app.post("/login", (req, res) => {

  const email = req.body.email;
  const password = req.body.password;

  const user = authenticateUser(email, password, users);

  if (user) {

    req.session.user_id = user.id;
    res.redirect('/urls');
  } else {

    res.status(403).send("Sorry, Wrong Credentials!! Please Go Back To<a href='/login' > Login</a>");
  }

});


// To handle User logout and redirecting to url_index
app.post("/logout", (req, res) => {
  
  req.session = null;
  res.redirect('/urls');

});


// To go to urls_new page to Create New URL
app.get("/urls/new", (req, res) => {

  const userId = req.session.user_id;
 
  if (!userId) {
    res.redirect('/login');
  }

  const templateVars = { user: users[userId] };
  
  res.render("urls_new", templateVars);

});


// To Create a new URL
app.post("/urls", (req, res) => {

  const userId = req.session.user_id;
  if (!userId) {
    return res.status(401).send("You Need To<a href='/login' > Login</a> To Create URL");
  }

  const newlongURL = req.body.longURL;
  const shortURL = createNewURL(userId, newlongURL, urlDatabase);
  
  const templateVars = { user: users[userId], shortURL: shortURL, longURL: newlongURL };
 
  res.render("urls_show", templateVars);

});


// To Show URL page if user is logged in and owns the URL for the given ID
app.get("/urls/:shortURL", (req, res) => {

  const userId = req.session.user_id;

  // If user is not logged in
  if (!userId) {
    return res.status(401).send("You Need To<a href='/login' > Login</a> To View URL");
  }

  // If a URL for the given ID does not exist
  if (!urlDatabase[req.params.shortURL]) {
    return res.status(401).send("URL for the given ID does not exist");
  }
 
  // If user is logged in but does not own the URL for the given ID:
  if (urlDatabase[req.params.shortURL]['userID'] !== userId) {
    return res.status(401).send("You don't own the URL for the given ID ");
  }

  const templateVars = { user: users[userId], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]['longURL'] };
 
  res.render("urls_show", templateVars);

});


app.post("/urls/:shortURL", (req, res) => {

  const userId = req.session.user_id;

  // If user is not logged in
  if (!userId) {
    return res.status(401).send("You Need To<a href='/login' > Login</a> To edit URL");
  }
 
  // If user is logged in but does not own the URL for the given ID:
  if (urlDatabase[req.params.shortURL]['userID'] !== userId) {
    return res.status(401).send("You don't own the URL for the given ID ");
  }

  const updatedlongURL = req.body.newlongURL;
  urlDatabase[req.params.shortURL]['longURL'] = updatedlongURL;

  res.redirect("/urls");
  
});


// To Delete the URL and redirect back to the urls_index page
app.post("/urls/:shortURL/delete", (req, res) => {

  const userId = req.session.user_id;

  if (!userId) {
    return res.status(401).send("You Need To<a href='/login' > Login</a> To Delete URL");
  }

  // If user is logged in but does not own the URL for the given ID:
  if (urlDatabase[req.params.shortURL]['userID'] !== userId) {
    return res.status(401).send("You don't own the URL for the given ID ");
  }
  
  delete urlDatabase[req.params.shortURL];
  
  res.redirect("/urls");

});


// Redirecting to the LongURL website from url_show page by clicking shortURL
app.get("/u/:shortURL", (req, res) => {

  if (!urlDatabase[req.params.shortURL]) {
    return res.status(401).send("URL for the given ID does not exist");
  }

  const longURL = urlDatabase[req.params.shortURL]['longURL'];
 
  res.redirect(longURL);

});


app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
