const utils = require('./utils.js');

const post = async(req, res, client) => {
    utils.log_query('mailing.post', req);

    const cookie = req.signedCookies.ync_shop;
    const assertion = await utils.assert_cookie(client, cookie);
    if (!assertion) return utils.failed_request(res, 401, {'error': 'Invalid cookie'});

    const mailing = client.db('store').collection('mailing');
    mailing.insertOne(req.body.info)
        .then(() => res.status(200).json({'message': 'Info inserted'}))
        .catch((error) => {
            console.error('mailing.post', error);
            res.status(500).json({'error': 'Internal server error'});
        });
}; exports.post = post;

const remove = async(req, res, client) => {
    utils.log_query('mailing.remove', req);

    const cookie = req.signedCookies.ync_shop;
    const assertion = await utils.assert_cookie(client, cookie);
    if (!assertion) return utils.failed_request(res, 401, {'error': 'Invalid cookie'});

    const mailing = client.db('store').collection('mailing');
    mailing.deleteOne({mail: req.query.mail})
        .then(() => res.status(200).json({'message': 'Info deleted'}))
        .catch((error) => {
            console.error('mailing.remove', error);
            res.status(500).json({'error': 'Internal server error'});
        });
}; exports.remove = remove;
