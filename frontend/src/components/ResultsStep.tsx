'use client';
import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, Receipt } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PersonSplitResult, SplitRequest } from '../types';
import apiService from '../services/api';

interface ResultsStepProps {
  onError: (message: string) => void;
}

export default function ResultsStep({ onError }: ResultsStepProps) {
  const { state, dispatch } = useApp();
  const [isCalculating, setIsCalculating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [splitResults, setSplitResults] = useState<PersonSplitResult[]>([]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateLocalSplit = () => {
    const results: PersonSplitResult[] = [];
    
    state.assignments.forEach(person => {
      let personTotal = 0;
      const personItems = person.items.map(assignment => {
        const item = state.items[assignment.item_index];
        const itemCost = item.unit_price * assignment.quantity;
        personTotal += itemCost;
        return assignment;
      });

      // Calculate proportional fees
      const itemsSubtotal = state.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
      const proportion = personTotal / itemsSubtotal;
      
      const proportionalFees = (
        (state.parsedData?.handling_fee || 0) +
        (state.parsedData?.other_fee || 0) -
        (state.parsedData?.discount || 0) -
        (state.parsedData?.discount_plus || 0)
      ) * proportion;

      const finalTotal = Math.round(personTotal + proportionalFees);

      results.push({
        name: person.name,
        total: finalTotal,
        items: personItems
      });
    });

    setSplitResults(results);
    dispatch({ type: 'SET_SPLIT_RESULTS', payload: results });
  };

  useEffect(() => {
    if (state.assignments.length > 0) {
      calculateLocalSplit();
    }
  }, [state.assignments, state.items, state.parsedData]);

  const handleDownloadPDF = async () => {
    if (!state.parsedData) {
      onError('No data available for PDF generation');
      return;
    }

    setIsDownloading(true);
    try {
      const splitRequest: SplitRequest = {
        session_id: state.sessionId,
        items: state.items,
        assignments: state.assignments,
        total_payment: state.parsedData.total_payment,
        discount: state.parsedData.discount,
        discount_plus: state.parsedData.discount_plus,
        handling_fee: state.parsedData.handling_fee,
        other_fee: state.parsedData.other_fee
      };

      const blob = await apiService.calculateSplit(splitRequest);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `split_summary_${state.sessionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      onError(error.response?.data?.detail || 'Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleStartNewSplit = () => {
    dispatch({ type: 'RESET' });
  };

  const getTotalSplit = () => {
    return splitResults.reduce((sum, result) => sum + result.total, 0);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Split Results</h2>
        <div className="flex space-x-3">
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center"
          >
            {isDownloading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Download PDF
          </button>
          <button
            onClick={handleStartNewSplit}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
          >
            Start New Split
          </button>
        </div>
      </div>

      {/* Summary Card */}
      {state.parsedData && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg mb-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Receipt className="w-5 h-5 mr-2" />
            Bill Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Subtotal</p>
              <p className="font-semibold">{formatCurrency(state.parsedData.total_price)}</p>
            </div>
            <div>
              <p className="text-gray-600">Handling Fee</p>
              <p className="font-semibold">{formatCurrency(state.parsedData.handling_fee)}</p>
            </div>
            <div>
              <p className="text-gray-600">Discount</p>
              <p className="font-semibold text-green-600">
                -{formatCurrency(state.parsedData.discount + state.parsedData.discount_plus)}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Total Payment</p>
              <p className="font-bold text-lg">{formatCurrency(state.parsedData.total_payment)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Split Results */}
      <div className="space-y-4">
        {splitResults.map((result) => (
          <div key={result.name} className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900">{result.name}</h3>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(result.total)}</p>
                <p className="text-sm text-gray-500">{result.items.length} item(s) assigned</p>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-2">Assigned Items:</h4>
              <div className="space-y-2">
                {result.items.map((assignment, index) => {
                  const item = state.items[assignment.item_index];
                  const itemTotal = item.unit_price * assignment.quantity;
                  
                  return (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">
                        {item.name} × {assignment.quantity}
                      </span>
                      <span className="font-medium">{formatCurrency(itemTotal)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Total Verification */}
      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-700">Total Split Amount:</span>
          <span className="text-lg font-bold text-gray-900">{formatCurrency(getTotalSplit())}</span>
        </div>
        {state.parsedData && (
          <div className="flex justify-between items-center mt-2 text-sm">
            <span className="text-gray-600">Original Bill Total:</span>
            <span className="text-gray-600">{formatCurrency(state.parsedData.total_payment)}</span>
          </div>
        )}
        {state.parsedData && Math.abs(getTotalSplit() - state.parsedData.total_payment) < 10 && (
          <p className="text-center text-green-600 text-sm mt-2">✓ Split calculation matches the original bill</p>
        )}
      </div>
    </div>
  );
}