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


from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from app.models.capture_handlers import CustomCaptureHandler

class ReflectComplianceOrchestrator:
    def __init__(self):
        self.llm = init_chat_model("deepseek-chat")
        self.tools = [
            list_rds_instances, list_ec2_instances, list_s3_buckets,
            list_ec2_volumes, list_ec2_security_groups, create_issue,
            scan_for_secrets, scan_for_vulnerabilities
        ]
        
        # Agentic components
        self.memory = []
        self.max_reflection_cycles = 2
        self.token_count = 0
        self.max_token_limit = 60000  # Safe limit below the actual 65536 limit
        
    def _estimate_tokens(self, text):
        """Roughly estimate token count - 1 token ≈ 4 chars for English text"""
        return len(str(text)) // 4
        
    def _summarize_logs(self, logs):
        """Summarize verbose logs to reduce token usage"""
        if not logs or len(logs) < 10:
            return logs
            
        # For long log histories, summarize them
        if len(logs) > 30:
            # Keep important logs like tool calls and results
            important_logs = [
                log for log in logs 
                if any(keyword in str(log) for keyword in 
                      ["Tool called", "Tool returned", "Agent decided", "Agent finished"])
            ]
            
            # Get a sample of thinking logs
            thinking_logs = [
                log for log in logs 
                if "Thinking" in str(log) or "LLM" in str(log)
            ]
            thinking_sample = thinking_logs[:3] + thinking_logs[-3:] if len(thinking_logs) > 6 else thinking_logs
            
            return important_logs + thinking_sample
            
        return logs
    
    def _summarize_cycle(self, cycle):
        """Create a summarized version of a cycle for memory"""
        if not cycle or "results" not in cycle:
            return cycle
            
        summarized = {
            "cycle": cycle["cycle"],
            "results": {
                "output": cycle["results"].get("output", "")
            }
        }
        
        # Keep tool calls but summarize their outputs
        if "tool_calls" in cycle["results"]:
            summarized["results"]["tool_calls"] = []
            for tool in cycle["results"]["tool_calls"]:
                # Truncate long outputs
                output = tool.get("output", "")
                if len(output) > 500:
                    output = output[:497] + "..."
                
                summarized_tool = {
                    "tool": tool.get("tool", "unknown"),
                    "input": tool.get("input", {}),
                    "output": output
                }
                summarized["results"]["tool_calls"].append(summarized_tool)
        
        # Summarize logs
        if "logs" in cycle["results"]:
            summarized["results"]["logs"] = self._summarize_logs(cycle["results"]["logs"])
            
        return summarized

    def _create_agent_executor(self):
        """Create agent with planning and reflection capabilities"""
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a Compliance Orchestrator Agent. Follow these steps:
            
            1. **Plan**: Analyze requirements and create an execution plan
            2. **Act**: Execute relevant tools in optimal order
            3. **Reflect**: Review results and plan next actions
            
            Current policy: {policy_text}
            Previous steps: {history}"""),
            MessagesPlaceholder("chat_history", optional=True),
            ("human", "{input}"),
            MessagesPlaceholder("agent_scratchpad")
        ])
        
        return AgentExecutor(
            agent=create_tool_calling_agent(self.llm, self.tools, prompt),
            tools=self.tools,
            verbose=False,
            return_intermediate_steps=True,
            handle_parsing_errors=True
        )

    def _self_reflect(self, results: dict, logs: list) -> bool:
        """Self-reflection mechanism to determine if more actions needed"""
        reflection_prompt = """Review these results and logs:
        {results}
        {logs}
        
        Should we take additional actions? Respond ONLY with YES or NO."""
        
        response = self.llm.invoke(reflection_prompt.format(
            results=str(results)[:2000], 
            logs=str(logs)[:2000]
        ))
        
        # Add token estimate for this reflection
        self.token_count += self._estimate_tokens(reflection_prompt) + self._estimate_tokens(response.content)
        
        return "YES" in response.content.upper()

    def orchestrate(self, policy_text: str) -> dict:
        """Agentic orchestration with planning-reflection loop"""
        handler = CustomCaptureHandler()
        results = {}
        current_cycle = 0
        
        # Reset token count
        self.token_count = 0
        
        # Add initial token count for policy text
        self.token_count += self._estimate_tokens(policy_text)
        
        while current_cycle < self.max_reflection_cycles:
            # Break if we're approaching token limit
            if self.token_count > self.max_token_limit * 0.8:  # 80% of max to be safe
                print(f"Approaching token limit ({self.token_count} tokens). Stopping reflection cycles.")
                break
                
            agent_executor = self._create_agent_executor()
            
            # Use summarized memory for context to save tokens
            summarized_memory = [self._summarize_cycle(cycle) for cycle in self.memory[-3:]] if self.memory else []
            
            # Build execution context
            context = {
                "input": "Perform compliance check",
                "policy_text": policy_text,
                "history": str(summarized_memory) if summarized_memory else "None"
            }
            
            # Estimate tokens for this context
            context_tokens = self._estimate_tokens(str(context))
            self.token_count += context_tokens
            
            # Execute agent cycle
            response = agent_executor.invoke(
                context,
                {"callbacks": [handler]}
            )
            
            # Estimate tokens for response
            response_tokens = self._estimate_tokens(str(response))
            self.token_count += response_tokens
            
            # Process results
            cycle_results = {
                "output": response["output"],
                "tool_calls": self._process_steps(response.get("intermediate_steps", [])),
                "logs": handler.log.copy()
            }
            
            # Store in memory
            self.memory.append({
                "cycle": current_cycle,
                "results": cycle_results
            })
            
            print(f"Cycle {current_cycle} complete. Estimated token count: {self.token_count}")
            
            # Check if reflection needed
            if not self._self_reflect(cycle_results, handler.log):
                break
                
            current_cycle += 1
            handler.log.clear()

        return self._compile_final_report()

    def _process_steps(self, steps: list) -> list:
        """Process intermediate steps into structured format"""
        processed = []
        for step in steps:
            if isinstance(step, tuple) and len(step) >= 1:
                action, observation = step[0], step[1]
                processed.append({
                    "tool": getattr(action, 'tool', 'unknown'),
                    "input": getattr(action, 'tool_input', {}),
                    "output": str(observation)[:1000]
                })
        return processed

    def _compile_final_report(self) -> dict:
        """Compile final report from memory"""
        report = {
            "status": "completed",
            "cycles": len(self.memory),
            "findings": [],
            "tickets_created": 0,
            "memory": [self._summarize_cycle(cycle) for cycle in self.memory]  # Store summarized memory
        }
        
        for cycle in self.memory:
            report["findings"].extend(cycle["results"]["tool_calls"])
            report["tickets_created"] += sum(
                1 for call in cycle["results"]["tool_calls"]
                if call["tool"] == "create_issue"
            )
        
        # Add final summary
        summary_prompt = """Synthesize this compliance report:
        {report}
        
        Format in markdown with: Compliance Score, Top Risks, and Recommendations"""
        
        report["summary"] = self.llm.invoke(
            summary_prompt.format(report=str(report)[:3000])
        ).content
        
        # Add token usage info
        report["token_usage"] = {
            "estimated_tokens": self.token_count,
            "max_limit": self.max_token_limit
        }
        
        return report