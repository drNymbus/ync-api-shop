const utils = require('./utils.js');
const paypal = require('./paypal.js');

const get = async (req, res, client) => {
    utils.log_query('capture.get', req);

    const cookie = req.signedCookies.ync_shop;
    let assertion = await utils.assert_cookie(client, cookie);
    if (!assertion) return utils.failed_request(res, 401, {'error': 'Invalid cookie'});

    const {status, data} = await paypal.getOrder(req.query.id);
    res.status(status).json(data);
}; exports.get = get;

const post = async (req, res, client) => {
    utils.log_query('capture.post', req);

    const cookie = req.signedCookies.ync_shop;
    let assertion = await utils.assert_cookie(client, cookie);
    if (!assertion) return utils.failed_request(res, 401, {'error': 'Invalid cookie'});

    const {status, data} = await paypal.postCapture(req.body.order.id);
    console.log(status, data);

    const order = client.db('store').collection('order');

    const filter = {cookie: cookie, id: req.body.order.uuid};
    console.log('capture post', filter);
    await order.updateOne(filter, {$set: {paid: true}});
    order.findOne(filter).then((result) => { utils.send_mail(result); });

    res.status(status).json(data);
}; exports.post = post;
