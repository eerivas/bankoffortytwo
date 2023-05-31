/* Main Script */

let container = document.getElementById('grid-container');
const actionsContainer = document.getElementById('actions-container');
const MAX_ACTIONS = 10;

function createGrid(width, height) {
  let increment = 100;
  for (let i = 1; i < width / 10; i++) {
    const verticalLine = document.createElement('div');
    verticalLine.classList.add('grid-line', 'vertical-line');
    verticalLine.style.left = `${i * 10}px`;
    container.appendChild(verticalLine);
  }

  for (let i = 1; i < height / 10; i++) {
    const horizontalLine = document.createElement('div');
    horizontalLine.classList.add('grid-line', 'horizontal-line');
    horizontalLine.style.top = `${i * 10}px`;
    container.appendChild(horizontalLine);

  }
}

createGrid(840, 360); // Create a 400x200 grid

// game.js
const stockGraph = document.getElementById('stock-graph').getContext('2d');

// Function to fetch historical stock data from Yahoo Finance API for a month
async function fetchStockData(symbol) {
  try {
    const response = await fetch(`/stock-data?symbol=${symbol}`);
    const data = await response.json();
    // Process the received stock data
    const historicalData = data.chart.result[0].indicators.quote[0].close;
    let dates = data.chart.result[0].timestamp.map(timestamp => new Date(timestamp * 1000));
    
    dates.sort((a, b) => a - b);

    return { dates, historicalData };
  } catch (error) {
    console.error(error);
    return null;
  }
}

let chart = null; // Reference to the current chart instance
let chartData = {
  labels: [],
  datasets: [{
    label: "",
    data: [],
    borderColor: 'red',
    backgroundColor: 'rgba(0, 0, 0 ,0)',
    borderWidth: 1,
    pointRadius: 0,
    tension: 0,
    fill: false
  }]
};

const startingBalance = 100000;
let yBalance = startingBalance;
let mBalance = startingBalance

const stockSymbols = ["AAPL", "GOOG", 'AMZN', 'MSFT', "META", "APA", "SOFI", "HPQ", "GME", "AMBA", "CRM", "TGT", "AVGO", "NFLX", "NET", "CRWD", "ENPH", "COIN", "PYPL"];
function getRandomStockSymbol() {
  const randomIndex = Math.floor(Math.random() * stockSymbols.length);
  return stockSymbols[randomIndex];
}
var stockTicker = getRandomStockSymbol();

const stockPriceText = document.getElementById('stock-price-text');
const marketBalance = document.getElementById('market-balance');
const yourScore = document.getElementById('your-score');
const stockTickerText = document.getElementById('stock-ticker');
const resultsText = document.getElementById('results');

