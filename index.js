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

    //await getRecipeFromPage(mainPage, 11, recipeType)

    console.log('DODAJE PRZEPISY z ' + endpoint)
    await getRecipesFromPage(mainPage, recipeType)
    // const endpoints = getEndpointsFromPage(mainPage, endpoint)
    // for (let i = 0; i < endpoints.length; i++) {
    //   const anotherPage = await rp(url + endpoints[i])
    //   await getRecipesFromOnePage(anotherPage, recipeType)
    // }
    console.log('\n\nZAKONCZONO DODAWAC PRZEPISY Z  ' + endpoint)
  } catch (e) {
    console.error(e)
  }
  await close()
}

// ENDPOINTY:
const endpoints = [
  { value: '/makarony-i-dania-z-ryzu', recipeType: 'pasta_rice' }, //0
  { value: '/dania-głowne-z-miesa', recipeType: 'meat_dish' }, //1
  { value: '/zupy', recipeType: 'soup' }, //2
  { value: '/przystawkisałatki', recipeType: 'appetizer_salad' }, //3
  { value: '/inne-dania-głowne', recipeType: 'other_dish' }, //4
  { value: '/desery', recipeType: 'lunch' }, //5
  { value: '/dania-głowne-z-ryb-owocow-morza', recipeType: 'fish_dish' }, //6
  { value: '/dania-głowne-z-warzyw', recipeType: 'vegetable_dish' }, //7
  { value: '/chleby-bułki', recipeType: 'bread' }, //8
  { value: '/napoje', recipeType: 'drink' }, //9
  { value: '/słone-wypieki', recipeType: 'salt_bread' }, //10
]

const test = () => {}

const start = () => {
  scrap(endpoints[0].value, endpoints[0].recipeType)
  setTimeout(() => {
    scrap(endpoints[1].value, endpoints[1].recipeType)
  }, [20 * 60 * 1000])
  setTimeout(() => {
    scrap(endpoints[2].value, endpoints[2].recipeType)
  }, [40 * 60 * 1000])
  setTimeout(() => {
    scrap(endpoints[3].value, endpoints[3].recipeType)
  }, [60 * 60 * 1000])
  setTimeout(() => {
    scrap(endpoints[4].value, endpoints[4].recipeType)
  }, [80 * 60 * 1000])
  setTimeout(() => {
    scrap(endpoints[5].value, endpoints[5].recipeType)
  }, [100 * 60 * 1000])
  setTimeout(() => {
    scrap(endpoints[6].value, endpoints[6].recipeType)
  }, [120 * 60 * 1000])
  setTimeout(() => {
    scrap(endpoints[7].value, endpoints[7].recipeType)
  }, [140 * 60 * 1000])
  setTimeout(() => {
    scrap(endpoints[8].value, endpoints[8].recipeType)
  }, [160 * 60 * 1000])
  setTimeout(() => {
    scrap(endpoints[9].value, endpoints[9].recipeType)
  }, [180 * 60 * 1000])
  setTimeout(() => {
    scrap(endpoints[10].value, endpoints[10].recipeType)
  }, [200 * 60 * 1000])
}

start()
