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

  let pageUrl = "https://www.aliexpress.com/p/wishlist/index.html";

  async function checkAli404(page) {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      let res = await page.evaluate(() => {
        //If 404 page
        if (
          document.querySelector("body > h1") !== null &&
          document.querySelector("body > h1").innerText === "404 Not Found"
        )
          return true;

        if (
          document.querySelector(
            "#page-content > div > div.container > div.content > ul"
          ) !== null
        ) {
          let error = true;
          //If all element are sold-out that's a bug
          for (let child of document.querySelector(
            "#page-content > div > div.container > div.content > ul"
          ).children) {
            if (!child.classList.contains("sold-out")) {
              error = false;
              break;
            }
          }
          return error;
        }
        return false;
      });
      if (res === true) {
        await page.reload();
        await page.waitForTimeout(2000);
        console.log("Reloaded " + (await page.url()));
      } else return;
    }
  }

  function printProgress(npidx, totalProds) {
    // eslint-disable-next-line no-undef
    process.stdout.clearLine(0);
    // eslint-disable-next-line no-undef
    process.stdout.cursorTo(0);
    const progress = npidx + "/" + totalProds;
    // console.log(progress);
    // eslint-disable-next-line no-undef
    process.stdout.write(progress);
  }

  await page.goto(pageUrl, {
    waitUntil: "networkidle0", // 'networkidle0' is very useful for SPAs.
  });
  await checkAli404(page);

  if (!page.url().includes("wishlist")) throw new Error("Wishlist not loaded");

  const myListsBtn =
    "#root > div.WishList--wishListContainer--2BbatJB > div > div > div.comet-tabs-wrapper > div > div:nth-child(2)";

  // Wait for button "My lists (..)"
  const listContainer =
    "#root > div.WishList--wishListContainer--2BbatJB > div:nth-child(2) > div > div.comet-tabs-container > div.comet-tabs-pane.comet-tabs-pane-active > div > div > div > div > div:nth-child(1)";

  const nLis = parseInt(
    await page.waitForSelector(listContainer).then(
      async () =>
        await page.evaluate((myListsBtn) => {
          return document
            .querySelector(myListsBtn)
            .innerText.split("(")[1]
            .split(")")[0];
        }, myListsBtn)
    )
  );

  console.log("N wishlists: " + nLis);

  const listsParent =
    "#root > div.WishList--wishListContainer--2BbatJB > div:nth-child(2) > div > div.comet-tabs-container > div > div > div > div > div";

  await page.waitForSelector(listsParent);

  const listTitleLocation =
    "#root > div.WishList--wishListContainer--2BbatJB > div > div > div.comet-tabs-container > div.comet-tabs-pane.comet-tabs-pane-active > div.ListDetail--wishListContainer--371wbK0 > div.ListDetail--headerPCContainer--NH339OM > div > div.MyList--leftContainer--2xxelrn > h4";

  const listFirstImage = (idx) => {
    return `#root > div.WishList--wishListContainer--2BbatJB > div:nth-child(2) > div > div.comet-tabs-container > div.comet-tabs-pane.comet-tabs-pane-active > div.MyListPage--myListPageContainer--2C0-_KU > div > div:nth-child(${idx}) > div.MyList--contentContainer--3HWWUua > div:nth-child(1)`;
  };

  const nListItemsLocation =
    "#root > div.WishList--wishListContainer--2BbatJB > div > div > div.comet-tabs-container > div.comet-tabs-pane.comet-tabs-pane-active > div.ListDetail--wishListContainer--371wbK0 > div.ListDetail--headerPCContainer--NH339OM > div > div.MyList--leftContainer--2xxelrn > p > span.MyList--messageText--1zsTCWw";

  //Start the csv file with headers
  let fullWish = [
    [
      "Wishlist",
      "ProductName",
      "ImageURL",
      "Price",
      "Shipping",
      "TotalPrice",
      "ProdURL",
    ],
  ];

  await page.waitForSelector(listContainer);
  await page.waitForTimeout(2000);
  //For each list, store all elements
  for (let i = 1; i <= nLis; i++) {
    //Click on "My Lists (10)"
    await page.$eval(myListsBtn, (element) => element.click());
    // await page.click(myListsBtn);

    if (i % 10 === 0) {
      // Each 10 items scroll to the bottom
      await page.evaluate(() => window.scrollBy(0, 10000));
      await new Promise((r) => setTimeout(r, 2000));
      // Backup scroll, sometimes needed
      await page.evaluate(() => window.scrollBy(0, 10000));
    }
    // Click the first image to enter the list
    await page.waitForSelector(listFirstImage(i));
    await page.click(listFirstImage(i));

    await page.waitForTimeout(2000);
    //Get list title
    const listTitle = await page.evaluate((listTitleLocation) => {
      return document.querySelector(listTitleLocation).innerText;
    }, listTitleLocation);
    console.log("\nWishlist " + i + ": " + listTitle);

    await page.waitForSelector(nListItemsLocation);
    //Get number of list items
    const nListItems = parseInt(
      await page.evaluate((nListItemsLocation) => {
        return document
          .querySelector(nListItemsLocation)
          .innerText.split(" ")[2];
      }, nListItemsLocation)
    );
    console.log("N items: " + nListItems);

    //For each item in the list
    for (let p = 1; p <= nListItems; p++) {
      const currItemlocation = `#root > div.WishList--wishListContainer--2BbatJB > div > div > div.comet-tabs-container > div.comet-tabs-pane.comet-tabs-pane-active > div.ListDetail--wishListContainer--371wbK0 > div:nth-child(3) > div > div > div > div:nth-child(${p}) > div.AllListItem--alllistItemContainer--3BpNMAE`;

      // If product currently unavailable, ignore, continue
      const isUnavailableLocation =
        currItemlocation + " > div.AllListItem--rightContainer--2AiihCN";

      const isProdUnavailable = await page.evaluate((isUnavailableLocation) => {
        let isUnavailable = false;
        for (let node of document.querySelector(isUnavailableLocation)
          .childNodes) {
          if (node.className.includes("invalid")) {
            isUnavailable = true;
            break;
          }
        }
        return isUnavailable;
      }, isUnavailableLocation);

      if (isProdUnavailable) {
        printProgress("Product unavailable " + p, nListItems);
      }

      if (!isProdUnavailable) {
        // Get url of item after clicking it and it being opened in a new tab
        const [target] = await Promise.all([
          new Promise((resolve) => {
            browser.once("targetcreated", resolve);
          }),
          page.click(
            currItemlocation + " > div.AllListItem--leftContainer--1eqBej2"
          ),
        ]);

        const url = await target.url();
        const tabPage = await target.page();
        if ((await tabPage) !== null) {
          await tabPage.close();
        }

        fullWish.push(
          ...(await page.evaluate(
            (listTitle, currItemlocation, prodURL) => {
              const price = document
                .querySelector(
                  currItemlocation +
                    ` > div.AllListItem--rightContainer--2AiihCN > p`
                )
                .innerText.replaceAll(",", ".")
                .replaceAll(" ", "")
                .replaceAll("€", "")
                .replaceAll("$", "");

              // If no price, it is unavailable
              if (price === "") return [];

              const name = document
                .querySelector(
                  currItemlocation +
                    " > div.AllListItem--rightContainer--2AiihCN > h3"
                )
                .innerText.replaceAll(",", " ");

              const img = document.querySelector(
                  currItemlocation +
                    " > div.AllListItem--leftContainer--1eqBej2 > div"
                ),
                style = img.currentStyle || window.getComputedStyle(img, false),
                imgUrl = style.backgroundImage.slice(4, -1).replace(/"/g, "");

              // const url =  newPage.evaluate(() => document.location.href);
              // console.log(url);

              const shipping = "0.00";
              const totalPrice = price;

              //Build product info
              return [
                [listTitle, name, imgUrl, price, shipping, totalPrice, prodURL],
              ];
            },
            listTitle,
            currItemlocation,
            url
          ))
        );
        printProgress(p, nListItems);
      }

      if (p % 10 === 0) {
        // Each 10 items scroll to the bottom
        await page.evaluate(() => window.scrollBy(0, 10000));
        await page.waitForTimeout(3000);
      }
      // Scroll up at the end
      if (p === nListItems) {
        await page.evaluate(() => window.scrollBy(0, -100000));
      }
    }
  }

  let csvContent = fullWish.map((e) => e.join(",")).join("\n");

  fs.writeFileSync("fullWish.csv", csvContent, (err) => {
    if (err) {
      return console.log(err);
    }
  });
  fs.writeFileSync("fullWish_b4Ship.csv", csvContent, (err) => {
    if (err) {
      return console.log(err);
    }
  });
  console.log("\nThe file was saved!");
  // eslint-disable-next-line no-undef
  process.exit();
})();
