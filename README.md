# dynamo-to-elasticsearch-nodejs
Performance oriented node.js lambda handler for DynamoDB to Elastic search using DynamoDB streams. This module uses Bulk processing. Compatible with node 12.x and above. 

## Getting Started

Install:
```bash
npm i dynamo-to-elasticsearch-nodejs
```
Use it in your lambda:
```javascript
const DynamoToES = require('dynamo-to-elasticsearch-nodejs');

exports.handler = async function handler(event) {
  const client = new DynamoToES({ node: process.env.ES_ENDPOINT });
  const response = await client.bulkHandler(event);
  return response;
};
```
_star_ this repository if it works as expected!!

### Parameters


### Running tests

Tests are written in using jest. Tests can be launched using:

```bash
npm test
```

## Authors & Contributors

* [sri sai swaroop](https://github.com/srisaiswaroop)

## License

This project is licensed under the GNU GPL v3 License - see the [LICENSE.md](LICENSE.md) file for details

