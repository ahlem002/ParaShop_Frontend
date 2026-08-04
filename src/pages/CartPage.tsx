import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { PublicShell } from '../components/layout/PublicShell';
import { useCart } from '../context/CartContext';
import { useConfirm } from '../context/ConfirmContext';
import { resolveUploadUrl } from '../config/api';
import type { CartCompanyGroup } from '../types/cart';
import '../styles/pages/cart.css';

function formatPrice(value: number) {
  return `${value.toFixed(2)} TND`;
}

export function CartPage() {
  const navigate = useNavigate();
  const {
    cart,
    loading,
    error,
    setItemQuantity,
    removeItem,
    clearAll,
    clearCompany,
  } = useCart();
  const { confirm } = useConfirm();
  const [busyId, setBusyId] = useState('');
  const [actionError, setActionError] = useState('');

  async function runAction(id: string, action: () => Promise<void>) {
    setBusyId(id);
    setActionError('');
    try {
      await action();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyId('');
    }
  }

  function handleCheckoutCompany(group: CartCompanyGroup) {
    navigate(`/checkout?companyId=${encodeURIComponent(group.companyId)}`);
  }

  async function handleClearCart() {
    const ok = await confirm({
      title: 'Clear entire cart?',
      message:
        'This will remove all products from your cart. This action cannot be undone.',
      confirmLabel: 'Yes, clear cart',
      danger: true,
    });
    if (!ok) return;
    await runAction('clear', clearAll);
  }

  async function handleClearCompany(group: CartCompanyGroup) {
    const ok = await confirm({
      title: 'Remove company items?',
      message: `This will remove all products from “${group.companyName}” in your cart.`,
      confirmLabel: 'Yes, remove items',
      danger: true,
    });
    if (!ok) return;
    await runAction(`company-${group.companyId}`, () =>
      clearCompany(group.companyId),
    );
  }

  async function handleRemoveItem(cartItemId: string, productName: string) {
    const ok = await confirm({
      title: 'Remove item?',
      message: `Remove “${productName}” from your cart?`,
      confirmLabel: 'Yes, remove',
      danger: true,
    });
    if (!ok) return;
    await runAction(cartItemId, () => removeItem(cartItemId));
  }

  return (
    <PublicShell>
      <main className="container home-container cart-page">
        <div className="cart-page__header">
          <div>
            <h1>Your cart</h1>
            <p>
              You can keep products from several companies here. At checkout,
              pay for one company at a time.
            </p>
          </div>
          {cart.items.length > 0 && (
            <button
              type="button"
              className="btn btn-secondary"
              disabled={Boolean(busyId)}
              onClick={() => void handleClearCart()}
            >
              Clear cart
            </button>
          )}
        </div>

        {(error || actionError) && (
          <div className="cart-page__error">{actionError || error}</div>
        )}

        {loading && cart.items.length === 0 && <p>Loading cart...</p>}

        {!loading && cart.items.length === 0 && (
          <div className="cart-empty">
            <ShoppingBag size={40} strokeWidth={1.5} />
            <h2>Your cart is empty</h2>
            <p>Browse products and add items to get started.</p>
            <Link to="/products" className="btn btn-primary">
              Browse products
            </Link>
          </div>
        )}

        <div className="cart-company-stack">
          {cart.groups.map((group) => (
            <section key={group.companyId} className="cart-company-block">
              <div className="cart-company-block__head">
                <div>
                  <h2>{group.companyName}</h2>
                  <p>
                    {group.items.length} item
                    {group.items.length === 1 ? '' : 's'} · Delivery{' '}
                    {formatPrice(group.deliveryFee)} · Total{' '}
                    {formatPrice(group.total)}
                  </p>
                </div>
                <div className="cart-company-block__actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-nav"
                    disabled={Boolean(busyId)}
                    onClick={() => void handleClearCompany(group)}
                  >
                    Remove all
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-nav"
                    onClick={() => handleCheckoutCompany(group)}
                  >
                    Checkout
                  </button>
                </div>
              </div>

              <div className="products-grid">
                {group.items.map((item) => {
                  const image = resolveUploadUrl(
                    item.product.images?.[0] ?? null,
                  );
                  const busy = busyId === item.cartItemId;

                  return (
                    <article key={item.cartItemId} className="product-card shop-line-card">
                      <Link
                        to={`/products/${item.product.productId}`}
                        className="shop-line-card__media"
                      >
                        {image ? (
                          <img
                            src={image}
                            alt={item.product.name}
                            className="product-img-placeholder"
                          />
                        ) : (
                          <div className="product-img-placeholder" />
                        )}
                      </Link>

                      <div className="product-details shop-line-card__details">
                        <span className="company-name">
                          {item.product.company.companyName}
                        </span>
                        <h3 className="product-title">
                          <Link to={`/products/${item.product.productId}`}>
                            {item.product.name}
                          </Link>
                        </h3>
                        <div className="product-meta">
                          <span className="price">
                            {formatPrice(item.lineTotal)}
                          </span>
                          <span className="rating">
                            {formatPrice(item.product.price)} each
                          </span>
                        </div>
                      </div>

                      <div className="shop-line-card__actions">
                        <div className="order-card__qty">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            disabled={busy || item.quantity <= 1}
                            onClick={() =>
                              void runAction(item.cartItemId, () =>
                                setItemQuantity(
                                  item.cartItemId,
                                  item.quantity - 1,
                                ),
                              )
                            }
                          >
                            <Minus size={12} />
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            disabled={
                              busy || item.quantity >= item.product.stock
                            }
                            onClick={() =>
                              void runAction(item.cartItemId, () =>
                                setItemQuantity(
                                  item.cartItemId,
                                  item.quantity + 1,
                                ),
                              )
                            }
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <button
                          type="button"
                          className="shop-line-card__remove"
                          aria-label="Remove item"
                          disabled={busy}
                          onClick={() =>
                            void handleRemoveItem(
                              item.cartItemId,
                              item.product.name,
                            )
                          }
                        >
                          <Trash2 size={15} />
                          Remove
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
    </PublicShell>
  );
}
