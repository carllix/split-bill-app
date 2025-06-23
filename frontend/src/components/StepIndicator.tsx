'use client';
import React from 'react';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
}

const steps = [
  { number: 1, title: 'Upload', description: 'Upload receipt' },
  { number: 2, title: 'Edit Items', description: 'Edit extracted items' },
  { number: 3, title: 'Assign', description: 'Assign items to people' },
  { number: 4, title: 'Results', description: 'View split results' }
];

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                  step.number < currentStep
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : step.number === currentStep
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white border-gray-300 text-gray-500'
                }`}
              >
                {step.number < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{step.number}</span>
                )}
              </div>
              <div className="mt-2 text-center">
                <p className={`text-sm font-medium ${
                  step.number <= currentStep ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-400 hidden sm:block">
                  {step.description}
                </p>
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`w-16 sm:w-24 h-0.5 mx-2 transition-colors ${
                  step.number < currentStep ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}