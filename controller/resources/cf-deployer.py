import boto3
import os
import json
client = boto3.client('cloudformation')
ddb_client = boto3.client('dynamodb')


def main(event, context):
    # print(event)
    content = json.loads(event['body'])
    stack_name = content['stack_name']
    if 'parameters' not in content.keys() or len(content['parameters']) == 0:
        create_stack(stack_name, os.environ.get('TEMPLATE_URL'))
    else:
        parameters = content['parameters']
        create_stack_with_params(stack_name, os.environ.get('TEMPLATE_URL'), parameters)
    return {
        'body': 'Stack ' + stack_name + ' is being created',
        'statusCode': 200
    }


def create_stack(stack_name, template_url):
    response = client.create_stack(
        StackName=stack_name,
        TemplateURL=template_url,
        # Parameters=parameters,
        TimeoutInMinutes=30,
        NotificationARNs=[
            os.environ.get('TOPIC_ARN'),
        ],
        Capabilities=[
        'CAPABILITY_IAM'
        ],
        OnFailure='DELETE',
        EnableTerminationProtection=False,
    )
    stack_info = {}
    stack_info['stack_name'] = stack_name
    stack_info['stack_id'] = response['StackId']
    stack_info['type'] = os.environ.get('TYPE')
    stack_info['stack_status'] = 'CREATING'
    ddb_client.put_item(TableName=os.environ.get('CF_MGMT_TABLE'), Item={
        'StackName': {
            'S': stack_name
        },
        'Info': {
            'S': str(stack_info)
        }
    })
def create_stack_with_params(stack_name, template_url, parameters):
    response = client.create_stack(
        StackName=stack_name,
        TemplateURL=template_url,
        Parameters=parameters,
        TimeoutInMinutes=30,
        NotificationARNs=[
            os.environ.get('TOPIC_ARN'),
        ],
        Capabilities=[
        'CAPABILITY_IAM'
        ],
        OnFailure='DELETE',
        EnableTerminationProtection=False,
    )
    stack_info = {}
    stack_info['stack_name'] = stack_name
    stack_info['stack_id'] = response['StackId']
    stack_info['type'] = os.environ.get('TYPE')
    stack_info['stack_status'] = 'CREATING'
    ddb_client.put_item(TableName=os.environ.get('CF_MGMT_TABLE'), Item={
        'StackName': {
            'S': stack_name
        },
        'Info': {
            'S': str(stack_info)
        }
    })