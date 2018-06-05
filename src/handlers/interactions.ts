import { Handler } from 'aws-lambda';

const handler: Handler = async (event, context, callback) => {
  callback(null, 'hello');
};

export default handler;