yourScore.innerHTML = `$${yBalance.toLocaleString('en-US', {style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
marketBalance.innerHTML = `$${mBalance.toLocaleString('en-US', {style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
stockTickerText.innerHTML += stockTicker;

let yourShares = 0;
let updateBalance = false;

function updateShares(action) {
  let stockPrice = Number(stockPriceText.innerHTML.replace("$", ""));

  // If action is SELL
  if (!action && yourShares != 0) {
    yourShares = 0;
    yourScore.innerHTML = `$${yBalance.toFixed(2).toLocaleString('en-US')}`;
    updateBalance = false;
    addLine(stockPrice, 'red');
   
  // If action is BUY
  } else if (action && yourShares == 0) {
    yourShares = yBalance / stockPrice;
    updateBalance = true;
    
    // Add the green line
    addLine(stockPrice, 'green');
  }
}

function addLine(price, color) {
  chart.data.datasets.push({
    label: 'Trade Line',
    data: [{x: chart.data.labels[0], y: price}, {x: chart.data.labels[chart.data.labels.length - 1], y: price}],
    borderColor: color,
    borderWidth: 0.5,
    pointRadius: 0,
    fill: false,
    type: 'line',
    width: '840px'
  });

  chart.update();
}

let isGameOver = true;

// Function to draw the stock graph on the grid using Chart.js
function drawStockGraph(stockSymbol, dates, historicalData) {
  container = document.getElementById("graph-container");
  
  if (chart) {
    chart.destroy();
  }

  // initialize chart with no data
  chartData.labels = [];
  chartData.datasets[0].data = [];
  chartData.datasets[0].label = stockSymbol;

  const containerWidth = container.offsetWidth;

  chart = new Chart(stockGraph, {
    type: 'line',
    data: chartData,
    options: {
      plugins: {
        legend: {
          display: false
        }, 
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        x: {
          display: false, // Hide x-axis
          grid: {
            display: false, // Hide x-axis grid lines
          },
          // Initial min and max values are the first date
          ticks: {
            min: dates[0],
            max: dates[dates.length - 1],
          },
        },
        y: {
          display: false,
          ticks: {
            font: {
              family: 'Courier New',
              size: 12
            },
          },
          grid: {
            display: false // Hide y-axis grid lines
          }
        }
      },
      layout: {
        padding: 0 // Remove padding around the chart
      },
      responsive: true,
      maintainAspectRatio: false, // Allow chart to fill its container
      animation: false
    }
  });

  // populate data over 30 seconds
  let index = 0;
  let marketStartingBalance = 100000; //get the initial balance
  let marketShares = marketStartingBalance / Number(`${historicalData[index].toFixed(2)}`);

  const intervalId = setInterval(() => {

    if (index < dates.length) {
      chartData.labels.push(dates[index]);
      chartData.datasets[0].data.push(historicalData[index]);
      chart.options.scales.x.ticks.max = dates[index];

      stockPriceText.innerHTML = `$${historicalData[index].toLocaleString('en-US', {style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      
      mBalance = marketShares * historicalData[index];
      marketBalance.innerHTML = `$${mBalance.toLocaleString('en-US', {style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      
      if (updateBalance) {
        yBalance = yourShares * historicalData[index];
        console.log("Your Score:" + yBalance);
        yourScore.innerHTML = `$${yBalance.toLocaleString('en-US', {style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

      }

      if (yBalance > mBalance) {
        yourScore.style.color = 'green';
      } else if (yBalance < mBalance) {
        yourScore.style.color = 'red';
      } else {
        yourScore.style.color = 'white';
      }       

      container.style.width = `${(index / dates.length) * containerWidth}px`;

      chart.update('quiet');
      index++;
    } else {
      clearInterval(intervalId); // stop the interval
      isGameOver = true;

      resultsText.innerHTML = "With the trades you made, you profited a total of " + 
      `$${(yBalance - 100000).toLocaleString('en-US', {style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2})}` +
      ", beating the market by a total of " + 
      `$${(yBalance - mBalance).toLocaleString('en-US', {style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2})}` +
      ". That is a " + `${(((yBalance - 100000) / 100000) * 100).toLocaleString('en-US', {style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2})}` +
      "% gain/loss. Refresh to play again."
    }
  }, 30000 / dates.length); // adjust timing based on number of data points

}



const binaryBackground = document.getElementById('binary-background');

function generateBinarySequence() {
  let binary = '';
  for (let i = 0; i < 2000; i++) {
    binary += '00101010'; // Binary representation of the number 42
  }
  return binary;
}

binaryBackground.innerHTML = generateBinarySequence();

async function displayStockGraph() {
  isGameOver = false;
  stockTickerText.innerHTML = "$" + stockTicker;
  stockTicker = getRandomStockSymbol();
  const { dates, historicalData } = await fetchStockData(stockTicker);
  drawStockGraph(stockTicker, dates, historicalData);
}

// Add event listener for key press
document.addEventListener('keydown', function(event) {
    const actionsContainer = document.getElementById('actions');
    const actions = actionsContainer.getElementsByClassName('action');
  
    if(event.keyCode === 13) {
      if (isGameOver) {
        displayStockGraph();
      }
    }

    // Check if key pressed is '4'
    if (event.keyCode === 52 && yourShares == 0 && !isGameOver) {
      const buyButton = document.querySelector('.buy-button');
      const buttonKey = buyButton.querySelector('.button-key');
      buyButton.classList.add('active');
      buttonKey.style.borderColor = 'green';
  
      // Create a new action element for buy
      const action = document.createElement('div');
      const stockPrice = document.getElementById('stock-price-text').innerHTML;
      action.classList.add('action', 'buy');
      action.style.color = 'green';
      action.textContent = 'BUY: ' + stockPrice;
      updateShares(true);
  
      // Insert the new action at the top of the container
      actionsContainer.insertBefore(action, actions[0]);
      const sound = document.getElementById('sound');
      sound.currentTime = 0;
      sound.play();
      
      // Remove the oldest action if there are more than 10
      if (actions.length > 20) {
        actionsContainer.removeChild(actions[actions.length - 1]);
      }
    }
    // Check if key pressed is '2'
    if (event.keyCode === 50 && yourShares != 0 && !isGameOver) {
      const sellButton = document.querySelector('.sell-button');
      const buttonKey = sellButton.querySelector('.button-key');
      sellButton.classList.add('active');
      buttonKey.style.borderColor = 'red';
  
      // Create a new action element for sell
      const action = document.createElement('div');
      const stockPrice = document.getElementById('stock-price-text').innerHTML;
      action.classList.add('action', 'sell');
      action.style.color = 'red';
      action.textContent = 'SELL: ' + stockPrice;
      updateShares(false);
  
      // Insert the new action at the top of the container
      actionsContainer.insertBefore(action, actions[0]);
      const sound = document.getElementById('sound');
      sound.currentTime = 0;
      sound.play();
      
      // Remove the oldest action if there are more than 10
      if (actions.length > 10) {
        actionsContainer.removeChild(actions[actions.length - 1]);
      }
    }
  });
  
  // Add event listener for key release
  document.addEventListener('keyup', function(event) {
    const actionsContainer = document.getElementById('actions');
  
    // Check if key released is '4'
    if (event.keyCode === 52) {
      const buyButton = document.querySelector('.buy-button');
      const buttonKey = buyButton.querySelector('.button-key');
      buyButton.classList.remove('active');
      buttonKey.style.borderColor = '';
    }
    // Check if key released is '2'
    if (event.keyCode === 50) {
      const sellButton = document.querySelector('.sell-button');
      const buttonKey = sellButton.querySelector('.button-key');
      sellButton.classList.remove('active');
      buttonKey.style.borderColor = '';
    }
  });