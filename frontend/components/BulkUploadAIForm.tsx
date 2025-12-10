"use client";

import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";

interface BulkUploadAIResult {
  success: boolean;
  productId: string;
  productTitle: string;
  error?: string;
  data?: any;
  aiAnalysis?: {
    title: string;
    description: string;
    features: string[];
    suggestedTags: string[];
    confidence: number;
  };
}

interface BulkUploadAIResponse {
  success: boolean;
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  results: BulkUploadAIResult[];
  message: string;
}

export default function BulkUploadAIForm() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [marketplace, setMarketplace] = useState("shopify");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<BulkUploadAIResponse | null>(
    null
  );
  
  // Bulk default values (same for all products)
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkCompareAtPrice, setBulkCompareAtPrice] = useState("");
  const [bulkInventory, setBulkInventory] = useState("");
  const [bulkTags, setBulkTags] = useState("");
  const [bulkFeatures, setBulkFeatures] = useState("");

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".csv"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setCsvFile(acceptedFiles[0]);
        toast.success(`CSV file selected: ${acceptedFiles[0].name}`);
      }
    },
  });

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!csvFile) {
      toast.error("Please select a CSV file");
      return;
    }

    setIsUploading(true);
    setUploadResults(null);

    try {
      const formData = new FormData();
      formData.append("csvFile", csvFile);
      formData.append("marketplace", marketplace);
      
      // Add bulk defaults if provided
      if (bulkPrice) formData.append("bulkPrice", bulkPrice);
      if (bulkCompareAtPrice) formData.append("bulkCompareAtPrice", bulkCompareAtPrice);
      if (bulkInventory) formData.append("bulkInventory", bulkInventory);
      if (bulkTags) formData.append("bulkTags", bulkTags);
      if (bulkFeatures) formData.append("bulkFeatures", bulkFeatures);

      const response = await fetch("http://localhost:3001/products/bulk-upload-ai", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setUploadResults(data);
        toast.success(data.message);
      } else {
        toast.error(data.message || "Bulk upload with AI failed");
      }
    } catch (error: any) {
      console.error("Bulk upload AI error:", error);
      toast.error("Failed to upload products with AI");
    } finally {
      setIsUploading(false);
    }
  };

  const clearResults = () => {
    setUploadResults(null);
    setCsvFile(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">✨ Bulk Product Upload with AI</h2>

        {/* CSV Format Instructions */}
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h3 className="font-semibold mb-2">CSV Format (AI-Powered):</h3>
          <p className="text-sm text-gray-700 mb-2">
            Your CSV file only needs 2 columns:
          </p>
          <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
            <li>
              <strong>id</strong> (required) - Unique identifier for the product
            </li>
            <li>
              <strong>folderPath</strong> (required) - Absolute path to folder
              containing product images
            </li>
          </ul>
          <div className="mt-3 p-3 bg-white rounded border border-purple-200">
            <p className="text-sm font-mono text-gray-800">
              id,folderPath<br/>
              PROD001,C:/images/product1<br/>
              PROD002,C:/images/product2
            </p>
          </div>
          <div className="mt-3 p-3 bg-blue-50 rounded">
            <p className="text-sm text-blue-800">
              <strong>🤖 AI will generate:</strong> Product title, description, and features from the images.
              You only need to set common values like price, inventory, and tags below.
            </p>
          </div>
        </div>

        <form onSubmit={handleBulkUpload}>
          {/* Marketplace Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Marketplace
            </label>
            <select
              value={marketplace}
              onChange={(e) => setMarketplace(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="shopify">Shopify</option>
              <option value="amazon">Amazon</option>
              <option value="meesho">Meesho</option>
            </select>
          </div>

          {/* Common Values for All Products */}
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-semibold mb-3 text-gray-800">
              Common Values (Applied to All Products)
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              These values will be the same for all products. Title, description, and features will be generated by AI.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={bulkPrice}
                  onChange={(e) => setBulkPrice(e.target.value)}
                  placeholder="99.99"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Compare At Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={bulkCompareAtPrice}
                  onChange={(e) => setBulkCompareAtPrice(e.target.value)}
                  placeholder="199.98"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inventory
                </label>
                <input
                  type="number"
                  value={bulkInventory}
                  onChange={(e) => setBulkInventory(e.target.value)}
                  placeholder="100"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Tags (Optional)
                </label>
                <input
                  type="text"
                  value={bulkTags}
                  onChange={(e) => setBulkTags(e.target.value)}
                  placeholder="sale,featured,new"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">AI tags will be combined with these</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Features (Optional)
                </label>
                <input
                  type="text"
                  value={bulkFeatures}
                  onChange={(e) => setBulkFeatures(e.target.value)}
                  placeholder="Free Shipping,1 Year Warranty"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">AI features will be combined with these</p>
              </div>
            </div>
          </div>

          {/* CSV File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CSV File
            </label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-300 hover:border-purple-400"
              }`}
            >
              <input {...getInputProps()} />
              {csvFile ? (
                <div>
                  <p className="text-green-600 font-medium">
                    ✓ {csvFile.name}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Click or drag to replace
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600">
                    {isDragActive
                      ? "Drop the CSV file here"
                      : "Drag & drop a CSV file here, or click to select"}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Accepts .csv files only (id,folderPath format)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isUploading || !csvFile}
            className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
              isUploading || !csvFile
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            }`}
          >
            {isUploading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing with AI...
              </span>
            ) : (
              "✨ Upload Products with AI"
            )}
          </button>
        </form>

        {/* Upload Results */}
        {uploadResults && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Upload Results</h3>
              <button
                onClick={clearResults}
                className="text-sm text-purple-600 hover:text-purple-800"
              >
                Clear Results
              </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-100 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-700">
                  {uploadResults.totalProcessed}
                </p>
                <p className="text-sm text-gray-600">Total Processed</p>
              </div>
              <div className="bg-green-100 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-700">
                  {uploadResults.successCount}
                </p>
                <p className="text-sm text-green-600">Successful</p>
              </div>
              <div className="bg-red-100 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-700">
                  {uploadResults.failedCount}
                </p>
                <p className="text-sm text-red-600">Failed</p>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
              {uploadResults.results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 border-b last:border-b-0 ${
                    result.success ? "bg-green-50" : "bg-red-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">
                        {result.success ? "✓" : "✗"} ID: {result.productId}
                      </p>
                      <p className="text-sm font-semibold text-gray-800 mt-1">
                        {result.productTitle}
                      </p>
                      {result.error && (
                        <p className="text-sm text-red-600 mt-1">
                          Error: {result.error}
                        </p>
                      )}
                      {result.success && result.aiAnalysis && (
                        <div className="mt-2 text-sm text-gray-700">
                          <p className="text-xs text-purple-600">
                            🤖 AI Confidence: {(result.aiAnalysis.confidence * 100).toFixed(0)}%
                          </p>
                          <p className="text-xs mt-1">
                            <strong>Description:</strong> {result.aiAnalysis.description.substring(0, 100)}...
                          </p>
                          {result.aiAnalysis.features && result.aiAnalysis.features.length > 0 && (
                            <p className="text-xs mt-1">
                              <strong>AI Features:</strong> {result.aiAnalysis.features.slice(0, 3).join(", ")}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        result.success
                          ? "bg-green-200 text-green-800"
                          : "bg-red-200 text-red-800"
                      }`}
                    >
                      {result.success ? "Success" : "Failed"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
