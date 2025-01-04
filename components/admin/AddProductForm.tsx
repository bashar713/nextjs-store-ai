"use client";
import { useState, useRef } from 'react';
import { supabase } from '@/utils/supabase';
import { Upload } from 'lucide-react';

interface AddProductFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AddProductForm({ onSuccess, onCancel }: AddProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMethod, setImageMethod] = useState<'upload' | 'url'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const price = parseFloat(formData.get('price') as string);
    
    try {
      let image_url = '';
      
      if (imageMethod === 'upload') {
        const imageFile = (formData.get('image') as File)?.size > 0 
          ? formData.get('image') as File 
          : null;

        if (imageFile) {
          const fileExt = imageFile.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const { error: uploadError, data } = await supabase.storage
            .from('product-images')
            .upload(fileName, imageFile);

          if (uploadError) throw uploadError;
          
          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName);
            
          image_url = publicUrl;
        }
      } else {
        image_url = imageUrl;
      }

      // Insert product
      const { error } = await supabase
        .from('products')
        .insert([
          {
            name,
            description,
            price,
            image_url: image_url || null,
          },
        ]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Product added successfully!' });
      formRef.current?.reset();
      setImagePreview(null);
      setImageUrl('');

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding product:', error);
      setMessage({ type: 'error', text: 'Failed to add product. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-base font-semibold text-gray-900 mb-2">
          Product Name
        </label>
        <input
          type="text"
          name="name"
          id="name"
          required
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 text-gray-900 text-base"
          placeholder="Enter product name"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-base font-semibold text-gray-900 mb-2">
          Description
        </label>
        <textarea
          name="description"
          id="description"
          rows={4}
          required
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 text-gray-900 text-base"
          placeholder="Enter product description"
        />
      </div>

      <div>
        <label htmlFor="price" className="block text-base font-semibold text-gray-900 mb-2">
          Price ($)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <input
            type="number"
            name="price"
            id="price"
            step="0.01"
            min="0"
            required
            className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 text-gray-900 text-base"
            placeholder="0.00"
          />
        </div>
      </div>

      <div>
        <label className="block text-base font-semibold text-gray-900 mb-2">
          Product Image
        </label>
        <div className="space-y-4">
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setImageMethod('upload')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                imageMethod === 'upload'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Upload Image
            </button>
            <button
              type="button"
              onClick={() => setImageMethod('url')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                imageMethod === 'url'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Image URL
            </button>
          </div>

          {imageMethod === 'upload' ? (
            <div className="mt-2 flex items-center space-x-6">
              <label className="cursor-pointer relative group">
                <div className={`h-40 w-40 rounded-lg border-2 border-dashed flex items-center justify-center
                  transition-all duration-200 ease-in-out
                  ${imagePreview 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-300 group-hover:border-primary/50 group-hover:bg-gray-50'}`}>
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-full w-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 group-hover:text-primary/70" />
                      <p className="mt-2 text-sm text-gray-500 group-hover:text-gray-600">
                        Click to upload
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        PNG, JPG up to 10MB
                      </p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              {imagePreview && (
                <button
                  type="button"
                  onClick={() => setImagePreview(null)}
                  className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setImagePreview(e.target.value);
                }}
                placeholder="Enter image URL"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 text-gray-900 text-base"
              />
              {imageUrl && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                  <div className="relative h-40 w-40 rounded-lg overflow-hidden">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                      onError={() => setImagePreview(null)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className={`px-6 py-2.5 text-sm font-medium text-white rounded-lg transition-colors
            ${loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'
            }`}
        >
          {loading ? 'Adding Product...' : 'Add Product'}
        </button>
      </div>
    </form>
  );
} 