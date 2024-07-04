import React, { createContext, useEffect, useState } from "react";


export const ShopContext = createContext(null);

const getDefaultCart = () => {
  let cart = {}
  for (let index = 0; index < 300+1; index++) {
        cart[index]=0;
  }
  return cart;
};

const ShopContextProvider = (props) => {

  const [all_product,setAll_Product]=useState([]);
  const [cartItems, setCartItems] = useState(getDefaultCart());

  //fetch our all product data and strong in it all_product to do this we use  useEffect for that 
 useEffect(()=>{
     fetch('http://localhost:4000/allproducts')
     .then((response)=> response.json())
     .then((data)=>setAll_Product(data))
 },[])
  
 

 
 const addToCart = (itemId) => {
  setCartItems({
      ...cartItems,
      [itemId]: (cartItems[itemId] || 0) + 1
  });

  if (localStorage.getItem('auth-token')) {
      fetch('http://localhost:4000/addtocart', {
          method: 'POST',
          headers: {
              Accept: 'application/json',
              'auth-token': `${localStorage.getItem('auth-token')}`,
              'Content-Type': 'application/json', // Corrected Content-Type
          },
          body: JSON.stringify({ "productId": itemId }), // Corrected key to "productId"
      })
          .then((response) => response.json())
          .then((data) => console.log(data));
  }
}

  const removeFromCart=(itemId)=>{
    setCartItems({
        ...cartItems,
        [itemId]: (cartItems[itemId] || 0) - 1
      });
 }
 const getTotalCartAmount = () => {
    let totalAmount = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        let itemInfo = all_product.find((product) => product.id === Number(item));
        totalAmount += itemInfo.new_price * cartItems[item];
      }
    }
    return totalAmount; 
  };
 const getTotalCartItems =()=>{
    let totalItem=0;
    for(const item in cartItems)
    {
        if(cartItems[item]>0)
        {
            totalItem+=cartItems[item];
        }
    }
    return totalItem;
}
  
 const contextValue = {getTotalCartItems ,getTotalCartAmount ,all_product, cartItems ,addToCart,removeFromCart};
  return (
    <ShopContext.Provider value={contextValue}>
      {props.children}
    </ShopContext.Provider>
  );
};

export default ShopContextProvider;
