const fetch = require('node-fetch')
const axios = require('axios')
const translate = require('@vitalets/google-translate-api')

const getProductsByQuery = async (query) => {
  try {
    const response = await fetch(
      `https://trackapi.nutritionix.com/v2/search/instant?query=${query}`,
      {
        headers: {
          'x-app-id': '1a3a6164',
          'x-app-key': '4267d03f7ae5b8bd0fac24de34278437',
        },
      }
    )

    const json = await response.json()
  } catch (e) {
    console.error(e)
  }
}

const getNutrientsFromString = async (ingr) => {
  try {
    const translatedIngr = await translate(ingr, { to: 'en' })

    const response = await axios(
      'https://trackapi.nutritionix.com/v2/natural/nutrients',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-id': '1a3a6164',
          'x-app-key': '4267d03f7ae5b8bd0fac24de34278437',
        },
        data: {
          query: translatedIngr.text,
        },
      }
    )
    if (response.status === 200) {
      return response.data
    }
  } catch (e) {
    console.error(e)
  }
}

module.exports = { getNutrientsFromString, getProductsByQuery }
