const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  const browser = await puppeteer.connect({
    browserURL: "http://127.0.0.1:9222",
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 1920,
    height: 950,
  });

  let fullWish = fs.readFileSync("fullWish.csv", "utf8");
  fullWish = fullWish.split("\n");
  for (let i in fullWish) {
    fullWish[i] = fullWish[i].split(",");
  }

  function printProgress(fullPrice, npidx, totalProds) {
    // eslint-disable-next-line no-undef
    process.stdout.clearLine(0);
    // eslint-disable-next-line no-undef
    process.stdout.cursorTo(0);
    const progress = fullPrice + " -> " + npidx + "/" + totalProds;
    // console.log(progress);
    // eslint-disable-next-line no-undef
    process.stdout.write(progress);
  }

  let npidx = 0;
  let resFullWish = [];
  let totalProds = fullWish.length;

  for (let prod of fullWish) {
    //skip first line
    if (prod[0] === "Wishlist") {
      resFullWish[npidx++] = prod;
      continue;
    }

    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        //Product website
        await page.goto(prod[6]);

        //Continue if unavailable, info div not null and "Sorry, ..." message
        if (
          await page.evaluate(() => {
            const infoDiv =
              "#root > div > div.pdp-body.pdp-wrap > div > div.pdp-body-top-right > div > div > div.message--wrap--TCbfZuF";
            return (
              document.querySelector(infoDiv) !== null &&
              document.querySelector(infoDiv).innerText.startsWith("Sorry,")
            );
          })
        ) {
          printProgress("Product unavailable", npidx, totalProds);
          totalProds -= 1;
          break;
        }

        let shippingText = await page.evaluate(
          () =>
            document.querySelector(
              "#root > div > div.pdp-body.pdp-wrap > div > div.pdp-body-top-right > div > div > div.shipping--wrap--Dhb61O7"
            ).innerText
        );

        if (shippingText.includes("can't be shipped")) {
          printProgress("Product unavailable", npidx, totalProds);
          totalProds -= 1;
          break;
        }

        let priceText = await page.evaluate(
          () =>
            document.querySelector(
              "#root > div > div.pdp-body.pdp-wrap > div > div.pdp-body-top-left > div.pdp-info > div.pdp-info-right > div.price--wrap--tA4MDk4.product-price"
            ).innerText
        );

        const regexAllCurrencySymbols =
          /[$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BD\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6]/;
        const newPrice = parseFloat(
          priceText.split(regexAllCurrencySymbols)[0].trim().replace(",", ".")
        );

        // Price correction
        if (newPrice !== parseFloat(prod[3])) {
          prod[3] = newPrice;
          prod[5] = newPrice;
        }

        // "1.99€ , or free over 10" is same as free if this argument says so
        // eslint-disable-next-line no-undef
        const orFreeIsFree = false || process.argv.includes("--orFreeIsFree");

        if (
          (shippingText.includes("Free") &&
            !shippingText.includes("Free shipping for orders over")) ||
          (orFreeIsFree && shippingText.includes("or free over 10"))
        ) {
          printProgress(
            `${parseFloat(prod[5])} + Free Shipping`,
            npidx,
            totalProds
          );
          resFullWish[npidx++] = prod;
          break;
        }

        //Shipping is at index 5 and totalPrice is at 6
        //totalPrice.toInt += shipping.toInt
        //remove the "Shipping: €" part
        const newShipping = shippingText
          .split("Shipping:")[1]
          .split("\n")[0]
          .trim()
          .split(" ")[0]
          .split(" ")[0]
          .slice(0, -1)
          .replace(",", ".");
        prod[4] = newShipping;
        const fullPrice = (
          parseFloat(prod[5]) + parseFloat(newShipping)
        ).toFixed(2);
        prod[5] = fullPrice;
        printProgress(
          `${parseFloat(prod[3])} + ${parseFloat(newShipping)} = ${fullPrice}`,
          npidx,
          totalProds
        );

        resFullWish[npidx++] = prod;
        break;
      } catch (err) {
        console.log("Error catched: " + err.toString());
        console.log("Retrying " + prod[6]);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  let csvContent = resFullWish.map((e) => e.join(",")).join("\n");

  fs.writeFileSync("fullWish.csv", csvContent, (err) => {
    if (err) {
      return console.log(err);
    }
  });
  console.log("\nThe file was saved!");
  // eslint-disable-next-line no-undef
  process.exit();
})();
