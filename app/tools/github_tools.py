import os
import requests
from langchain_core.tools import tool
from dotenv import load_dotenv
import base64

load_dotenv()

@tool
def get_code_repository_github(repository_name: str) -> str:
    """Get the code of a repository from GitHub"""
    try:
        # Get GitHub token from environment variables
        github_token = os.getenv('GITHUB_TOKEN')
        if not github_token:
            return "Error: GITHUB_TOKEN environment variable not set"
            
        headers = {
            'Authorization': f'token {github_token}',
            'Accept': 'application/vnd.github.v3+json'
        }
        
        url = f"https://api.github.com/repos/{repository_name}/contents"
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            return f"Error: Failed to fetch repository. Status code: {response.status_code}"
            
        files = response.json()
        if not isinstance(files, list):
            return "Error: Invalid repository or empty repository"
            
        result = []
        for file in files:
            if file['type'] == 'file':
                file_url = file['download_url']
                file_response = requests.get(file_url, headers=headers)
                if file_response.status_code == 200:
                    content = file_response.text
                    result.append({
                        'path': file['path'],
                        'content': content
                    })
                    
        return result
    except Exception as e:
        return f"Error: {str(e)}"

#get_code_repository_github.invoke(dict(repository_name="AsriMed/uncompliant_aws_infra"))