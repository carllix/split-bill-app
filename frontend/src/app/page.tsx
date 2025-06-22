// pages/index.tsx
"use client";

import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState("session1");
  const [totalPayment, setTotalPayment] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [handlingFee, setHandlingFee] = useState(0);
  const [otherFee, setOtherFee] = useState(0);
  const [discountPlus, setDiscountPlus] = useState(0);

  const [personName, setPersonName] = useState("");
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await axios.post("http://localhost:8000/upload/parse", formData);
    setItems(res.data.items);
    setTotalPayment(res.data.total_payment);
    setDiscount(res.data.discount);
    setHandlingFee(res.data.handling_fee);
    setOtherFee(res.data.other_fee);
    setDiscountPlus(res.data.discount_plus);
  };

  const buildPayload = () => {
    return {
      session_id: sessionId,
      items: [
        ...items,
        { name: "__total_payment__", quantity: 1, unit_price: totalPayment },
        { name: "__discount__", quantity: 1, unit_price: discount },
        { name: "__handling_fee__", quantity: 1, unit_price: handlingFee },
        { name: "__other_fee__", quantity: 1, unit_price: otherFee },
        { name: "__discount_plus__", quantity: 1, unit_price: discountPlus },
      ],
      assignments
    };
  };

  const handleSplit = async () => {
    const res = await axios.post("http://localhost:8000/split", buildPayload());
    setResults(res.data);
  };

  const handleDownloadPDF = async () => {
    const blob = await axios.post("http://localhost:8000/split/pdf", buildPayload(), { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([blob.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `split_summary_${sessionId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const addAssignment = () => {
    if (!personName || selectedQuantity <= 0) return;
    const existing = assignments.find(a => a.name === personName);
    if (existing) {
      existing.items.push({ item_index: selectedItemIndex, quantity: selectedQuantity });
      setAssignments([...assignments]);
    } else {
      setAssignments([...assignments, { name: personName, items: [{ item_index: selectedItemIndex, quantity: selectedQuantity }] }]);
    }
    setPersonName("");
    setSelectedQuantity(1);
  };

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Upload Struk & Split Bill</h1>

      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <button onClick={handleUpload} className="bg-blue-500 px-3 py-1 text-white rounded">Upload & Parse</button>

      <div>
        <h2 className="font-semibold">Parsed Items</h2>
        <ul>
          {items.map((item, i) => (
            <li key={i}>{item.name} x{item.quantity} @Rp{item.unit_price}</li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="font-semibold">Tambah Assignment</h2>
        <input
          type="text"
          placeholder="Nama Orang"
          value={personName}
          onChange={(e) => setPersonName(e.target.value)}
          className="border px-2 py-1 mr-2"
        />
        <select value={selectedItemIndex} onChange={(e) => setSelectedItemIndex(parseInt(e.target.value))} className="border px-2 py-1 mr-2">
          {items.map((item, index) => (
            <option value={index} key={index}>{item.name}</option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          max={items[selectedItemIndex]?.quantity || 1}
          value={selectedQuantity}
          onChange={(e) => setSelectedQuantity(parseInt(e.target.value))}
          className="border px-2 py-1 mr-2 w-20"
        />
        <button onClick={addAssignment} className="bg-yellow-600 px-3 py-1 text-white rounded">Tambah</button>

        <div className="mt-2">
          <h3 className="font-medium">Current Assignments:</h3>
          <pre className="bg-gray-100 p-2 rounded text-sm text-black">{JSON.stringify(assignments, null, 2)}</pre>
        </div>
      </div>

      <div>
        <button onClick={handleSplit} className="bg-green-600 px-3 py-1 text-white rounded">Split Bill</button>
        <button onClick={handleDownloadPDF} className="bg-red-600 px-3 py-1 text-white rounded ml-2">Download PDF</button>
      </div>

      <div>
        <h2 className="font-semibold">Result:</h2>
        <pre className="bg-gray-100 p-2 rounded text-sm text-black">{JSON.stringify(results, null, 2)}</pre>
      </div>
    </main>
  );
}
