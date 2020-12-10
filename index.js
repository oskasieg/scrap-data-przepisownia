const rp = require('request-promise')
const $ = require('cheerio')

const { connect, close } = require('./src/utils/db')

const getRecipeFromPage = require('./src/functions/getRecipeFromPage')
const getRecipesFromPage = require('./src/functions/getRecipesFromPage')

// pobieranie danych z przepisownia.pl
const url = 'https://przepisownia.pl/kategorie'

// linki do kolejnych stron
const getEndpointsFromPage = (mainPage, mainEndpoint) => {
  const endpoints = []

  const pageLinks = $('.page-link', mainPage)
  for (let i = 1; i < pageLinks.length; i++) {
    endpoints.push(mainEndpoint + `?page=${pageLinks[i].children[0].data}`)
  }
  return endpoints
}

// zamiana polskich znakow na kod UTF8
const convertEndpoint = (endpoint) => {
  let result = endpoint
  if (endpoint.indexOf('ł')) {
    result = endpoint.replace('ł', '%C5%82')
  }
  return result
}

const scrap = async (endpoint, recipeType) => {
  try {
    await connect()

    const convertedEndpoint = convertEndpoint(endpoint)

    const mainPage = await rp(url + convertedEndpoint)

    //await getRecipeFromPage(mainPage, 0, 'dinner')

    await getRecipesFromPage(mainPage, recipeType)

    // const endpoints = getEndpointsFromPage(mainPage, endpoint);
    // for (let i = 0; i < endpoints.length; i++) {
    //   const anotherPage = await rp(url + endpoints[i]);
    //   await getRecipesFromOnePage(anotherPage, recipeType);
    // }
  } catch (e) {
    console.error(e)
  }
  await close()
}

// ENDPOINTY:
const endpoints = [
  { value: '/makarony-i-dania-z-ryzu', recipeType: 'pasta_rice' },
  { value: '/dania-głowne-z-miesa', recipeType: 'meat_dish' },
  { value: '/zupy', recipeType: 'soup' },
  { value: '/przystawkisałatki', recipeType: 'appetizer_salad' },
  { value: '/inne-dania-głowne', recipeType: 'other_dish' },
  { valie: '/desery', recipeType: 'lunch' },
  { value: '/dania-głowne-z-ryb-owocow-morza', recipeType: 'fish_dish' },
  { value: '/dania-głowne-z-warzyw', recipeType: 'vegetable_dish' },
  { value: '/chleby-bułki', recipeType: 'bread' },
  { value: '/napoje', recipeType: 'drink' },
  { value: '/słone-wypieki', recipeType: 'salt_bread' },
]

const test = () => {
  scrap('/desery', 'dessert')
}

//test()
