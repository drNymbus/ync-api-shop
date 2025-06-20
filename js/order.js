const utils = require('./utils.js');
const paypal = require('./paypal.js');

const get = async (req, res, client) => {
    utils.log_query('order.get', req);

    const cookie = req.signedCookies.ync_shop;
    let assertion = await utils.assert_cookie(client, cookie);
    if (!assertion) return utils.failed_request(res, 401, {'error': 'Invalid cookie'});

    let uorder = client.db('store').collection('order');
    uorder.findOne({token: cookie, id: req.query.id}).toArray()
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

    assertion = await utils.assert_basket(client, req.body.order);
    if (!assertion) {
        utils.failed_request(res, 200, {'error': 'Not enough in store for order'});
    } else {
        req.body.order.price = await utils.compute_price_order(client, req.body.order);
        await utils.hold_basket(client, req.body.order.items);

        const {status, data} = await paypal.postOrder(req.body.order.price);
        if (status === 200 || status === 201) {
            let order = {
                ...req.body.order,
                cookie: req.signedCookies.ync_shop,
                id: utils.generate_cookie(),
                paypal_order: data.id,
                completed: false,
                paid: false
            };

            const uorder = client.db('store').collection('order');
            uorder.insertOne(order)
                .then(() => res.status(status).json({...data, uuid: order.id}))
                .catch((error) => {
                    console.error('order.post', error);
                    res.status(500).json({'error': 'Internal server error'});
                });
        } else {
            // Put back items into store
            utils.release_basket(client, req.body.order.items);
            res.status(500).json({error: "An error occured with Paypal"});
        }
    }
}; exports.post = post;

const remove = async (req, res, client) => {
    utils.log_query('order.remove', req);

    const cookie = req.signedCookies.ync_shop;
    const assertion = await utils.assert_cookie(client, cookie);
    if (!assertion) return utils.failed_request(res, 401, {'error': 'Invalid cookie'});

    const uorder = client.db('store').collection('order');
    uorder.deleteOne({id: req.query.id.split(',')})
        .then(() => res.status(200).json({'message': 'Item deleted'}))
        .catch((error) => {
            console.error('order.remove', error);
            res.status(500).json({'error': 'Internal server error'});
        });
}; exports.remove = remove;
