'use client';

import React, { ChangeEvent, useState } from 'react';
import { Upload } from 'lucide-react';
import { TerraformPlan } from '@/lib/parsePlan';

interface FileUploadProps {
  onUpload: (data: TerraformPlan) => void;
}

export default function FileUpload({ onUpload }: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const json = JSON.parse(text);
        if (json.resource_changes) {
          setError(null);
          onUpload(json as TerraformPlan);
        } else {
          setError('Invalid Terraform plan file. Missing "resource_changes".');
        }
      } catch (err) {
        setError('Error parsing JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto">
      <label
        htmlFor="file-upload"
        className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600 transition-colors"
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <Upload className="w-10 h-10 mb-3 text-gray-400" />
          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">JSON (Terraform Plan)</p>
        </div>
        <input
          id="file-upload"
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileChange}
        />
      </label>
      {error && <p className="mt-4 text-red-500 text-sm font-medium">{error}</p>}
    </div>
  );
}
