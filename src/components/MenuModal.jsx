import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { getCategoryIcon } from './JapaneseIcons';
import { supabase } from '../lib/supabase';

export default function MenuModal({ isOpen, onClose, onSave, editingItem, inventoryItems = [] }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'rice',
    price: '',
    stock: '',
    emoji: '',
  });
  const [recipeRows, setRecipeRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name || '',
        category: editingItem.category || 'rice',
        price: editingItem.price || '',
        stock: editingItem.stock || '',
        emoji: '',
      });
      // Load existing recipes for this menu item
      loadRecipes(editingItem.id);
    } else {
      setFormData({
        name: '',
        category: 'rice',
        price: '',
        stock: '',
        emoji: '',
      });
      setRecipeRows([]);
    }
    setError('');
  }, [editingItem, isOpen]);

  const loadRecipes = async (menuItemId) => {
    const { data } = await supabase.from('recipes').select('*').eq('menu_item_id', menuItemId);

    if (data && data.length > 0) {
      setRecipeRows(
        data.map((r) => ({
          ingredient_id: r.ingredient_id,
          quantity_per_serving: r.quantity_per_serving,
        }))
      );
    } else {
      setRecipeRows([]);
    }
  };

  const addRecipeRow = () => {
    setRecipeRows((prev) => [...prev, { ingredient_id: '', quantity_per_serving: '' }]);
  };

  const updateRecipeRow = (index, field, value) => {
    setRecipeRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const removeRecipeRow = (index) => {
    setRecipeRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.stock) {
      setError('Please fill in all required fields.');
      return;
    }

    // Validate recipe rows
    const validRecipes = recipeRows.filter((r) => r.ingredient_id && r.quantity_per_serving);

    setLoading(true);
    try {
      // Save the menu item (parent handles insert/update and returns the saved item)
      const savedItem = await onSave(formData);

      // Save recipes if we have a menu item ID
      const menuItemId = editingItem?.id || savedItem?.id;
      if (menuItemId) {
        // Delete existing recipes for this item
        await supabase.from('recipes').delete().eq('menu_item_id', menuItemId);

        // Insert new recipes
        if (validRecipes.length > 0) {
          const recipePayload = validRecipes.map((r) => ({
            menu_item_id: menuItemId,
            ingredient_id: r.ingredient_id,
            quantity_per_serving: parseFloat(r.quantity_per_serving),
          }));
          await supabase.from('recipes').insert(recipePayload);
        }
      }

      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save item.');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'sushi', label: 'Sushi Platter' },
    { value: 'baked-sushi', label: 'Baked Sushi' },
    { value: 'kimbap', label: 'Kimbap' },
    { value: 'solo', label: 'Solo' },
    { value: 'salad', label: 'Salad' },
    { value: 'takoyaki-8pcs', label: 'Takoyaki (8pcs)' },
    { value: 'takoyaki-10pcs', label: 'Takoyaki (10pcs)' },
    { value: 'add-ons', label: 'Add-ons' },
    { value: 'rice', label: 'Rice' },
  ];

  const labelStyle = {
    display: 'block',
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: 'var(--muted)',
    marginBottom: '8px',
  };
  const inputStyle = {
    width: '100%',
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '12px',
    color: 'var(--cream)',
    outline: 'none',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="modal-root"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(4px)',
            }}
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="menu-modal"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '30px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
              }}
            >
              <h2
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: '1.5rem',
                  color: 'var(--cream)',
                  margin: 0,
                }}
              >
                {editingItem ? 'Edit Menu Item' : 'Add New Item'}
              </h2>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                }}
              >
                <X size={24} />
              </button>
            </div>

            {error && (
              <div
                style={{
                  background: 'rgba(160, 76, 76, 0.1)',
                  border: '1px solid rgba(160, 76, 76, 0.2)',
                  color: 'var(--red-bright)',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.85rem',
                }}
              >
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Item Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Salmon Aburi"
                  style={inputStyle}
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  marginBottom: '16px',
                }}
              >
                <div className="form-group">
                  <label style={labelStyle}>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label style={labelStyle}>Category Icon</label>
                  <div
                    style={{
                      width: '100%',
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '48px',
                    }}
                  >
                    {getCategoryIcon(formData.category, 40, 'var(--red-bright)')}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  marginBottom: '24px',
                }}
              >
                <div className="form-group">
                  <label style={labelStyle}>Price (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    style={inputStyle}
                  />
                </div>
                <div className="form-group">
                  <label style={labelStyle}>Initial Stock</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="0"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* ─── Recipe Section ─── */}
              <div
                style={{
                  borderTop: '1px solid var(--border)',
                  paddingTop: '20px',
                  marginBottom: '24px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <label style={{ ...labelStyle, marginBottom: 0 }}>
                    Recipe (Ingredients per Serving)
                  </label>
                  <button
                    type="button"
                    onClick={addRecipeRow}
                    style={{
                      background: 'rgba(154, 174, 71, 0.1)',
                      border: '1px solid rgba(154, 174, 71, 0.3)',
                      color: 'var(--red-bright)',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                    }}
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>

                {recipeRows.length === 0 ? (
                  <div
                    style={{
                      padding: '20px',
                      textAlign: 'center',
                      color: 'var(--muted)',
                      fontSize: '0.8rem',
                      background: 'var(--surface2)',
                      borderRadius: '8px',
                      border: '1px dashed var(--border)',
                    }}
                  >
                    No ingredients added. Click "Add" to define what this item uses.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {recipeRows.map((row, index) => {
                      const selectedIngredient = inventoryItems.find(
                        (i) => i.id === parseInt(row.ingredient_id)
                      );
                      return (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center',
                            background: 'var(--surface2)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            padding: '10px',
                          }}
                        >
                          <select
                            value={row.ingredient_id}
                            onChange={(e) =>
                              updateRecipeRow(index, 'ingredient_id', e.target.value)
                            }
                            style={{
                              flex: 2,
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              padding: '8px',
                              color: 'var(--cream)',
                              outline: 'none',
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                            }}
                          >
                            <option value="">Select ingredient...</option>
                            {inventoryItems.map((inv) => (
                              <option key={inv.id} value={inv.id}>
                                {inv.name} ({inv.unit})
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={row.quantity_per_serving}
                            onChange={(e) =>
                              updateRecipeRow(index, 'quantity_per_serving', e.target.value)
                            }
                            placeholder="Qty"
                            style={{
                              flex: 1,
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              padding: '8px',
                              color: 'var(--cream)',
                              outline: 'none',
                              fontSize: '0.82rem',
                              textAlign: 'center',
                            }}
                          />
                          {selectedIngredient && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                color: 'var(--muted)',
                                minWidth: '35px',
                                textAlign: 'center',
                              }}
                            >
                              {selectedIngredient.unit}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeRecipeRow(index)}
                            style={{
                              background: 'rgba(160, 76, 76, 0.15)',
                              border: '1px solid rgba(160, 76, 76, 0.3)',
                              color: 'var(--red-bright)',
                              padding: '6px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  background: 'var(--red)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '14px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'background 0.2s',
                }}
              >
                {loading ? (
                  'Saving...'
                ) : (
                  <>
                    <Save size={18} />
                    {editingItem ? 'Update Item' : 'Add to Menu'}
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
