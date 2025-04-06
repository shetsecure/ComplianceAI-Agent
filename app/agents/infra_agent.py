from app.tools.aws_tools import list_rds_instances, list_ec2_instances, list_s3_buckets, list_ec2_volumes, list_ec2_security_groups
from langchain.chat_models import init_chat_model
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder 
from app.models.capture_handlers import CustomCaptureHandler



tools = [list_rds_instances, list_ec2_instances, list_s3_buckets, list_ec2_volumes, list_ec2_security_groups]

class InfraAgent:
    """Analyze The infrastructure of the company and provide a detailed compliance analysis."""
    
    def __init__(self, model_name: str = "deepseek-chat", temperature: float = 0):
        self.llm = init_chat_model(model_name, temperature=temperature)

    def analyze_infrastructure(self, pssi_text: str) -> dict:
        try:
            handler = CustomCaptureHandler()
            
            prompt = ChatPromptTemplate.from_messages([
                ("system", """You are a compliance expert analyzing AWS infrastructure against PSSI requirements.
                
                Provide your analysis in the following structured format:
                
                ## Infrastructure Compliance Score
                **XX/100**
                
                ## Summary
                Brief analysis of the infrastructure compliance
                
                ## Key Compliance Issues:
                
                1. **Issue Title 1**: Description of the issue and its impact
                2. **Issue Title 2**: Description of the issue and its impact
                
                ## Recommendations:
                
                1. **Recommendation Title 1**: Specific actions to take
                2. **Recommendation Title 2**: Specific actions to take
                
                Always follow this exact format to ensure proper parsing of your results.
                
                Current PSSI rules: {pssi_text}"""),
                ("human", "{input}"),
                MessagesPlaceholder("agent_scratchpad")
            ])
            
            agent = create_tool_calling_agent(self.llm, tools, prompt)
            agent_executor = AgentExecutor(
                agent=agent, 
                tools=tools, 
                verbose=False,  # Disable default logging
                return_intermediate_steps=True,
                handle_parsing_errors=True
            )
            
            response = agent_executor.invoke(
                {
                    "input": "Perform full infrastructure compliance check",
                    "pssi_text": pssi_text
                },
                {"callbacks": [handler]}
            )

            # Process intermediate steps
            processed_tool_calls = []
            for step in response.get("intermediate_steps", []):
                if isinstance(step, tuple) and len(step) >= 1:
                    action = step[0]
                    if hasattr(action, 'tool') and hasattr(action, 'tool_input'):
                        processed_tool_calls.append({
                            "name": action.tool,
                            "args": action.tool_input,
                            "result": step[1] if len(step) > 1 else None
                        })

            return {
                "status": "completed",
                "analysis": response["output"],
                "tool_calls": processed_tool_calls,
                "logs": handler.log,
                "steps": response.get("intermediate_steps", [])
            }
            
        except Exception as e:
            raise Exception(f"Error in LLM Infrastructure analysis: {str(e)}")