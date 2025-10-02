import React from 'react';
import DebugButton from '../debug-button';

export function TestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Button Testing Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="col-span-1">
          <div className="border-2 border-blue-500 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Debug Button Test</h2>
            <DebugButton />
          </div>
        </div>
        
        <div className="col-span-1">
          <div className="border-2 border-green-500 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Console Output</h2>
            <p className="mb-4">
              Open your browser's developer console (F12) to see debug output when you click the button.
            </p>
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
              <div id="console-output">
                Waiting for button clicks...
              </div>
            </div>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          // Capture console.log output
          const originalConsoleLog = console.log;
          console.log = function() {
            // Call the original console.log
            originalConsoleLog.apply(console, arguments);
            
            // Add to our display
            const output = document.getElementById('console-output');
            if (output) {
              const entry = document.createElement('div');
              entry.className = 'py-1 border-b border-green-800';
              
              const timestamp = new Date().toLocaleTimeString();
              entry.textContent = \`[\${timestamp}] \${Array.from(arguments).join(' ')}\`;
              
              output.appendChild(entry);
              output.scrollTop = output.scrollHeight;
            }
          };
        `
      }} />
    </div>
  );
}

export default TestPage;