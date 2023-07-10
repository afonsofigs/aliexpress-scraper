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

  let fullWish = fs.readFileSync('fullWish.csv', 'utf8');
  fullWish = fullWish.split('\n');
  for (let i in fullWish) {
    fullWish[i] = fullWish[i].split(',');
  }

  function printProgress(fullPrice, npidx, totalProds) {
    // eslint-disable-next-line no-undef
    process.stdout.clearLine(0);
    // eslint-disable-next-line no-undef
    process.stdout.cursorTo(0);
    const progress = fullPrice + ' -> ' + npidx + '/' + totalProds;
    // console.log(progress);
    // eslint-disable-next-line no-undef
    process.stdout.write(progress);
  }

  let npidx = 0;
  let resFullWish = [];
  let totalProds = fullWish.length;

  for (let prod of fullWish) {
    //skip first line
    if (prod[0] === 'Wishlist') {
      resFullWish[npidx++] = prod;
      continue;
    }

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
          '#root > div.pdp-wrap.pdp-body > div.pdp-body-right > div > div > div.message--wrap--TCbfZuF';
        return (
          document.querySelector(infoDiv) !== null &&
          document.querySelector(infoDiv).innerText.startsWith('Sorry,')
        );
      })
    ) {
      printProgress('Product unavailable', npidx, totalProds);
      totalProds -= 1;
      continue;
    }

    let shippingText = await page.evaluate(
      () =>
        document.querySelector(
          '#root > div.pdp-wrap.pdp-body > div.pdp-body-right > div > div > div.shipping--wrap--Dhb61O7'
        ).innerText
    );
    // console.log(shippingText);

    if (shippingText.includes("can't be shipped")) {
      printProgress('Product unavailable', npidx, totalProds);
      totalProds -= 1;
      continue;
    }

    if (shippingText.includes('Free')) {
      printProgress(
        `${parseFloat(prod[5])} + Free Shipping`,
        npidx,
        totalProds
      );
      resFullWish[npidx++] = prod;
      continue;
    }

    //Shipping is at index 5 and totalPrice is at 6
    //totalPrice.toInt += shipping.toInt
    //remove the "Shipping: €" part
    shippingText = shippingText
      .split('Shipping:')[1]
      .split('\n')[0]
      .trim()
      .slice(0, -1)
      .replace(',', '.');
    prod[4] = shippingText;
    const fullPrice = (parseFloat(prod[5]) + parseFloat(shippingText)).toFixed(
      2
    );
    prod[5] = fullPrice;
    printProgress(
      `${parseFloat(prod[3])} + ${parseFloat(shippingText)} = ${fullPrice}`,
      npidx,
      totalProds
    );
    resFullWish[npidx++] = prod;
  }

  let csvContent = resFullWish.map((e) => e.join(',')).join('\n');

  fs.writeFileSync('fullWish.csv', csvContent, (err) => {
    if (err) {
      return console.log(err);
    }
  });
  console.log('\nThe file was saved!');
  // eslint-disable-next-line no-undef
  process.exit();
})();
