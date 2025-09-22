# 🚀 Simple GALA Trading Bot

An automated trading bot for the GALA/GUSDC pair on GalaChain's GalaSwap DEX. This bot uses simple price prediction algorithms to execute trades every 30 minutes based on expected price movements.

## 🎯 Features

- **Automated Trading**: Executes trades every 30 minutes based on price predictions
- **Simple Strategy**: Buys if expecting >1% price increase, sells if expecting >1% price decrease  
- **Fixed Trade Amounts**: User-defined amounts for consistent position sizing
- **Zero Gas Fees**: Benefits from GalaChain's zero gas fee structure
- **Price Prediction**: Uses momentum and volatility analysis for trade decisions
- **Test Mode**: Optional test transaction to verify bot functionality
- **Performance Tracking**: Detailed trade history and performance analytics

## 📋 Prerequisites

Before running the bot, ensure you have:

1. **Node.js** (v14 or higher)
2. **GALA and GUSDC tokens** in your GalaChain wallet
3. **Private key** for your GalaChain wallet
4. **Sufficient balance** for your specified trade amounts

## 🛠️ Installation

1. Clone or download the bot files
2. Install required dependencies:
   ```bash
   npm install @gala-chain/gswap-sdk
   ```
3. Run the bot:
   ```bash
   node simple_gala_trading_bot.js
   ```

## ⚙️ Setup Process

When you start the bot, it will prompt you for:

1. **Wallet Address**: Your GalaChain wallet address
2. **Private Key**: Your wallet's private key (keep this secure!)
3. **Buy Amount**: How much GALA to buy per trade (e.g., 10)
4. **Sell Amount**: How much GALA to sell per trade (e.g., 10)
5. **Test Transaction**: Optional 1 GALA → GUSDC test trade

## 🎮 How It Works

### Trading Strategy
- **Every 30 minutes**, the bot:
  1. Fetches current GALA/GUSDC price
  2. Analyzes recent price history and trends
  3. Predicts next 30-minute price movement
  4. Executes trades if prediction confidence is >1%

### Trade Logic
- **BUY Signal**: If price expected to increase >1%
  - Buys your specified amount of GALA using GUSDC
- **SELL Signal**: If price expected to decrease >1%  
  - Sells your specified amount of GALA for GUSDC
- **HOLD Signal**: If expected change is <1%
  - No action taken

### Price Prediction Algorithm
The bot uses a simple momentum-based prediction system:
- Analyzes short-term (last interval) and long-term (last 3 intervals) trends
- Weighs recent price movements more heavily (70% short-term, 30% long-term)
- Factors in market volatility to adjust predictions
- Requires >1% expected change to trigger trades

## 🔧 Configuration

### Trade Amounts
- Set conservative amounts initially (e.g., 5-10 GALA per trade)
- Ensure you have sufficient GALA and GUSDC for multiple trades
- The bot doesn't check balances - make sure you have enough funds

### Time Interval
- Default: 30 minutes between price checks
- Can be modified by changing `checkInterval` in the code:
  ```javascript
  this.checkInterval = 30 * 60 * 1000; // 30 minutes in milliseconds
  ```

## 📊 Performance Tracking

The bot provides detailed analytics:

### During Operation
- Real-time price updates and changes
- Trade predictions with confidence levels  
- Successful trade confirmations
- Price per GALA for each transaction

### Session Summary
- Total number of trades executed
- Individual trade details (amount, price, timestamp)
- Average buy and sell prices
- Net performance percentage

## 🚨 Important Safety Notes

### Security
- **Never share your private key** with anyone
- Store your private key securely and never commit it to version control
- Consider using a dedicated trading wallet with limited funds

### Risk Management  
- Start with small trade amounts to test the strategy
- Monitor the bot regularly, especially during volatile market conditions
- The bot uses simple prediction algorithms - past performance doesn't guarantee future results
- Set trade amounts you're comfortable potentially losing

### Technical Considerations
- Ensure stable internet connection for consistent operation
- GalaSwap DEX must be operational for trades to execute
- The bot assumes sufficient wallet balance for specified trade amounts

## 🛑 Stopping the Bot

To safely stop the bot:
- Press `Ctrl+C` in the terminal
- The bot will complete any pending operations and show a final performance summary

## 🔍 Troubleshooting

### Common Issues

**Bot fails to start:**
- Verify wallet address and private key are correct
- Check internet connection
- Ensure GALA/GUSDC pair exists on GalaSwap

**Trade failures:**
- Verify sufficient GALA/GUSDC balance in wallet
- Check if trade amounts are reasonable for current liquidity
- Ensure wallet has trading permissions

**Price fetch errors:**
- Check GalaSwap DEX status
- Verify internet connectivity
- Wait for network issues to resolve

### Debug Mode
The bot includes detailed logging to help diagnose issues:
- Price fetch attempts and results
- Trade quote calculations  
- Success/failure messages for all operations

## 📈 Strategy Optimization

### Improving Performance
- Adjust trade amounts based on your risk tolerance
- Monitor which market conditions produce better results
- Consider modifying prediction thresholds (currently 1%)

### Backtesting
- The bot logs all trades with timestamps and prices
- Use this data to analyze strategy performance over time
- Adjust parameters based on historical results

## ⚖️ Disclaimer

This trading bot is provided for educational and experimental purposes. Cryptocurrency trading involves significant risk, and you should:

- Only trade with funds you can afford to lose
- Understand that automated trading can result in losses
- Monitor the bot's performance regularly
- Not rely solely on automated predictions for trading decisions

**Use at your own risk. The developers are not responsible for any financial losses.**

## 🤝 Contributing

Feel free to fork this project and submit improvements:
- Enhanced prediction algorithms
- Better risk management features
- Additional trading pairs
- Improved error handling

## 📝 License

This project is open source. Use responsibly and at your own risk.

---

**Happy Trading! 🚀💰**
