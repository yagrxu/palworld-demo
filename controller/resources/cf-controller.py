import boto3
import os
client = boto3.client('cloudformation')

def main(event, context):

    return some_value


def create_stack(stack_name, template_url, parameters):
response = client.create_stack(
    StackName=stack_name,
    TemplateURL=template_url,
    Parameters=parameters,
#     Parameters=[
#         {
#             'ParameterKey': 'string',
#             'ParameterValue': 'string',
#             'UsePreviousValue': True,
#         },
#     ],
    DisableRollback=True|False,
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
#     RetainExceptOnCreate=True|False
)