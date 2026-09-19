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
  const existingCount = await Address.countDocuments({ userId: req.user._id });
  const shouldBeDefault = existingCount === 0 || Boolean(req.body.isDefault);

  if (shouldBeDefault) {
    await Address.updateMany({ userId: req.user._id }, { isDefault: false });
  }

  const address = await Address.create({
    ...req.body,
    userId: req.user._id,
    isDefault: shouldBeDefault,
  });
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

const setDefaultAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, userId: req.user._id });
  if (!address) {
    const error = new Error('Address not found');
    error.statusCode = 404;
    throw error;
  }

  await Address.updateMany({ userId: req.user._id }, { isDefault: false });
  address.isDefault = true;
  await address.save();

  return sendSuccess(res, {
    message: 'Default address updated',
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

  if (address.isDefault) {
    const nextDefault = await Address.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    if (nextDefault) {
      nextDefault.isDefault = true;
      await nextDefault.save();
    }
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
  setDefaultAddress,
  deleteAddress,
};
