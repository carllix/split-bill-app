'use client';
import React, { useState } from 'react';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Item } from '../types';

export default function EditItemsStep() {
  const { state, dispatch } = useApp();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Item>({ name: '', quantity: 1, unit_price: 0 });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditForm({ ...state.items[index] });
  };

  const handleSave = () => {
    if (editingIndex !== null) {
      const updatedItems = [...state.items];
      updatedItems[editingIndex] = editForm;
      dispatch({ type: 'SET_ITEMS', payload: updatedItems });
      setEditingIndex(null);
    }
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setEditForm({ name: '', quantity: 1, unit_price: 0 });
  };

  const handleDelete = (index: number) => {
    const updatedItems = state.items.filter((_, i) => i !== index);
    dispatch({ type: 'SET_ITEMS', payload: updatedItems });
  };

  const handleAddItem = () => {
    const newItem: Item = { name: 'New Item', quantity: 1, unit_price: 0 };
    dispatch({ type: 'SET_ITEMS', payload: [...state.items, newItem] });
    setEditingIndex(state.items.length);
    setEditForm(newItem);
  };

  const handleNext = () => {
    if (state.items.length === 0) {
      alert('Please add at least one item before continuing.');
      return;
    }
    dispatch({ type: 'SET_STEP', payload: 3 });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Edit Items</h2>
        <button
          onClick={handleNext}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
        >
          Next: Assign Items
        </button>
      </div>

      <div className="space-y-4">
        {state.items.map((item, index) => (
          <div key={index} className="bg-white p-4 rounded-lg border">
            {editingIndex === index ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editForm.quantity}
                      onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Price
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.unit_price}
                      onChange={(e) => setEditForm({ ...editForm, unit_price: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                  <p className="text-gray-600">
                    Quantity: {item.quantity} × {formatCurrency(item.unit_price)}
                  </p>
                  <p className="font-medium text-blue-600">
                    Total: {formatCurrency(item.quantity * item.unit_price)}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(index)}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleAddItem}
        className="w-full mt-4 p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 flex items-center justify-center"
      >
        <Plus className="w-5 h-5 mr-2" />
        Add New Item
      </button>
    </div>
  );
}