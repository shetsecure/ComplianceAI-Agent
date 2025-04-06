from langchain.chat_models import init_chat_model
from langchain_core.tools import tool
import os
import PyPDF2
import requests

from dotenv import load_dotenv

load_dotenv()

def extract_text_from_pdf(file_path):
    text = ""
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text()
        return text
    except Exception as e:
        print(f"Error extracting text from {file_path}: {e}")
        return ""
    
# Load the two documents
doc1 = extract_text_from_pdf("doc1.pdf")
doc2 = extract_text_from_pdf("doc2.pdf")

@tool
def count_characters(text: str) -> int:
    """Count the number of characters in the text"""
    return len(text)

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

    response = requests.post(url, json=data, auth=("shetsecure@gmail.com", os.getenv("JIRA_API_TOKEN")))

    if response.status_code == 201:
        print("Issue created successfully:", response.json())
        return f"Issue created successfully: {response.json().get('key', 'Unknown')}"
    else:
        print("Failed to create issue:", response.text)
        return f"Failed to create issue: {response.text}"


tools = [create_issue]
llm = init_chat_model("deepseek-chat", temperature=0)
llm_with_tools = llm.bind_tools(tools)

print(f"Document 1 length: {len(doc1)} characters")
print(f"Document 2 length: {len(doc2)} characters")

# Create a prompt that asks the model to analyze the documents and create Jira tickets for issues
prompt = f"""
You are a compliance expert specializing in analyzing PSSI (Politique de Sécurité des Systèmes d'Information) documents against security norms.

Please analyze these two documents and identify any compliance issues:

NORM DOCUMENT:
{doc1[:3000]}... (document truncated for brevity)

PSSI DOCUMENT:
{doc2[:3000]}... (document truncated for brevity)

For each compliance issue you find, create a Jira ticket using the create_issue tool.
Make sure to provide a clear summary and detailed description for each issue.
"""


# from langchain_core.tools import tool

# @tool
# def multiply(a: int, b: int) -> int:
#    """Multiply two numbers."""
#    return a * b

# print(multiply.invoke({"a": 2, "b": 3}))
# print(create_issue.invoke({"summary": "Test Issue", "description": "This is a test issue."}))


response = llm_with_tools.invoke(prompt)

# print("\nResponse from LLM:")
# print(response.content)

# # Execute tool calls
# if hasattr(response, 'tool_calls') and response.tool_calls:
#     print("\nExecuting tool calls:")
#     for i, tool_call in enumerate(response.tool_calls):
#         tool_name = tool_call["name"]
#         tool_args = tool_call["args"]
#         print(f"\nTool Call #{i+1}:")
#         print(f"  Tool: {tool_name}")
#         print("--------------------------------")
#         print(f"  Arguments: {tool_args}")
#         print("--------------------------------")
        
#         # Execute the tool
#         if tool_name == "count_characters":
#             result = count_characters(**tool_args)
#             print(f"  Result: {result}")
#         elif tool_name == "create_issue":
#             result = create_issue.run(tool_args)
#             # create_issue.run()
#             print(f"  Result: {result}")
#         else:
#             print(f"  Unknown tool: {tool_name}")
# else:
#     print("\nNo tool calls were made.")