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
                handle_server_cf_complete(stack_info, output_map)
        elif status == "'DELETE_COMPLETE'":
            print('delete_complete')
            stack_info = get_cf_status(stack_name.replace("'", ''))
            if stack_info['type'] == 'NETWORK':
                handle_networks_cf_deleted(stack_info)
            else:
                handle_server_cf_deleted(stack_name.replace("'", ''))
        elif "'DELETE_FAILED'" == status:
            print('delete_failed')
            delete_stack(stack_name.replace("'", ''))
        else:
            print(status)

def delete_stack(stack_name):
    client.delete_stack(StackName=stack_name)
    ddb_client.delete_item(TableName=os.environ.get('CF_MGMT_TABLE'), Key={
        'StackName': {
            'S': stack_name
        }
    })
    return

def handle_server_cf_complete(stack_info, output_map):
    update_cf_status(stack_info, 'CREATE_COMPLETE')
    stack_name = output_map['ServerStackName']
    server_name = output_map['ServerName']
    instance_id = output_map['InstanceId']
    aws_stack_name = output_map['AwsStackName']
    update_server_data(stack_info, stack_name, server_name, instance_id, aws_stack_name)

    return

def handle_networks_cf_complete(stack_info, output_map):
    vpc_id = output_map['VpcId']
    sg_id = output_map['SecurityGroupId']
    update_cf_status(stack_info, 'CREATE_COMPLETE')
    update_networks_data(stack_info['stack_name'],vpc_id, sg_id)

    print('handle networks cf complete')
    return

def handle_server_cf_deleted(stack_name):
    delete_server_data(stack_name)
    print('handle server cf complete')
    return

def delete_server_data(stack_name):

    res = ddb_client.scan(TableName=os.environ.get('SERVER_TABLE_NAME'),
        FilterExpression='StackName = :value',
        ExpressionAttributeValues={':value': {'S': stack_name}}
    )
    items = res['Items']
    for item in items:
        server_info = ast.literal_eval(item['ServerInfo']['S'])
        server_stack_name = server_info['stack_name']
        server_name = server_info['server_name']
        ddb_client.delete_item(TableName=os.environ.get('SERVER_TABLE_NAME'), Key={
            'StackName': {
                'S': stack_name
            },
            'InstanceId': item['InstanceId'],
        })
        ddb_client.delete_item(TableName=os.environ.get('NICKNAME_TABLE_NAME'), Key={
            'StackName': {
                'S': server_stack_name
            },
            'NickName': {
                'S': server_name
            },
        })

    ddb_client.delete_item(TableName=os.environ.get('CF_MGMT_TABLE'), Key={
        'StackName': {
            'S': stack_name
        }
    })
    return

def handle_networks_cf_deleted(stack_info):
    stack_name = stack_info['stack_name']
    delete_networks_data(stack_name)
    print('handle networks cf complete')
    return

def delete_networks_data(stack_name):

    res = ddb_client.scan(TableName=os.environ.get('NETWORK_TABLE_NAME'),
        FilterExpression='StackName = :value',
        ExpressionAttributeValues={':value': {'S': stack_name}}
    )
    items = res['Items']
    for item in items:
        ddb_client.delete_item(TableName=os.environ.get('NETWORK_TABLE_NAME'), Key={
            'StackName': {
                'S': stack_name
            },
            'VpcId': item['VpcId'],
        })
    ddb_client.delete_item(TableName=os.environ.get('CF_MGMT_TABLE'), Key={
        'StackName': {
            'S': stack_name
        }
    })
    return
def update_server_data(stack_info, stack_name, server_name, instance_id, aws_stack_name):
    response = ec2_client.describe_instances(
        InstanceIds=[
            instance_id,
        ]
    )
    server_detail = response['Reservations'][0]['Instances'][0]
    server_info = {}
    server_info['instance_id'] = instance_id
    server_info['instance_type'] = server_detail['InstanceType']
    server_info['private_ip'] = server_detail['PrivateIpAddress']
    server_info['public_ip'] = server_detail['PublicIpAddress']
    server_info['subnet_id'] = server_detail['SubnetId']
    server_info['vpc_id'] = server_detail['VpcId']
    server_info['stack_name'] = stack_name
    server_info['server_name'] = server_name
    server_info['aws_stack_name'] = aws_stack_name

    ddb_client.put_item(TableName=os.environ.get('SERVER_TABLE_NAME'), Item={
        'StackName': {
            'S': aws_stack_name
        },
        'InstanceId': {
            'S': instance_id
        },
        'ServerInfo': {
            'S': str(server_info)
        }
    })
    ddb_client.put_item(TableName=os.environ.get('NICKNAME_TABLE_NAME'), Item={
        'StackName': {
            'S': stack_name
        },
        'NickName': {
            'S': server_name
        },
        'ServerInfo': {
            'S': str(server_info)
        }
        })
    return

def update_networks_data(stack_name, vpc_id, sg_id):
    vpc_info = get_vpc_info(vpc_id)
    vpc_info['SecurityGroupId'] = sg_id
    ddb_client.put_item(TableName=os.environ.get('NETWORK_TABLE_NAME'), Item={
        'StackName': {
            'S': stack_name
        },
        'VpcId': {
            'S': vpc_id
        },
        'VpcInfo': {
            'S': str(vpc_info)
        }
    })
    return

def get_cf_status(stack_name):
    response = ddb_client.get_item(TableName=os.environ.get('CF_MGMT_TABLE'), Key={
        'StackName': {
            'S': stack_name
        },
    })
    item = response['Item']
    return ast.literal_eval(item['Info']['S'])

def update_cf_status(stack_info, status):
    stack_name = stack_info['stack_name']
    stack_info['stack_status'] = status
    ddb_client.put_item(TableName=os.environ.get('CF_MGMT_TABLE'), Item={
        'StackName': {
            'S': stack_name
        },
        'Info': {
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