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
            
        return instances
    except Exception as e:
        return f"Error listing RDS instances: {str(e)}"
    

@tool
def list_ec2_instances() -> str:
    """List all EC2 instances and return their details in a formatted string. 
    Return only the instance id, type, state, public ip address, private ip address, subnet id, vpc id, and security groups"""
    try:
        client = boto3.client('ec2')
        response = client.describe_instances()
        instances = response['Reservations']
        
        if not instances or len(instances) == 0:
            return "No EC2 instances found."
            
        return instances
    except Exception as e:
        return f"Error listing EC2 instances: {str(e)}"


@tool
def list_s3_buckets() -> str:
    """
    List all S3 buckets and return their details in a formatted string.
    Return only the bucket name and creation date
    """
    try:
        client = boto3.client('s3')
        response = client.list_buckets()
        buckets = response['Buckets']
        
        if not buckets or len(buckets) == 0:
            return "No S3 buckets found."
            
        return buckets
    except Exception as e:
        return f"Error listing S3 buckets: {str(e)}"


@tool
def list_ec2_volumes() -> str:
    """
    List all EC2 volumes and return their details in a formatted string.
    Return only the volume id, size, state, and availability zone
    """
    try:
        client = boto3.client('ec2')
        response = client.describe_volumes()
        volumes = response['Volumes']

        if not volumes or len(volumes) == 0:
            return "No EC2 volumes found."
            
        return volumes
    except Exception as e:
        return f"Error listing EC2 volumes: {str(e)}"


@tool
def list_ec2_security_groups() -> str:
    """
    List all EC2 security groups and return their details in a formatted string.
    Return only the group id, name, description, vpc id, and ip permissions
    """
    try:
        client = boto3.client('ec2')
        response = client.describe_security_groups()
        security_groups = response['SecurityGroups']
        
        return security_groups
    except Exception as e:
        return f"Error listing EC2 security groups: {str(e)}"

