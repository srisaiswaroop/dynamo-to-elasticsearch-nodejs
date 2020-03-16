const DynamoDB = require('aws-sdk/clients/dynamodb');
const { Client } = require('@elastic/elasticsearch');

// can pickup Elastic search URL from environment variable
const DEFAULT_CONFIG = { maxRetries: 5, requestTimeout: 300000, node: process.env.ES_ENDPOINT };

class DynamoToES {
  constructor(config = {}) {
    this.client = new Client(Object.assign(DEFAULT_CONFIG, config));
    this.log = config.log || console;
    this.transformParsedRecord = config.transformParsedRecord;
    this.onError = config.onError;
    this.tableToIndexMap = config.tableToIndexMap || {};
    this.actionMap = { INSERT: 'index', MODIFY: 'index', DELETE: 'delete' };
    this.log.debug('DynamoToES constructor');
  }

  getActionEntry(parsedRecord) {
    const { eventName, keys, indexName } = parsedRecord;
    const id = Object.values(keys).reduce((acc, curr) => acc.concat(curr), '');
    this.log.info(`getActionEntry: ${id}`);
    return { [this.actionMap[eventName]]: { _index: indexName, _id: id } };
  }

  getParsedRecord(record) {
    const tableName = record.eventSourceARN.split('/')[1];
    const parsedRecord = DynamoDB.Converter.unmarshall({
      newImage: { M: record.dynamodb.NewImage || {} },
      oldImage: { M: record.dynamodb.OldImage || {} },
      keys: { M: record.dynamodb.Keys },
      eventName: { S: record.eventName },
      tableName: { S: tableName },
      indexName: { S: this.tableToIndexMap[tableName] || tableName.toLowerCase() },
    });
    if (this.transformParsedRecord && typeof this.transformParsedRecord === 'function') {
      return this.transformParsedRecord(parsedRecord);
    }
    return parsedRecord;
  }

  transformEventToESBulk(event) {
    const bulkQueryInput = [];
    for (const record of event.Records) {
      const { eventName } = record;
      const parsedRecord = this.getParsedRecord(record);
      // push action entry
      bulkQueryInput.push(this.getActionEntry(parsedRecord));
      // push relavent data
      if (this.actionMap[eventName] === 'index') {
        bulkQueryInput.push(parsedRecord.newImage);
      }
    }
    return bulkQueryInput;
  }

  async bulkHandler(event) {
    const body = this.transformEventToESBulk(event);
    const { body: bulkResponse } = await this.client.bulk({ refresh: true, body });
    await this.handleErrors(bulkResponse, body);
  }

  // Async function to support asynchronous onError method as input
  async handleErrors(bulkResponse, body) {
    if (bulkResponse.errors) {
      this.log.info('Found Errors while processing');
      const erroredDocuments = [];
      // The items array has the same order of the dataset we just indexed.
      bulkResponse.items.forEach((action, i) => {
        const operation = Object.keys(action)[0];
        if (action[operation].error) {
          erroredDocuments.push({
            status: action[operation].status,
            error: action[operation].error,
            operation: body[i * 2],
            document: body[i * 2 + 1],
          });
        }
      });
      this.log.error(JSON.stringify(erroredDocuments, null, 2));
      // Custom Error Hook that can be used to run your custom logic for Errorred Documents
      if (this.onError) {
        await this.onError(erroredDocuments);
      }
    } else {
      this.log.info('Successfully Processed all the records');
    }
  }
}

module.exports = DynamoToES;
