from app.tools.aws_tools import *
from langchain.chat_models import init_chat_model

from app.tools.github_tools import get_code_repository_github
from app.tools.code_scanning_tools import scan_for_secrets, scan_for_vulnerabilities
from app.tools.jira_tool import create_issue

class ComplianceOrchestrator:
    def __init__(self):
        self.llm = init_chat_model("deepseek-chat")
        self.tool_map = {
            # Infrastructure tools
            "database": [list_rds_instances],
            "instance": [list_ec2_instances],
            "storage": [list_s3_buckets, list_ec2_volumes],
            "security": [list_ec2_security_groups],
            
            # Code analysis tools
            "code_quality": [scan_for_vulnerabilities],
            "secrets": [scan_for_secrets],
            
            # Fetch github code
            "fetch_github_code": [get_code_repository_github],
            
            # Jira integration
            "ticketing": [create_issue]
        }

    def policy_parser(self, policy_text: str) -> dict:
        """Identify required checks from policy content"""
        prompt = f"""Analyze this security policy and identify required compliance checks:
        {policy_text}
        
        Return JSON with: {{
            "checks": ["database", "storage", "security", "code_quality", "secrets"],
            "priority": "critical/high/medium/low"
        }}"""
        
        try:
            response = self.llm.invoke(prompt).model_dump_json()

            print(response)
            content = response.content
            
            # Try to find and extract JSON from the response
            import json
            import re
            
            # First look for JSON block
            json_match = re.search(r'```json\s*(.*?)\s*```', content, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                # Look for something that's JSON-like
                json_match = re.search(r'({[\s\S]*})', content)
                if json_match:
                    json_str = json_match.group(1)
                else:
                    # Just use the full response as a fallback
                    json_str = content
            
            # Try to parse the JSON
            try:
                result = json.loads(json_str)
                # Validate that it has the expected keys
                if not isinstance(result, dict) or "checks" not in result:
                    # Fallback to a default structure
                    return {
                        "checks": ["database", "storage", "security"],
                        "priority": "medium"
                    }
                return result
            except json.JSONDecodeError:
                print(f"Failed to parse JSON: {json_str}")
                # Fallback to a default structure
                return {
                    "checks": ["database", "storage", "security"],
                    "priority": "medium"
                }
        except Exception as e:
            print(f"Error in policy parser: {str(e)}")
            # Fallback to a default structure
            return {
                "checks": ["database", "storage", "security"],
                "priority": "medium"
            }

    def execute_checks(self, checks: list) -> dict:
        """Run identified checks and format results"""
        results = {}
        
        # Infrastructure checks
        if 'database' in checks:
            results['rds_instances'] = list_rds_instances.invoke({})
        if 'storage' in checks:
            results.update({
                's3_buckets': list_s3_buckets.invoke({}),
                'ec2_volumes': list_ec2_volumes.invoke({})
            })
        if 'security' in checks:
            results['security_groups'] = list_ec2_security_groups.invoke({})
        
        # Code checks (if implemented)
        # if 'code_quality' in checks:
        #     results['code_vulnerabilities'] = scan_for_vulnerabilities({})
        # if 'secrets' in checks:
        #     results['exposed_secrets'] = scan_for_secrets("")
        
        return results

    def generate_report(self, results: dict, priority: str) -> dict:
        """Create compliance report with automated ticketing"""
        try:
            summary_prompt = f"Create compliance summary from: {str(results)}"
            summary_response = self.llm.invoke(summary_prompt)
            
            report = {
                "summary": summary_response.content,
                "findings": [],
                "jira_tickets": []
            }
            
            # Automatically create Jira tickets for failed checks
            for check_type, data in results.items():
                if "error" in str(data).lower() or "non-compliant" in str(data).lower():
                    try:
                        ticket = create_issue.invoke({
                            "summary": f"{check_type.replace('_', ' ').title()} Compliance Issue",
                            "description": f"**Priority**: {priority}\n\n**Findings**:\n{data}"
                        })
                        report["jira_tickets"].append(ticket)
                    except Exception as ticket_error:
                        print(f"Error creating ticket for {check_type}: {str(ticket_error)}")
                        report["findings"].append({
                            "type": check_type,
                            "error": f"Failed to create ticket: {str(ticket_error)}",
                            "data": str(data)
                        })
                else:
                    # Add findings even if no ticket was created
                    report["findings"].append({
                        "type": check_type,
                        "status": "compliant",
                        "data": str(data)
                    })
            
            return report
        except Exception as e:
            print(f"Error generating report: {str(e)}")
            return {
                "error": f"Error generating report: {str(e)}",
                "summary": "Failed to generate compliance report due to an error."
            }
