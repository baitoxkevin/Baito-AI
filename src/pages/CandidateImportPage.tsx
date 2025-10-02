import React, { useEffect, useState } from 'react';
import { CandidateTextImportTool } from '@/components/CandidateTextImportTool';
import { FileText, AlertCircle, CheckCircle2, Database } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function CandidateImportPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Candidate Import</h1>
        <p className="text-muted-foreground text-lg">
          Import candidate profiles from text resumes, job applications, or other sources
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-8 max-w-5xl mx-auto">
        <CandidateTextImportTool />
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 p-6 rounded-xl shadow-sm max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-blue-800 dark:text-blue-300">Tips for best results</h3>
        </div>
        <ul className="space-y-2.5 ml-6">
          <li className="flex gap-2 items-start text-sm text-slate-700 dark:text-slate-300">
            <span className="bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 p-1 rounded-full flex-shrink-0 mt-0.5">
              <FileText className="h-3 w-3" />
            </span>
            <span>Paste the complete text from the resume or CV</span>
          </li>
          <li className="flex gap-2 items-start text-sm text-slate-700 dark:text-slate-300">
            <span className="bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 p-1 rounded-full flex-shrink-0 mt-0.5">
              <FileText className="h-3 w-3" />
            </span>
            <span>Make sure the text includes contact information (name, email, phone)</span>
          </li>
          <li className="flex gap-2 items-start text-sm text-slate-700 dark:text-slate-300">
            <span className="bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 p-1 rounded-full flex-shrink-0 mt-0.5">
              <FileText className="h-3 w-3" />
            </span>
            <span>Include section headers like "Skills:", "Experience:", etc.</span>
          </li>
          <li className="flex gap-2 items-start text-sm text-slate-700 dark:text-slate-300">
            <span className="bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 p-1 rounded-full flex-shrink-0 mt-0.5">
              <FileText className="h-3 w-3" />
            </span>
            <span>Review the extracted information before creating the candidate profile</span>
          </li>
          <li className="flex gap-2 items-start text-sm text-slate-700 dark:text-slate-300">
            <span className="bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 p-1 rounded-full flex-shrink-0 mt-0.5">
              <FileText className="h-3 w-3" />
            </span>
            <span>You can edit any incorrect information in the candidate details after creation</span>
          </li>
        </ul>
      </div>
    </div>
  );
}