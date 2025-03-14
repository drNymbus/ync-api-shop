# YNC Node API

This application program interface uses Express to manage a simple shopping cart system, get items present in the shop and manage user's orders. Orders are paid via Paypal only, data is retrieved and inserted into an actual database (in this case MongoDB, you can see in earlier commits Cassandra driver too) for the API to work properly. Each action requires the user to be authenticated via a signed cookie. The system generates and updates these cookies as needed (through the 'connect' route under the method GET) to track user's session and cart information.

This API is part of a larger project called [YNC](https://yn-corp.xyz/home) and can be seen in action [here](https://yn-corp.xyz/api/shop)

## Exposed Routes and Methods

Root's route is `/api/shop`.

- **GET `/connect`**: In case a cookie is passed then the session is updated then user's shopping cart is retrieved. If no cookie were provided, a new session and basket is created then the new basket is sent.

        {
            "items": [string, ]
        }

- **GET `/basket`**: Retrieves the user's shopping cart.

        {
            "items": [string, ]
        }

- **POST `/basket`**: Updates the user's cart then retrieve the updated basket. Request's body:

        {
            "items": {item_id: int, }
        }

    Response's body:

        {
            "items": {item_id: int, }
        }

- **GET `/item?id=<item_id#1>[, <item_id#2>, ...]`**: Retrieves all attributes from item_id, all item ids should be separated by a comma. If no attribute exists, the list of all item ids available in the shop is sent.

        {
            "item_id": string,
            "image": string,
            "display_name": string,
            "description": string,
            "price": decimal
        }

    In case no id is provided, you'll get the lost of item ids to be queried from this route

        [
            {
                "item_id": <item_id#1>,
            }, {
                "item_id": <item_id#2>,
            }, ...
        ]

- **POST `/item`**: Adds one or several new items to the item table. The response object contains two fields containing item ids: 'completed' for every succesful item insertionl and 'rejected' for every failed item insertion. Request's body:

        {
            "items": {item_id: int, }
        }

    Response's body:

        {
            "completed": [string, ],
            "rejected": [string, ]
        }

- **DELETE `/item?id=<item_id>`**: Removes an item from the table then returns the status of the query: 200 if successful, 500 otherwise.

- **GET `/order`**: Retrieves the user's previous orders. If no orders are found an empty json object is returned.

        {
            "command_id": string,
            "item_count": integer,
            "items": [string, ],
            "address": string,
            "postal_code": string,
            "country": string,
            "name": string,
            "first_name": string,
            "mail": string,
            "phone": string,
            "processed": bool
        }

- **POST `/order`**: Adds a new order to the orders table then returns the status of the query: 200 if successful, 500 otherwise. Only one order can be posted at a time.

- **DELETE `/order?id=<item_id>`**: Removes an order from the table then returns the status of the query: 200 if successful, 500 otherwise.

In case a request cannot be completed or fails the response will update the status accordingly to the error type and contain an error message under a json format:

    {
        "error": "Error description"
    }