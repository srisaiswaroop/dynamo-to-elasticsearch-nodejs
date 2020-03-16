const fs = require('fs');
const DynamoToES = require('../index');

const inputdata = fs.readFileSync(`${__dirname}/data/input.json`, 'utf8');
const input = JSON.parse(inputdata);

// get endpoint details
const { ES_ENDPOINT = 'http://localhost:9200' } = process.env;

test('transformEventToESBulk', async () => {
  const client = new DynamoToES({ node: ES_ENDPOINT });
  const result = client.transformEventToESBulk(input);
  expect(result).toMatchSnapshot();
});

test('bulkHandler', async () => {
  const client = new DynamoToES({ node: ES_ENDPOINT });
  await client.bulkHandler(input);
  // ToDO: need to finish checking for the items in the DB and remove them
});
