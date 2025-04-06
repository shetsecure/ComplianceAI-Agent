from langchain.chat_models import init_chat_model
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.agents import AgentExecutor, create_tool_calling_agent
from typing import List, Any
from app.tools.jira_tool import create_issue   

from langchain.callbacks.base import BaseCallbackHandler

class CustomCaptureHandler(BaseCallbackHandler):
    def __init__(self):
        self.log = []
        
    def on_chain_start(self, serialized, inputs, **kwargs):
        # Safely handle serialized data structure
        try:
            chain_name = serialized.get('id', ['unknown'])[-1] if serialized else 'unknown_chain'
            self.log.append(f"Chain start: {chain_name}")
        except Exception as e:
            self.log.append(f"Chain start error: {str(e)}")
        
    def on_tool_start(self, serialized, input_str, **kwargs):
        # Safely handle tool name extraction
        try:
            tool_name = serialized.get('name', 'unnamed_tool') if serialized else 'unknown_tool'
            self.log.append(f"Tool called: {tool_name}")
        except Exception as e:
            self.log.append(f"Tool start error: {str(e)}")

class PSSIAnalyzerAgent:
    def __init__(self, model_name: str = "deepseek-chat", temperature: float = 0):
        self.llm = init_chat_model(model_name, temperature=temperature)
    
    def analyze_documents(self, norm_text: str, pssi_text: str, tools: List[Any] = [create_issue]) -> dict:
        """Analyze documents using LLM and return results."""
        try:
            # Create proper prompt template
            prompt = ChatPromptTemplate.from_messages([
                ("system", """You are a compliance expert analyzing PSSI documents against security norms. 
            
                Your task is to analyze the provided PSSI document against the specified norm and provide a detailed compliance analysis.
                For any non-compliant issues found, you should create Jira tickets using the available Jira tool.

                When creating Jira tickets:
                1. Create one ticket per non-compliant issue
                2. Use clear, descriptive titles
                3. Include detailed descriptions with:
                - The specific requirement not met
                - The current state
                - Recommendations for achieving compliance
                4. Set appropriate priority based on the severity of non-compliance
                 
                Provide your response in a specific structured format:
                
                ## Compliance Score
                **XX/100**
                
                ## Summary
                Brief summary of your findings
                
                ## Non-Compliant Items
                
                For each non-compliant item, create a ticket and format as:
                
                Ticket 1: **Title of the issue**
                - **Description**: Description of the issue
                - **Priority**: High/Medium/Low
                
                Ticket 2: **Title of another issue**
                - **Description**: Description of the issue
                - **Priority**: High/Medium/Low
                
                ## Recommendations
                Add your recommendations for improving compliance
                
                Always follow this exact format to ensure proper parsing of your results.
                In case you returned Jira tickets, do not ask for permission, always create them.

                Please analyze the following PSSI document against the provided norm.
                
                Current Norm: {norm_text}
                PSSI Document: {pssi_text}"""),
                ("human", "{input}"),
                MessagesPlaceholder("agent_scratchpad")
            ])
            
            # Create agent with proper tool handling
            agent = create_tool_calling_agent(self.llm, tools, prompt)
            agent_executor = AgentExecutor(
                agent=agent, 
                tools=tools, 
                verbose=False,  # Disable verbose to prevent automatic printing
                return_intermediate_steps=True,
                handle_parsing_errors=True  # Add error handling for parsing
            )
            
            handler = CustomCaptureHandler()
            # Invoke with required parameters
            response = agent_executor.invoke(
                {
                    "input": "Perform full compliance analysis and create tickets",
                    "norm_text": norm_text,
                    "pssi_text": pssi_text
                },
                {"callbacks": [handler]}
            )
            
            processed_tool_calls = []
            for step in response.get("intermediate_steps", []):
                # Each step is a tuple of (AgentAction, observation)
                if isinstance(step, tuple) and len(step) >= 1:
                    action = step[0]
                    # Check if it's a valid AgentAction
                    if hasattr(action, 'tool') and hasattr(action, 'tool_input'):
                        if action.tool == "create_issue":
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
            raise Exception(f"Error in PSSIAnalyzerAgent LLM analysis: {str(e)}")