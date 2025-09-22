const { GSwap, PrivateKeySigner } = require('@gala-chain/gswap-sdk');
const readline = require('readline');

class SimpleGalaTradingBot {
  constructor() {
    this.gSwap = null;
    this.walletAddress = '';
    this.checkInterval = 30 * 60 * 1000; // 30 minutes
    this.isRunning = false;
    this.priceHistory = [];
    this.tradeHistory = [];
    
    // User-defined trade amounts
    this.buyAmountGala = 0;  // How much GALA to buy each trade
    this.sellAmountGala = 0; // How much GALA to sell each trade
  }

  async initialize() {
    console.log('=== 🚀 Simple GALA/GUSDC Trading Bot (Fixed) ===\n');
    console.log('🎯 This bot predicts GALA price movements every 30 minutes');
    console.log('📊 Buys if expecting >1% price increase');
    console.log('📉 Sells if expecting >1% price decrease');
    console.log('💡 Uses fixed trade amounts (no balance checking)\n');
    
    // Get user inputs
    const walletAddress = await this.getUserInput('Enter your Gala wallet address: ');
    const privateKey = await this.getUserInput('Enter your private key: ');
    
    this.walletAddress = walletAddress.trim();
    
    // Get trade amounts from user
    const buyAmount = await this.getUserInput('Enter how much GALA to buy per trade (e.g., 10): ');
    const sellAmount = await this.getUserInput('Enter how much GALA to sell per trade (e.g., 10): ');
    
    this.buyAmountGala = parseFloat(buyAmount.trim()) || 10;
    this.sellAmountGala = parseFloat(sellAmount.trim()) || 10;
    
    // Initialize GSwap
    try {
      this.gSwap = new GSwap({
        signer: new PrivateKeySigner(privateKey.trim()),
      });
      
      console.log('\n✅ Bot initialized successfully!');
      console.log(`🏠 Wallet: ${this.walletAddress}`);
      console.log(`⏱️  Check interval: 30 minutes`);
      console.log(`💰 Buy amount: ${this.buyAmountGala} GALA per trade`);
      console.log(`📉 Sell amount: ${this.sellAmountGala} GALA per trade`);
      console.log('📈 Strategy: Fixed amount trades based on price predictions\n');
      
      await this.discoverTokens();
      
      // Ask for test transaction
      const testNow = await this.getUserInput('Would you like to do a test transaction (1 GALA → GUSDC)? (y/n): ');
      if (testNow.toLowerCase().trim() === 'y' || testNow.toLowerCase().trim() === 'yes') {
        await this.executeTestTransaction();
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize bot:', error.message);
      process.exit(1);
    }
  }

  getUserInput(prompt) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(prompt, (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }

  async discoverTokens() {
    try {
      console.log('🔍 Verifying GALA/GUSDC pair on GalaSwap DEX...');
      
      this.galaToken = 'GALA|Unit|none|none';
      this.gusdcToken = 'GUSDC|Unit|none|none';
      
      // Test connection with small quote
      const quote = await this.gSwap.quoting.quoteExactInput(
        this.galaToken,
        this.gusdcToken,
        1
      );
      
      console.log(`✅ Pair verified! 1 GALA = ${quote.outTokenAmount} GUSDC`);
      console.log(`📊 Current GALA price: $${parseFloat(quote.outTokenAmount).toFixed(4)}\n`);
      
      // Store initial price
      this.priceHistory.push({
        timestamp: Date.now(),
        price: parseFloat(quote.outTokenAmount),
        galaToGusdc: parseFloat(quote.outTokenAmount)
      });
      
    } catch (error) {
      console.error('❌ Error verifying GALA/GUSDC pair:', error.message);
      throw error;
    }
  }

  async executeTestTransaction() {
    try {
      console.log('\n🧪 EXECUTING TEST TRANSACTION');
      console.log('=' .repeat(40));
      console.log('💰 Trading 1 GALA → GUSDC');
      
      const testAmount = 1;
      const quote = await this.gSwap.quoting.quoteExactInput(
        this.galaToken,
        this.gusdcToken,
        testAmount
      );
      
      const expectedGusdc = parseFloat(quote.outTokenAmount);
      
      console.log(`📊 Test Trade Quote:`);
      console.log(`   Input: ${testAmount} GALA`);
      console.log(`   Expected: ${expectedGusdc.toFixed(6)} GUSDC`);
      console.log(`   Price: $${expectedGusdc.toFixed(4)} per GALA`);
      
      const confirm = await this.getUserInput('\nExecute test trade? (y/n): ');
      
      if (confirm.toLowerCase().trim() !== 'y' && confirm.toLowerCase().trim() !== 'yes') {
        console.log('❌ Test trade cancelled\n');
        return;
      }
      
      console.log('🚀 Executing trade...');
      
      const transaction = await this.gSwap.swaps.swap(
        this.galaToken,
        this.gusdcToken,
        quote.feeTier,
        {
          exactIn: testAmount,
          amountOutMinimum: expectedGusdc * 0.95, // 5% slippage
        },
        this.walletAddress
      );
      
      console.log('\n🎉 TEST TRADE SUCCESSFUL!');
      console.log(`✨ Sold: ${testAmount} GALA`);
      console.log(`💰 Received: ~${expectedGusdc.toFixed(6)} GUSDC`);
      console.log(`🔗 Transaction: ${JSON.stringify(transaction, null, 2)}`);
      console.log('\n✅ Bot is working! Ready to start automated trading.\n');
      
    } catch (error) {
      console.log('\n❌ TEST TRADE FAILED!');
      console.error('Error:', error.message);
      
      const continueAnyway = await this.getUserInput('\nContinue with bot anyway? (y/n): ');
      if (continueAnyway.toLowerCase().trim() !== 'y') {
        process.exit(1);
      }
    }
  }

  async getCurrentPrice() {
    try {
      const quote = await this.gSwap.quoting.quoteExactInput(
        this.galaToken,
        this.gusdcToken,
        1
      );
      
      return parseFloat(quote.outTokenAmount);
    } catch (error) {
      console.error('Error getting current price:', error.message);
      return null;
    }
  }

  predictPriceMovement() {
    if (this.priceHistory.length < 3) {
      return { direction: 'hold', confidence: 0, expectedChange: 0 };
    }
    
    // Simple price prediction based on recent trends
    const recent = this.priceHistory.slice(-3);
    const currentPrice = recent[recent.length - 1].price;
    const previousPrice = recent[recent.length - 2].price;
    const earlierPrice = recent[0].price;
    
    // Calculate recent trend
    const shortTrend = (currentPrice - previousPrice) / previousPrice * 100;
    const longTrend = (currentPrice - earlierPrice) / earlierPrice * 100;
    
    // Simple momentum-based prediction
    let expectedChange = (shortTrend * 0.7) + (longTrend * 0.3);
    
    // Add some market volatility factors
    const volatility = this.calculateVolatility();
    expectedChange = expectedChange * (1 + volatility * 0.1);
    
    // Determine direction and confidence
    let direction = 'hold';
    let confidence = Math.abs(expectedChange) / 5; // Scale confidence
    
    if (expectedChange > 1) {
      direction = 'buy';
    } else if (expectedChange < -1) {
      direction = 'sell';
    }
    
    return {
      direction,
      confidence: Math.min(confidence, 1),
      expectedChange: expectedChange
    };
  }

  calculateVolatility() {
    if (this.priceHistory.length < 2) return 0;
    
    const prices = this.priceHistory.slice(-10).map(h => h.price);
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  async executeBuyOrder() {
    try {
      const buyAmountGala = this.buyAmountGala;
      
      console.log(`💰 Executing BUY order: ${buyAmountGala} GALA`);
      
      // Get quote for buying GALA with GUSDC
      // First we need to know how much GUSDC we need to buy the desired amount of GALA
      const quote = await this.gSwap.quoting.quoteExactOutput(
        this.gusdcToken,
        this.galaToken,
        buyAmountGala
      );
      
      const requiredGusdc = parseFloat(quote.inTokenAmount);
      
      console.log(`📊 Buy Quote:`);
      console.log(`   Want: ${buyAmountGala} GALA`);
      console.log(`   Need: ${requiredGusdc.toFixed(6)} GUSDC`);
      console.log(`   Price: ${(requiredGusdc/buyAmountGala).toFixed(6)} GUSDC per GALA`);
      
      const transaction = await this.gSwap.swaps.swap(
        this.gusdcToken,
        this.galaToken,
        quote.feeTier,
        {
          exactOut: buyAmountGala,
          amountInMaximum: requiredGusdc * 1.05, // 5% slippage
        },
        this.walletAddress
      );
      
      console.log(`✅ BUY executed: Got ${buyAmountGala} GALA for ${requiredGusdc.toFixed(6)} GUSDC`);
      
      this.tradeHistory.push({
        timestamp: new Date().toISOString(),
        type: 'BUY',
        amountIn: requiredGusdc,
        tokenIn: 'GUSDC',
        amountOut: buyAmountGala,
        tokenOut: 'GALA',
        price: requiredGusdc/buyAmountGala,
        transaction
      });
      
      return true;
      
    } catch (error) {
      console.error('❌ Buy order failed:', error.message);
      return false;
    }
  }

  async executeSellOrder() {
    try {
      const sellAmountGala = this.sellAmountGala;
      
      console.log(`📉 Executing SELL order: ${sellAmountGala} GALA`);
      
      // Get quote for selling GALA for GUSDC
      const quote = await this.gSwap.quoting.quoteExactInput(
        this.galaToken,
        this.gusdcToken,
        sellAmountGala
      );
      
      const expectedGusdc = parseFloat(quote.outTokenAmount);
      
      console.log(`📊 Sell Quote:`);
      console.log(`   Selling: ${sellAmountGala} GALA`);
      console.log(`   Expected: ${expectedGusdc.toFixed(6)} GUSDC`);
      console.log(`   Price: ${(expectedGusdc/sellAmountGala).toFixed(6)} GUSDC per GALA`);
      
      const transaction = await this.gSwap.swaps.swap(
        this.galaToken,
        this.gusdcToken,
        quote.feeTier,
        {
          exactIn: sellAmountGala,
          amountOutMinimum: expectedGusdc * 0.95, // 5% slippage
        },
        this.walletAddress
      );
      
      console.log(`✅ SELL executed: Got ${expectedGusdc.toFixed(6)} GUSDC for ${sellAmountGala} GALA`);
      
      this.tradeHistory.push({
        timestamp: new Date().toISOString(),
        type: 'SELL',
        amountIn: sellAmountGala,
        tokenIn: 'GALA',
        amountOut: expectedGusdc,
        tokenOut: 'GUSDC',
        price: expectedGusdc/sellAmountGala,
        transaction
      });
      
      return true;
      
    } catch (error) {
      console.error('❌ Sell order failed:', error.message);
      return false;
    }
  }

  async analyzeAndTrade() {
    try {
      console.log(`\n🔍 [${new Date().toLocaleString()}] Analyzing GALA price...`);
      
      // Get current price
      const currentPrice = await this.getCurrentPrice();
      if (!currentPrice) {
        console.log('❌ Failed to get current price, skipping this cycle');
        return;
      }
      
      // Store price data
      this.priceHistory.push({
        timestamp: Date.now(),
        price: currentPrice,
        galaToGusdc: currentPrice
      });
      
      // Keep only last 20 price points
      if (this.priceHistory.length > 20) {
        this.priceHistory = this.priceHistory.slice(-20);
      }
      
      console.log(`📊 Current GALA price: ${currentPrice.toFixed(6)} GUSDC`);
      
      // Show recent price history
      if (this.priceHistory.length > 1) {
        const prevPrice = this.priceHistory[this.priceHistory.length - 2].price;
        const change = ((currentPrice - prevPrice) / prevPrice * 100);
        console.log(`📈 Price change: ${change > 0 ? '+' : ''}${change.toFixed(2)}% from last check`);
      }
      
      // Predict price movement
      const prediction = this.predictPriceMovement();
      
      console.log(`🤖 Price Prediction:`);
      console.log(`   Direction: ${prediction.direction.toUpperCase()}`);
      console.log(`   Expected change: ${prediction.expectedChange.toFixed(2)}%`);
      console.log(`   Confidence: ${(prediction.confidence * 100).toFixed(1)}%`);
      
      // Execute trades based on prediction
      if (prediction.direction === 'buy' && Math.abs(prediction.expectedChange) > 1) {
        console.log(`🚀 Prediction: Price going UP >1% - BUYING ${this.buyAmountGala} GALA`);
        await this.executeBuyOrder();
      } else if (prediction.direction === 'sell' && Math.abs(prediction.expectedChange) > 1) {
        console.log(`📉 Prediction: Price going DOWN >1% - SELLING ${this.sellAmountGala} GALA`);
        await this.executeSellOrder();
      } else {
        console.log('😴 Prediction: Price change <1% - HOLDING position');
      }
      
    } catch (error) {
      console.error('❌ Error during analysis:', error.message);
    }
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️  Bot is already running!');
      return;
    }

    this.isRunning = true;
    console.log('\n🚀 Starting Simple GALA Trading Bot...');
    console.log('📊 Strategy: Predict GALA price movements every 30 minutes');
    console.log(`💰 Buy ${this.buyAmountGala} GALA if expecting >1% price increase`);
    console.log(`📉 Sell ${this.sellAmountGala} GALA if expecting >1% price decrease`);
    console.log('🎯 No balance checking - uses fixed trade amounts');
    console.log('Press Ctrl+C to stop\n');

    // Initial analysis
    await this.analyzeAndTrade();

    // Set up 30-minute interval
    this.intervalId = setInterval(async () => {
      if (this.isRunning) {
        await this.analyzeAndTrade();
      }
    }, this.checkInterval);
  }

  stop() {
    if (!this.isRunning) {
      console.log('⚠️  Bot is not running!');
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    console.log('\n🛑 Simple GALA Trading Bot stopped');
    console.log(`📊 Executed ${this.tradeHistory.length} trades during this session`);
    
    if (this.tradeHistory.length > 0) {
      console.log('\n📈 Trade Summary:');
      this.tradeHistory.forEach((trade, index) => {
        const priceStr = trade.price ? ` @ ${trade.price.toFixed(6)} GUSDC/GALA` : '';
        console.log(`   ${index + 1}. ${trade.type}: ${trade.amountIn.toFixed(6)} ${trade.tokenIn} → ${trade.amountOut.toFixed(6)} ${trade.tokenOut}${priceStr}`);
      });
      
      // Calculate net performance
      const buys = this.tradeHistory.filter(t => t.type === 'BUY');
      const sells = this.tradeHistory.filter(t => t.type === 'SELL');
      
      if (buys.length > 0 && sells.length > 0) {
        const avgBuyPrice = buys.reduce((sum, t) => sum + t.price, 0) / buys.length;
        const avgSellPrice = sells.reduce((sum, t) => sum + t.price, 0) / sells.length;
        const netChange = ((avgSellPrice - avgBuyPrice) / avgBuyPrice * 100);
        
        console.log(`\n💡 Performance Summary:`);
        console.log(`   Average buy price: ${avgBuyPrice.toFixed(6)} GUSDC/GALA`);
        console.log(`   Average sell price: ${avgSellPrice.toFixed(6)} GUSDC/GALA`);
        console.log(`   Net change: ${netChange > 0 ? '+' : ''}${netChange.toFixed(2)}%`);
      }
    }
  }
}

// Main execution
async function main() {
  const bot = new SimpleGalaTradingBot();
  
  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down bot...');
    bot.stop();
    process.exit(0);
  });

  try {
    await bot.initialize();
    await bot.start();
  } catch (error) {
    console.error('💥 Bot failed to start:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check your wallet address and private key');
    console.log('   2. Ensure you have sufficient GALA and GUSDC in your wallet');
    console.log('   3. Verify internet connection');
    console.log('   4. Make sure GALA/GUSDC pair exists on GalaSwap');
    console.log('   5. Ensure your wallet has enough tokens for the trade amounts you specified');
    process.exit(1);
  }
}

// Run the bot
if (require.main === module) {
  main();
}

module.exports = SimpleGalaTradingBot;