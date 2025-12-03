'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { Upload, X, ShoppingBag, Loader2 } from 'lucide-react'

type MarketplaceType = 'shopify' | 'amazon' | 'meesho'

interface ImageFile extends File {
  preview?: string
}

export default function ProductForm() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [marketplace, setMarketplace] = useState<MarketplaceType>('shopify')
  const [images, setImages] = useState<ImageFile[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages = acceptedFiles.map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
      })
    )
    setImages((prev) => [...prev, ...newImages])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    maxSize: 20 * 1024 * 1024, // 20MB
  })

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Please enter a product title')
      return
    }

    if (!description.trim()) {
      toast.error('Please enter a product description')
      return
    }

    setIsSubmitting(true)
    const loadingToast = toast.loading('Creating product...')

    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('description', description)
      formData.append('marketplace', marketplace)

      images.forEach((image) => {
        formData.append('images', image)
      })

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/products`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create product')
      }

      toast.success(data.message || 'Product created successfully!', {
        id: loadingToast,
        duration: 5000,
      })

      // Reset form
      setTitle('')
      setDescription('')
      setImages([])
      
      console.log('Product created:', data.data)
    } catch (error: any) {
      toast.error(error.message || 'Failed to create product', {
        id: loadingToast,
      })
      console.error('Error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Marketplace Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Marketplace
          </label>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: 'shopify', label: 'Shopify', available: true },
              { value: 'amazon', label: 'Amazon', available: false },
              { value: 'meesho', label: 'Meesho', available: false },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={!option.available}
                onClick={() => setMarketplace(option.value as MarketplaceType)}
                className={`
                  relative p-4 border-2 rounded-lg text-center transition-all
                  ${
                    marketplace === option.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }
                  ${!option.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="font-semibold">{option.label}</div>
                {!option.available && (
                  <span className="text-xs text-gray-500">Coming Soon</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Product Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Product Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter product title"
            required
          />
        </div>

        {/* Product Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Product Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter product description"
            required
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Images
          </label>
          
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'}
            `}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-primary-600">Drop the images here...</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-1">
                  Drag & drop images here, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  PNG, JPG, GIF, WEBP up to 20MB
                </p>
              </div>
            )}
          </div>

          {/* Image Previews */}
          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((file, index) => (
                <div key={index} className="relative group">
                  <img
                    src={file.preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {file.name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
              Creating Product...
            </>
          ) : (
            <>
              <ShoppingBag className="h-5 w-5 mr-2" />
              Create Product
            </>
          )}
        </button>
      </form>
    </div>
  )
}
