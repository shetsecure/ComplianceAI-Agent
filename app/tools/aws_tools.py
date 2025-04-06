import os
import requests
from langchain_core.tools import tool
from dotenv import load_dotenv
import boto3
import json

load_dotenv()

@tool
def list_rds_instances() -> str:
    """List all RDS instances and return their details in a formatted string"""
    try:
        client = boto3.client('rds')
        response = client.describe_db_instances()
        instances = response['DBInstances']
        
        if not instances or len(instances) == 0:
            return "No RDS instances found."
            
        print(instances)
        result = []
        for instance in instances:
            instance_info = {
                'DBInstanceIdentifier': instance.get('DBInstanceIdentifier', 'N/A'),
                'Engine': instance.get('Engine', 'N/A'),
                'DBInstanceStatus': instance.get('DBInstanceStatus', 'N/A'),
                'Endpoint': instance.get('Endpoint', {}).get('Address', 'N/A'),
                'Port': instance.get('Endpoint', {}).get('Port', 'N/A'),
                'AllocatedStorage': instance.get('AllocatedStorage', 'N/A'),
                'DBInstanceClass': instance.get('DBInstanceClass', 'N/A')
            }
            result.append(instance_info)
        return json.dumps(result, indent=2)
    except Exception as e:
        return f"Error listing RDS instances: {str(e)}"

