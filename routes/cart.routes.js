const { Router } = require('express');
const { check } = require('express-validator');
const {
  addProductToCart,
  updateCart,
  removeProductToCart,
  buyProductOnCart,
} = require('../controllers/cart.controller');
const { protect } = require('../middlewares/auth.middleware');
const {
  validExistCart,
  validExistProductInCart,
  validExisProductInCartForUpdate,
  validExistProductInCartByParamsForUpdate,
} = require('../middlewares/cart.middleware');
const {
  validBodyProductById,
  validIfExistProductsInStock,
  validExistProductInStockForUpdate,
  validExistProductIdByParams,
} = require('../middlewares/products.middlewares');
const { validateFields } = require('../middlewares/validateField.middleware');

const router = Router();

router.use(protect);

router.post(
  '/add-product',
  [
    check('productId', 'ProductId is required').not().isEmpty(),
    check('productId', 'ProductId is required').isNumeric(),
    check('quantity', 'quantity is required').not().isEmpty(),
    check('quantity', 'quantity is required').isNumeric(),
    validateFields,
    validBodyProductById,
    validIfExistProductsInStock,
    validExistCart,
    validExistProductInCart,
  ],
  addProductToCart
);

router.patch(
  '/update-cart',
  [
    check('productId', 'ProductId is required').not().isEmpty(),
    check('productId', 'ProductId is required').isNumeric(),
    check('newQty', 'quantity is required').not().isEmpty(),
    check('newQty', 'quantity is required').isNumeric(),
    validateFields,
    validBodyProductById,
    validExistProductInStockForUpdate,
    validExisProductInCartForUpdate,
  ],
  updateCart
);

router.delete(
  '/:productId',
  validExistProductIdByParams,
  validExistProductInCartByParamsForUpdate,
  removeProductToCart
);

router.post('/purchase', buyProductOnCart);

module.exports = {
  cartRouter: router,
};
