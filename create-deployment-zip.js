const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

async function createDeploymentZip() {
    const projectRoot = '/Users/baito.kevin/Downloads/project 10';
    const distPath = path.join(projectRoot, 'dist');
    const redirectsPath = path.join(projectRoot, '_redirects');
    const outputPath = path.join(projectRoot, 'baito-events-netlify-deploy.zip');
    
    try {
        // Run build
        console.log('Building the project...');
        execSync('npm run build', { 
            cwd: projectRoot, 
            stdio: 'inherit' 
        });
        
        console.log('Build completed successfully!');
        
        // Create zip file
        console.log('Creating deployment package...');
        
        const output = fs.createWriteStream(outputPath);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });
        
        output.on('close', () => {
            console.log(`Deployment package created: baito-events-netlify-deploy.zip (${archive.pointer()} bytes)`);
        });
        
        archive.on('error', (err) => {
            throw err;
        });
        
        archive.pipe(output);
        
        // Add dist folder contents (not the folder itself)
        archive.directory(distPath, false);
        
        // Add _redirects file if it exists
        if (fs.existsSync(redirectsPath)) {
            archive.file(redirectsPath, { name: '_redirects' });
        } else {
            console.log('Warning: _redirects file not found!');
        }
        
        await archive.finalize();
        
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

createDeploymentZip();