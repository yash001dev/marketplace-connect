"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";

interface MetaUpdateResult {
  url: string;
  success: boolean;
  message: string;
  type?: "collection" | "product";
  identifier?: string;
}

interface MetaUpdateResponse {
  success: boolean;
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  results: MetaUpdateResult[];
  message: string;
}

export default function MetaUpdateForm() {
  const [marketplace, setMarketplace] = useState<string>("shopify");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MetaUpdateResponse | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "text/csv": [".csv"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setCsvFile(acceptedFiles[0]);
        setResults(null); // Clear previous results
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!csvFile) {
      alert("Please upload a CSV file");
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append("csvFile", csvFile);
      formData.append("marketplace", marketplace);

      const response = await fetch(
        "http://localhost:3001/products/meta-update",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to process meta updates");
      }

      setResults(data);
    } catch (error: any) {
      alert(error.message || "An error occurred during meta update");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `Page URL,Meta Title,Meta Description
https://yourstore.myshopify.com/collections/summer-collection,Summer Collection 2024,Browse our latest summer collection with fresh styles
https://yourstore.myshopify.com/products/blue-t-shirt,Blue Cotton T-Shirt,Comfortable blue t-shirt made from premium cotton`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "meta-update-template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Update Meta Titles & Descriptions
          </h2>
          <button
            onClick={downloadTemplate}
            className="text-blue-600 hover:text-blue-700 underline text-sm"
          >
            Download CSV Template
          </button>
        </div>

        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-semibold text-blue-900 mb-2">CSV Format:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Page URL:</strong> Full URL (supports /collections/ and /products/ paths)</li>
            <li>• <strong>Meta Title:</strong> SEO title for the page</li>
            <li>• <strong>Meta Description:</strong> SEO description for the page</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Marketplace Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Marketplace *
            </label>
            <select
              value={marketplace}
              onChange={(e) => setMarketplace(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="shopify">Shopify</option>
              <option value="amazon">Amazon</option>
              <option value="meesho">Meesho</option>
            </select>
          </div>

          {/* CSV File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload CSV File *
            </label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input {...getInputProps()} />
              {csvFile ? (
                <div>
                  <p className="text-green-600 font-medium">{csvFile.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Click or drag to replace
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600">
                    {isDragActive
                      ? "Drop the CSV file here"
                      : "Drag and drop CSV file here, or click to select"}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    CSV file with Page URL, Meta Title, Meta Description
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !csvFile}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? "Processing..." : "Update Meta Information"}
          </button>
        </form>
      </div>

      {/* Results Section */}
      {results && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Update Results
          </h3>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Processed</p>
              <p className="text-2xl font-bold text-blue-600">
                {results.totalProcessed}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Successful</p>
              <p className="text-2xl font-bold text-green-600">
                {results.successCount}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">
                {results.failedCount}
              </p>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="space-y-3">
            {results.results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  result.success
                    ? "bg-green-50 border-green-500"
                    : "bg-red-50 border-red-500"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          result.success
                            ? "bg-green-200 text-green-800"
                            : "bg-red-200 text-red-800"
                        }`}
                      >
                        {result.success ? "SUCCESS" : "FAILED"}
                      </span>
                      {result.type && (
                        <span className="text-xs font-medium px-2 py-1 rounded bg-gray-200 text-gray-700">
                          {result.type.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-800 mb-1 break-all">
                      {result.url}
                    </p>
                    {result.identifier && (
                      <p className="text-xs text-gray-600 mb-1">
                        Identifier: {result.identifier}
                      </p>
                    )}
                    <p
                      className={`text-sm ${
                        result.success ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {result.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
