import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState([]);

    function addToCart(product) {
        setCartItems(prev => {
            const existing = prev.find(i => i.id === product.id);
            if (existing) {
                return prev.map(i =>
                    i.id === product.id ? { ...i, qty: i.qty + product.qty } : i
                );
            }
            return [...prev, { ...product }];
        });
    }

    function removeFromCart(productId) {
        setCartItems(prev => prev.filter(i => i.id !== productId));
    }

    function updateQty(productId, qty) {
        if (qty <= 0) {
            removeFromCart(productId);
            return;
        }
        setCartItems(prev =>
            prev.map(i => i.id === productId ? { ...i, qty } : i)
        );
    }

    function clearCart() {
        setCartItems([]);
    }

    const total = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);
    const itemCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateQty,
            clearCart,
            total,
            itemCount,
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within CartProvider');
    return ctx;
}
