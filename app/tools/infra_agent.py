from app.tools.aws_tools import list_rds_instances, list_ec2_instances, list_s3_buckets, list_ec2_volumes, list_ec2_security_groups

from langchain.chat_models import init_chat_model
from langchain_core.tools import tool
from typing import List, Any

tools = [list_rds_instances, list_ec2_instances, list_s3_buckets, list_ec2_volumes, list_ec2_security_groups]

model_name: str = "deepseek-chat"
temperature: float = 0

llm = init_chat_model(model_name, temperature=temperature)

from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder 

@tool
def analyze_infrastructure(pssi_text: str) -> dict:
    """Analyze The infrastructure of the company and provide a detailed compliance analysis."""
    
    try:
        from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a compliance expert analyzing AWS infrastructure against PSSI requirements.
            Current PSSI rules: {pssi_text}"""),
            ("human", "{input}"),
            MessagesPlaceholder("agent_scratchpad")
        ])
        
        from langchain.agents import AgentExecutor, create_tool_calling_agent
        
        agent = create_tool_calling_agent(llm, tools, prompt)
        agent_executor = AgentExecutor(
            agent=agent, 
            tools=tools, 
            verbose=True,
            return_intermediate_steps=True  # Enable intermediate steps tracking
        )
        
        response = agent_executor.invoke({
            "input": "Perform full infrastructure compliance check",
            "pssi_text": pssi_text
        })
        
        return {
            "status": "completed",
            "analysis": response["output"],
            "tool_calls": response.get("intermediate_steps", [])  # Safe access
        }
        
    except Exception as e:
        raise Exception(f"Error in LLM analysis: {str(e)}")
    
# @tool
# def analyze_infrastructure(pssi_text: str) -> dict:
#     """Analyze The infrastructure of the company and provide a detailed compliance analysis."""

#     prompt = f"""
#     You are a compliance expert analyzing infrastructure against a PSSI document.

#     **Workflow**:
#     1. Use AWS inventory tools to list ALL resources.
#     2. Check each resource against these PSSI requirements:
#     {pssi_text}

#     **Steps**:
#     - Call ALL tools: list_rds_instances, list_ec2_instances, list_s3_buckets, etc.
#     - For each resource type, verify compliance with the PSSI.
#     - Return findings as a structured report.
#     """
    
#     try:
#         llm_with_tools = llm.bind_tools(tools)

#         from langchain_core.output_parsers import StrOutputParser

#         chain = llm_with_tools | StrOutputParser()  # Or JSON parser
#         response = chain.invoke(prompt)  # Direct tool invocation happens here

#         from langchain.agents import AgentExecutor, create_tool_calling_agent

#         agent = create_tool_calling_agent(llm, tools, prompt)
#         agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
#         response = agent_executor.invoke({"input": prompt})  # Auto-handles tool calls
        
        
        
#         # Process tool calls and store their results
#         processed_tool_calls = []
#         if hasattr(response, 'tool_calls') and response.tool_calls:
#             for tool_call in response.tool_calls:
#                 if tool_call["name"] == "list_rds_instances":
#                     result = list_rds_instances.invoke(tool_call["args"])
#                     processed_tool_calls.append({
#                         "name": tool_call["name"],
#                         "args": tool_call["args"],
#                         "result": result
#                     })
#                 if tool_call["name"] == "list_ec2_instances":
#                     result = list_ec2_instances.invoke(tool_call["args"])
#                     processed_tool_calls.append({
#                         "name": tool_call["name"],
#                         "args": tool_call["args"],
#                         "result": result
#                     })
#                 if tool_call["name"] == "list_s3_buckets":
#                     result = list_s3_buckets.invoke(tool_call["args"])
#                     processed_tool_calls.append({
#                         "name": tool_call["name"],
#                         "args": tool_call["args"],
#                         "result": result
#                     })
#                 if tool_call["name"] == "list_ec2_volumes":
#                     result = list_ec2_volumes.invoke(tool_call["args"])
#                     processed_tool_calls.append({
#                         "name": tool_call["name"],
#                         "args": tool_call["args"],
#                         "result": result
#                     })
#                 if tool_call["name"] == "list_ec2_security_groups":
#                     result = list_ec2_security_groups.invoke(tool_call["args"])
#                     processed_tool_calls.append({
#                         "name": tool_call["name"],
#                         "args": tool_call["args"],
#                         "result": result
#                     })

#         return {
#             "status": "completed",
#             "analysis": response.content,
#             "tool_calls": processed_tool_calls
#         }
#     except Exception as e:
#         raise Exception(f"Error in LLM analysis: {str(e)}") 
    
