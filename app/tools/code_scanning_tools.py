import os
import re
from langchain_core.tools import tool
from typing import List, Dict
import ast
import json
import github_tools

@tool
def scan_for_secrets(code_content: str) -> Dict:
    """
    Scan code content for potential secrets and sensitive information.
    Returns a dictionary with findings.
    """
    findings = {
        'secrets': [],
        'sensitive_patterns': []
    }
    
    # Common secret patterns
    secret_patterns = {
        'api_key': r'api[_-]?key["\']?\s*[:=]\s*["\']?[a-zA-Z0-9]{32,}["\']?',
        'password': r'password["\']?\s*[:=]\s*["\']?[^\s"\']{8,}["\']?',
        'token': r'token["\']?\s*[:=]\s*["\']?[a-zA-Z0-9]{32,}["\']?',
        'secret': r'secret["\']?\s*[:=]\s*["\']?[a-zA-Z0-9]{32,}["\']?',
        'aws_key': r'aws[_-]?(access[_-]?key|secret[_-]?key)["\']?\s*[:=]\s*["\']?[a-zA-Z0-9]{20,}["\']?'
    }
    
    for pattern_name, pattern in secret_patterns.items():
        matches = re.finditer(pattern, code_content, re.IGNORECASE)
        for match in matches:
            findings['secrets'].append({
                'type': pattern_name,
                'line': code_content.count('\n', 0, match.start()) + 1,
                'match': match.group()
            })
    
    return findings

@tool
def scan_for_vulnerabilities(code_content: str) -> Dict:
    """
    Scan code content for common security vulnerabilities.
    Returns a dictionary with findings.
    """
    findings = {
        'vulnerabilities': [],
        'warnings': []
    }
    
    # SQL Injection patterns
    sql_patterns = [
        r'execute\s*\(.*?\+.*?\)',
        r'exec\s*\(.*?\+.*?\)',
        r'query\s*\(.*?\+.*?\)'
    ]
    
    # Command Injection patterns
    cmd_patterns = [
        r'os\.system\s*\(.*?\+.*?\)',
        r'subprocess\.run\s*\(.*?\+.*?\)',
        r'subprocess\.Popen\s*\(.*?\+.*?\)'
    ]
    
    # Check for SQL Injection
    for pattern in sql_patterns:
        matches = re.finditer(pattern, code_content, re.IGNORECASE)
        for match in matches:
            findings['vulnerabilities'].append({
                'type': 'SQL Injection',
                'line': code_content.count('\n', 0, match.start()) + 1,
                'match': match.group()
            })
    
    # Check for Command Injection
    for pattern in cmd_patterns:
        matches = re.finditer(pattern, code_content, re.IGNORECASE)
        for match in matches:
            findings['vulnerabilities'].append({
                'type': 'Command Injection',
                'line': code_content.count('\n', 0, match.start()) + 1,
                'match': match.group()
            })
    
    return findings

@tool
def scan_repository(repository_data: List[Dict]) -> Dict:
    """
    Scan an entire repository for security issues and code quality.
    Takes the output from get_code_repository_github as input.
    """
    results = {
        'secrets': [],
        'vulnerabilities': [],
        'complexity': {},
        'files_scanned': 0
    }
    
    for file_data in repository_data:
        if not isinstance(file_data, dict) or 'content' not in file_data:
            continue
            
        content = file_data['content']
        path = file_data['path']
        
        # Skip binary files
        if not isinstance(content, str):
            continue
            
        results['files_scanned'] += 1
        
        # Scan for secrets
        secrets = scan_for_secrets(content)
        if secrets['secrets']:
            results['secrets'].append({
                'file': path,
                'findings': secrets['secrets']
            })
            
        # Scan for vulnerabilities
        vulns = scan_for_vulnerabilities(content)
        if vulns['vulnerabilities']:
            results['vulnerabilities'].append({
                'file': path,
                'findings': vulns['vulnerabilities']
            })
            
    return results 

#scan_repository.invoke(
#    dict(
#        repository_data=github_tools.get_code_repository_github.invoke(dict(repository_name="AsriMed/uncompliant_aws_infra"))
#        )
#    )
