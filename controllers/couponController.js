const Coupon = require('../models/coupon');

// Create a new coupon
const createCoupon = async (req, res) => {
  try {
    const { coupon_name, Expire_date, isoffer, amt } = req.body;
    const coupon = await Coupon.create({ coupon_name, Expire_date, isoffer, amt });
    res.status(201).json(coupon);
  } catch (err) {
    res.status(500).json({ error: 'Error creating the coupon' });
  }
};

// Read all coupons
const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.findAll();
    res.status(200).json(coupons);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching coupons' });
  }
};

// Read a specific coupon by ID
const getCouponById = async (req, res) => {
  try {
    const couponId = req.params.id;
    const coupon = await Coupon.findByPk(couponId);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    res.status(200).json(coupon);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching coupon by ID' });
  }
};

// Update a coupon by ID
const updateCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    const { coupon_name, Expire_date, isoffer, amt } = req.body;
    const updatedCoupon = await Coupon.update(
      { coupon_name, Expire_date, isoffer, amt },
      { where: { id: couponId } }
    );
    res.status(200).json(updatedCoupon);
  } catch (err) {
    res.status(500).json({ error: 'Error updating the coupon' });
  }
};

// Delete a coupon by ID
const deleteCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    await Coupon.destroy({ where: { id: couponId } });
    res.status(204).end(); // 204 No Content - Successfully deleted
  } catch (err) {
    res.status(500).json({ error: 'Error deleting the coupon' });
  }
};

module.exports = {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
};
