import boto3
import os
client = boto3.client('cloudformation')

def main(event, context):
    print(event)

    create_stack(event['stack_name'], os.environ.get('TEMPLATE_URL'), [])
    return {
        'statusCode': 200
    }


def create_stack(stack_name, template_url, parameters):
    response = client.create_stack(
        StackName=stack_name,
        TemplateURL=template_url,
        # Parameters=parameters,
        TimeoutInMinutes=30,
        NotificationARNs=[
            os.environ.get('TOPIC_ARN'),
        ],
    #     ResourceTypes=[
    #         'string',
    #     ],
    #     RoleARN='string',
        OnFailure='DELETE',
    #     StackPolicyBody='string',
    #     StackPolicyURL='string',
    #     Tags=[
    #         {
    #             'Key': 'string',
    #             'Value': 'string'
    #         },
    #     ],
    #     ClientRequestToken='string',
        EnableTerminationProtection=False,
    )