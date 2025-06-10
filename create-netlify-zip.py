#!/usr/bin/env python3
import os
import zipfile
import fnmatch
import re

def should_exclude(filepath):
    """Check if file should be excluded based on patterns"""
    exclude_patterns = [
        '*.sql',
        '*test*',
        '*debug*',
        '.env',
        '.env.local',
        '.env.development',
        '*.zip',
        'node_modules/*',
        '.git/*',
        'dist/*',
        'build/*',
        'supabase/*',
        '*.tsbuildinfo',
        '*backup*',
        '*original*'
    ]
    
    for pattern in exclude_patterns:
        if fnmatch.fnmatch(filepath.lower(), pattern.lower()):
            return True
        # Check if any part of the path matches
        if '*' in pattern and any(fnmatch.fnmatch(part.lower(), pattern.lower()) for part in filepath.split('/')):
            return True
    return False

def create_netlify_zip():
    """Create a zip file for Netlify deployment"""
    zip_filename = 'baito-events-netlify.zip'
    
    # Remove existing zip if it exists
    if os.path.exists(zip_filename):
        os.remove(zip_filename)
        print(f"Removed existing {zip_filename}")
    
    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Add directories
        dirs_to_add = ['src', 'public']
        for dir_name in dirs_to_add:
            if os.path.exists(dir_name):
                for root, dirs, files in os.walk(dir_name):
                    # Skip hidden directories
                    dirs[:] = [d for d in dirs if not d.startswith('.')]
                    
                    for file in files:
                        filepath = os.path.join(root, file)
                        if not should_exclude(filepath):
                            zipf.write(filepath)
                            print(f"Added: {filepath}")
        
        # Add specific files
        files_to_add = [
            'package.json',
            'package-lock.json',
            'pnpm-lock.yaml',
            'tsconfig.json',
            'tsconfig.app.json',
            'tsconfig.node.json',
            'components.json',
            'eslint.config.js',
            'postcss.config.js',
            'tailwind.config.js',
            'vite.config.ts',
            'vite.config.enhanced.ts',
            'index.html',
            'index-enhanced.html',
            'netlify.toml',
            'README.md',
            'NETLIFY_DEPLOYMENT.md',
            '.env.production'
        ]
        
        for file in files_to_add:
            if os.path.exists(file) and not should_exclude(file):
                zipf.write(file)
                print(f"Added: {file}")
    
    # Get file size
    size_mb = os.path.getsize(zip_filename) / (1024 * 1024)
    print(f"\nZip file created: {zip_filename} ({size_mb:.2f} MB)")
    print(f"Ready for deployment to Netlify!")

if __name__ == "__main__":
    # Change to project directory
    os.chdir("/Users/baito.kevin/Downloads/project 10")
    create_netlify_zip()