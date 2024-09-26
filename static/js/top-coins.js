import { COINGECKO_API_OPTIONS } from "../js/helpers.js";

let current_page = 1;
let current_sort = "market_cap_desc";
let coinData = {
  market_cap_asc: null,
  market_cap_desc: null,
  volume_asc: null,
  volume_desc: null,
};

async function fetchCoinsData(sortCoinsBy = "market_cap_desc") {
  const fetchOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sort_coins_by: sortCoinsBy }),
  };

  try {
    const response = await fetch("/get_top_coins_data", fetchOptions);
    const data = await response.json();

    const results = data.map((coin) => {
      let {
        image,
        name,
        symbol,
        current_price,
        market_cap,
        price_change_percentage_1h_in_currency: price_change_1h,
        price_change_percentage_24h_in_currency: price_change_24h,
        price_change_percentage_7d_in_currency: price_change_7d,
        total_volume,
        sparkline_in_7d,
      } = coin;

      sparkline_in_7d = sparkline_in_7d["price"];

      return {
        image,
        name,
        symbol,
        current_price,
        market_cap,
        price_change_1h,
        price_change_24h,
        price_change_7d,
        total_volume,
        sparkline_in_7d,
      };
    });

    return results;
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

/**
 * Creates and appends table rows for displaying cryptocurrency data.
 *
 * This function generates a specified number of table rows, each containing
 * elements to display various details about a cryptocurrency (e.g., image,
 * name, price, market cap, price change, and volume). These rows are then
 * appended to an existing table in the DOM.
 *
 * @param {number} [numRows=10] - The number of table rows to create.
 *                                 Defaults to 10 if not specified.
 */
function createCoinTableRows(numRows = 10) {
  const markup = `
    <td>
      <div class="coin-image-container">
        <img class="coin-image" src="" alt="Coin Image" loading="lazy" />
      </div>
    </td>
    <td class="coin-name"></td>
    <td class="coin-price"></td>
    <td class="coin-market-cap"></td>
    <td class="coin-price-change-1h"></td>
    <td class="coin-price-change-24h"></td>
    <td class="coin-price-change-7d"></td>
    <td class="coin-volume"></td>
    <td class="coin-graph">
      <canvas class="sparkline-canvas"></canvas>
    </td>
  `;

  for (let i = 0; i < numRows; i++) {
    const coinTableDataRow = document.createElement("tr");
    coinTableDataRow.classList.add("table-row");
    coinTableDataRow.innerHTML = markup;
    document.querySelector(".table tbody").appendChild(coinTableDataRow);
  }
}

/**
 * Displays a paginated list of cryptocurrency data in a table.
 *
 * This function updates the table rows with cryptocurrency data based on the
 * current sorting criteria and the specified page number. It fetches a subset
 * of the data from the `coinData` dictionary and updates the table rows
 * accordingly.
 *
 * @param {number} pageNum - The page number to display (1-indexed)
 */
function displayCoins(pageNum) {
  const tableRows = document.querySelectorAll(".table-row");
  const dataToShow = coinData[current_sort].slice(
    (pageNum - 1) * 10,
    pageNum * 10
  );

  for (const [i, row] of Array.from(tableRows).entries()) {
    // Update image
    row.querySelector(".coin-image").setAttribute("src", dataToShow[i].image);
    row
      .querySelector(".coin-image")
      .setAttribute("alt", dataToShow[i].name + " Logo");

    // Update coin name + symbol
    row.querySelector(
      ".coin-name"
    ).textContent = `${dataToShow[i].name} (${dataToShow[i].symbol})`;

    // Update coin (current) price
    row.querySelector(".coin-price").textContent = `${dataToShow[
      i
    ].current_price.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    })}`;

    // Update coin market cap
    row.querySelector(".coin-market-cap").textContent = `${dataToShow[
      i
    ].market_cap.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    })}`;

    // Update coin 1h price change
    if (dataToShow[i].price_change_1h) {
      row.querySelector(".coin-price-change-1h").textContent =
        dataToShow[i].price_change_1h >= 0 ? "+" : "";
      row.querySelector(".coin-price-change-1h").textContent += `${dataToShow[
        i
      ].price_change_1h.toFixed(4)}%`;
      row.querySelector(".coin-price-change-1h").style.color =
        dataToShow[i].price_change_1h >= 0 ? "#17C671" : "#EB5757";
    } else {
      row.querySelector(".coin-price-change-1h").textContent = "N/A";
    }

    // Update coin 24h price change
    if (dataToShow[i].price_change_24h) {
      row.querySelector(".coin-price-change-24h").textContent =
        dataToShow[i].price_change_24h >= 0 ? "+" : "";
      row.querySelector(".coin-price-change-24h").textContent += `${dataToShow[
        i
      ].price_change_24h.toFixed(4)}%`;
      row.querySelector(".coin-price-change-24h").style.color =
        dataToShow[i].price_change_24h >= 0 ? "#17C671" : "#EB5757";
    } else {
      row.querySelector(".coin-price-change-24h").textContent = "N/A";
    }

    // Update coin 7d price change
    row.querySelector(".coin-price-change-7d").textContent =
      dataToShow[i].price_change_7d >= 0 ? "+" : "";
    row.querySelector(".coin-price-change-7d").textContent += `${dataToShow[
      i
    ].price_change_7d.toFixed(4)}%`;
    row.querySelector(".coin-price-change-7d").style.color =
      dataToShow[i].price_change_7d >= 0 ? "#17C671" : "#EB5757";

    // Update coin total volume
    row.querySelector(".coin-volume").textContent = `${dataToShow[
      i
    ].total_volume.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

    // Update coin price graph (7 days)
    drawSparkline(
      dataToShow[i].sparkline_in_7d,
      row.querySelector(".sparkline-canvas")
    );
  }
}

function drawSparkline(data, canvas) {
  const ctx = canvas.getContext("2d");

  // Clear previous drawings
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Set up the drawing style
  if (data[0] > data[data.length - 1]) {
    ctx.strokeStyle = "#EB5757"; // Line color
  } else {
    ctx.strokeStyle = "#17C671"; // Line color
  }

  ctx.lineWidth = 3;

  // Determine the scale of the graph
  const maxVal = Math.max(...data);
  const minVal = Math.min(...data);
  const range = maxVal - minVal;

  // Function to map data points to canvas coordinates
  const scaleX = canvas.width / (data.length - 1);
  const scaleY = canvas.height / range;

  // Start at the first data point
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - (data[0] - minVal) * scaleY);

  // Draw line to each subsequent point
  data.forEach((val, i) => {
    ctx.lineTo(i * scaleX, canvas.height - (val - minVal) * scaleY);
  });

  // Stroke the path
  ctx.stroke();
}

/**
 * Adds event listeners to the pagination buttons for navigating through pages.
 *
 * This function attaches click event listeners to the "Next" and "Previous"
 * pagination buttons, allowing users to navigate through pages of content.
 * Renders the new coins, and handles button visibility as well depending on
 * which page is currently visible (i.e., next = hidden on last page, previous =
 * hidden on first page).
 */
function addPaginationButtonEventListeners() {
  const tableButtonNext = document.querySelector(".pagination-button--next");
  const tableButtonPrevious = document.querySelector(
    ".pagination-button--previous"
  );

  tableButtonNext.addEventListener("click", function () {
    if (current_page < 10) {
      current_page += 1;
      displayCoins(current_page);

      tableButtonNext.classList.toggle("hidden", current_page == 10);
      tableButtonPrevious.classList.toggle("hidden", current_page == 1);
    }
  });

  tableButtonPrevious.addEventListener("click", function () {
    if (current_page > 1) {
      current_page -= 1;
      displayCoins(current_page);

      tableButtonPrevious.classList.toggle("hidden", current_page == 1);
      tableButtonNext.classList.toggle("hidden", current_page == 10);
    }
  });
}

/**
 * Adds event listeners to the sort dropdown menu for handling sorting actions.
 *
 * This function attaches an event listener to a dropdown menu with the class
 * "sort-dropdown-menu". When the user selects a sorting option, it updates the
 * current sorting criteria, resets the pagination to the first page, and
 * refreshes the displayed content accordingly.
 *
 * Each case in the switch statement:
 * - Sets the `current_sort` variable to the selected sorting option.
 * - Resets the `current_page` variable to 1.
 * - Calls `resetPaginationButtons()` to reset pagination controls.
 * - Conditionally fetches the sorted coin data if not already cached in `coinData`.
 * - Calls `displayCoins(current_page)` to refresh the displayed content.
 */
function addSortDropdownEventListeners() {
  document
    .querySelector(".sort-dropdown-menu")
    .addEventListener("change", async function (event) {
      const selectedValue = event.target.value;

      switch (selectedValue) {
        case "market_cap_asc":
          current_sort = "market_cap_asc";
          current_page = 1;
          resetPaginationButtons();

          if (!coinData.market_cap_asc) {
            coinData.market_cap_asc = await fetchCoinsData("market_cap_asc");
          }

          displayCoins(current_page);
          break;
        case "market_cap_desc":
          current_sort = "market_cap_desc";
          current_page = 1;
          resetPaginationButtons();
          displayCoins(current_page);
          break;
        case "volume_asc":
          current_sort = "volume_asc";
          current_page = 1;
          resetPaginationButtons();

          if (!coinData.volume_asc) {
            coinData.volume_asc = await fetchCoinsData("volume_asc");
          }

          displayCoins(current_page);
          break;
        case "volume_desc":
          current_sort = "volume_desc";
          current_page = 1;
          resetPaginationButtons();

          if (!coinData.volume_desc) {
            coinData.volume_desc = await fetchCoinsData("volume_desc");
          }

          displayCoins(current_page);
          break;
      }
    });
}

/**
 * Resets the state of pagination buttons (previous = hidden, next = visible)
 *
 * This function ensures that the "Next" pagination button is visible and the
 * "Previous" pagination button is hidden. Used when the user switches the sort
 * being applied on the table data.
 */
function resetPaginationButtons() {
  document.querySelector(".pagination-button--next").classList.remove("hidden");
  document
    .querySelector(".pagination-button--previous")
    .classList.add("hidden");
}

async function main() {
  // Get top 100 coins data
  coinData.market_cap_desc = await fetchCoinsData();

  // Dynamically add rows to the table
  createCoinTableRows(10);

  // Render data for first page
  displayCoins(1);

  // Add event listeners for dropdown menu and pagination buttons
  addPaginationButtonEventListeners();
  addSortDropdownEventListeners();
}

main();
