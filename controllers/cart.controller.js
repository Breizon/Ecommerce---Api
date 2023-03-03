const Cart = require('../models/cart.model');
const Order = require('../models/order.model');
const Product = require('../models/product.model');
const ProductInCart = require('../models/productInCart.model');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.addProductToCart = catchAsync(async (req, res, next) => {
  const { productId, quantity } = req.body;
  const { cart } = req;

  const productInCart = await ProductInCart.create({
    cartId: cart.id,
    productId,
    quantity,
  });

  res.status(201).json({
    status: 'success',
    message: 'The product has been added',
    productInCart,
  });
});

exports.updateCart = catchAsync(async (req, res, next) => {
  const { newQty } = req.body;
  const { productInCart } = req;

  if (newQty < 0) {
    return next(new AppError('The quantity must be greater than 0', 400));
  }

  if (newQty === 0) {
    await productInCart.update({ quantity: newQty, status: 'removed' });
  } else {
    await productInCart.update({ quantity: newQty, status: 'active' });
  }
  res.status(201).json({
    status: 'success',
    message: 'The product in cart has been updated',
  });
});

exports.removeProductToCart = catchAsync(async (req, res, next) => {
  const { productInCart } = req;

  await productInCart.update({ quantity: 0, status: 'removed' });

  res.status(200).json({
    status: 'success',
    message: 'The product in cart has been removed',
  });
});

exports.buyProductOnCart = catchAsync(async (req, res, next) => {
  const { sessionUser } = req;

  //1. Buscar el cart del user

  const cart = await Cart.findOne({
    attributes: ['id', 'userId'],
    where: {
      userId: sessionUser.id,
      status: 'active',
    },
    include: [
      {
        model: ProductInCart,
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        where: {
          status: 'active',
        },
        include: [
          {
            model: Product,
            attributes: { exclude: ['createdAt', 'updatedAt'] },
          },
        ],
      },
    ],
  });

  if (!cart) {
    return next(new AppError('There are not products in cart', 400));
  }

  //2. calcular el precio total
  let totalPrice = 0;

  cart.productInCarts.forEach(productInCart => {
    totalPrice += productInCart.quantity * productInCart.product.price;
  });

  //3. Actualizar el stock o cantidad del modelo Product
  const purchasedProductPromises = cart.productInCarts.map(
    async productInCart => {
      //3.1 buscar el producto para actualizar su información
      const product = await Product.findOne({
        where: {
          id: productInCart.productId,
        },
      });
      //3.2 calcular la cantidad de productos que me quedan en stock
      const newStock = product.quantity - productInCart.quantity;
      //3.3 actualizar la informacion y retornarla
      return await product.update({ quantity: newStock });
    }
  );
  //NOTA: se realiza esta función para cumplir las promesas de purchasedProductPromises
  await Promise.all(purchasedProductPromises);

  //crear una constante para asignar al map, que se llame statusProductInCartPromises
  const statusProductInCartPromises = cart.productInCarts.map(
    //recorrer el arreglo de productsInCarts
    async productInCart => {
      //buscar el prducto en el carrito a actualizar
      const productInCartFoundIt = await ProductInCart.findOne({
        where: {
          id: productInCart.id,
          status: 'active',
        },
      });
      //retornar las actualizaciones del producto en el carrito encontrado, y el status: 'purchased'
      return await productInCartFoundIt.update({ status: 'purchased' });
    }
  );
  //fuera del map van a resolver las promesas con el promise All
  await Promise.all(statusProductInCartPromises);

  await cart.update({ status: 'purchased' });

  const order = await Order.create({
    userId: sessionUser.id,
    cartId: cart.id,
    totalPrice,
  });

  res.status(201).json({
    message: 'The norder has been generated successfully',
    order,
  });
});
