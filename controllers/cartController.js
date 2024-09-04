const { Op, literal } = require('sequelize');
const Cart = require('../models/cart');
const CartItem = require('../models/Cart_Items');
const Item = require('../models/Item');
const sequelize = require('../models/database');

const ERR_CART_NOT_FOUND = 'Cart not found';
const ERR_ITEM_NOT_FOUND = 'Associated item not found';
const ERR_REQUESTED_COUNT_EXCEEDS_QUANTITY = 'Requested count exceeds available quantity';

const handleServerError = (res, message) => {
  console.error(message);
  res.status(500).json({ error: message });
};

const getCartByUserId = async (req, res) => {
  const user_id = req.params.id;

  try {
    const cart = await Cart.findOne({
      where: { user_id },
      include: [{ model: CartItem, include: [Item] }],
    });

    if (!cart) {
      const newCart = await sequelize.transaction(async (transaction) => {
        return await Cart.create({ user_id }, { transaction });
      });

      res.status(200).json(newCart);
    } else {
      const cartItems = cart.CartItems;

      const totalAmount = await CartItem.sum(
        literal('"CartItem"."count" * "Item"."price"'),
        {
          where: { Cart_id: cart.id },
          include: [{ model: Item }],
        }
      );

      res.status(200).json({
        cart,
        items: cartItems,
        totalAmount,
      });
    }
  } catch (err) {
    handleServerError(res, 'Error fetching cart by ID');
  }
};

const deleteCart = async (req, res) => {
  const user_id = req.params.id;

  try {
    const cart = await Cart.findOne({ where: { user_id } });

    if (!cart) {
      res.status(404).json({ error: ERR_CART_NOT_FOUND });
      return;
    }

    await sequelize.transaction(async (transaction) => {
      await CartItem.destroy({ where: { Cart_id: cart.id }, transaction });
      await Cart.destroy({ where: { user_id }, transaction });
    });

    res.status(204).end();
  } catch (err) {
    handleServerError(res, 'Error deleting the cart');
  }
};
const createCartItem = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { Item_id, Count, user_id } = req.body;

    const [cart, created] = await Cart.findOrCreate({ where: { user_id } });
    const item = await Item.findByPk(Item_id);

    if (!item) {
      throw new Error('Invalid Item');
    }

    if (item.quantity < Count) {
      throw new Error('Invalid Count');
    }

    const Cart_id = cart.id;

    const cartItem = await CartItem.create({ Item_id, Count, user_id, Cart_id });
    await Item.update(
      { quantity: item.quantity - Count },
      { where: { id: item.id } }
    );

    await t.commit();
    res.status(201).send(cartItem);
  } catch (err) {
    await t.rollback();
    res.status(500).send({ error: 'Error creating the cart item', err: err.message });
  }
};

const createOrUpdateCartItem = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { Item_id, Count, user_id } = req.body;

    // Find the user's cart
    const [cart, created] = await Cart.findOrCreate({ where: { user_id } });
    
    // Try to find an existing cart item for the specified item and user's cart
    const cartItem = await CartItem.findOne({
      where: { Item_id, Cart_id: cart.id },
    });

    if (!cartItem) {
      // If the cart item doesn't exist, create a new one
      await CartItem.create({ Item_id, Count, user_id, Cart_id: cart.id }, { transaction: t });
    } else {
      // If the cart item exists, update its count
      await CartItem.update( 
        { Count },
        {
          where: { id: cartItem.id },
          transaction: t,
        }
      );
    }    

    await t.commit();
    res.status(201).send({ message: 'Cart item created or updated successfully' });
  } catch (err) {
    await t.rollback();
    res.status(500).send({ error: 'Error creating or updating the cart item', err: err.message });
  }
};



// const updateCartItem = async (req, res) => {
//   const t = await sequelize.transaction();

//   try {
//     const cartItemId = req.params.id;
//     const { Count } = req.body;

//     const cartItem = await CartItem.findByPk(cartItemId);

//     if (!cartItem) {
//       res.status(404).json({ error: 'Cart item not found' });
//       return;
//     }

//     const item = await Item.findByPk(cartItem.Item_id);

//     if (!item) {
//       res.status(404).json({ error: 'Associated item not found' });
//       return;
//     }

//     const previousCount = cartItem.Count;
//     const countChange = Count - previousCount;

//     if (item.quantity < Math.abs(countChange) && countChange > 0) {
//       res.status(400).json({ error: 'Requested count exceeds available quantity' });
//       return;
//     }

//     console.log('Before Update - Item Quantity:', item.quantity);

//     await CartItem.update(
//       { Count },
//       { where: { id: cartItemId } }
//     );
//     await item.reload();

//     await Item.update(
//       { quantity: item.quantity - countChange },
//       { where: { id: item.id } }
//     );

//      console.log('After Update - Item Quantity:', item.quantity);

//     await t.commit();
//     // console.log('After Update - Item Quantity:', item.quantity);

//     res.status(200).json({ message: 'Cart item updated successfully' });
//   } catch (err) {
//     await t.rollback();
//     res.status(500).json({ error: 'Error updating the cart item' });
//   }
// };

const updateCartItem = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const cartItemId = req.params.id;
    const { Count } = req.body;

    const cartItem = await CartItem.findByPk(cartItemId);

    if (!cartItem) {
      res.status(404).json({ error: 'Cart item not found' });
      return;
    }

    const item = await Item.findByPk(cartItem.Item_id);

    if (!item) {
      res.status(404).json({ error: 'Associated item not found' });
      return;
    }

    const previousCount = cartItem.Count;
    const countChange = Count - previousCount;

    if (item.quantity < Math.abs(countChange) && countChange > 0) {
      res.status(400).json({ error: 'Requested count exceeds available quantity' });
      return;
    }

    console.log('Before Update - Item Quantity:', item.quantity);

    await CartItem.update(
      { Count },
      { where: { id: cartItemId } }
    );

    // Reload the item from the database
    await item.reload();

    // Calculate the new quantity
    const newQuantity = item.quantity - countChange;

    // Update the item quantity in the database
    await Item.update(
      { quantity: newQuantity },
      { where: { id: item.id } }
    );

    console.log('After Update - Item Quantity:', newQuantity);

    await t.commit();

    res.status(200).json({ message: 'Cart item updated successfully' });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: 'Error updating the cart item' });
  }
};







const deleteCartItem = async (req, res) => {
  try {
    const cartItemId = req.params.item_id;
    const deletedRows = await CartItem.destroy({ where: { id: cartItemId } });

    if (deletedRows === 0) {
      res.status(404).send({ error: 'Cart item not found' });
    } else {
      res.status(204).end(); // 204 No Content - Successfully deleted
    }
  } catch (err) {
    res.status(500).send({ error: 'Error deleting the cart item', err });
  }
};

module.exports = {
  getCartByUserId,
  deleteCart,
  createCartItem,
  updateCartItem,
  deleteCartItem,
  createOrUpdateCartItem
};
