#!/usr/bin/env python3
import asyncio
import os
import sys

# Add vibetest to path
sys.path.insert(0, '/Users/baito.kevin/Downloads/project 10/mcp-servers/vibetest-use')

# Set environment
os.environ['GOOGLE_API_KEY'] = '***REMOVED***'

from browser_use import Agent, BrowserSession, BrowserProfile
from langchain_google_genai import ChatGoogleGenerativeAI
import time
import uuid

async def run_vibetest_with_auth():
    """Run vibetest with authentication on localhost:5173"""
    
    # Configuration
    base_url = "http://localhost:5173"
    num_agents = 5
    headless = False
    login_email = "admin@baito.events"
    login_password = "Password123!!"
    
    print(f"Starting vibetest on {base_url} with {num_agents} agents (headless: {headless})")
    print(f"Using login credentials: {login_email}")
    
    # Create LLM instance
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        temperature=0.9,
        google_api_key=os.environ['GOOGLE_API_KEY']
    )
    
    # First, let's login with one agent
    print("\n1. Performing login...")
    browser_args = ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage']
    
    browser_profile = BrowserProfile(
        headless=headless,
        disable_security=True,
        user_data_dir=None,
        args=browser_args,
        ignore_default_args=['--enable-automation'],
        wait_for_network_idle_page_load_time=2.0,
        maximum_wait_page_load_time=8.0,
        wait_between_actions=0.5
    )
    
    browser_session = BrowserSession(
        browser_profile=browser_profile,
        headless=headless
    )
    
    # Login task
    login_task = f"""
Navigate to {base_url} and perform the following login steps:
1. Look for the email input field and enter: {login_email}
2. Look for the password input field and enter: {login_password}
3. Click the Sign in button
4. Wait for the page to load after login
5. Confirm you are logged in successfully

After logging in, explore the application and test various features.
"""
    
    login_agent = Agent(
        task=login_task,
        llm=llm,
        browser_session=browser_session,
        use_vision=True
    )
    
    try:
        login_history = await login_agent.run()
        print("Login completed successfully!")
        
        # Keep the session open and get cookies
        page = browser_session.page
        cookies = await page.context.cookies()
        
        await browser_session.close()
    except Exception as e:
        print(f"Login failed: {str(e)}")
        await browser_session.close()
        return
    
    # Now run the actual vibetest with the stored session
    print(f"\n2. Running vibetest with {num_agents} agents...")
    
    # Import and run the vibetest
    from vibetest.agents import run_pool, summarize_bug_reports
    
    # Run the test pool
    test_id = await run_pool(
        base_url=base_url,
        num_agents=num_agents,
        headless=headless
    )
    
    print(f"\n3. Test completed! Test ID: {test_id}")
    
    # Get the summary
    summary = summarize_bug_reports(test_id)
    
    # Print results
    print("\n" + "="*80)
    print("VIBETEST RESULTS")
    print("="*80)
    print(f"URL: {base_url}")
    print(f"Agents: {num_agents}")
    print(f"Status: {summary.get('status_emoji', '')} {summary.get('overall_status', 'Unknown')}")
    print(f"Description: {summary.get('status_description', '')}")
    print(f"Total Issues: {summary.get('total_issues', 0)}")
    
    if 'severity_breakdown' in summary:
        breakdown = summary['severity_breakdown']
        print("\nIssue Breakdown:")
        print(f"  - High Severity: {len(breakdown.get('high_severity', []))}")
        print(f"  - Medium Severity: {len(breakdown.get('medium_severity', []))}")
        print(f"  - Low Severity: {len(breakdown.get('low_severity', []))}")
        
        if breakdown.get('high_severity'):
            print("\nHigh Severity Issues:")
            for issue in breakdown['high_severity']:
                print(f"  - [{issue['category']}] {issue['description']}")
        
        if breakdown.get('medium_severity'):
            print("\nMedium Severity Issues:")
            for issue in breakdown['medium_severity']:
                print(f"  - [{issue['category']}] {issue['description']}")
    
    print("\n" + "="*80)
    
    return summary

if __name__ == "__main__":
    asyncio.run(run_vibetest_with_auth())