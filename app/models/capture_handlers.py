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
        
    def on_tool_start(self, serialized, input_str, **kwargs):
        try:
            tool_name = serialized.get('name', 'unnamed_tool') if serialized else 'unknown_tool'
            self.log.append(f"Tool called: {tool_name}")
        except Exception as e:
            self.log.append(f"Tool start error: {str(e)}")