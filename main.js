import { HttpsProxyAgent } from "https-proxy-agent";
import fs from "fs/promises";
import { ethers } from "ethers";
import readline from 'readline/promises';
import axios from 'axios';
import { TurnstileTask } from 'node-capmonster';
import { Solver } from "@2captcha/captcha-solver";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
console.log("1. CapResolve (recommended as cheapest) - 2. 2Captcha - 3. Capmonster");
const type = await rl.question("Enter captcha solving service type: ");
const apiKey = await rl.question("Enter your API key: ");

const pageurl = "https://sowing.taker.xyz/";
const sitekey = "0x4AAAAAABNqF8H4KF9TDs2O";
const CONTRACT_ADDRESS = "0xF929AB815E8BfB84Cdab8d1bb53F22eB1e455378";
const API_BASE_URL = 'https://sowing-api.taker.xyz';
const CONTRACT_ABI = [
  {
    constant: false,
    inputs: [],
    name: "active",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
];

const axiosInstance = axios.create({
    baseURL: 'https://sowing-api.taker.xyz',
    headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/json",
        "sec-ch-ua": "\"Google Chrome\";v=\"135\", \"Not-A.Brand\";v=\"8\", \"Chromium\";v=\"135\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        Referer: "https://sowing.taker.xyz/",
        "Referrer-Policy": "strict-origin-when-cross-origin",
    }
});

axiosInstance.interceptors.request.use((config) => {
    if (config.agent) {
        config.httpsAgent = config.agent;
        delete config.agent;
    }
    return config;
});

async function axiosWithRetry(config, maxRetries = 3, delay = 1000) {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            const response = await axiosInstance(config);
            return response;
        } catch (error) {
            retries++;
            if (retries === maxRetries) throw error;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

async function solverCaptcha() {
    if (!type) {
        console.error("No captcha service type selected");
        return null;
    }

    try {
        if (type === "1") {
            const Solver = (await import("capsolver-npm")).Solver;
            const solver = new Solver({ apiKey });
            const token = await solver.turnstileproxyless({
                websiteURL: pageurl,
                websiteKey: sitekey,
            });
            console.log("Captcha solved successfully");
            return token.token;
        }

        if (type === "2") {
            console.log("Solving captcha with 2Captcha");
            const solver = new Solver(apiKey);
            const result = (await solver.cloudflareTurnstile({ pageurl, sitekey })).data;
            console.log("Captcha solved successfully");
            return result;
        }

        if (type === "3") {
            console.log("Solving captcha with Capmonster");
            const capMonster = new TurnstileTask(apiKey);
            const task = capMonster.task({
                websiteKey: sitekey,
                websiteURL: pageurl
            });
            const token = await task.join();
            console.log("Captcha solved successfully");
            return token;
        }

        console.error("Invalid captcha service type selected");
        return null;
    } catch (error) {
        console.error("Error solving captcha:", error);
        return null;
    }
}

async function pointInfo(token, agent) {
    if (!token) {
        console.error("No token provided for point info");
        return;
    }

    try {
        const response = await axiosWithRetry({
            url: '/user/pointInfo',
            method: 'GET',
            headers: {
                "accept": "application/json, text/plain, */*",
                "accept-language": "en-US,en;q=0.9",
                "authorization": `Bearer ${token.trim()}`,
                "sec-ch-ua": "\"Google Chrome\";v=\"135\", \"Not-A.Brand\";v=\"8\", \"Chromium\";v=\"135\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site",
                "Referer": "https://sowing.taker.xyz/",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            agent
        });

        const data = response.data;
        console.log("Points after claim:", data.result);
    } catch (error) {
        console.error("Error fetching point info:", error.message);
    }
}

async function login(address, privateKey, agent, invitationCode) {
    try {
        const response = await axiosWithRetry({
            url: '/wallet/generateNonce',
            method: 'POST',
            data: {
                walletAddress: address
            },
            agent
        });

        if (!response.data.result || !response.data.result.nonce) {
            console.error("Failed to get nonce:", response.data);
            return null;
        }

        const nonce = response.data.result.nonce;
        const signature = await new ethers.Wallet(privateKey).signMessage(nonce);
        const getNonce = nonce.split('\n')[4].replace("Nonce: ", "");
        const message = `Taker quest needs to verify your identity to prevent unauthorized access. Please confirm your sign-in details below:\n\naddress: ${address}\n\nNonce: ${getNonce}`;

        const loginResponse = await axiosWithRetry({
            url: '/wallet/login',
            method: 'POST',
            data: {
                address,
                signature,
                message,
                invitationCode,
            },
            agent
        });

        if (!loginResponse.data.result || !loginResponse.data.result.token) {
            console.error("Failed to login:", loginResponse.data);
            return null;
        }

        const token = loginResponse.data.result.token;
        console.log(`Login successful, token for wallet ${address}:`, token);
        return token;
    } catch (error) {
        console.error("Login error:", error.message);
        return null;
    }
}

async function claimOnchain(privateKey, token, agent) {
    if (!token) {
        console.error("No token provided for claim");
        return;
    }

    try {
        const turnstile = await solverCaptcha();
        if (!turnstile) {
            console.error("Failed to solve captcha");
            return;
        }

        const response = await axiosWithRetry({
            url: '/task/signIn?status=true',
            method: 'GET',
            headers: {
                "accept": "application/json, text/plain, */*",
                "accept-language": "en-US,en;q=0.9",
                "authorization": `Bearer ${token.trim()}`,
                "cf-turnstile-token": turnstile,
                "sec-ch-ua": "\"Google Chrome\";v=\"135\", \"Not-A.Brand\";v=\"8\", \"Chromium\";v=\"135\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site",
                "Referer": "https://sowing.taker.xyz/",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            agent
        });

        if (!response.status === 200) {
            console.error(`Failed to claim rewards: ${response.statusText}`);
            return;
        }

        console.log("Successfully claimed onchain rewards");
    } catch (error) {
        console.error("Error claiming rewards:", error);
    }
}

async function main() {
    const invitationCode = "2PR66BBV";
    console.log("Made with <3 by: Azurezren");
    console.log(
        "JOIN OUR DISCORD SERVER TO RECEIVE NEW TOOLS: https://discord.gg/k2WTCyQtj4"
    );
    console.log("------------------------------------------------------------");

    while (true) {
        try {
            const wallets = await fs.readFile("wallets.txt", "utf-8");
            const proxies = await fs.readFile("proxies.txt", "utf-8");
            const walletsArray = wallets.split("\n").filter(Boolean);
            const proxiesArray = proxies.split("\n").filter(Boolean);

            await Promise.all(
                walletsArray.map(async (wallet, i) => {
                    try {
                        let [address, privateKey] = wallet.split(",");
                        privateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
                        const agent = proxiesArray[i] ? new HttpsProxyAgent(proxiesArray[i]) : null;
                        const token = await login(address, privateKey, agent, invitationCode);
                        if (!token) {
                            console.error(`Failed to get token for wallet ${address}`);
                            return;
                        }
                        await claimOnchain(privateKey, token, agent);
                        await pointInfo(token, agent);
                    } catch (error) {
                        console.error(`Error processing wallet ${wallet}:`, error.message);
                    }
                })
            );
        } catch (error) {
            console.error("Error in main loop:", error);
        }
        console.log("Waiting 3 hours to continue");
        await new Promise((resolve) => setTimeout(resolve, 3 * 60 * 60 * 1000));
    }
}

main().catch(console.error);
