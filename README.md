# todolist
This is yet another todo list but this one is made with pure javascript using Node, Express, MongoDB and EJS (templating engine).
# Features
* Implements Basic Authentication with PassportJS using LocalStrategy
* Implements OAuth2.0 Authentication for logging in with a Google account.
* The user and task model was made with mongoose, which then applies the schema on mongodb
* Password is stored encrypted on your mongodb collection
* You can do the usual CRUD stuff with tasks
* It also has a preferences menu to edit your name and email.
* I also implemented a basic authorization middleware on each endpoint.
* It uses Helmet to add recommended security headers on each request
* It uses Open API Swagger to document what each endpoint is supposed to do.

# What should I do to make it work?
You should firstly npm install everything, then set up your own .env file with your own port, mongodb connection string and session secret.
then just nodemon index.js
### Env file looks like this:
PUERTO -> the port you're listening in your app <br>
MONGO -> your mongodb database url <br>
SECRETOSESSION -> your passport secret <br>
GOOGLE_CLIENT_ID -> your google oauth2 client id <br>
GOOGLE_CLIENT_SECRET -> your google oauth2 secret <br>
APPURL -> your app's url (example https://localhost, https://milanesas.org) <br>
