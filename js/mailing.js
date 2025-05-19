const utils = require('./utils.js');

const post = async(req, res, client) => {
    utils.log_query('mailing.post', req);

    const cookie = req.signedCookies.ync_shop;
    let assertion = await utils.assert_cookie(client, cookie);
    if (!assertion) return utils.failed_request(res, 401, {'error': 'Invalid cookie'});

    const mailing = client.db('store').collection('mailing');
    mailing.insertOne(req.body.user_info)
        .then(() => res.status(200))
        .catch((error) => {
            console.error('mailing.post', error);
            res.status(500).json({'error': 'Internal server error'});
        });
}

const remove = async(req, res, client) => {
    utils.log_query('mailing.remove', req);

    const cookie = req.signedCookies.ync_shop;
    let assertion = await utils.assert_cookie(client, cookie);
    if (!assertion) return utils.failed_request(res, 401, {'error': 'Invalid cookie'});

    const mailing = client.db('store').collection('mailing');
    mailing.deleteOne({mail: req.query.mail})
        .then(() => res.status(200).json({'message': 'Item deleted'}))
        .catch((error) => {
            console.error('mailing.remove', error);
            res.status(500).json({'error': 'Internal server error'});
        });
}
