const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

const PORT = 8080; // default port 8080

// creating an Express app
const app = express();

app.use(bodyParser.urlencoded({extended: true}));

// activate cookie parser
app.use(cookieParser());

// Setting ejs as the template engine
app.set("view engine", "ejs");

//In urlDatabase
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

//To generate the shortURL
function generateRandomString() {
  let randomStr = '';
  /*const alphaNum = 'ABCDEFGHIJKLMNOPQRSTUVWXYXabcdefghijklmnopqrstuvwxy1234567890';
  for (let i = 0; i < 6; i++) {
    let randomNum = Math.floor(Math.random() * 56 + 1);
    randomStr += alphaNum[randomNum]
  }*/
  
  randomStr = Math.random().toString(36).substring(2, 8);

  return randomStr;
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  //console.log('templateVars in urls : ',templateVars);
  res.render("urls_index", templateVars);
});

//To render to view page to Create New URL 
app.get("/urls/new", (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_new", templateVars);
});

/*app.post("/urls", (req, res) => {
  //const templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  //console.log('templateVars in urls post: ',templateVars);
  //res.render("urls_index", templateVars);

  console.log(req.body);  // Log the POST request body to the console
  res.send("Ok");         // Respond with 'Ok' (we will replace this)
});*/

/*app.post("/login", (req, res) => {
  const userName = req.body.username;
  res.cookie('username', userName);
  //const templateVars = { username: userName };
  const templateVars = { username: req.cookies["username"], urls: urlDatabase };
  //console.log('templateVars : ',templateVars);
  res.render("urls_index", templateVars);
  //res.render("/urls", templateVars);
});*/

//User login
app.post("/login", (req, res) => {
  res.cookie("username",req.body["username"]);
  res.redirect('/urls');
});

//User logout and redirecting to url_index
app.post("/logout", (req, res) => {
  //res.cookie("username",req.body["username"]);
  console.log('username : ',req.cookies["username"]);
  res.clearCookie('username');
  res.redirect('/urls');
});

//To Create a new URL
app.post("/urls/create", (req, res) => {
  const newlongURL = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = newlongURL;
  //const templateVars = { shortURL: shortURL, longURL: newlongURL};
  //const templateVars = { username: req.cookies["username"]};
  //res.redirect("/urls", templateVars);
  res.redirect("/urls");
});

//To Delete the URL
app.post("/urls/:shortURL/delete", (req, res) => {
  //console.log(urlDatabase[req.params.shortURL]); 
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");         // Redirect the client back to the urls_index page
});

//Rendering to urls_show page to update the URL
app.post("/urls/:shortURL/edit", (req, res) => {
  //console.log(urlDatabase[req.params.shortURL]); 
  const longURL = urlDatabase[req.params.shortURL];
  const templateVars = { shortURL: req.params.shortURL, longURL: longURL, username: req.cookies["username"]};
  res.render("urls_show", templateVars);
});

//Showing URL list after Update
app.post("/urls/:shortURL", (req, res) => {
  const updatedlongURL = req.body.newlongURL;
  urlDatabase[req.params.shortURL] = updatedlongURL;
  //const templateVars = { shortURL: req.params.shortURL, longURL: updatedlongURL};
  res.redirect("/urls");
});

//******Rendering to urls_show page*******/
/*app.get("/urls/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  console.log('Inside get urls/shortURL****** ', longURL);
  const templateVars = { shortURL: req.params.shortURL, longURL: longURL, username: req.cookies["username"]};
  res.render("urls_show", templateVars);
});*/

//Redirecting to the LongURL website from url_show page clicking shortURL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// app.get("/urls/:shortURL", (req, res) => {
//   const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase.b2xVn2 };
//   res.render("urls_show", templateVars);
// });

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
