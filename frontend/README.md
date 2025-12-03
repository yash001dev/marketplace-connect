# Frontend - Marketplace Connector UI

Next.js 14 application with modern UI for managing marketplace products.

## 🎨 Features

- **Responsive Design** - Works on desktop, tablet, and mobile
- **Drag & Drop Upload** - Easy image upload with preview
- **Real-time Validation** - Form validation with instant feedback
- **Toast Notifications** - Beautiful success/error messages
- **Marketplace Selection** - Visual selector for target marketplace
- **Loading States** - Clear feedback during async operations

## 🏗️ Project Structure

```
frontend/
├── app/
│   ├── layout.tsx      # Root layout with Toaster
│   ├── page.tsx        # Home page
│   └── globals.css     # Global styles
├── components/
│   └── ProductForm.tsx # Main product creation form
├── public/             # Static assets
└── package.json
```

## 🧩 Components

### ProductForm Component

Main form component for creating products.

**State Management:**
- `title` - Product title
- `description` - Product description
- `marketplace` - Selected marketplace (shopify/amazon/meesho)
- `images` - Array of uploaded images with previews
- `isSubmitting` - Loading state during submission

**Key Features:**
1. **Marketplace Selection** - Visual buttons with disabled state for unavailable options
2. **Image Upload** - Drag & drop with react-dropzone
3. **Image Preview** - Thumbnail grid with remove option
4. **Form Validation** - Client-side validation before submission
5. **Error Handling** - User-friendly error messages

### Layout Component

Root layout providing:
- Global styles (Tailwind CSS)
- Font configuration (Inter)
- Toast notification container
- Metadata for SEO

## 🎨 Styling

### Tailwind CSS Configuration

**Custom Colors:**
```javascript
primary: {
  50-900: // Blue color scale
}
```

**Responsive Breakpoints:**
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

### Component Patterns

**Cards:**
```tsx
className="bg-white rounded-xl shadow-lg p-8"
```

**Buttons:**
```tsx
className="bg-primary-600 hover:bg-primary-700 text-white py-3 px-6 rounded-lg"
```

**Form Inputs:**
```tsx
className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
```

## 🔄 Data Flow

```
User Input
    ↓
ProductForm State
    ↓
Form Validation
    ↓
FormData Creation
    ↓
Fetch API Request
    ↓
Backend API
    ↓
Response Handling
    ↓
UI Update (Toast + Reset)
```

## 🌐 API Integration

### Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### API Request Example

```typescript
const formData = new FormData()
formData.append('title', title)
formData.append('description', description)
formData.append('marketplace', marketplace)
images.forEach(image => formData.append('images', image))

const response = await fetch(`${apiUrl}/products`, {
  method: 'POST',
  body: formData,
})
```

## 📱 Responsive Design

### Mobile (< 640px)
- Single column layout
- Stacked marketplace buttons
- 2-column image grid

### Tablet (640px - 1024px)
- Optimized spacing
- 3-column marketplace buttons
- 3-column image grid

### Desktop (> 1024px)
- Maximum width container (max-w-4xl)
- 4-column image grid
- Optimal spacing and padding

## 🎯 User Experience

### Loading States
```tsx
{isSubmitting ? (
  <>
    <Loader2 className="animate-spin" />
    Creating Product...
  </>
) : (
  <>
    <ShoppingBag />
    Create Product
  </>
)}
```

### Toast Notifications
- **Loading**: "Creating product..."
- **Success**: "Product created successfully!"
- **Error**: Specific error message

### Image Management
- Preview with thumbnail grid
- Remove button on hover
- File name display
- Drag & drop visual feedback

## 🚀 Development

### Start Dev Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

### Lint Code
```bash
npm run lint
```

## 🎨 Customization

### Change Theme Colors

Edit `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Your color scale
      }
    }
  }
}
```

### Add New Marketplace

1. Add to marketplace type:
```typescript
type MarketplaceType = 'shopify' | 'amazon' | 'meesho' | 'newMarket'
```

2. Add to selector:
```typescript
{ value: 'newMarket', label: 'New Market', available: true }
```

### Customize Form Fields

Add new fields to form state and FormData:
```typescript
const [newField, setNewField] = useState('')
formData.append('newField', newField)
```

## 📦 Dependencies

### Core
- `next` - React framework
- `react` - UI library
- `react-dom` - React DOM rendering

### UI & Styling
- `tailwindcss` - Utility-first CSS
- `lucide-react` - Icon library
- `react-hot-toast` - Notifications

### File Upload
- `react-dropzone` - Drag & drop file upload

### HTTP Client
- `axios` - HTTP requests (available if needed)

## 🔍 Debugging

### Enable Verbose Logging
```typescript
console.log('Product created:', data.data)
console.error('Error:', error)
```

### Check Network Requests
1. Open browser DevTools
2. Go to Network tab
3. Look for POST request to `/products`
4. Check request payload and response

### Common Issues

**Images not uploading:**
- Check file size (< 20MB)
- Verify file format (PNG, JPG, JPEG, GIF, WEBP)
- Check browser console for errors

**Backend not reachable:**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend is running
- Check CORS configuration

## 🎓 Best Practices

1. **State Management** - Use local state for form data
2. **Validation** - Validate on client and server
3. **Error Handling** - Always handle fetch errors
4. **Loading States** - Disable form during submission
5. **Cleanup** - Clear form after successful submission
6. **Accessibility** - Use semantic HTML and ARIA labels

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Dropzone](https://react-dropzone.js.org/)
- [React Hot Toast](https://react-hot-toast.com/)
- [Lucide Icons](https://lucide.dev/)
