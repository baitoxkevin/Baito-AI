#!/usr/bin/env python3
import os
import sys
import subprocess

# Set environment variables
os.environ['GOOGLE_API_KEY'] = '***REMOVED***'

# Run vibetest with authentication
vibetest_path = '/Users/baito.kevin/Downloads/project 10/mcp-servers/vibetest-use'
venv_python = f'{vibetest_path}/.venv/bin/python'

# Create a test script that includes login
test_script = '''
import asyncio
import os
import sys
sys.path.insert(0, '/Users/baito.kevin/Downloads/project 10/mcp-servers/vibetest-use')

from vibetest.agents import run_pool

async def run_with_auth():
    # Set up test with authentication context
    url = "http://localhost:5173"
    
    # Run vibetest with 5 agents, non-headless
    result = await run_pool(
        base_url=url,
        num_agents=5,
        headless=False
    )
    
    print("Test Results:")
    print(result)
    return result

if __name__ == "__main__":
    asyncio.run(run_with_auth())
'''

# Write the test script
with open('/tmp/vibetest_auth.py', 'w') as f:
    f.write(test_script)

# Run the test
subprocess.run([venv_python, '/tmp/vibetest_auth.py'])