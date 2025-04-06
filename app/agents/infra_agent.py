from app.tools.aws_tools import list_rds_instances, list_ec2_instances, list_s3_buckets, list_ec2_volumes, list_ec2_security_groups
from langchain.chat_models import init_chat_model
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder 
from langchain.callbacks.base import BaseCallbackHandler

# Define the callback handler first
class CustomCaptureHandler(BaseCallbackHandler):
    def __init__(self):
        self.log = []
        
    def on_chain_start(self, serialized, inputs, **kwargs):
        try:
            chain_name = serialized.get('id', ['unknown'])[-1] if serialized else 'unknown_chain'
            self.log.append(f"Chain start: {chain_name}")
        except Exception as e:
            self.log.append(f"Chain start error: {str(e)}")
        
    def on_tool_start(self, serialized, input_str, **kwargs):
        try:
            tool_name = serialized.get('name', 'unnamed_tool') if serialized else 'unknown_tool'
            self.log.append(f"Tool called: {tool_name}")
        except Exception as e:
            self.log.append(f"Tool start error: {str(e)}")

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
                Provide:
                - Compliance score (0-100)
                - Infrastructure analysis summary
                
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