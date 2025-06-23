'use client';
import React, { useState } from 'react';
import { Plus, Minus, Trash2, Users, Calculator } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PersonAssignment, ItemAssignment } from '../types';

export default function AssignStep() {
  const { state, dispatch } = useApp();
  const [newPersonName, setNewPersonName] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleAddPerson = () => {
    if (newPersonName.trim()) {
      dispatch({ type: 'ADD_PERSON', payload: newPersonName.trim() });
      setNewPersonName('');
    }
  };

  const handleRemovePerson = (personName: string) => {
    dispatch({ type: 'REMOVE_PERSON', payload: personName });
  };

  const getAssignedQuantity = (itemIndex: number): number => {
    return state.assignments.reduce((total, person) => {
      const assignment = person.items.find(item => item.item_index === itemIndex);
      return total + (assignment?.quantity || 0);
    }, 0);
  };

  const getAvailableQuantity = (itemIndex: number): number => {
    return state.items[itemIndex].quantity - getAssignedQuantity(itemIndex);
  };

  const getPersonAssignedQuantity = (personName: string, itemIndex: number): number => {
    const person = state.assignments.find(p => p.name === personName);
    const assignment = person?.items.find(item => item.item_index === itemIndex);
    return assignment?.quantity || 0;
  };

  const updatePersonAssignment = (personName: string, itemIndex: number, quantity: number) => {
    const updatedAssignments = state.assignments.map(person => {
      if (person.name === personName) {
        const existingItemIndex = person.items.findIndex(item => item.item_index === itemIndex);
        
        if (quantity === 0) {
          // Remove assignment if quantity is 0
          return {
            ...person,
            items: person.items.filter(item => item.item_index !== itemIndex)
          };
        } else {
          // Update or add assignment
          if (existingItemIndex >= 0) {
            const updatedItems = [...person.items];
            updatedItems[existingItemIndex] = { item_index: itemIndex, quantity };
            return { ...person, items: updatedItems };
          } else {
            return {
              ...person,
              items: [...person.items, { item_index: itemIndex, quantity }]
            };
          }
        }
      }
      return person;
    });

    dispatch({ type: 'SET_ASSIGNMENTS', payload: updatedAssignments });
  };

  const incrementQuantity = (personName: string, itemIndex: number) => {
    const currentQuantity = getPersonAssignedQuantity(personName, itemIndex);
    const available = getAvailableQuantity(itemIndex);
    
    if (available > 0) {
      updatePersonAssignment(personName, itemIndex, currentQuantity + 1);
    }
  };

  const decrementQuantity = (personName: string, itemIndex: number) => {
    const currentQuantity = getPersonAssignedQuantity(personName, itemIndex);
    
    if (currentQuantity > 0) {
      updatePersonAssignment(personName, itemIndex, currentQuantity - 1);
    }
  };

  const canProceed = () => {
    if (state.people.length === 0) return false;
    
    // Check if all items are fully assigned
    return state.items.every((_, index) => getAvailableQuantity(index) === 0);
  };

  const handleCalculateSplit = () => {
    if (!canProceed()) {
      alert('Please assign all items to people before calculating the split.');
      return;
    }
    dispatch({ type: 'SET_STEP', payload: 4 });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Assign Items</h2>
        <button
          onClick={handleCalculateSplit}
          disabled={!canProceed()}
          className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          <Calculator className="w-4 h-4 mr-2" />
          Calculate Split
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add People Section */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Add People
          </h3>
          
          <div className="flex space-x-2 mb-4">
            <input
              type="text"
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddPerson()}
              placeholder="Enter person name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddPerson}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Add
            </button>
          </div>

          <div className="space-y-2">
            {state.people.map((person) => (
              <div key={person} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{person}</span>
                <button
                  onClick={() => handleRemovePerson(person)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Assignment Summary */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment Summary</h3>
          <div className="space-y-3">
            {state.items.map((item, index) => {
              const assigned = getAssignedQuantity(index);
              const available = getAvailableQuantity(index);
              
              return (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      {assigned}/{item.quantity} assigned
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded text-sm ${
                    available === 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {available === 0 ? 'Complete' : `${available} remaining`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Assignment Grid */}
      {state.people.length > 0 && (
        <div className="mt-6 bg-white rounded-lg border overflow-hidden">
          <h3 className="text-lg font-semibold text-gray-900 p-6 pb-4">Assign Items to People</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  {state.people.map((person) => (
                    <th key={person} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {person}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Available
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {state.items.map((item, itemIndex) => (
                  <tr key={itemIndex}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(item.unit_price)} × {item.quantity}
                        </div>
                      </div>
                    </td>
                    {state.people.map((person) => {
                      const assignedQty = getPersonAssignedQuantity(person, itemIndex);
                      const available = getAvailableQuantity(itemIndex);
                      
                      return (
                        <td key={person} className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => decrementQuantity(person, itemIndex)}
                              disabled={assignedQty === 0}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-medium">{assignedQty}</span>
                            <button
                              onClick={() => incrementQuantity(person, itemIndex)}
                              disabled={available === 0}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        getAvailableQuantity(itemIndex) === 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {getAvailableQuantity(itemIndex)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}