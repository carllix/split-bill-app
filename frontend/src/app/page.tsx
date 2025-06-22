"use client";

import React, { useState } from "react";
import {
  Upload,
  FileText,
  Users,
  Calculator,
  Download,
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
} from "lucide-react";

const BillSplitterApp = () => {
  const [file, setFile] = useState(null);
  const [items, setItems] = useState([]);
  const [people, setPeople] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [results, setResults] = useState([]);
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [totalPayment, setTotalPayment] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [handlingFee, setHandlingFee] = useState(0);
  const [otherFee, setOtherFee] = useState(0);
  const [discountPlus, setDiscountPlus] = useState(0);

  // UI States
  const [currentStep, setCurrentStep] = useState(1);
  const [editingItem, setEditingItem] = useState(null);
  const [editingItemData, setEditingItemData] = useState(null);

  const [newPersonName, setNewPersonName] = useState("");
  const [selectedPerson, setSelectedPerson] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Mock upload function (replace with your actual API call)
  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/upload/parse", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to parse PDF");

      const data = await response.json();

      const parsedItems = data.items.map((item, index) => ({
        ...item,
        id: index,
        originalQuantity: item.quantity,
        assignedQuantity: 0,
      }));

      setItems(parsedItems);
      setTotalPayment(data.total_payment);
      setDiscount(data.discount);
      setHandlingFee(data.handling_fee);
      setOtherFee(data.other_fee);
      setDiscountPlus(data.discount_plus);
      setCurrentStep(2);
    } catch (err) {
      console.error(err);
      alert("Failed to parse receipt");
    } finally {
      setIsUploading(false);
    }
  };

  const handleItemEdit = (itemId, field, value) => {
    setItems(
      items.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  const saveItemEdit = (itemId) => {
    setEditingItem(null);
    // Recalculate assigned quantities when item quantity changes
    const updatedItems = items.map((item) => {
      if (item.id === itemId && item.assignedQuantity > item.quantity) {
        return { ...item, assignedQuantity: item.quantity };
      }
      return item;
    });
    setItems(updatedItems);
  };

  const addPerson = () => {
    if (newPersonName.trim() && !people.includes(newPersonName.trim())) {
      setPeople([...people, newPersonName.trim()]);
      setNewPersonName("");
    }
  };

  const removePerson = (personName) => {
    setPeople(people.filter((p) => p !== personName));
    setAssignments(assignments.filter((a) => a.name !== personName));
    // Recalculate assigned quantities
    recalculateAssignedQuantities(
      assignments.filter((a) => a.name !== personName)
    );
  };

  const recalculateAssignedQuantities = (currentAssignments) => {
    const assignedCounts = {};
    currentAssignments.forEach((assignment) => {
      assignment.items.forEach((item) => {
        assignedCounts[item.item_index] =
          (assignedCounts[item.item_index] || 0) + item.quantity;
      });
    });

    setItems(
      items.map((item) => ({
        ...item,
        assignedQuantity: assignedCounts[item.id] || 0,
      }))
    );
  };

  const addAssignment = (personName, itemId, quantity) => {
    const item = items.find((i) => i.id === itemId);
    if (
      !item ||
      quantity <= 0 ||
      item.assignedQuantity + quantity > item.quantity
    )
      return;

    const existingAssignment = assignments.find((a) => a.name === personName);
    const updatedAssignments = [...assignments];

    if (existingAssignment) {
      const existingItem = existingAssignment.items.find(
        (i) => i.item_index === itemId
      );
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        existingAssignment.items.push({ item_index: itemId, quantity });
      }
    } else {
      updatedAssignments.push({
        name: personName,
        items: [{ item_index: itemId, quantity }],
      });
    }

    setAssignments(updatedAssignments);
    recalculateAssignedQuantities(updatedAssignments);
  };

  const removeAssignment = (personName, itemId) => {
    const updatedAssignments = assignments
      .map((assignment) => {
        if (assignment.name === personName) {
          return {
            ...assignment,
            items: assignment.items.filter(
              (item) => item.item_index !== itemId
            ),
          };
        }
        return assignment;
      })
      .filter((assignment) => assignment.items.length > 0);

    setAssignments(updatedAssignments);
    recalculateAssignedQuantities(updatedAssignments);
  };

  const buildPayload = () => ({
    session_id: sessionId,
    items: items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unit_price: item.unit_price,
    })),
    assignments,
    total_payment: totalPayment,
    discount,
    discount_plus: discountPlus,
    handling_fee: handlingFee,
    other_fee: otherFee,
  });

  const handleSplit = async () => {
    try {
      const payload = buildPayload();

      const response = await fetch("http://localhost:8000/split", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to calculate split");

      const data = await response.json();
      setResults(data);
      setCurrentStep(4);
    } catch (err) {
      console.error(err);
      alert("Failed to calculate split");
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const payload = buildPayload();

      const response = await fetch("http://localhost:8000/split/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `split_summary_${sessionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to download PDF");
    }
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= step
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {step}
          </div>
          {step < 4 && (
            <div
              className={`w-16 h-1 mx-2 ${
                currentStep > step ? "bg-blue-600" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const StepLabels = () => (
    <div className="flex justify-center mb-8">
      <div className="flex space-x-16 text-sm">
        <span
          className={
            currentStep >= 1 ? "text-blue-600 font-medium" : "text-gray-500"
          }
        >
          Upload
        </span>
        <span
          className={
            currentStep >= 2 ? "text-blue-600 font-medium" : "text-gray-500"
          }
        >
          Edit Items
        </span>
        <span
          className={
            currentStep >= 3 ? "text-blue-600 font-medium" : "text-gray-500"
          }
        >
          Assign
        </span>
        <span
          className={
            currentStep >= 4 ? "text-blue-600 font-medium" : "text-gray-500"
          }
        >
          Results
        </span>
      </div>
    </div>
  );

  const UploadStep = () => (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <Upload className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Upload Receipt
          </h2>
          <p className="text-gray-600">
            Upload your receipt PDF to get started
          </p>
        </div>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">
                {file ? file.name : "Click to select PDF file"}
              </p>
            </label>
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>Upload & Parse</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const EditItemsStep = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Edit Items</h2>
          <button
            onClick={() => setCurrentStep(3)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Next: Assign Items
          </button>
        </div>

        <div className="grid gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {editingItem === item.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editingItemData.name}
                        onChange={(e) =>
                          setEditingItemData({
                            ...editingItemData,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex space-x-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={editingItemData.quantity}
                            onChange={(e) =>
                              setEditingItemData({
                                ...editingItemData,
                                quantity: parseInt(e.target.value) || 1,
                              })
                            }
                            className="w-20 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Price
                          </label>
                          <input
                            type="number"
                            value={editingItemData.unit_price}
                            onChange={(e) =>
                              setEditingItemData({
                                ...editingItemData,
                                unit_price: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-32 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {item.name}
                      </h3>
                      <p className="text-gray-600">
                        Quantity: {item.quantity} × Rp
                        {item.unit_price.toLocaleString()}
                        {item.assignedQuantity > 0 && (
                          <span className="ml-2 text-sm text-blue-600">
                            ({item.assignedQuantity} assigned)
                          </span>
                        )}
                      </p>
                      <p className="text-lg font-semibold text-gray-800">
                        Total: Rp
                        {(item.quantity * item.unit_price).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  {editingItem === item.id ? (
                    <>
                      <button
                        onClick={() => {
                          // Save perubahan
                          setItems((prev) =>
                            prev.map((i) =>
                              i.id === item.id ? { ...editingItemData } : i
                            )
                          );
                          setEditingItem(null);
                          setEditingItemData(null);
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      >
                        <Save className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          // Batalkan perubahan
                          setEditingItem(null);
                          setEditingItemData(null);
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingItem(item.id);
                        setEditingItemData({ ...item });
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const AssignStep = () => (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* People Management */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Add People</h3>
          <div className="flex space-x-2 mb-4">
            <input
              type="text"
              placeholder="Enter person's name"
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addPerson();
                }
              }}
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addPerson}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>

          <div className="space-y-2">
            {people.map((person) => (
              <div
                key={person}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">{person}</span>
                </div>
                <button
                  onClick={() => removePerson(person)}
                  className="text-red-600 hover:bg-red-50 p-1 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Assignment Interface */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Assign Items</h3>

          {people.length > 0 ? (
            <div className="space-y-4">
              <select
                value={selectedPerson}
                onChange={(e) => setSelectedPerson(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select person</option>
                {people.map((person) => (
                  <option key={person} value={person}>
                    {person}
                  </option>
                ))}
              </select>

              {selectedPerson && (
                <div className="space-y-3">
                  {items.map((item) => {
                    const availableQuantity =
                      item.quantity - item.assignedQuantity;
                    const personAssignment = assignments
                      .find((a) => a.name === selectedPerson)
                      ?.items.find((i) => i.item_index === item.id);

                    return (
                      <div key={item.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-800">
                            {item.name}
                          </h4>
                          <span className="text-sm text-gray-600">
                            Available: {availableQuantity}
                          </span>
                        </div>

                        {personAssignment ? (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-green-600">
                              Assigned: {personAssignment.quantity}
                            </span>
                            <button
                              onClick={() =>
                                removeAssignment(selectedPerson, item.id)
                              }
                              className="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        ) : availableQuantity > 0 ? (
                          <div className="flex space-x-2">
                            {[...Array(Math.min(availableQuantity, 5))].map(
                              (_, i) => (
                                <button
                                  key={i}
                                  onClick={() =>
                                    addAssignment(
                                      selectedPerson,
                                      item.id,
                                      i + 1
                                    )
                                  }
                                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                                >
                                  +{i + 1}
                                </button>
                              )
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">
                            Fully assigned
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Add people first to start assigning items
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={handleSplit}
          disabled={assignments.length === 0}
          className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
        >
          <Calculator className="w-5 h-5" />
          <span>Calculate Split</span>
        </button>
      </div>
    </div>
  );

  const ResultsStep = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Split Results</h2>
          <button
            onClick={handleDownloadPDF}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Download PDF</span>
          </button>
        </div>

        <div className="grid gap-4">
          {results.map((result) => (
            <div key={result.name} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800">
                  {result.name}
                </h3>
                <span className="text-xl font-bold text-blue-600">
                  Rp{result.total.toLocaleString()}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Items: {result.items.length} assigned
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t">
          <button
            onClick={() => {
              setCurrentStep(1);
              setItems([]);
              setPeople([]);
              setAssignments([]);
              setResults([]);
              setFile(null);
            }}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
          >
            Start New Split
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Bill Splitter
          </h1>
          <p className="text-gray-600">
            Upload, edit, assign, and split your bills easily
          </p>
        </div>

        <StepIndicator />
        <StepLabels />

        <div className="mt-8">
          {currentStep === 1 && <UploadStep />}
          {currentStep === 2 && <EditItemsStep />}
          {currentStep === 3 && <AssignStep />}
          {currentStep === 4 && <ResultsStep />}
        </div>
      </div>
    </div>
  );
};

export default BillSplitterApp;
