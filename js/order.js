const uuid = require('cassandra-driver').types.Uuid;
const utils = require('./utils.js');
const paypal = require('./paypal.js');

const get = async (req, res, client) => {
    utils.log_query('order.get', req);

    const cookie = req.signedCookies.ync_shop;
    let assertion = await utils.assert_cookie(client, cookie);
    if (!assertion) return utils.failed_request(res, 401, {'error': 'Invalid cookie'});

    // Send permanent cookie associated if different from actual
    let uorder = client.db('store').collection('order');
    uorder.find({token: cookie, id: req.query.id})
        .then((result) => res.status(200).json(result))
        .catch((error) => {
            console.log('order.get', error);
            res.status(500).json({'error': 'Internal server error'});
        });
}; exports.get = get;

const post = async (req, res, client) => {
    utils.log_query('order.post', req);

    const cookie = req.signedCookies.ync_shop;
    let assertion = await utils.assert_cookie(client, cookie);
    if (!assertion) return utils.failed_request(res, 401, {'error': 'Invalid cookie'});

    if (req.body.order.gtc !== undefined) { delete req.body.order.gtc; }
    if (req.body.order.newsletter !== undefined) { delete req.body.order.newsletter; }

    // Compute order price
    let price = 0;
    for (const id in req.body.order.items) {
        for (const size in req.body.order.items[id]) {
            const quantity = req.body.order.items[id][size];
            const item = client.db('store').collection('items').find({id: item_id})[0];
            price += item.price * quantity;
        }
    }
    req.body.order.price = price;

    const {status, data} = await paypal.postOrder(req.body.order.price);
    console.log(status, data);

    let order = {...req.body.order, cookie: req.signedCookies.ync_shop, id: uuid.random()};
    let uorder = client.db('store').collection('order');
    uorder.insertOne(order)
        .then(() => res.status(status).json({...data, uuid: order.id}))
        .catch((error) => {
            console.error('order.post', error);
            res.status(500).json({'error': 'Internal server error'});
        });
}; exports.post = post;

const remove = async (req, res, client) => {
    utils.log_query('order.remove', req);

    const cookie = req.signedCookies.ync_shop;
    let assertion = await utils.assert_cookie(client, cookie);
    if (!assertion) return utils.failed_request(res, 401, {'error': 'Invalid cookie'});

    let uorder = client.db('store').collection('order');
    uorder.deleteOne({id: req.query.id.split(',')})
        .then(() => res.status(200).json({'message': 'Item deleted'}))
        .catch((error) => {
            console.error('order.remove', error);
            res.status(500).json({'error': 'Internal server error'});
        });
}; exports.remove = remove;
