'use client'

import { useState } from 'react'
import ProductForm from '@/components/ProductForm'
import AIProductForm from '@/components/AIProductForm'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('ai')

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Marketplace Connector
          </h1>
          <p className="text-lg text-gray-600">
            Easily add products to Shopify, Amazon, and Meesho from one place
          </p>
        </div>
        
        {/* Tab Navigation */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-2 flex gap-2">
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
              activeTab === 'ai'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ✨ AI-Powered
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
              activeTab === 'manual'
                ? 'bg-primary-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ✍️ Manual Entry
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'ai' ? <AIProductForm /> : <ProductForm />}

        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">
            Supported Marketplaces
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border-2 border-green-500 rounded-lg bg-green-50">
              <h3 className="font-semibold text-green-700 mb-2">✅ Shopify</h3>
              <p className="text-sm text-gray-600">
                Fully integrated with product and media upload
              </p>
            </div>
            <div className="p-4 border-2 border-yellow-500 rounded-lg bg-yellow-50">
              <h3 className="font-semibold text-yellow-700 mb-2">🚧 Amazon</h3>
              <p className="text-sm text-gray-600">
                Coming soon - Integration in progress
              </p>
            </div>
            <div className="p-4 border-2 border-yellow-500 rounded-lg bg-yellow-50">
              <h3 className="font-semibold text-yellow-700 mb-2">🚧 Meesho</h3>
              <p className="text-sm text-gray-600">
                Coming soon - Integration in progress
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
