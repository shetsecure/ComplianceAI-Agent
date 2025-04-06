import os
import requests
from langchain_core.tools import tool
from dotenv import load_dotenv

load_dotenv()

@tool
def create_issue(summary: str, description: str) -> str:
    """Create an issue in Jira"""
    url = "https://shetsecure.atlassian.net/rest/api/3/issue"
    headers = {"Content-Type": "application/json"}
    
    data = {
        "fields": {
            "project": {"id": "10000"},
            "summary": summary,
            "description": {
                "version": 1,
                "type": "doc",
                "content": [
                    {
                        "type": "paragraph",
                        "content": [
                            {
                                "type": "text",
                                "text": description
                            }
                        ]
                    }
                ]
            },
            "issuetype": {"id": "10001"}
        }
    }

    try:
        response = requests.post(
            url, 
            json=data, 
            auth=("shetsecure@gmail.com", os.getenv("JIRA_API_TOKEN"))
        )

        if response.status_code == 201:
            return f"Issue created successfully: {response.json().get('key', 'Unknown')}"
        else:
            return f"Failed to create issue: {response.text}"
    except Exception as e:
        return f"Error creating Jira issue: {str(e)}" 