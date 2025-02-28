const express = require('express');

// Request parsers
const { queryParser } = require('express-query-parser');
const bodyParser = require('body-parser');
const cors = require('cors');

// Cookie parsers
const cookieParser = require('cookie-parser');

// Database driver
// const cassandra = require('cassandra-driver');
const { MongoClient } = require('mongodb');

// Route's functions
const session = require('./js/session.js');
const basket = require('./js/basket.js');
const item = require('./js/item.js');
const order = require('./js/order.js');
const capture = require('./js/capture.js');
const utils = require('./js/utils.js');

// Set up express app
const app = express();
const port = 8080;

// Parse body in case of POST method
app.use(bodyParser.json());
app.use(
    queryParser({
      parseNull: true,
      parseUndefined: true,
      parseBoolean: true,
      parseNumber: true,
      parseList: true
    })
);

app.use(cors({origin: true, credentials: true}));

// Loading secrets for signature's cookies
const cookie_secret = process.env.COOKIE_SECRET || 'little-secret';
app.use(cookieParser(cookie_secret));

// Connect to database
// const client = new cassandra.Client({
//     contactPoints: [process.env.CASSANDRA_CONTACT_POINTS || '127.0.0.1'],
//     localDataCenter: 'datacenter1',
//     keyspace: 'store',
//     credentials: { username: 'shop_api', password: 'shopapi' }
// });
const driver = process.env.MONGO_DRIVER || 'mongodb';
const username = process.env.MONGO_USERNAME || 'shop_api';
const password = process.env.MONGO_PASSWORD || 'shop_api';
const contact  = process.env.MONGO_CONTACT_POINT || 'localhost:27017';
const uri = `${driver}://${username}:${password}@${contact}/store`;
console.log(uri);
const client = new MongoClient(uri);
// Send a ping to confirm a successful connection
client.db("admin").command({ ping: 1 });

// Routes
app.route('/*/').get((req, res) => {
    utils.log_query('/', req);
    res.send("SHOP API")
});
app.route('/*/connect').get((req, res) => {
    const cookie = req.signedCookies.ync_shop;
    if (!cookie) {
        session.createSession(req, res, client);
    } else {
        session.retrieveSession(req, res, client, cookie);
    }
});

app.route('/*/basket')
    .get((req, res) => basket.get(req, res, client))
    .post((req, res) => basket.post(req, res, client));

app.route('/*/item')
    .get((req, res) => { item.get(req, res, client); })
    .post((req, res) => { item.post(req, res, client); })
    .delete((req, res) => { item.remove(req, res, client); });

app.route('/*/order')
    .get((req, res) => order.get(req, res, client))
    .post((req, res) => order.post(req, res, client))
    .delete((req, res) => order.remove(req, res, client));

app.route('/*/capture')
    .get((req, res) => capture.get(req, res, client))
    .post((req, res) => capture.post(req, res, client));

// Start the server
app.listen(port, () => { console.log(`(Express-app) Server is running on port ${port}`)})