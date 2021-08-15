import { useEffect } from 'react';
import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  // useEffect(() => {
  //   localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
  // }, [cart]);

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart];

      const productInCart = updatedCart.find(product => product.id === productId);

      const productInStock: Stock = await api
        .get(`/stock/${productId}`)
        .then(
          response => {
            return response.data;
          });

      const currentAmountInCart = productInCart ? productInCart.amount : 0;

      const isProductInStock = productInStock.amount >= currentAmountInCart + 1;

      if (!isProductInStock) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
  
      if (productInCart) {
        productInCart.amount = currentAmountInCart + 1;

      } else {
        const product: Product = await api
          .get(`/products/${productId}`)
          .then(
            response => {
              return response.data;
            });
        const productWithAmount: Product = {...product, amount: 1};
        updatedCart.push(productWithAmount);
      }

      setCart(updatedCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart];
      const productIndex = updatedCart.findIndex(product => product.id === productId);
      
      if (productIndex >= 0) {
        updatedCart.splice(productIndex, 1);
        setCart(updatedCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
      } else {
        throw Error();
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }
 
      const productInStock: Stock = await api
      .get(`/stock/${productId}`)
      .then(
        response => {
          return response.data;
        });
              
      const updatedCart = [...cart];

      const productInCart = updatedCart.find(product => product.id === productId);

      const isProductInStock = productInStock.amount > amount;

      if (!isProductInStock) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productInCart) {
        productInCart.amount = amount;
      } else {
        throw Error();
      }

      setCart(updatedCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
