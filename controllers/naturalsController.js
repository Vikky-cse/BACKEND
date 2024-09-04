const { Op } = require('sequelize');
const User = require('../models/user');
const Naturals = require('../models/naturals');
const Transaction = require('../models/Transaction')

const createNaturalsEntry = async (req, res) => {
  try {
    const { user_id, time, amount } = req.body;

    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isHosteller !== true) {
      return res.status(400).json({ message: 'Not a Hosteller' });
    }

    if (user.gender === 0) {
      if (user.natural_amt< amount) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }

      const updatedUser = await user.decrement('natural_amt', { by: amount });
      await Naturals.create({ user_id, time });
      const createdTransaction = await Transaction.create({
        Amount: amount,
        Transaction_Time: time,
        Is_completed: true,
        order_id: null, 
        transactiontype: 2, 
        user_id, 
      });
      return res.status(201).json({ message: 'Naturals entry created', user: updatedUser });
    } else {
      const currentDate = new Date();
      const lastEntry = await Naturals.findOne({
        where: {
          user_id,
          time: {
            [Op.gte]: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
            [Op.lt]: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
          },
        },
      });

      if (!lastEntry) {
        await Naturals.create({ user_id, time });
        const createdTransaction = await Transaction.create({
          Amount: 0,
          Transaction_Time: time,
          Is_completed: true,
          order_id: null, 
          transactiontype: 2, 
          user_id, 
        });

        return res.status(201).json({ message: 'Entry created for the boy' });
      } else {
        return res.status(400).json({ message: 'Boys can only have one entry per month' });
      }
    }
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: 'An error occurred' });
  }
};





// Read all naturals entries
// const getAllNaturalsEntries = async (req, res) => {
//   try {
//     const naturalsEntries = await Naturals.findAll();
//     res.status(200).json(naturalsEntries);
//   } catch (err) {
//     res.status(500).json({ error: 'Error fetching naturals entries' });
//   }
// };

// Read a specific naturals entry by ID
// const getNaturalsEntryById = async (req, res) => {
//   try {
//     const naturalsEntryId = req.params.id;
//     const naturalsEntry = await Naturals.findByPk(naturalsEntryId);
//     if (!naturalsEntry) {
//       return res.status(404).json({ message: 'Naturals entry not found' });
//     }
//     res.status(200).json(naturalsEntry);
//   } catch (err) {
//     res.status(500).json({ error: 'Error fetching naturals entry by ID' });
//   }
// };

const getNaturalsEntryByUserId = async (req, res) => {
  try {
    const userId = req.params.id; // Assuming you're passing user_id as a parameter
    const transactionType = 2; // Assuming 2 represents "natural" transaction type

    const transactions = await Transaction.findAll({
      where: {
        user_id: userId,
        transactiontype: transactionType,
      },
    });

    res.status(200).json(transactions);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching transactions by user and type' });
  }
};

// // Update a naturals entry by ID
// const updateNaturalsEntry = async (req, res) => {
//   try {
//     const naturalsEntryId = req.params.id;
//     const { user_id, time } = req.body;
//     const updatedNaturalsEntry = await Naturals.update(
//       { user_id, time },
//       { where: { id: naturalsEntryId } }
//     );
//     res.status(200).json(updatedNaturalsEntry);
//   } catch (err) {
//     res.status(500).json({ error: 'Error updating the naturals entry' });
//   }
// };

// // Delete a naturals entry by ID
// const deleteNaturalsEntry = async (req, res) => {
//   try {
//     const naturalsEntryId = req.params.id;
//     await Naturals.destroy({ where: { id: naturalsEntryId } });
//     res.status(204).end(); // 204 No Content - Successfully deleted
//   } catch (err) {
//     res.status(500).json({ error: 'Error deleting the naturals entry' });
//   }
// };

module.exports = {
  createNaturalsEntry,
  // getAllNaturalsEntries,
  getNaturalsEntryByUserId,
  // updateNaturalsEntry,
  // deleteNaturalsEntry,
};
