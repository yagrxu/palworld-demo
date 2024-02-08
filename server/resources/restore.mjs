import { SSMClient, CreateAssociationCommand } from '@aws-sdk/client-ssm';

export const main = async (event, context) => {
    console.log(event)
    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'hello world' }),
    };
}