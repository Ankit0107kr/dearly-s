const Address = require('../models/Address');
const { asyncHandler } = require('../utils/helpers');
const { sendSuccess } = require('../utils/response');

const listAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({ userId: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
  return sendSuccess(res, {
    message: 'Addresses fetched successfully',
    data: { addresses },
  });
});

const createAddress = asyncHandler(async (req, res) => {
  if (req.body.isDefault) {
    await Address.updateMany({ userId: req.user._id }, { isDefault: false });
  }

  const address = await Address.create({ ...req.body, userId: req.user._id });
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Address created successfully',
    data: { address },
  });
});

const updateAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, userId: req.user._id });
  if (!address) {
    const error = new Error('Address not found');
    error.statusCode = 404;
    throw error;
  }

  if (req.body.isDefault) {
    await Address.updateMany({ userId: req.user._id }, { isDefault: false });
  }

  Object.assign(address, req.body);
  await address.save();

  return sendSuccess(res, {
    message: 'Address updated successfully',
    data: { address },
  });
});

const deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!address) {
    const error = new Error('Address not found');
    error.statusCode = 404;
    throw error;
  }

  return sendSuccess(res, {
    message: 'Address deleted successfully',
    data: { address },
  });
});

module.exports = {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
};
