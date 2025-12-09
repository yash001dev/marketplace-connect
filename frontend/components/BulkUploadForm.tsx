"use client";

import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";

interface BulkUploadResult {
  success: boolean;
  productTitle: string;
  error?: string;
  data?: any;
}

interface BulkUploadResponse {
  success: boolean;
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  results: BulkUploadResult[];
  message: string;
}

export default function BulkUploadForm() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [marketplace, setMarketplace] = useState("shopify");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<BulkUploadResponse | null>(
    null
  );

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

      const response = await fetch("http://localhost:3001/products/bulk-upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setUploadResults(data);
        toast.success(data.message);
      } else {
        toast.error(data.message || "Bulk upload failed");
      }
    } catch (error: any) {
      console.error("Bulk upload error:", error);
      toast.error("Failed to upload products");
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
        <h2 className="text-2xl font-bold mb-6">Bulk Product Upload</h2>

        {/* CSV Format Instructions */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold mb-2">CSV Format Requirements:</h3>
          <p className="text-sm text-gray-700 mb-2">
            Your CSV file must include the following columns:
          </p>
          <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
            <li>
              <strong>title</strong> (required) - Product title
            </li>
            <li>
              <strong>description</strong> (required) - Product description (max
              130 chars)
            </li>
            <li>
              <strong>folderPath</strong> (required) - Absolute path to folder
              containing product images
            </li>
            <li>
              <strong>price</strong> (optional) - Product price
            </li>
            <li>
              <strong>compareAtPrice</strong> (optional) - Compare at price (will
              auto-double if empty)
            </li>
            <li>
              <strong>inventory</strong> (optional) - Inventory quantity
            </li>
            <li>
              <strong>tags</strong> (optional) - Comma-separated tags
            </li>
            <li>
              <strong>features</strong> (optional) - Comma-separated features
            </li>
          </ul>
          <p className="text-sm text-gray-600 mt-2">
            Example: title,description,folderPath,price,compareAtPrice,inventory,tags,features
          </p>
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
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="shopify">Shopify</option>
              <option value="amazon">Amazon</option>
              <option value="meesho">Meesho</option>
            </select>
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
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-blue-400"
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
                    Accepts .csv files only
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
                : "bg-blue-600 hover:bg-blue-700"
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
                Processing...
              </span>
            ) : (
              "Upload Products"
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
                className="text-sm text-blue-600 hover:text-blue-800"
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
                        {result.success ? "✓" : "✗"} {result.productTitle}
                      </p>
                      {result.error && (
                        <p className="text-sm text-red-600 mt-1">
                          Error: {result.error}
                        </p>
                      )}
                      {result.success && result.data && (
                        <p className="text-sm text-gray-600 mt-1">
                          Created successfully
                        </p>
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
