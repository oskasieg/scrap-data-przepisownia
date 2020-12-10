const mongoose = require('mongoose')
const mongoose_fuzzy_searching = require('mongoose-fuzzy-searching')

const recipesSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true,
    trim: true,
    required: true,
  },
  level: {
    type: String,
  },
  description: {
    type: String,
    required: true,
  },
  steps: {
    type: Array,
    required: true,
  },
  products: {
    type: Array,
    required: true,
  },
  time_min: {
    type: Number,
  },
  type: {
    type: String,
    required: true,
  },
  values: {
    carbohydrates: Number,
    fat: Number,
    kcal: Number,
    protein: Number,
  },
  number_of_portions: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: new Date(),
    required: true,
  },
  image: String,
})

recipesSchema.plugin(mongoose_fuzzy_searching, { fields: ['name'] })

const Recipe = mongoose.model('recipe', recipesSchema)

module.exports = Recipe
