# Aliexpress Wishlist to CSV

## How to run the scraper:

1.  Clone this repository to your local machine.
2.  Have Google Chrome installed.
3.  Fully close Google Chrome on your machine.
4.  Start a debugging Chrome instance on port 9222. Terminal commands:

    - macOS with temporary chrome profile: `/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --no-first-run --no-default-browser-check --user-data-dir=$(mktemp -d -t 'chrome-remote_data_dir')`

    - macOS with custom user profile: `/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --profile-directory=Profile\ 2 --remote-debugging-port=9222`

    - Windows with default chrome profile: `start chrome.exe –remote-debugging-port=9222`

5.  **Login to Aliexpress.com** normally on the debugging Google Chrome window, and change the website **language to English**.

6.  Make sure you have `pnpm` installed. Install all the dependencies with `pnpm install` and then run the program with `npm start`. Because google chrome changes the focus of the mouse when a new tab is open, it may be annoying to use your computer while this is running. Optional commands:

    - The code run is split in two phases: the product info gathering and the shipping costs gathering phase. each phase can be run with `npm run products` and `npm run shipping`, respectively.

7.  At the end, on this folder, there should be a CSV file named `fullWish.csv` with your products information, including the total price shipped to you. You can now open this file on Excel and easily use it.

---

## Notes:

- Final price may vary because of the different available product variations.

- The attributes stored for each product and currently available on the output CSV file are: `Wishlist Name, Product Name, Image Thumbnail URL, Base Price, Shipping Price, Total Price, Product URL`

- If the program hang between phases, `control+C` out of the first run after the "File was saved" message and run the second phase manually. See optional commands on the sixth step.

---

## How to run the webserver to see the products:

1. After running the scraper, make sure you have a file named `fullWish.csv` on the root directory.
2. Make sure you have `pnpm` installed. From the root directory run `npm run webserver`.
3. A webpage will open with the website and the terminal will also display the url where it is available.
