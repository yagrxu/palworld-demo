import boto3
import os
client = boto3.client('cloudformation')

def main(event, context):
    message = event['Records'][0]['Sns']['Message']
    items = message.split('\n')
    properties = {}
    for item in items:
        kv = item.split('=')
        if len(kv) == 1:
            properties[kv[0]] = ''
        else:
            properties[kv[0]] = kv[1]
    if properties['LogicalResourceId'] == properties['StackName']:
        if properties['ResourceStatus'] == "'CREATE_COMPLETE'" or properties['ResourceStatus'] == "'UPDATE_COMPLETE'":
            output_map = get_output(properties['StackName'].replace("'", ''))
            if 'VpcId' in output_map.keys():
                handle_networks_cf_complete(output_map['VpcId'])
            else:
                handle_server_cf_complete()
    return {'statusCode': 200}

def handle_server_cf_complete():
    print('handle server cf complete')
    return

def handle_networks_cf_complete(value):
    print(value)

    print('handle networks cf complete')
    return

def update_networks_data(vpc_id):
    pass

def get_output(stack_name):
    response = client.describe_stacks(StackName=stack_name)
    outputs = response["Stacks"][0]["Outputs"]
    output_map = {}
    for output in outputs:
        key = output["OutputKey"]
        value = output["OutputValue"]
        output_map[key]=value
    return output_map