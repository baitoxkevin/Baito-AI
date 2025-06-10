#!/usr/bin/env python3
import os
import subprocess
import shutil
import zipfile
from pathlib import Path

def create_deployment_zip():
    project_root = Path("/Users/baito.kevin/Downloads/project 10")
    dist_path = project_root / "dist"
    redirects_path = project_root / "_redirects"
    output_path = project_root / "baito-events-netlify-deploy.zip"
    
    # Remove existing zip if it exists
    if output_path.exists():
        output_path.unlink()
    
    # Run build
    print("Building the project...")
    try:
        subprocess.run(["npm", "run", "build"], cwd=project_root, check=True)
        print("Build completed successfully!")
    except subprocess.CalledProcessError:
        print("Build failed!")
        return
    
    # Create zip file
    print("Creating deployment package...")
    
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Add all files from dist directory
        for root, dirs, files in os.walk(dist_path):
            for file in files:
                file_path = Path(root) / file
                # Calculate the relative path from dist directory
                arcname = file_path.relative_to(dist_path)
                zipf.write(file_path, arcname)
        
        # Add _redirects file if it exists
        if redirects_path.exists():
            zipf.write(redirects_path, "_redirects")
        else:
            print("Warning: _redirects file not found!")
    
    # Get file size
    size = output_path.stat().st_size
    print(f"Deployment package created: baito-events-netlify-deploy.zip ({size:,} bytes)")

if __name__ == "__main__":
    create_deployment_zip()