const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222',
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 1920,
    height: 950,
  });

  let fullWish = require('fs').readFileSync('fullWish.csv', 'utf8');
  fullWish = fullWish.split('\n');
  for (let i in fullWish) {
    fullWish[i] = fullWish[i].split(',');
  }

  for (let prod of fullWish) {
    //skip first line
    if (prod[0] === 'Wishlist') continue;

    //Product website
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        await page.goto(prod[6]);
        break;
      } catch (err) {
        console.log('Error catched: ' + err.toString());
        console.log('Retrying ' + prod[6]);
        page.waitForTimeout(2000);
      }
    }

    //Continue if unavailable, info div not null and "Sorry, ..." message
    if (
      await page.evaluate(() => {
        const infoDiv =
          '#root > div > div.product-main > div.product-main-wrap > div.product-info > div.customs-message-wrap';
        return (
          document.querySelector(infoDiv) !== null &&
          document.querySelector(infoDiv).innerText.startsWith('Sorry,')
        );
      })
    ) {
      prod[4] = 'unavailable';
      prod[5] = 'unavailable';
      continue;
    }

    //Get shipping price, check if it says free
    let shippingText = await page.evaluate(() => {
      //5-day shipping info makes a div with the same class as we wanted here, so we need to count how many we get and
      // select the latter
      let nTitleLayouts = 1;
      let firstFlag = true;
      for (let child of document.querySelector(
        '#root > div > div.product-main > div.product-main-wrap > div.product-info > div.product-dynamic-shipping > div > div.dynamic-shipping'
      ).children)
        if (child.classList.contains('dynamic-shipping-titleLayout'))
          if (!firstFlag) nTitleLayouts += 1;
          else firstFlag = false;

      return document.querySelector(
        `#root > div > div.product-main > div.product-main-wrap > div.product-info > div.product-dynamic-shipping > div > div > div:nth-child(${nTitleLayouts}) > span > span > strong`
      ).innerText;
    });

    if (shippingText.startsWith('Free')) continue;

    //Shipping is at index 5 and totalPrice is at 6
    //totalPrice.toInt += shipping.toInt
    //remove the "Shipping: € " part
    shippingText = shippingText.slice(12).replace(',', '.');
    prod[4] = shippingText;
    const fullPrice = (parseFloat(prod[5]) + parseFloat(shippingText)).toFixed(
      2
    );
    prod[5] = fullPrice;
    console.log(fullPrice);
  }

  let csvContent = fullWish.map((e) => e.join(',')).join('\n');

  fs.writeFile('fullWish.csv', csvContent, (err) => {
    if (err) {
      return console.log(err);
    }
    console.log('The file was saved!');
  });

  //browser.close();
})();
