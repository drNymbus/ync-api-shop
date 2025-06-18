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

    // Order capture
    const order_response = await paypal.postCapture(req.body.order.id);
    const order_status = order_response.status, order_data = order_response.data;
    if (order_status !== 200 && order_status !== 201) {
        return res.status(500).json({error: "An error occured with Paypal"});
    }

    let completed = false, paid = false;
    // Payment capture
    const id = order_data.purchase_units[0].payments.captures[0].id;
    const payment_response = await paypal.getPayment(id);
    const payment_status = payment_response.status, payment_data = payment_response.data;
    if (payment_status === 200) {
        completed = (payment_data.status === 'COMPLETED' || payment_data.status === 'PENDING');
        paid = (payment_data.status === 'COMPLETED');

        const filter = {cookie: cookie, id: req.body.order.uuid};
        const order = client.db('store').collection('order');

        await order.updateOne(filter, {$set: {completed: completed, paid: paid}});
        order.findOne(filter)
            .then((result) => { utils.send_mail(result); })
            .catch(e => console.error(`[capture.post] Cannot send mail: ${e}`));

        res.status(payment_status).json({status:payment_data.status, reason:payment_data.reason});
    } else {
        res.status(500).json({error: "An error occured with Paypal"});
    }
}; exports.post = post;
