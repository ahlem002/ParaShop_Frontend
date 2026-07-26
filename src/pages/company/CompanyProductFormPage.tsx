import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { ProductCategory } from '../../types/product';
import {
  createCompanyProduct,
  getCategories,
  getCompanyProduct,
  updateCompanyProduct,
} from '../../services/products.service';
import { resolveUploadUrl } from '../../config/api';

export function CompanyProductFormPage() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const isEdit = Boolean(productId);

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: '',
    description: '',
    categoryId: '',
    price: '',
    stock: '',
    notice: '',
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const cats = await getCategories();
      setCategories(cats);

      if (productId) {
        const product = await getCompanyProduct(productId);
        setForm({
          name: product.name,
          description: product.description ?? '',
          categoryId: product.categoryId,
          price: String(product.price),
          stock: String(product.stock),
          notice: product.notice ?? '',
        });
        setExistingImages(product.images ?? []);
      }
    } catch {
      setError('Failed to load form data.');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    if (!form.categoryId) {
      setError('Please select a category.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        categoryId: form.categoryId,
        price: form.price,
        stock: form.stock,
        notice: form.notice,
        images: imageFiles.length ? imageFiles : undefined,
      };

      if (isEdit && productId) {
        await updateCompanyProduct(productId, payload);
      } else {
        await createCompanyProduct(payload);
      }

      navigate('/company/products');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save product.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">
          {isEdit ? 'Edit product' : 'Add product'}
        </h1>
        <div className="admin-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">
        {isEdit ? 'Edit product' : 'Add product'}
      </h1>
      <p className="admin-validations__intro" style={{ marginBottom: 16 }}>
        {isEdit
          ? 'Saving changes will resubmit this product for admin validation.'
          : 'New products wait for admin validation before appearing on the home page.'}
      </p>

      <div className="admin-page-card">
        {error && (
          <div className="admin-error" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="productName">Name</label>
            <input
              id="productName"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="productDescription">Description</label>
            <textarea
              id="productDescription"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="productCategory">Category</label>
            <select
              id="productCategory"
              value={form.categoryId}
              onChange={(e) =>
                setForm({ ...form, categoryId: e.target.value })
              }
              required
            >
              <option value="" disabled>
                Select category
              </option>
              {categories.map((category) => (
                <option key={category.categoryId} value={category.categoryId}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="productPrice">Price (TND)</label>
              <input
                id="productPrice"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="productStock">Stock</label>
              <input
                id="productStock"
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="productImages">Images (up to 5)</label>
            <input
              id="productImages"
              type="file"
              accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
              multiple
              onChange={(e) =>
                setImageFiles(Array.from(e.target.files ?? []).slice(0, 5))
              }
            />
            {existingImages.length > 0 && (
              <div className="product-image-preview">
                {existingImages.map((image) => {
                  const url = resolveUploadUrl(image);
                  return url ? (
                    <img key={image} src={url} alt="" className="product-thumb" />
                  ) : null;
                })}
              </div>
            )}
            {imageFiles.length > 0 && (
              <>
                <span className="form-file-name">
                  {imageFiles.length} new file(s) selected
                </span>
                <div className="product-image-preview">
                  {imageFiles.map((file) => (
                    <img
                      key={`${file.name}-${file.lastModified}`}
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="product-thumb"
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="productNotice">Notice</label>
            <textarea
              id="productNotice"
              value={form.notice}
              onChange={(e) => setForm({ ...form, notice: e.target.value })}
              rows={5}
              placeholder="Usage instructions, dosage, warnings..."
            />
          </div>

          <div className="admin-table__actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create product'}
            </button>
            <Link to="/company/products" className="btn btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
