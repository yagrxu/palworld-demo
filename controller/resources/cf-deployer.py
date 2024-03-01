import boto3
import os
import json
client = boto3.client('cloudformation')
ddb_client = boto3.client('dynamodb')


def main(event, context):
    # print(event)
    stack_name = json.loads(event['body'])['stack_name']
    create_stack(stack_name, os.environ.get('TEMPLATE_URL'), [])
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
    stack_info = {}
    stack_info['stackName'] = stack_name
    stack_info['stackId'] = response['StackId']
    stack_info['type'] = os.environ.get('TYPE')
    stack_info['stackStatus'] = 'CREATING'
    ddb_client.put_item(TableName=os.environ.get('CF_MGMT_TABLE'), Item={
        'stackName': {
            'S': stack_name
        },
        'info': {
            'S': str(stack_info)
        }
    })
