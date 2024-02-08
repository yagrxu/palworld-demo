import { SSMClient, CreateAssociationCommand } from '@aws-sdk/client-ssm';

export const main = async (event, context) => {
    console.log(event);
    const body = JSON.parse(event.body)
    const documentName = 'restore-document';
    const targets = [
        { Key: 'InstanceIds', Values: [body.instanceId] },
    ];
    const associationParams = {
        Targets: targets,
        Parameters: {
            timestamp: [ body.timestamp ]
        },
        AssociationName: 'restore-' + event.instanceId,
        Name: documentName,
    };
    const ssmClient = new SSMClient();

    try{
        const createAssociationCommand = new CreateAssociationCommand(associationParams);
        const data = await ssmClient.send(createAssociationCommand);
        console.log('Association created successfully:', data);

        // Return a response if needed
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Association created successfully' }),

        }

    } catch (error) {
        console.error('Error creating association:', error);

        // Return an error response
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error creating association' }),
        };
    } finally {
        // Close the SDK client to release resources
        ssmClient.destroy();
    }
}