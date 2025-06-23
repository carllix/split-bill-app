'use client';

import React, { useState } from 'react';
import { AppProvider, useApp } from '../context/AppContext';
import StepIndicator from '../components/StepIndicator';
import UploadStep from '../components/UploadStep';
import EditItemsStep from '../components/EditItemsStep';
import AssignStep from '../components/AssignStep';
import ResultsStep from '../components/ResultsStep';
import ErrorModal from '../components/ErrorModal';

function BillSplitterContent() {
  const { state } = useApp();
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);

  const handleError = (message: string) => {
    setErrorMessage(message);
    setShowError(true);
  };

  const closeError = () => {
    setShowError(false);
    setErrorMessage('');
  };

  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 1:
        return <UploadStep onError={handleError} />;
      case 2:
        return <EditItemsStep />;
      case 3:
        return <AssignStep />;
      case 4:
        return <ResultsStep onError={handleError} />;
      default:
        return <UploadStep onError={handleError} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Bill Splitter</h1>
            <p className="mt-1 text-gray-600">Upload, edit, assign, and split your bills easily</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StepIndicator currentStep={state.currentStep} />
        
        <div className="bg-white rounded-lg shadow-sm min-h-96">
          <div className="p-6">
            {renderCurrentStep()}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-gray-500 text-sm">
            Bill Splitter - Making bill splitting easier for everyone
          </p>
        </div>
      </footer>

      {/* Error Modal */}
      <ErrorModal
        isOpen={showError}
        onClose={closeError}
        message={errorMessage}
      />
    </div>
  );
}

export default function BillSplitter() {
  return (
    <AppProvider>
      <BillSplitterContent />
    </AppProvider>
  );
}