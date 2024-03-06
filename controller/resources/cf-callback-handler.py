import boto3
import os
import ast
import json
client = boto3.client('cloudformation')
ec2_client = boto3.client('ec2')
ddb_client = boto3.client('dynamodb')

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
    handle_status(properties['LogicalResourceId'], properties['StackName'], properties['ResourceStatus'])
    return {'statusCode': 200}

def handle_status(resource_id, stack_name, status):
    if resource_id == stack_name:
        if status == "'CREATE_COMPLETE'" or status == "'UPDATE_COMPLETE'":
            stack_info = get_cf_status(stack_name.replace("'", ''))
            output_map = get_output(stack_name.replace("'", ''))
            if stack_info['type'] == 'NETWORK':
                handle_networks_cf_complete(stack_info, output_map)
            else:
                handle_server_cf_complete(stack_info)
        elif status == "'DELETE_COMPLETE'":
            stack_info = get_cf_status(stack_name.replace("'", ''))
            if stack_info['type'] == 'NETWORK':
                handle_networks_cf_deleted(stack_info)
            else:
                handle_server_cf_deleted(stack_info)

def handle_server_cf_complete():
    print('handle server cf complete')
    return

def handle_networks_cf_complete(stack_info, output_map):
    vpc_id = output_map['VpcId']
    sg_id = output_map['SecurityGroupId']
    update_cf_status(stack_info)
    update_networks_data(stack_info['stackName'],vpc_id, sg_id)

    print('handle networks cf complete')
    return

def handle_server_cf_deleted():
    print('handle server cf complete')
    return

def handle_networks_cf_deleted(stack_info):
    stack_name = stack_info['stackName']
    delete_networks_data(stack_name)
    print('handle networks cf complete')
    return

def delete_networks_data(stack_name):

    res = ddb_client.scan(TableName=os.environ.get('NETWORK_TABLE_NAME'),
        FilterExpression='stackName = :value',
        ExpressionAttributeValues={':value': {'S': stack_name}}
    )
    items = res['Items']
    for item in items:
        ddb_client.delete_item(TableName=os.environ.get('NETWORK_TABLE_NAME'), Key={
            'stackName': {
                'S': stack_name
            },
            'vpcId': item['vpcId'],
        })
    ddb_client.delete_item(TableName=os.environ.get('CF_MGMT_TABLE'), Key={
        'stackName': {
            'S': stack_name
        }
    })
    return

def update_networks_data(stack_name, vpc_id, sg_id):
    vpc_info = get_vpc_info(vpc_id)
    vpc_info['SecurityGroupId'] = sg_id
    ddb_client.put_item(TableName=os.environ.get('NETWORK_TABLE_NAME'), Item={
        'stackName': {
            'S': stack_name
        },
        'vpcId': {
            'S': vpc_id
        },
        'vpcInfo': {
            'S': str(vpc_info)
        }
    })
    return

def get_cf_status(stack_name):
    response = ddb_client.get_item(TableName=os.environ.get('CF_MGMT_TABLE'), Key={
        'stackName': {
            'S': stack_name
        },
    })
    item = response['Item']
    return ast.literal_eval(item['info']['S'])

def update_cf_status(stack_info):
    stack_name = stack_info['stackName']
    stack_info['stackStatus'] = 'CREATE_COMPLETE'
    ddb_client.put_item(TableName=os.environ.get('CF_MGMT_TABLE'), Item={
        'stackName': {
            'S': stack_name
        },
        'info': {
            'S': str(stack_info)
        }
    })
    return

def get_vpc_info(vpc_id):
    vpc_info = {}
    response = ec2_client.describe_vpcs(
        VpcIds=[
            vpc_id,
        ],
        DryRun=False
    )
    vpc_response = response['Vpcs'][0]
    vpc_info['VpcId'] = vpc_response['VpcId']
    vpc_info['CidrBlock'] = vpc_response['CidrBlock']
    response = ec2_client.describe_subnets(
        Filters=[
            {
                'Name': 'vpc-id',
                'Values': [
                    vpc_id,
                ]
            },
        ],
        DryRun=False
    )
    vpc_info['Subnets'] = []
    for subnet_response in response['Subnets']:
        subnet_item = {}
        subnet_item['SubnetId'] = subnet_response['SubnetId']
        subnet_item['CidrBlock'] = subnet_response['CidrBlock']
        vpc_info['Subnets'].append(subnet_item)
    return vpc_info

def get_output(stack_name):
    response = client.describe_stacks(StackName=stack_name)
    outputs = response["Stacks"][0]["Outputs"]
    output_map = {}
    for output in outputs:
        key = output["OutputKey"]
        value = output["OutputValue"]
        output_map[key]=value
    return output_map

def get_deleted_output(stack_name):
    response = client.list_stacks(StackStatusFilter=['DELETE_COMPLETE'])
    outputs = response["Stacks"][0]["Outputs"]
    output_map = {}
    for output in outputs:
        key = output["OutputKey"]
        value = output["OutputValue"]
        output_map[key]=value
    return output_map