# node-js-sample

This is a barebones Node.js app using the [Express](http://expressjs.com/) framework.

## Running Locally

Asumming you have [Node.js](http://nodejs.org/) and [Heroku Toolbelt](https://toolbelt.heroku.com/) installed on your machine:

```sh
git clone git@github.com:heroku/node-js-sample.git # or clone your own fork
cd node-js-sample
npm install
foreman start
```

Your app should now be running on [localhost:5000](http://localhost:5000/).

## Deploying to Heroku

```
heroku create
git push heroku master
heroku open
```

## Running locally for development

Assuming you have rserve-js checked out via github in an adjacent directory, you can start Rserve locally with something like:

```sh
$(cd ../others/rserve-js/tests/ && r_files/start_no_ocap)
```

To check if it's running (can use netstat, or install sockstat):

```sh
sockstat | grep -i rserve
```

To start the node server locally:

```sh
node server.js
```

Now to use a simple client to interact with the node server and this with the Rserver, in a browser open the file test_servers/front_end.html, which initiates a connection with node at localhost:5000.

## Documentation

For more information about using Node.js on Heroku, see these Dev Center articles:

- [Getting Started with Node.js on Heroku](https://devcenter.heroku.com/articles/nodejs)
- [Heroku Node.js Support](https://devcenter.heroku.com/articles/nodejs-support)
- [Building a Real-time, Polyglot Application with Node.js, Ruby, MongoDB and Socket.IO](https://devcenter.heroku.com/articles/realtime-polyglot-app-node-ruby-mongodb-socketio)
- [Using Socket.IO with Node.js on Heroku](https://devcenter.heroku.com/articles/using-socket-io-with-node-js-on-heroku)