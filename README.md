# Taker Sowing Bot

Taker Sowing Bot is an automated cryptocurrency tool designed to interact with Taker's Sowing platform for automated points claiming and reward collection. It provides a streamlined interface for managing multiple wallets and handling CAPTCHA challenges efficiently.

## Features

- **Automated Points Claiming**: Automatically claims rewards every 3 hours
- **Multiple CAPTCHA Services**: Supports CapSolver, 2Captcha, Capmonster, and Bestcaptchasolver
- **Multi-Wallet Support**: Manage multiple Ethereum wallets simultaneously
- **Proxy Integration**: Supports proxy configurations for network management
- **Secure Key Management**: Secure handling of private keys and API credentials
- **Error Handling**: Robust error handling and logging system

## Requirements

- Node.js and npm
- Valid API key for your chosen CAPTCHA solving service
- Ethereum wallets with private keys
- Optional: Proxy configurations for network management

## Installation & Usage

One-line installation and startup:

```bash
git clone https://github.com/azurezren/Taker-Sowing-Bot.git && cd Taker-Sowing-Bot && npm install && node main.js
```

This command will:
1. Clone the repository
2. Enter the project directory
3. Install dependencies
4. Start the bot

Alternatively, you can follow these steps manually:

1. Register here: [sowing.taker.xyz](https://sowing.taker.xyz/?start=2PR66BBV)

2. Clone the repository:
   ```bash
   git clone https://github.com/azurezren/Taker-Sowing-Bot.git
   cd Taker-Sowing-Bot
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Configure your wallets:
   ```bash
   # Edit wallets.txt with format: address,privateKey
   nano wallets.txt
   ```

5. Configure proxies (optional):
   ```bash
   # Edit proxies.txt
   nano proxies.txt
   ```

6. Start the bot:
   ```bash
   node main.js
   ```

## Configuration Files

### wallets.txt
- Format: `address,privateKey`
- Each line represents one wallet
- Multiple wallets can be added

### proxies.txt
- Add your proxy configurations
- Leave blank lines for local network connections
- Format depends on your proxy type

## Supported CAPTCHA Services

1. **CapSolver (Recommended)**
   - Sign up: [capsolver.com](https://dashboard.capsolver.com/passport/register?inviteCode=0JzVX8gkgLfH)

2. **2Captcha**
   - Support link: [2captcha.com](https://2captcha.com/?from=24882470)

## Security Best Practices

- Never share your private keys
- Keep API keys secure
- Regularly update dependencies
- Run in a secure environment
- Use strong passwords for CAPTCHA service accounts

## Error Handling

The bot includes comprehensive error handling for:
- Network connectivity issues
- CAPTCHA solving failures
- Transaction errors
- API rate limiting

## License

This project is licensed under the MIT License - see the LICENSE file for details.
