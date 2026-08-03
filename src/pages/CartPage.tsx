import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { useCart } from '../context/CartContext';
import { resolveUploadUrl } from '../config/api';
import type { CartCompanyGroup } from '../types/cart';
import '../styles/pages/cart.css';

function formatPrice(value: number) {
  return `${value.toFixed(2)} TND`;
}

export function CartPage() {
  const {
    cart,
    loading,
    error,
    setItemQuantity,
    removeItem,
    clearAll,
    clearCompany,
  } = useCart();
  const [busyId, setBusyId] = useState('');
  const [actionError, setActionError] = useState('');
  const [checkoutHint, setCheckoutHint] = useState('');

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
    setCheckoutHint(
      `Checkout for “${group.companyName}” is ready (${formatPrice(group.total)}). Flouci payment comes next.`,
    );
  }

  return (
    <>
      <Navbar />
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
              onClick={() => void runAction('clear', clearAll)}
            >
              Clear cart
            </button>
          )}
        </div>

        {(error || actionError) && (
          <div className="cart-page__error">{actionError || error}</div>
        )}
        {checkoutHint && (
          <div className="cart-page__hint">{checkoutHint}</div>
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

        <div className="cart-groups">
          {cart.groups.map((group) => (
            <section key={group.companyId} className="cart-group">
              <div className="cart-group__head">
                <div>
                  <h2>{group.companyName}</h2>
                  <p>{group.items.length} product(s) from this company</p>
                </div>
                <button
                  type="button"
                  className="cart-group__clear"
                  disabled={Boolean(busyId)}
                  onClick={() =>
                    void runAction(`company-${group.companyId}`, () =>
                      clearCompany(group.companyId),
                    )
                  }
                >
                  Remove company items
                </button>
              </div>

              <ul className="cart-group__items">
                {group.items.map((item) => {
                  const image = resolveUploadUrl(item.product.images?.[0] ?? null);
                  return (
                    <li key={item.cartItemId} className="cart-item">
                      <Link
                        to={`/products/${item.product.productId}`}
                        className="cart-item__media"
                      >
                        {image ? (
                          <img src={image} alt={item.product.name} />
                        ) : (
                          <div className="cart-item__placeholder" />
                        )}
                      </Link>

                      <div className="cart-item__info">
                        <Link to={`/products/${item.product.productId}`}>
                          <h3>{item.product.name}</h3>
                        </Link>
                        <p>{formatPrice(item.product.price)} each</p>
                        <p className="cart-item__stock">
                          Stock: {item.product.stock}
                        </p>
                      </div>

                      <div className="cart-item__qty">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          disabled={
                            busyId === item.cartItemId || item.quantity <= 1
                          }
                          onClick={() =>
                            void runAction(item.cartItemId, () =>
                              setItemQuantity(
                                item.cartItemId,
                                item.quantity - 1,
                              ),
                            )
                          }
                        >
                          <Minus size={14} />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          disabled={
                            busyId === item.cartItemId ||
                            item.quantity >= item.product.stock
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
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="cart-item__line">
                        <strong>{formatPrice(item.lineTotal)}</strong>
                        <button
                          type="button"
                          className="cart-item__remove"
                          aria-label="Remove item"
                          disabled={busyId === item.cartItemId}
                          onClick={() =>
                            void runAction(item.cartItemId, () =>
                              removeItem(item.cartItemId),
                            )
                          }
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="cart-group__footer">
                <div className="cart-group__totals">
                  <div>
                    <span>Subtotal</span>
                    <strong>{formatPrice(group.subtotal)}</strong>
                  </div>
                  <div>
                    <span>Delivery fee</span>
                    <strong>{formatPrice(group.deliveryFee)}</strong>
                  </div>
                  <div className="cart-group__total">
                    <span>Total for this company</span>
                    <strong>{formatPrice(group.total)}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleCheckoutCompany(group)}
                >
                  Checkout this company
                </button>
              </div>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
