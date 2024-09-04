const Category = require('../models/category');
const Item = require('../models/Item');
const multer=require('multer')
const path=require('path')
const sequelize = require('../models/database');
const { Op, Sequelize } = require('sequelize');


// Create a new item
const createItem = async (req, res) => {
  try {
   
    // const { name, veg, image, price, categoryname ,quantity} = req.body;
    const category = await Category.findByPk(req.body.category_id)

  console.log(category)
    if(!category){
      res.status(200).json({error : 'category not found'})
      return
    }
    let info1={
      name:req.body.name,
      veg:req.body.veg || false,
      image:req.file.path,
      price:req.body.price,
      category_id: category.id,
      quantity:req.body.quantity,
      availableForPreorder:req.body.availableForPreorder || false ,
      preorderQuantity:req.body.preorderQuantity || 0,
      Hide:req.body.Hide || false,
      AvlMrng : req.body.AvlMrng || true,
      AvlAn: req.body.AvlAn || true,
      AvlEve: req.body.AvlEve || true,
      Shop_id: category.Shop_id,
    }
    const item = await Item.create(info1);
    res.status(201).send(item);
  } catch (err) {
    res.status(500).json({ error: 'Error creating the item',err});
  }
};

// Read all items  {};{}
const getAllItems = async (req, res) => {
  try {
    const items = await Item.findAll({order:[["quantity","ASC"]]});
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching items',err });
  }
};
const getAllItemsWithCategory = async (req, res) => {
  try {
    const {id}=req.params;
    const items = await Item.findAll({
      where: { category_id :id },
    }); 
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching items', err });
  }
};

// Read a specific item by ID
const getItemById = async (req, res) => {
  try {
    const itemId = req.params.id;
    const item = await Item.findByPk(itemId);
    if (!item) {
      return res.status(200).json({ error: 'Item not found' });
    }
    res.status(200).json(item);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching item by ID' });
  }
};

// // Update an item by ID
// const updateItem = async (req, res) => {
//   try {
//     const itemId = req.params.id;
//     // const { name, veg, image, price, category_id } = req.body;
//     let info1={
//       name:req.body.name,
//       veg:req.body.veg,
//       image:req.file.path,
//       price:req.body.price,
//       category_id: category.id,
//       quantity:req.body.quantity
//     }
//     const updatedItem = await Item.update(
//       { info1 },
//       { where: { id: itemId } }
//     );
//     res.status(200).json(updatedItem);
//   } catch (err) {
//     res.status(500).json({ error: 'Error updating the item' });
//   }
// };
const updateItem = async (req, res) => {
  try {
    const itemId = req.params.id;
    
    await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE }, async (t) => {
    
    const item= await Item.findByPk(itemId, { transaction: t })


    let updateData = {
      name:req.body.name || item.name,
      veg:req.body.veg || item.veg,
      price:req.body.price || item.price,
      quantity:req.body.quantity || item.quantity,
      availableForPreorder:req.body.availableForPreorder || item.availableForPreorder ,
      preorderQuantity:req.body.preorderQuantity || item.preorderQuantity,
      Hide:req.body.Hide || item.Hide,
      AvlMrng : req.body.AvlMrng || item.AvlMrng,
      AvlAn: req.body.AvlAn || item.AvlAn,
      AvlEve: req.body.AvlEve || item.AvlEve,
     
    };
   

    if (req.file) {
      updateData.image = req.file.path;
    }
    console.log("first")
    
    const [numUpdatedRows, updatedItems] = await Item.update(updateData, {
      where: { id: itemId },
      returning: true,
      transaction: t
    });
    
    if (numUpdatedRows === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }

   
    res.status(200).json(updatedItems[0]);
  })
    
} catch (err) {
    console.error('Error updating the item:', err);
    res.status(500).json({ error: 'Error updating the item' });
  } 
};



// Delete an item by ID
const deleteItem = async (req, res) => {
  try {
    const itemId = req.params.id;
    await Item.destroy({ where: { id: itemId } });
    res.status(204).end(); // 204 No Content - Successfully deleted
  } catch (err) {
    res.status(500).json({ error: 'Error deleting the item' });
  }
};
// upload image 
const storage=multer.diskStorage({
  destination:(req,file,cb) =>{
    cb(null,'Images')  //file name should be unique so we are using Date.now(), 2/1/23.png

  },
  filename:(req,file,cb) => {
    cb(null,Date.now() + path.extname(file.originalname))
  }
})
const imgupload=multer({
  storage:storage,
  // limits:{fileSize:'1000000'},
  fileFilter:(req,file,cb) => {
    // const fileTypes = /jpeg | JPG | png | gif/
    const fileTypes = /JPEG|jpg|png|gif|JPG/i;
    const mimType=fileTypes.test(file.mimetype) //checking the file format
    const extname=fileTypes.test(path.extname(file.originalname))

    if(mimType && extname) {
      return cb(null,true)
    }
    cb('Give proper file format to upload')

  }
}).single('image')

module.exports = {
  createItem,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem,
  imgupload,
  getAllItemsWithCategory
};
