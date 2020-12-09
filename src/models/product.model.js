const mongoose = require("mongoose");
const mongoose_fuzzy_searching = require("mongoose-fuzzy-searching");

const productSchema = new mongoose.Schema({
  name: {
    required: true,
    type: String,
  },
  weight: Number,
  values_per_100: {
    kcal: Number,
    carbohydrates: Number,
    protein: Number,
    fat: Number,
  },
  current_values: {
    kcal: Number,
    carbohydrates: Number,
    protein: Number,
    fat: Number,
  },
  values: {
    kcal: Number,
    carbohydrates: Number,
    protein: Number,
    fat: Number,
  },
  image: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
  unit: String,
  pieces: Number,
  type: String,
});

productSchema.plugin(mongoose_fuzzy_searching, { fields: ["name"] });

const Product = mongoose.model("product", productSchema);

module.exports = Product;
