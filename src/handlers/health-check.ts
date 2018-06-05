import { Handler } from 'aws-lambda';
import * as HttpStatus from 'http-status-codes';

const handler: Handler = async (event, context, callback) => {
  callback(null, {
    statusCode: HttpStatus.OK,
    body: 'ping? pong!'
  });
};

export default handler;
