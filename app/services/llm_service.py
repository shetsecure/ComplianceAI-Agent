from langchain.chat_models import init_chat_model
from typing import List, Any
from app.tools.jira_tool import create_issue

class LLMService:
    def __init__(self, model_name: str = "deepseek-chat", temperature: float = 0):
        self.llm = init_chat_model(model_name, temperature=temperature)
    
    def analyze_documents(self, norm_text: str, pssi_text: str, tools: List[Any]) -> dict:
        """Analyze documents using LLM and return results."""
        try:
            llm_with_tools = self.llm.bind_tools(tools)
            
            prompt = f"""
            You are a compliance expert specializing in analyzing PSSI (Politique de Sécurité des Systèmes d'Information) documents against security norms.
            
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

            Please analyze the following PSSI document against the provided norm.
            
            NORM DOCUMENT:
            {norm_text}

            PSSI DOCUMENT:
            {pssi_text}

            Provide a detailed compliance analysis and create tickets for non-compliant items. Before you proceed to create tickets, make sure you have a clear understanding of the PSSI document and the norm.
            And give a score for the compliance of the PSSI document.

            For each compliance issue you find, create a Jira ticket using the create_issue tool.
            Make sure to provide a clear summary and detailed description for each issue.
            """

            response = llm_with_tools.invoke(prompt)
            
            # Process tool calls and store their results
            processed_tool_calls = []
            if hasattr(response, 'tool_calls') and response.tool_calls:
                for tool_call in response.tool_calls:
                    if tool_call["name"] == "create_issue":
                        result = create_issue.run(tool_call["args"])
                        processed_tool_calls.append({
                            "name": tool_call["name"],
                            "args": tool_call["args"],
                            "result": result
                        })
            
            return {
                "status": "completed",
                "analysis": response.content,
                "tool_calls": processed_tool_calls
            }
        except Exception as e:
            raise Exception(f"Error in LLM analysis: {str(e)}") 