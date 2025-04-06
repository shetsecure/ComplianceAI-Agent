from langchain.callbacks.base import BaseCallbackHandler# Define the callback handler first

class CustomCaptureHandler(BaseCallbackHandler):
    def __init__(self):
        self.log = []
        
    def on_chain_start(self, serialized, inputs, **kwargs):
        try:
            chain_name = serialized.get('id', ['unknown'])[-1] if serialized else 'unknown_chain'
            self.log.append(f"Chain start: {chain_name}")
        except Exception as e:
            self.log.append(f"Chain start error: {str(e)}")
    
    def on_chain_end(self, outputs, **kwargs):
        try:
            self.log.append(f"Chain completed with result: {outputs}")
        except Exception as e:
            self.log.append(f"Chain end error: {str(e)}")
        
    def on_tool_start(self, serialized, input_str, **kwargs):
        try:
            tool_name = serialized.get('name', 'unnamed_tool') if serialized else 'unknown_tool'
            self.log.append(f"Tool called: {tool_name} with input: {input_str}")
        except Exception as e:
            self.log.append(f"Tool start error: {str(e)}")
    
    def on_tool_end(self, output, **kwargs):
        try:
            # Truncate large outputs
            output_str = str(output)
            if len(output_str) > 1000:
                output_str = output_str[:997] + "..."
            self.log.append(f"Tool returned: {output_str}")
        except Exception as e:
            self.log.append(f"Tool end error: {str(e)}")
    
    def on_llm_start(self, serialized, prompts, **kwargs):
        try:
            self.log.append(f"LLM thinking...")
        except Exception as e:
            self.log.append(f"LLM start error: {str(e)}")
    
    def on_llm_end(self, response, **kwargs):
        try:
            if hasattr(response, 'generations') and response.generations:
                for i, gen in enumerate(response.generations):
                    if gen and len(gen) > 0 and hasattr(gen[0], 'text'):
                        text = gen[0].text
                        if len(text) > 500:  # Truncate for readability
                            text = text[:497] + "..."
                        self.log.append(f"LLM response: {text}")
            else:
                self.log.append("LLM completed (response format unknown)")
        except Exception as e:
            self.log.append(f"LLM end error: {str(e)}")
    
    def on_agent_action(self, action, **kwargs):
        try:
            self.log.append(f"Agent decided: {action.tool} with input: {action.tool_input}")
        except Exception as e:
            self.log.append(f"Agent action error: {str(e)}")
    
    def on_agent_finish(self, finish, **kwargs):
        try:
            self.log.append(f"Agent finished: {finish.return_values}")
        except Exception as e:
            self.log.append(f"Agent finish error: {str(e)}")
    
    def on_text(self, text, **kwargs):
        try:
            # Only log non-empty text
            if text and text.strip():
                # Truncate long text
                if len(text) > 500:
                    text = text[:497] + "..."
                self.log.append(f"Thinking: {text}")
        except Exception as e:
            self.log.append(f"Text error: {str(e)}")