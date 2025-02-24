const utils = require('./utils.js');

const get = async (req, res, client) => {
    utils.log_query('item.get', req);

    const cookie = req.signedCookies.ync_shop;
    let assertion = await utils.assert_cookie(client, cookie);
    if (!assertion) return utils.failed_request(res, 401, {'error': 'Invalid cookie'});

    let item = client.db('store').collection('item');
    let result = [];
    if (req.query.id === undefined) { // Retrieve all store items
        // client.execute(utils.item.select_all)
        // .then((result) => res.status(200).json(result.rows))
        // .catch((error) => {
        //     console.error('item.get', error);
        //     res.status(500).json({'error': 'Internal server error'});
        // });
        result = await item.find({id : {$ne:'dummy'}}).toArray();
        for (let i = 0; i < result.length; i++) {
            const blob = result[i].image;
            const image = (blob === undefined || blob === null) ? "undefined" : blob.toString('base64');
            result[i].image = `data:image/jpeg;base64,${image}`;
        }

    } else { // Retrieve items specified in query id field
        // client.execute(utils.item.select, [req.query.id.split(',')]).then((result) => { // retrieve item.s
        //     let data = result.rows;
        //     for (let i = 0; i < data.length; i++) {
        //         const blob = data[i].image;
        //         const image = (blob === undefined || blob === null) ? "undefined" : blob.toString('base64');
        //         data[i].image = `data:image/jpeg;base64,${image}`;
        //     }
        //     res.status(200).json(data); // send item.s
        // });
        result = await item.find({id: { $in: req.query.id.split(',') }}).toArray();
        for (let i = 0; i < result.length; i++) {
            const blob = result[i].image;
            const image = (blob === undefined || blob === null) ? "undefined" : blob.toString('base64');
            result[i].image = `data:image/jpeg;base64,${image}`;
        }
    }

    res.status(200).json(result);
}; exports.get = get;

const post = async (req, res, client) => {
    utils.log_query('item.post', req);

    const cookie = req.signedCookies.ync_shop;
    let assertion = await utils.assert_cookie(client, cookie);
    if (!assertion) return utils.failed_request(res, 401, {'error': 'Invalid cookie'});

    const valid_ids = [], unvalid_ids = [];
    // for (let i in req.body) {
    //     let src_item = req.body[i], id = req.body[i].id; // item information
    //     await client.execute(utils.item.insert, src_item, {prepare:true}) // add item to table
    //         .then(() => { valid_ids.push(id); }) // If promise completed add id to valid ids
    //         .catch(() => { unvalid_ids.push(id); }); // If promise failed add id to unvalid ids
    // }

    res.status(200).json({completed: valid_ids, rejected: unvalid_ids}); // send all ids (completed & rejected)
}; exports.post = post;

const remove = async (req, res, client) => {
    utils.log_query('item.remove', req);

    const cookie = req.signedCookies.ync_shop;
    let assertion = await utils.assert_cookie(client, cookie);
    if (!assertion) return utils.failed_request(res, 401, {'error': 'Invalid cookie'});

    // await client.execute(utils.item.delete, [req.query.id.split(',')]); // delete item from database
    // client.execute(utils.basket.select, [req.signedCookies.ync_shop])
    //     .then(() => res.status(200).json({'message': 'Item deleted'}))
    //     .catch((error) => {
    //         console.error('item.remove', error);
    //         res.status(500).json({'error': 'Internal server error'});
    //     });
}; exports.remove = remove;

