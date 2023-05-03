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

  let pageUrl = 'https://best.aliexpress.com/?lan=en';

  async function checkAli404(page) {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      let res = await page.evaluate(() => {
        //If 404 page
        if (
          document.querySelector('body > h1') !== null &&
          document.querySelector('body > h1').innerText === '404 Not Found'
        )
          return true;

        if (
          document.querySelector(
            '#page-content > div > div.container > div.content > ul'
          ) !== null
        ) {
          let error = true;
          //If all element are sold-out that's a bug
          for (let child of document.querySelector(
            '#page-content > div > div.container > div.content > ul'
          ).children) {
            if (!child.classList.contains('sold-out')) {
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
        console.log('Reloaded ' + (await page.url()));
      } else return;
    }
  }

  await page.goto(pageUrl, {
    waitUntil: 'networkidle0', // 'networkidle0' is very useful for SPAs.
  });
  await checkAli404(page);

  //Ignore coupon banner
  const couponBanner = 'img.btn-close';
  const couponBanner2 =
    'body > div:nth-child(46) > div > div:nth-child(1) > img:nth-child(2)';
  try {
    //console.log("Starting time")
    //await page.waitForTimeout(4000)
    //console.log("End time")
    await page.click(couponBanner, { clickCount: 3, delay: 1000 });
    console.log('Clicked on close coupon banner');
  } catch (error) {
    console.log("Coupon banner didn't appear.");
    try {
      await page.click(couponBanner2, { clickCount: 3, delay: 1000 });
    } catch (error) {
      console.log("Coupon banner2 didn't appear.");
    }
  }

  //Click on wish list
  console.log('Clicking on wish list banner btn');
  await page.click(
    '#nav-global > div.ng-item-wrap.ng-personal-info > div.ng-item.nav-pinfo-item.nav-wishlist > a'
  );
  await checkAli404(page);

  //Check if url is login.aliexpress.com
  // const loginPageStart = 'https://login';
  // if (page.url().startsWith(loginPageStart)) {
  //   console.log('Login page');
  //   // login through gmail
  //   const gmailBtn = '#root > div > div > section > div > div:nth-child(1) > a';
  //   await page.waitForSelector(gmailBtn).then(() => {
  //     page.click(gmailBtn);
  //   });
  //   console.log('Please click on your gmail account');
  //   await page.waitForTimeout(15000);
  //   console.log('Login click timeout finished');
  // } else console.log('Already logged.');

  if (!page.url().includes('wishlist')) throw new Error('Wishlist not loaded');

  // const myListsBtn =
  //   '#root > div.WishList--wishListContainer--2BbatJB > div:nth-child(2) > div > div.comet-tabs-wrapper > div > div:nth-child(2)';
  const myListsBtn =
    '#root > div.WishList--wishListContainer--2BbatJB > div > div > div.comet-tabs-wrapper > div > div:nth-child(2)';
  // Wait for button "My lists (..)"
  const listContainer =
    '#root > div.WishList--wishListContainer--2BbatJB > div:nth-child(2) > div > div.comet-tabs-container > div.comet-tabs-pane.comet-tabs-pane-active > div > div > div > div > div:nth-child(1)';

  const nLis = parseInt(
    await page.waitForSelector(listContainer).then(
      async () =>
        await page.evaluate((myListsBtn) => {
          return document
            .querySelector(myListsBtn)
            .innerText.split('(')[1]
            .split(')')[0];
        }, myListsBtn)
    )
  );

  console.log('nLists: ', nLis);

  const listsParent =
    '#root > div.WishList--wishListContainer--2BbatJB > div:nth-child(2) > div > div.comet-tabs-container > div > div > div > div > div';

  await page.waitForSelector(listsParent);

  const listTitleLocation =
    '#root > div.WishList--wishListContainer--2BbatJB > div > div > div.comet-tabs-container > div.comet-tabs-pane.comet-tabs-pane-active > div.ListDetail--wishListContainer--371wbK0 > div.ListDetail--headerPCContainer--NH339OM > div > div.MyList--leftContainer--2xxelrn > h4';

  const listFirstImage = (idx) => {
    return `#root > div.WishList--wishListContainer--2BbatJB > div:nth-child(2) > div > div.comet-tabs-container > div.comet-tabs-pane.comet-tabs-pane-active > div.MyListPage--myListPageContainer--2C0-_KU > div > div:nth-child(${idx}) > div.MyList--contentContainer--3HWWUua > div:nth-child(1)`;
  };

  const nListItemsLocation =
    '#root > div.WishList--wishListContainer--2BbatJB > div > div > div.comet-tabs-container > div.comet-tabs-pane.comet-tabs-pane-active > div.ListDetail--wishListContainer--371wbK0 > div.ListDetail--headerPCContainer--NH339OM > div > div.MyList--leftContainer--2xxelrn > p > span.MyList--messageText--1zsTCWw';

  //Start the csv file with headers
  let fullWish = [
    [
      'Wishlist',
      'ProductName',
      'ImageURL',
      'Price',
      'Shipping',
      'TotalPrice',
      'ProdURL',
    ],
  ];

  await page.waitForSelector(listContainer);
  await page.waitForTimeout(2000);
  //For each list, store all elements
  for (let i = 1; i <= nLis; i++) {
    //Click on "My Lists (10)"
    await page.$eval(myListsBtn, (element) => element.click());
    // await page.click(myListsBtn);
    console.log('Clickou!');

    if (i % 10 === 0) {
      // Each 10 items scroll to the bottom
      await page.evaluate(() => window.scrollBy(0, 10000));
      await page.waitForTimeout(2000);
    }
    // Click the first image to enter the list
    await page.waitForSelector(listFirstImage(i));
    await page.click(listFirstImage(i));

    await page.waitForTimeout(2000);
    //Get list title
    const listTitle = await page.evaluate((listTitleLocation) => {
      return document.querySelector(listTitleLocation).innerText;
    }, listTitleLocation);
    console.log('Title: ' + listTitle);

    await page.waitForSelector(nListItemsLocation);
    //Get number of list items
    const nListItems = parseInt(
      await page.evaluate((nListItemsLocation) => {
        return document
          .querySelector(nListItemsLocation)
          .innerText.split(' ')[2];
      }, nListItemsLocation)
    );
    console.log('nItems: ' + nListItems);

    //For each item in the list
    for (let p = 1; p <= nListItems; p++) {
      const currItemlocation = `#root > div.WishList--wishListContainer--2BbatJB > div > div > div.comet-tabs-container > div.comet-tabs-pane.comet-tabs-pane-active > div.ListDetail--wishListContainer--371wbK0 > div:nth-child(3) > div > div > div > div:nth-child(${p}) > div.AllListItem--alllistItemContainer--3BpNMAE`;

      // Get url of item after clicking it and it being opened in a new tab
      const [target] = await Promise.all([
        // new Promise((resolve) => {
        //   browser.once('targetcreated', async (target) => {
        //     resolve(target.url());
        //   });
        // }),
        new Promise((resolve) => {
          browser.once('targetcreated', resolve);
        }),
        page.click(
          currItemlocation + ' > div.AllListItem--leftContainer--1eqBej2'
        ),
      ]);

      const url = await target.url();
      // console.log(await url);
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
              .innerText.replaceAll(',', '.')
              .replaceAll(' ', '')
              .replaceAll('€', '')
              .replaceAll('$', '');

            // If no price, it is unavailable
            if (price === '') return [];

            const name = document
              .querySelector(
                currItemlocation +
                  ' > div.AllListItem--rightContainer--2AiihCN > h3'
              )
              .innerText.replaceAll(',', ' ');

            const img = document.querySelector(
                currItemlocation +
                  ' > div.AllListItem--leftContainer--1eqBej2 > div'
              ),
              style = img.currentStyle || window.getComputedStyle(img, false),
              imgUrl = style.backgroundImage.slice(4, -1).replace(/"/g, '');

            // const url =  newPage.evaluate(() => document.location.href);
            // console.log(url);

            const shipping = '0.00';
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

      if (p % 10 === 0) {
        console.log(p);
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

  let csvContent = fullWish.map((e) => e.join(',')).join('\n');

  fs.writeFile('fullWish.csv', csvContent, (err) => {
    if (err) {
      return console.log(err);
    }
    console.log('The file was saved!');
  });

  return;
})();
