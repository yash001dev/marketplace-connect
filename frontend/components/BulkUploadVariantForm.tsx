"use client";

import React, { useState } from "react";
import { useDropzone } from "react-dropzone";

interface BulkUploadVariantResult {
  success: boolean;
  productTitle: string;
  variantsCreated: number;
  error?: string;
  data?: any;
}

interface BulkUploadVariantResponse {
  success: boolean;
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  totalVariants: number;
  results: BulkUploadVariantResult[];
  message: string;
}

export default function BulkUploadVariantForm() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [marketplace, setMarketplace] = useState("shopify");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] =
    useState<BulkUploadVariantResponse | null>(null);

  // Bulk default values
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkCompareAtPrice, setBulkCompareAtPrice] = useState("");
  const [bulkInventory, setBulkInventory] = useState("");
  const [bulkTags, setBulkTags] = useState("");
  const [bulkFeatures, setBulkFeatures] = useState("");

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "text/csv": [".csv"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setCsvFile(acceptedFiles[0]);
      }
    },
  });

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!csvFile) {
      alert("Please select a CSV file");
      return;
    }

    setIsUploading(true);
    setUploadResults(null);

    try {
      const formData = new FormData();
      formData.append("csvFile", csvFile);
      formData.append("marketplace", marketplace);

      if (bulkPrice) formData.append("bulkPrice", bulkPrice);
      if (bulkCompareAtPrice)
        formData.append("bulkCompareAtPrice", bulkCompareAtPrice);
      if (bulkInventory) formData.append("bulkInventory", bulkInventory);
      if (bulkTags) formData.append("bulkTags", bulkTags);
      if (bulkFeatures) formData.append("bulkFeatures", bulkFeatures);

      const response = await fetch(
        "http://localhost:3001/products/bulk-upload-variant",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.success) {
        setUploadResults(data);
      } else {
        alert(data.message || "Bulk upload failed");
      }
    } catch (error: any) {
      console.error("Bulk upload error:", error);
      alert("Failed to upload products");
    } finally {
      setIsUploading(false);
    }
  };

  const clearResults = () => {
    setUploadResults(null);
    setCsvFile(null);
  };

  const downloadTemplate = () => {
    const csvContent = `title,description,metaTitle,metaDescription,folderPath,variantOption,variants,price,compareAtPrice,inventory,tags,features
"Premium Phone Case Set","Protective phone cases in multiple materials","Premium Phone Case - Multiple Materials | YourBrand","Shop our premium phone cases available in Metal, Glass, and Anti-Yellow Silicon.","C:/Projects/MarketPlace/product-images/phone-cases","Material","Metal,Glass,Anti Yellow-Silicon",29.99,59.98,100,"phone case,protective","Shockproof,Scratch Resistant"

Note: variantOption can be: Material, Color, Size, Style, etc.
Place all images in the folderPath directory.
Name variant images: metal.jpg, glass.jpg, anti-yellow-silicon.jpg
For multiple images per variant: metal-1.jpg, metal-2.jpg, etc.`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk-upload-variant-template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Bulk Product Upload with Variants</h2>
          <button
            onClick={downloadTemplate}
            className="text-blue-600 hover:text-blue-700 underline text-sm"
          >
            Download CSV Template
          </button>
        </div>

        {/* Instructions */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold mb-2">CSV Format & Image Naming:</h3>
          <p className="text-sm text-gray-700 mb-3">
            Your CSV file must include these columns:
          </p>
          <ul className="text-sm text-gray-700 list-disc list-inside space-y-1 mb-3">
            <li><strong>title</strong> (required) - Product title</li>
            <li><strong>description</strong> (required) - Product description</li>
            <li><strong>metaTitle</strong> (required) - SEO meta title</li>
            <li><strong>metaDescription</strong> (required) - SEO meta description</li>
            <li><strong>folderPath</strong> (required) - Path to folder containing all product images</li>
            <li><strong>variantOption</strong> (required) - Option name (e.g., "Material", "Color", "Size")</li>
            <li><strong>variants</strong> (required) - Comma-separated variant values (e.g., "Metal,Glass,Anti Yellow-Silicon")</li>
            <li><strong>price, compareAtPrice, inventory, tags, features</strong> (optional)</li>
          </ul>
          <div className="bg-white p-3 rounded border border-blue-300">
            <p className="text-sm font-semibold text-gray-800 mb-2">Image Naming Convention:</p>
            <pre className="text-xs text-gray-700 font-mono">
{`Folder: product-images/phone-cases/
  random1.jpg         (general product image)
  random2.jpg         (general product image)
  metal.jpg           (Metal variant image)
  metal-2.jpg         (Metal variant image 2)
  glass.jpg           (Glass variant image)
  anti-yellow-silicon.jpg  (Anti Yellow-Silicon variant)`}
            </pre>
            <div className="mt-2 space-y-1 text-xs text-gray-700">
              <p>✓ <strong>Variant images</strong>: Name files after variant (e.g., metal.jpg for "Metal")</p>
              <p>✓ <strong>Multiple images per variant</strong>: Use metal-1.jpg, metal-2.jpg or metal_1.jpg, metal_2.jpg</p>
              <p>✓ <strong>Case insensitive</strong>: METAL.jpg, metal.jpg, Metal.jpg all work</p>
              <p>✓ <strong>Spaces in variant names</strong>: Use hyphens (Anti Yellow-Silicon → anti-yellow-silicon.jpg)</p>
            </div>
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
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="shopify">Shopify</option>
              <option value="amazon">Amazon</option>
              <option value="meesho">Meesho</option>
            </select>
          </div>

          {/* Bulk Defaults */}
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-semibold mb-3 text-gray-800">
              Bulk Default Values (Applied to all variants)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={bulkPrice}
                  onChange={(e) => setBulkPrice(e.target.value)}
                  placeholder="29.99"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Compare At Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={bulkCompareAtPrice}
                  onChange={(e) => setBulkCompareAtPrice(e.target.value)}
                  placeholder="59.98"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Inventory
                </label>
                <input
                  type="number"
                  value={bulkInventory}
                  onChange={(e) => setBulkInventory(e.target.value)}
                  placeholder="100"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Tags
                </label>
                <input
                  type="text"
                  value={bulkTags}
                  onChange={(e) => setBulkTags(e.target.value)}
                  placeholder="phone case,protective"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Features
                </label>
                <textarea
                  value={bulkFeatures}
                  onChange={(e) => setBulkFeatures(e.target.value)}
                  placeholder="Shockproof,Scratch Resistant"
                  rows={2}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* CSV Upload */}
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
                  <p className="text-green-600 font-medium">✓ {csvFile.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Click or drag to replace
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600">
                    {isDragActive
                      ? "Drop the CSV file here"
                      : "Drag & drop CSV file here, or click to select"}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">Accepts .csv files only</p>
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
            {isUploading ? "Processing..." : "Upload Products with Variants"}
          </button>
        </form>
      </div>

      {/* Results */}
      {uploadResults && (
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Upload Results</h3>
            <button
              onClick={clearResults}
              className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
              Clear Results
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-blue-600">
                {uploadResults.totalProcessed}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Variants</p>
              <p className="text-2xl font-bold text-purple-600">
                {uploadResults.totalVariants}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Successful</p>
              <p className="text-2xl font-bold text-green-600">
                {uploadResults.successCount}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">
                {uploadResults.failedCount}
              </p>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="space-y-3">
            {uploadResults.results.map((result, index) => (
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
                      {result.success && result.variantsCreated > 0 && (
                        <span className="text-xs font-medium px-2 py-1 rounded bg-purple-200 text-purple-800">
                          {result.variantsCreated} VARIANTS
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-gray-800 mb-1">
                      {result.productTitle}
                    </p>
                    {result.success && result.data?.variants && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600 mb-1">Variants created:</p>
                        <div className="flex flex-wrap gap-1">
                          {result.data.variants.map((variant: any, vIdx: number) => (
                            <span
                              key={vIdx}
                              className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded"
                            >
                              {variant.title}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.error && (
                      <p className="text-sm text-red-700">{result.error}</p>
                    )}
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
