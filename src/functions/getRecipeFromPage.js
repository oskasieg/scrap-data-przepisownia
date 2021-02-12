const { getNutrientsFromString } = require('../utils/nutritionix')

const rp = require('request-promise')

const $ = require('cheerio')

const Product = require('../models/product.model')
const Recipe = require('../models/recipe.model')

const translate = require('@vitalets/google-translate-api')

const Fuse = require('fuse.js')

// Pobiera pobiera przepis ze strony
const getRecipeFromPage = async (mainPage, index, recipeType) => {
  try {
    const aTags = $(
      '#recipe-gallery-view > .col-sm-4 > .result-grid-display > .overlay-container > a',
      mainPage
    )

    const recipePage = await rp(
      'https://przepisownia.pl' + aTags[index].attribs.href
    )

    const content = $('.view-recipe > .content', recipePage)

    // nazwa
    const recipeName = $('.step-container > meta[itemprop=name]', content)['0']
      .attribs.content

    console.log('Dodaje przepis: ' + recipeName)

    // opis
    let recipeDescription = recipeName[0].toUpperCase() + recipeName.slice(1)
    recipeDescription +=
      '.\n Przepis został zaimportowany ze strony www.przepisownia.pl'

    const tm = $(
      '.appliances-list > ul > li > .media-body > .media-heading',
      content
    )

    if (tm['0'].children && tm['0'].children[0].data) {
      recipeDescription +=
        '.\nPrzepis jest tworzony dla urządzenia ' + tm['0'].children[0].data
    }

    // zdjecie
    const recipeImage = $('.recipe-main-image', content)['0'].attribs.src

    // czas wykonania
    const additionalInfo = $('.additional-info > ul > li h5', content)
    let recipeTimeMin = 0
    if (additionalInfo[0].children.length > 0) {
      recipeTimeMinString = additionalInfo[0].children[0].data
      // jezeli podany w godzinach
      if (recipeTimeMinString[1] === 'h') {
        recipeTimeMin += parseInt(recipeTimeMinString[0]) * 60
        recipeTimeMin += parseInt(recipeTimeMinString.slice(2))
      } else {
        recipeTimeMin = parseInt(recipeTimeMinString)
      }
    }

    // pobranie ilosci porcji
    const portions = $('span[itemprop="recipeYield"]', content)
    let numberOfPortions = 1

    if (portions['0']) {
      numberOfPortions = parseInt(portions['0'].children[0].data)
      if (!numberOfPortions) {
        numberOfPortions = 1
      }
    }

    // lista krokow
    const recipeSteps = []
    const stepsLi = $('.steps-list > div > li > span > ol > li', content)

    for (let i = 0; i < stepsLi.length; i++) {
      recipeSteps.push(stepsLi[i].children[0].data)
    }
    const stepsLi2 = $('.steps-list > div > li > span > p', content)

    for (let i = 0; i < stepsLi2.length; i++) {
      recipeSteps.push(stepsLi2[i].children[0].data)
    }
    const stepsP = $('.steps-list > div > li p ', content)
    for (let i = 0; i < stepsP.length; i++) {
      recipeSteps.push(stepsP[i].children[0].data)
    }

    const recipeMappedSteps = []
    for (let i = 0; i < recipeSteps.length; i++) {
      if (recipeSteps[i] === undefined) continue

      recipeSteps[i] = recipeSteps[i]
        .replace('\n', '')
        .replace(/\d\./, '')
        .replace('*', '')
      recipeMappedSteps.push({ name: recipeSteps[i].trim() })
    }

    const recipeFilteredSteps = recipeMappedSteps.filter((step) => {
      if (step.name === 'Wpisz tutaj kroki przygotowania przepisu') {
        return false
      }

      let empty = true
      for (i = 0; i < step.name.length; i++) {
        if (/[a-zA-z]/.test(step.name[i])) {
          empty = false
        }
      }
      if (empty) {
        return false
      }

      return true
    })

    // skladniki
    const ingredientSection = $('#ingredient-section', content)
    const li = $('ul > li', ingredientSection)
    let recipeIngredients = []

    for (let i = 0; i < li.length; i++) {
      const recipeIngredientParts = []
      li[i].children.forEach((el) => {
        recipeIngredientParts.push(el.children[0].data.trim())
      })

      const data = recipeIngredientParts.join(' ')

      //const data = li[i].children[0].data
      recipeIngredients.push({ name: data })
    }

    // usuwanie pustych miejsc z nazwy
    recipeIngredients = recipeIngredients.map((ingredient) => {
      let result = ingredient.name

      result = result.replace('\n', '')
      result = result.replace('\n', '')
      result = result.replace('\n', '')

      // let words = []
      // for (let i = 0; i < result.length; i++) {
      //   word = ''

      //   if (result[i] === ' ') {
      //     continue
      //   }

      //   while (result[i] !== ' ') {
      //     word += result[i]
      //     i++
      //   }

      //   words.push(word)
      // }
      // result = words.join(' ')

      return { name: result }
    })

    const recipeFixedIngredients = []
    for (let i = 0; i < recipeIngredients.length; i++) {
      let productName = recipeIngredients[i].name
        .replace(/\d+/g, '')
        .replace(
          /łyżeczka|łyżek|łyżeczek|łyżeczki|łyżka|łyżki|kostka|szczypty|szczypta/,
          ''
        )
        .replace(/opakowanie|woreczki|ugotowane|ugotowany|ugotowana/, '')
        .replace(
          /obrana|opakowanie|opakowania|opakowań|obranych|obranej|obrane|obrana|obrany/,
          ''
        )
        .replace(/ciepłej|ciepłych|ciepłego/, '')
        .replace(
          /ziarenko|ziarenka|ziarenek|obranych|gorącej|gorącego|gorąca|gorący/,
          ''
        )
        .replace(
          /poszatkowanej|poszatkowanego|poszatkowane|opcjonalnie|roztrzepane/,
          ''
        )
        .replace(
          /pęczek|pęczka|kilka|płaskich|czubate|czubata|czubatych|płaskie|czubatej/,
          ''
        )
        .replace(/ulubione/, '')
        .replace('%', '')
        .replace(' g ', '')
        .replace(' i ', '')
        .replace('/', '')
        .replace(/^•/, '')
        .replace(',', '')
        .replace(' soli', 'sól')
        .replace('mąki', 'mąka')
        .replace('Pora', 'por')
        .replace('pora', 'por')
        .replace('UHT', '')
        .replace('\n', '')
        .replace('-', '')
        .replace('MT', '')
        .replace('po ', '')
        .trim()

      if (productName.indexOf('(') > 0) {
        productName =
          productName.substr(0, productName.indexOf('(')) +
          productName.substr(productName.indexOf(')') + 1)
      }

      if (productName.indexOf('(') === 0) {
        productName = productName.substr(productName.indexOf(')') + 1)
      }

      if (productName.indexOf(' pokroj') > 0) {
        productName = productName.substr(0, productName.indexOf(' pokroj'))
      }

      if (productName.indexOf(' ja użył') > 0) {
        productName = productName.substr(0, productName.indexOf(' ja użył'))
      }

      if (productName.indexOf(' ja dał') > 0) {
        productName = productName.substr(0, productName.indexOf(' ja dał'))
      }

      if (productName.indexOf(' na ') > 0) {
        productName = productName.substr(0, productName.indexOf(' na '))
      }

      if (productName.indexOf(' o ') > 0) {
        productName = productName.substr(0, productName.indexOf(' o '))
      }

      if (productName.indexOf(' min ') > 0) {
        productName = productName.substr(0, productName.indexOf(' o '))
      }

      if (productName.indexOf(' posiek') > 0) {
        productName = productName.substr(0, productName.indexOf(' posiek'))
      }

      if (productName.indexOf(' przekroj') > 0) {
        productName = productName.substr(0, productName.indexOf(' przekroj'))
      }

      if (productName.indexOf(' porwa') > 0) {
        productName = productName.substr(0, productName.indexOf(' porwa'))
      }

      if (productName.indexOf(' ugotow') > 0) {
        productName = productName.substr(0, productName.indexOf(' ugotow'))
      }

      if (productName.indexOf(' gorąc') > 0) {
        productName = productName.substr(0, productName.indexOf(' gorąc'))
      }

      if (productName.indexOf(' do ') > 0) {
        productName = productName.substr(0, productName.indexOf(' do '))
      }

      if (productName.indexOf(' w ') > 0) {
        productName = productName.substr(0, productName.indexOf(' w '))
      }

      if (productName.indexOf(' np') > 0) {
        productName = productName.substr(0, productName.indexOf(' np'))
      }

      if (productName.indexOf(' plus ') > 0) {
        productName = productName.substr(0, productName.indexOf(' plus '))
      }

      if (productName.indexOf(' bez ') > 0) {
        productName = productName.substr(0, productName.indexOf(' bez '))
      }

      if (productName.indexOf(' z ') > 0) {
        productName = productName.substr(0, productName.indexOf(' z '))
      }

      if (productName.indexOf(' lub ') > 0) {
        productName = productName.substr(0, productName.indexOf(' lub '))
      }

      if (productName.indexOf(' or ') > 0) {
        productName = productName.substr(0, productName.indexOf(' or '))
      }

      if (productName.indexOf(' rozdrob') > 0) {
        productName = productName.substr(0, productName.indexOf(' rozdrob'))
      }

      if (productName.indexOf(' śwież') > 0) {
        productName = productName.substr(0, productName.indexOf(' śwież'))
      }

      if (productName.indexOf(' wędz') > 0) {
        productName = productName.substr(0, productName.indexOf(' wędz'))
      }

      if (productName.indexOf(' miel') > 0) {
        productName = productName.substr(0, productName.indexOf(' miel'))
      }

      let words = productName.split(' ')
      words = words.filter((word) => {
        if (word === '' || word === ',') return false
        return true
      })
      words = words.map((word) => {
        let result = word
        if (word === 'soli') result = 'sól'
        if (word === 'jajek') result = 'jajko'
        if (word === 'wody') result = 'woda'
        if (word === 'mąki') result = 'mąka'
        if (word === /[P|p]ora/) result = 'por'
        if (word === 'soli') result = 'sól'
        if (word === 'pieczarek') result = 'grzyby'

        if (word[word.length - 1] === ',' || word[word.length - 1] === '.') {
          result = word.substr(0, word.length - 1)
        }

        if (word[word.length - 1] === 'i') {
          result = result.substr(0, result.length - 1) + 'a'
        }

        return result
      })

      productName = words.join(' ')

      recipeFixedIngredients.push({ name: productName })
    }

    // tworzenie zapytania do Nutritionix
    const productStrings = []
    for (let i = 0; i < recipeFixedIngredients.length; i++) {
      const name = recipeFixedIngredients[i].name
      productStrings.push(name)
    }
    const ingr = productStrings.join(', ')
    console.log('\nZapytanie do API: ' + ingr + '\n')
    const nutrients = await getNutrientsFromString(ingr)

    // dodawanie produktow do bazy
    try {
      const products = await Product.find()
      for (let i = 0; i < nutrients.foods.length; i++) {
        const item = nutrients.foods[i]
        let translatedName = await translate(item.food_name, {
          to: 'pl',
        })

        if (translatedName.text[translatedName.text.length - 1] === '.') {
          translatedName.text = translatedName.text.substr(
            0,
            translatedName.text.length - 1
          )
        }

        const product = {
          name:
            translatedName.text.charAt(0).toUpperCase() +
            translatedName.text.slice(1),
          values: {
            kcal: item.nf_calories,
            fat: item.nf_total_fat,
            carbohydrates: item.nf_total_carbohydrate,
            protein: item.nf_protein,
          },
          weight: item.serving_weight_grams,
          image: item.photo.thumb,
          createdAt: new Date(),
          unit: 'grams',
          pieces: 1,
          type: 'nutritionix',
        }

        let values_per_100 = {}
        values_per_100.kcal = (product.values.kcal * 100) / product.weight
        values_per_100.fat = (product.values.fat * 100) / product.weight
        values_per_100.carbohydrates =
          (product.values.carbohydrates * 100) / product.weight
        values_per_100.protein = (product.values.protein * 100) / product.weight
        product['values_per_100'] = values_per_100

        let productExist = false
        if (products.length > 0) {
          for (let i = 0; i < products.length; i++) {
            if (products[i].name === product.name) {
              productExist = true
            }
          }
        }

        if (
          !productExist &&
          product.name !== 'Sól cebuli' &&
          product.name !== 'Czerwony pieprz'
        ) {
          console.log('Dodaje produkt: ' + product.name)
          await Product.create(product)
          products.push(product)
        }
      }
    } catch (e) {
      console.error(e)
    }

    // szukanie produktow z bazy i przypiswanie wartosci skladnikom
    for (let i = 0; i < recipeFixedIngredients.length; i++) {
      let productName = recipeFixedIngredients[i].name

      try {
        const products = await Product.find()
        const options = {
          includeScore: true,
          keys: ['name'],
        }

        const fuse = new Fuse(products, options)

        //let findedProducts = fuse.search(productName)

        let findedProducts = await Product.fuzzySearch(productName)

        findedProducts = findedProducts.filter((product) => {
          if (product.name.length > productName.length + 5) return false
          return true
        })
        const findedProduct = findedProducts[0]

        if (findedProduct) {
          console.log(
            recipeIngredients[i].name +
              ' - ' +
              productName +
              ' - ' +
              findedProduct.name +
              ' \n'
          )

          const recipeIngredientName = recipeIngredients[i].name
            .replace(/^•/, '')
            .replace('po ', '')
            .trim()

          const calculatedIngredientValues = {}
          let weight = 0
          let ammount = 0
          if (
            recipeIngredientName.indexOf(' g ') > 0 ||
            recipeIngredientName.indexOf(' ml ') > 0 ||
            recipeIngredientName.indexOf(' gramów ') > 0 ||
            recipeIngredientName.indexOf(' gramow') > 0 ||
            recipeIngredientName.indexOf(' gram ') > 0 ||
            recipeIngredientName.indexOf(' gr ') > 0 ||
            recipeIngredientName.indexOf(' ml ') > 0 ||
            recipeIngredientName.indexOf(' łyż') > 0
          ) {
            if (recipeIngredientName.indexOf(' łyż') > 0) {
              weight = parseInt(recipeIngredientName) * 8
            } else weight = parseInt(recipeIngredientName)

            if (isNaN(weight)) weight = 1

            let p = weight / 100

            calculatedIngredientValues.kcal =
              Math.round(findedProduct.values_per_100.kcal * p * 100) / 100
            calculatedIngredientValues.fat =
              Math.round(findedProduct.values_per_100.fat * p * 100) / 100
            calculatedIngredientValues.protein =
              Math.round(findedProduct.values_per_100.protein * p * 100) / 100
            calculatedIngredientValues.carbohydrates =
              Math.round(findedProduct.values_per_100.carbohydrates * p * 100) /
              100
          } else {
            ammount = parseFloat(recipeIngredientName)
            if (ammount === 0 || Number.isNaN(ammount)) {
              ammount = 1
            }
            calculatedIngredientValues.kcal =
              Math.round(findedProduct.values.kcal * ammount * 100) / 100
            calculatedIngredientValues.fat =
              Math.round(findedProduct.values.fat * ammount * 100) / 100
            calculatedIngredientValues.protein =
              Math.round(findedProduct.values.protein * ammount * 100) / 100
            calculatedIngredientValues.carbohydrates =
              Math.round(findedProduct.values.carbohydrates * ammount * 100) /
              100
          }

          recipeIngredients[i] = {
            ...recipeIngredients[i],
            name: recipeIngredientName,
            values: calculatedIngredientValues,
            values_per_100: findedProduct.values_per_100,
            original_name: findedProduct.name,
          }

          if (weight > 0) {
            recipeIngredients[i]['unit'] = 'grams'
            recipeIngredients[i]['weight'] = weight
          } else if (ammount > 0) {
            recipeIngredients[i]['unit'] = 'pieces'
            recipeIngredients[i]['pieces'] = ammount
          }
        }
      } catch (e) {
        console.error(e)
      }
    }

    const recipeFilteredIngredients = recipeIngredients.filter(
      (recipeIngredient) => {
        if (recipeIngredient.name === '') return false
        if (recipeIngredient.name.indexOf(':') > 0) return false
        return true
      }
    )

    // wyliczenie wartosci odzywczych przepisu
    const recipeValues = {
      kcal: 0,
      fat: 0,
      carbohydrates: 0,
      protein: 0,
    }
    for (let i = 0; i < recipeIngredients.length; i++) {
      if (recipeIngredients[i].values) {
        recipeValues.kcal += recipeIngredients[i].values.kcal
        recipeValues.fat += recipeIngredients[i].values.fat
        recipeValues.protein += recipeIngredients[i].values.protein
        recipeValues.carbohydrates += recipeIngredients[i].values.carbohydrates
      }
    }

    recipeValues.kcal /= numberOfPortions
    recipeValues.fat /= numberOfPortions
    recipeValues.carbohydrates /= numberOfPortions
    recipeValues.protein /= numberOfPortions

    // zaokraglenie do 2 miejsc po przecinku
    recipeValues.kcal = +(Math.round(recipeValues.kcal + 'e+2') + 'e-2')
    recipeValues.carbohydrates = +(
      Math.round(recipeValues.carbohydrates + 'e+2') + 'e-2'
    )
    recipeValues.fat = +(Math.round(recipeValues.fat + 'e+2') + 'e-2')
    recipeValues.protein = +(Math.round(recipeValues.protein + 'e+2') + 'e-2')

    //tworzenie przepisu
    const recipe = {
      name: recipeName,
      description: recipeDescription,
      steps: recipeFilteredSteps,
      products: recipeFilteredIngredients,
      time_min: recipeTimeMin > 0 ? recipeTimeMin : undefined,
      type: recipeType,
      image: recipeImage,
      createdAt: new Date(),
      values: recipeValues,
      number_of_portions: numberOfPortions,
    }

    console.log(recipe.values)

    //await Recipe.create(recipe)
  } catch (e) {
    console.error(e)
  }
}

module.exports = getRecipeFromPage
