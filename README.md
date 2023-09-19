# todolist
This is yet another todo list but this one is made with pure javascript using Node, Express, MongoDB and EJS (templating engine).
# Features
It has a simple authentication with PassportJS using LocalStrategy
The user and task model was made with mongoose, which then applies the schema on mongodb
Password is stored encrypted on your mongodb collection
You can do the usual CRUD stuff with tasks
It also has a preferences menu to edit your name and email.
I also implemented a basic authorization middleware on each endpoint.

# What should I do to make it work?
You should firstly npm install everything, then set up your own .env file with your own port, mongodb connection string and session secret.
then just nodemon index.js
