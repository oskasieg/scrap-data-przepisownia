const { getNutrientsFromString } = require('../utils/nutritionix')

const rp = require('request-promise')

const $ = require('cheerio')

const Product = require('../models/product.model')
const Recipe = require('../models/recipe.model')

const translate = require('@vitalets/google-translate-api')

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

    // skladniki
    const ingredientSection = $('#ingredient-section', content)
    const li = $('ul > li', ingredientSection)
    let recipeIngredients = []
    for (let i = 0; i < li.length; i++) {
      const data = li[i].children[0].data
      recipeIngredients.push({ name: data })
    }

    // usuwanie pustych miejsc z nazwy
    recipeIngredients = recipeIngredients.map((ingredient) => {
      let result = ingredient.name

      result = result.replace('\n', '')
      result = result.replace('\n', '')
      result = result.replace('\n', '')

      let words = []
      for (let i = 0; i < result.length; i++) {
        word = ''

        if (result[i] === ' ') {
          continue
        }

        while (result[i] !== ' ' /*&& result[i] !== ','*/) {
          word += result[i]
          i++
        }

        words.push(word)
      }
      result = words.join(' ')

      return { name: result }
    })

    const recipeFixedIngredients = []
    for (let i = 0; i < recipeIngredients.length; i++) {
      if (recipeIngredients[i].name === '') continue
      if (recipeIngredients[i].name.indexOf(':') > 0) continue

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

      let words = productName.split(' ')
      words = words.filter((word) => {
        if (word === '' || word === ',') return false
        return true
      })
      words = words.map((word) => {
        let result = word
        if (word === 'soli') result = 'sól'
        if (word === 'mąki') result = 'mąka'
        if (word === /[P|p]ora/) result = 'por'
        if (word === 'soli') result = 'sól'

        // if (word[word.length - 1] === 'y' || word[word.length - 1] === 'i') {
        //   result = word.substr(0, word.length - 1) + 'a'
        // }

        if (word[word.length - 1] === ',' || word[word.length - 1] === '.') {
          result = word.substr(0, word.length - 1)
        }

        // if (word.substr(word.length - 2) === 'ów') {
        //   result = word.substr(0, word.length - 2)
        // }

        // if (word.substr(word.length - 2) === 'ej') {
        //   result = word.substr(0, word.length - 2) + 'a'
        // }

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
    console.log('recipeIngr:' + recipeIngredients.length)
    console.log('Ingr: ' + recipeFixedIngredients.length)
    console.log(ingr)
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

        if (!productExist) {
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
        let findedProducts = await Product.fuzzySearch(productName)
        findedProducts = findedProducts.filter((product) => {
          if (product.name.length > productName.length + 2) return false
          return true
        })
        const findedProduct = findedProducts[0]

        if (findedProduct) {
          console.log(
            recipeFixedIngredients[i].name +
              ' - ' +
              productName +
              ' - ' +
              findedProduct.name +
              '\n'
          )

          const recipeIngredientName = recipeIngredients[i].name
            .replace(/^•/, '')
            .trim()

          const calculatedIngredientValues = {}
          let weight = 0
          let ammount = 0
          if (
            recipeIngredientName.indexOf(' g ') > 0 ||
            recipeIngredientName.indexOf(' ml ') > 0 ||
            recipeIngredientName.indexOf(' gramów ') > 0 ||
            recipeIngredientName.indexOf(' gramow') > 0 ||
            recipeIngredientName.indexOf(' gram ') > 0
          ) {
            weight = parseInt(recipeIngredientName)
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

    // pobranie ilosci porcji
    const portions = $("span[class='sprite-responsive cake']", content)
    let numberOfPortions = 1
    if (portions['0']) {
      numberOfPortions = parseInt(portions['0'].next.data)
      if (!numberOfPortions) {
        numberOfPortions = 1
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

    // lista krokow
    const recipeSteps = []
    const stepsLi = $('.steps-list > li > ol > li', content)
    for (let i = 0; i < stepsLi.length; i++) {
      recipeSteps.push(stepsLi[i].children[0].data)
    }
    const stepsLi2 = $('.steps-list > li', content)
    for (let i = 0; i < stepsLi2.length; i++) {
      recipeSteps.push(stepsLi2[i].children[0].data)
    }
    const stepsP = $('.steps-list > li p ', content)
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

    // TM 31
    const tm = $(
      '.appliances-list > ul > li > .media-body > .media-heading',
      content
    )

    if (tm['0'].children && tm['0'].children[0].data) {
      recipeDescription +=
        '.\nPrzepis jest tworzony dla urządzenia ' + tm['0'].children[0].data
    }

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
    //await Recipe.create(recipe)
  } catch (e) {
    console.error(e)
  }
}

module.exports = getRecipeFromPage
