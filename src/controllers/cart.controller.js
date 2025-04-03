import CartProduct from "../models/cart.model.js";
import Product from "../models/product.model.js";

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user._id;

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    if (product.countInStock < quantity) {
      return res
        .status(400)
        .json({ success: false, message: "Insufficient stock" });
    }

    const existingCartItem = await CartProduct.findOne({ userId, productId });

    if (existingCartItem) {
      const newQuantity = existingCartItem.quantity + parseInt(quantity);

      if (product.countInStock < newQuantity) {
        return res
          .status(400)
          .json({ success: false, message: "Insufficient stock" });
      }

      existingCartItem.quantity = newQuantity;
      await existingCartItem.save();

      return res.status(200).json({
        success: true,
        message: "Cart updated successfully",
        cartItem: existingCartItem,
      });
    }

    const cartItem = new CartProduct({
      userId,
      productId,
      quantity: parseInt(quantity),
    });

    const savedCartItem = await cartItem.save();

    res.status(201).json({
      success: true,
      message: "Product added to cart",
      cartItem: savedCartItem,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const cartItems = await CartProduct.find({ userId }).populate(
      "productId",
      "name price images countInStock"
    );
    let totalAmount = 0;
    console.log(cartItems);
    cartItems.forEach((item) => {
      totalAmount += item.productId.price * item.quantity;
    });

    res.status(200).json({
      success: true,
      cartItems,
      totalAmount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const userId = req.user._id;
    console.log(cartItemId);
    const cartItem = await CartProduct.findOne({ _id: cartItemId, userId });
    if (!cartItem) {
      return res
        .status(404)
        .json({ success: false, message: "Cart item not found" });
    }

    await CartProduct.findByIdAndDelete(cartItemId);
    res.status(200).json({ success: true, message: "Item removed from cart" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    await CartProduct.deleteMany({ userId });

    res
      .status(200)
      .json({ success: true, message: "Cart cleared successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
