const Product = require('../models/product.model');
const catchAsync = require('../utils/catchAsync');
const { ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const { storage } = require('../utils/firebase');
const ProductImg = require('../models/productImg.model');

exports.findProducts = catchAsync(async (req, res, next) => {
  const products = await Product.findAll({
    where: {
      status: true,
    },
    include: [
      {
        model: ProductImg,
      },
    ],
  });

  const productPromises = products.map(async product => {
    const productImgsPromises = product.productImgs.map(async productImg => {
      const imgRef = ref(storage, productImg.imgUrl);
      const url = await getDownloadURL(imgRef);

      productImg.imgUrl = url;
      return productImg;
    });
    await Promise.all(productImgsPromises);
  });

  await Promise.all(productPromises);

  res.status(200).json({
    status: 'success',
    message: 'The product found were successfully',
    products,
  });
});

exports.findProduct = catchAsync(async (req, res, next) => {
  const { product } = req;

  const productImgsPromises = product.ProductImgs.map(async productImg => {
    const imgRef = ref(storage, productImg.imgUrl);
    const url = await getDownloadURL(imgRef);

    productImg.imgUrl = url;

    return productImg;
  });

  await Promise.all(productImgsPromises);

  res.status(200).json({
    status: 'success',
    message: 'The product found was successfully',
    product,
  });
});

exports.createProduct = catchAsync(async (req, res, next) => {
  const { title, description, quantity, price, categoryId, userId } = req.body;

  const newProduct = await Product.create({
    title: title.toLowerCase(),
    description: description.toLowerCase(),
    quantity,
    price,
    categoryId,
    userId,
  });

  const productImgsPromises = req.files.map(async file => {
    const imgRef = ref(storage, `products/${Date.now()}-${file.originalname}`);
    const imgUploaded = await uploadBytes(imgRef, file.buffer);

    return await ProductImg.create({
      imgUrl: imgUploaded.metadata.fullPath,
      productId: newProduct.id,
    });
  });

  await Promise.all(productImgsPromises);

  res.status(201).json({
    status: 'success',
    message: 'The product was created successfully',
    newProduct,
  });
});

exports.updateProduct = catchAsync(async (req, res, next) => {
  const { product } = req;

  const { title, description, quantity, price } = req.body;

  const updatedProduct = await product.update({
    title,
    description,
    quantity,
    price,
  });

  res.status(200).json({
    status: 'success',
    message: 'The product has been updated succesfully',
    updatedProduct,
  });
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
  const { product } = req;

  await product.update({ status: false });
  //5. enviar la respuesta al cliente
  res.status(200).json({
    status: 'success',
    message: 'The product has been deleted successfully',
  });
});
