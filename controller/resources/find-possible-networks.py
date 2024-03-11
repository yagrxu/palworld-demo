import boto3
import os
import json
import ast

ddb_client = boto3.client('dynamodb')
ec2_client = boto3.client('ec2')


def main(event, context):
    vpcs = get_vpcs()
    for vpc in vpcs:
        vpcInfoStr = vpc['VpcInfo']['S']
        vpcInfo = ast.literal_eval(vpcInfoStr)
        vpcId = vpcInfo['VpcId']
        sgId = vpcInfo['SecurityGroupId']
        for subnet in vpcInfo['Subnets']:
            subnetId = subnet['SubnetId']
            is_available, subnetInfo = available_subnets(subnetId)
            if is_available:
                print('success')
                return {
                    'body': str({
                        'vpcId': vpcId,
                        'subnetId': subnetId,
                        'securityGroupId': sgId
                    }),
                    'statusCode': 200
                }
    return {
        'body':"no available subnet or security group found",
        'statusCode': 404
    }


def get_vpcs():
    response = ddb_client.scan(
        TableName='networks'
    )
    print(response['Items'])
    return response['Items']


def available_subnets(subnetId):
    subnetInfo = ec2_client.describe_subnets(SubnetIds=[subnetId])
    is_available = False
    if subnetInfo['Subnets'][0]['AvailableIpAddressCount'] > 0:
        is_available = True
    return is_available, subnetInfo['Subnets'][0]

