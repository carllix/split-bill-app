'use client';
import React, { useState, useRef } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import apiService from '../services/api';

interface UploadStepProps {
  onError: (message: string) => void;
}

export default function UploadStep({ onError }: UploadStepProps) {
  const { dispatch } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.includes('pdf')) {
      onError('Please select a PDF file');
      return;
    }

    setIsUploading(true);
    try {
      const parsedData = await apiService.uploadAndParse(file);
      dispatch({ type: 'SET_PARSED_DATA', payload: parsedData });
      dispatch({ type: 'SET_STEP', payload: 2 });
    } catch (error: any) {
      onError(error.response?.data?.detail || 'Failed to parse PDF. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
          <Upload className="w-8 h-8 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Receipt</h2>
        <p className="text-gray-600">Upload your receipt PDF to get started</p>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileInputChange}
          className="hidden"
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-600">Processing your receipt...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <FileText className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">Click to select PDF file</p>
            <p className="text-gray-500">or drag and drop your receipt here</p>
          </div>
        )}
      </div>

      <div className="mt-6">
        <button
          onClick={handleClick}
          disabled={isUploading}
          className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Upload & Parse
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload & Parse
            </>
          )}
        </button>
      </div>
    </div>
  );
}